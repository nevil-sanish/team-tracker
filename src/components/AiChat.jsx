import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import { askGroq } from '../lib/groqService';
import { useStore } from '../store/useStore';
import { toDateKey } from '../lib/utils';

export default function AiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const { events, tasks } = useStore();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const buildContext = () => {
    const today = toDateKey(new Date());
    const todayEv = events.filter(e => e.date === today);
    const pending = tasks.filter(t => t.status !== 'done');
    let ctx = 'You are a concise productivity assistant. Answer in short bullet points only. Keep answers under 4 bullets.\n\nContext:\n';
    if (todayEv.length) ctx += 'Today\'s events: ' + todayEv.map(e => `${e.title} (${e.startTime}–${e.endTime})`).join(', ') + '\n';
    else ctx += 'No events today.\n';
    if (pending.length) ctx += 'Pending tasks: ' + pending.map(t => t.title).join(', ') + '\n';
    else ctx += 'All tasks done.\n';
    return ctx;
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const sysMsg = { role: 'system', content: buildContext() };
      const history = [...messages.slice(-6), userMsg];
      const reply = await askGroq([sysMsg, ...history], 200);
      setMessages(m => [...m, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: '• Something went wrong. Try again.' }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: 20, right: 20, width: 48, height: 48,
          borderRadius: '50%', background: 'var(--color-accent)', color: 'white',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', boxShadow: '0 4px 16px rgba(249,115,22,0.4)',
          zIndex: 1000, transition: 'transform 0.2s',
        }}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* Chat Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 78, right: 20, width: 320, height: 400,
          borderRadius: 14, background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-default)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 1000,
        }}>
          {/* Header */}
          <div style={{
            padding: '10px 14px', borderBottom: '1px solid var(--color-border-subtle)',
            background: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Bot size={16} style={{ color: 'white' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'white', flex: 1 }}>AI Assistant</span>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}><X size={14} /></button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--color-text-muted)', fontSize: 11 }}>
                <Bot size={28} style={{ margin: '0 auto 8px', color: 'var(--color-accent)' }} />
                <p style={{ fontWeight: 600 }}>Ask me anything!</p>
                <p style={{ fontSize: 10, marginTop: 4 }}>I know your tasks & events</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex', gap: 6, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                {m.role === 'assistant' && <Bot size={14} style={{ color: 'var(--color-accent)', marginTop: 4, flexShrink: 0 }} />}
                <div style={{
                  maxWidth: '80%', padding: '6px 10px', borderRadius: 10,
                  background: m.role === 'user' ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
                  color: m.role === 'user' ? 'white' : 'var(--color-text-primary)',
                  fontSize: 11, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Bot size={14} style={{ color: 'var(--color-accent)' }} />
                <Loader2 size={14} style={{ color: 'var(--color-accent)', animation: 'spin 1s linear infinite' }} />
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '8px 10px', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', gap: 6 }}>
            <input
              className="input"
              placeholder="Ask a question..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              style={{ flex: 1, fontSize: 11, height: 30 }}
            />
            <button onClick={send} disabled={loading} className="btn btn-primary" style={{ padding: '0 10px', height: 30, borderRadius: 8 }}>
              <Send size={12} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
