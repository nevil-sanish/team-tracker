import { auth } from './firebase';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const PROXY_URL = '/api/chat';
const GROQ_DIRECT_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callProxy(messages, maxTokens) {
  const token = await auth.currentUser?.getIdToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages, max_tokens: maxTokens }),
  });
  if (!res.ok) throw new Error('Proxy failed');
  return res.json();
}

async function callDirect(messages, maxTokens) {
  const res = await fetch(GROQ_DIRECT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error('Groq API error: ' + res.status);
  return res.json();
}

export async function askGroq(messages, maxTokens = 300) {
  let data;
  try {
    // Try serverless proxy first (works on Vercel)
    data = await callProxy(messages, maxTokens);
  } catch {
    // Fall back to direct API call (works locally)
    data = await callDirect(messages, maxTokens);
  }
  return data.choices?.[0]?.message?.content || '';
}

export async function getSummary(events, tasks) {
  const evText = events.length > 0
    ? events.map(e => `• ${e.title} (${e.startTime}–${e.endTime})`).join('\n')
    : 'No events today.';
  const taskText = tasks.length > 0
    ? tasks.map(t => `• ${t.title} — ${t.status}`).join('\n')
    : 'All tasks done.';

  const prompt = `You are a productivity assistant. Give a short bullet-point summary and action plan for today. Keep it under 5 bullets. Be concise.

Today's events:
${evText}

Pending tasks:
${taskText}`;

  return askGroq([{ role: 'user', content: prompt }], 250);
}
