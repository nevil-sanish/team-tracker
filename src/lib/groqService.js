const API_URL = '/api/chat';

export async function askGroq(messages, maxTokens = 300) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, max_tokens: maxTokens }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'API error');
  }
  const data = await res.json();
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
