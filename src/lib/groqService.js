/**
 * Groq AI Service
 *
 * SECURITY: The API key is NEVER shipped to the browser.
 * All requests go through the /api/chat serverless proxy which
 * reads the key from server-side environment variables.
 *
 * Requests include the Firebase ID token for server-side auth verification.
 */

import { auth } from './firebase';

const PROXY_URL = '/api/chat';

async function getAuthToken() {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}

async function callProxy(messages, maxTokens) {
  const token = await getAuthToken();

  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages, max_tokens: maxTokens }),
  });

  if (!res.ok) {
    // Never expose raw server errors to console in production
    const status = res.status;
    if (status === 429) throw new Error('Rate limit exceeded. Please wait a moment.');
    if (status === 401) throw new Error('Please sign in to use the AI assistant.');
    throw new Error(`AI service unavailable (${status})`);
  }
  return res.json();
}

export async function askGroq(messages, maxTokens = 300) {
  const data = await callProxy(messages, maxTokens);
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
