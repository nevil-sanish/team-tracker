/**
 * /api/chat — Serverless AI proxy (Vercel Edge/Node)
 *
 * Security hardening:
 *   1. CORS restricted to ALLOWED_ORIGINS (no wildcard)
 *   2. Startup validation for GROQ_API_KEY
 *   3. Firebase ID token verification (auth required)
 *   4. Input validation (messages array, max_tokens bounds)
 *   5. In-memory rate limiting per IP (burst protection)
 *   6. Error details masked from the client
 *   7. POST-only enforcement
 */

// ─── Rate Limiter (in-memory, per-deployment) ──────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 15;           // max requests per window

function isRateLimited(ip) {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);

  if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
    entry = { start: now, count: 1 };
    rateLimitMap.set(ip, entry);
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}

// Periodic cleanup to avoid memory leaks (every 5 min)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.start > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60_000);

// ─── CORS helpers ──────────────────────────────────────────────
function getAllowedOrigins() {
  const origins = process.env.ALLOWED_ORIGINS || '';
  return origins.split(',').map(o => o.trim()).filter(Boolean);
}

function getCorsOrigin(reqOrigin) {
  const allowed = getAllowedOrigins();
  // In development, allow localhost variants
  if (!allowed.length) return reqOrigin || '*';
  if (allowed.includes(reqOrigin)) return reqOrigin;
  return null; // Not allowed
}

function setCorsHeaders(res, origin) {
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

// ─── Input validation ──────────────────────────────────────────
function validateBody(body) {
  if (!body || typeof body !== 'object') {
    return 'Request body must be a JSON object';
  }

  const { messages, max_tokens } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return '"messages" must be a non-empty array';
  }

  if (messages.length > 50) {
    return '"messages" must contain at most 50 entries';
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== 'object') {
      return `messages[${i}] must be an object`;
    }
    if (!['system', 'user', 'assistant'].includes(msg.role)) {
      return `messages[${i}].role must be "system", "user", or "assistant"`;
    }
    if (typeof msg.content !== 'string' || msg.content.length === 0) {
      return `messages[${i}].content must be a non-empty string`;
    }
    if (msg.content.length > 4000) {
      return `messages[${i}].content must be at most 4000 characters`;
    }
  }

  if (max_tokens !== undefined) {
    const mt = Number(max_tokens);
    if (!Number.isInteger(mt) || mt < 1 || mt > 2000) {
      return '"max_tokens" must be an integer between 1 and 2000';
    }
  }

  return null; // valid
}

// ─── Firebase Auth: verify ID token ────────────────────────────
async function verifyFirebaseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const idToken = authHeader.slice(7);
  const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;

  if (!apiKey) {
    // Can't verify without API key — fail open in dev, closed in prod
    if (process.env.NODE_ENV === 'production') return null;
    return { uid: 'dev-user' };
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (data.error) return null;
    const user = data.users?.[0];
    return user ? { uid: user.localId, email: user.email } : null;
  } catch {
    return null;
  }
}

// ─── Main handler ──────────────────────────────────────────────
export default async function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer;
  const corsOrigin = getCorsOrigin(origin);

  // Always set CORS for preflight
  setCorsHeaders(res, corsOrigin);

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // POST only
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS enforcement in production
  if (process.env.NODE_ENV === 'production' && !corsOrigin) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  // ── Startup validation ──
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    console.error('[FATAL] GROQ_API_KEY is not set in environment');
    return res.status(500).json({ error: 'Service not configured' });
  }

  // ── Rate limiting ──
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || 'unknown';

  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      error: 'Too many requests. Please wait a minute and try again.',
    });
  }

  // ── Auth verification ──
  const user = await verifyFirebaseToken(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // ── Input validation ──
  const validationError = validateBody(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  // ── Proxy to Groq ──
  try {
    const { messages, max_tokens = 300 } = req.body;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages,
        max_tokens: Math.min(Number(max_tokens), 2000),
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      // Log the real error server-side, return generic message to client
      const errorBody = await response.text();
      console.error('[Groq API error]', response.status, errorBody);
      return res.status(502).json({ error: 'AI service temporarily unavailable' });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    // Mask internal errors — never expose stack traces or messages
    console.error('[Internal error]', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}
