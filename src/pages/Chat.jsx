import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Hash, Pin, Send, Smile, Paperclip, Search, Reply, Mic, Image, X, AtSign, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatRelative, presenceMeta } from '../lib/utils';
import { saveMessage, saveActivity } from '../lib/dataService';
import Avatar from '../components/Avatar';

export default function Chat() {
  const { activeGroup, channels, messages, addMessage, user, addNotification } = useStore();
  const groupId = activeGroup?.id;

  if (!activeGroup) {
    return (
      <div className="h-full flex items-center justify-center animate-fade-in">
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Hash size={24} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>Group Chat</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Join a group to start chatting with your team.</p>
        </div>
      </div>
    );
  }

  const [selectedId, setSelectedId] = useState(channels[0]?.id ?? null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selected = channels.find(c => c.id === selectedId) ?? channels[0];
  const channelMessages = useMemo(() => selected ? messages.filter(m => m.channelId === selected.id) : [], [messages, selected]);
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return channelMessages;
    return channelMessages.filter(m => m.body.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [channelMessages, searchQuery]);

  const handleSend = async (body) => {
    const msg = { channelId: selected.id, authorId: user?.id, authorName: user?.name || 'You', body };
    if (groupId) {
      await saveMessage(groupId, { ...msg, createdAt: new Date().toISOString(), reactions: [] });
    } else addMessage(msg);
    addNotification({ title: 'New Message', message: `in #${selected.name}: "${body.slice(0, 50)}"`, type: 'info', section: 'Chat' });
  };

  return (
    <div className="h-full flex animate-fade-in" style={{ overflow: 'hidden' }}>
      <aside className="hidden md:flex flex-col" style={{ width: 252, borderRight: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-secondary)', flexShrink: 0 }}>
        <div style={{ padding: 10, borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-disabled)' }} />
            <input className="input" placeholder="Search channels..." style={{ paddingLeft: 32, height: 30, fontSize: 11 }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
          <div style={{ padding: '6px 10px', marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-muted)' }}>Channels</span>
          </div>
          {channels.map(c => (
            <button key={c.id} onClick={() => setSelectedId(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', background: selected?.id === c.id ? 'var(--color-bg-elevated)' : 'transparent', border: selected?.id === c.id ? '1px solid var(--color-border-default)' : '1px solid transparent', borderRadius: 8, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', marginBottom: 2 }} className="hover:bg-[var(--color-bg-hover)]">
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Hash size={14} style={{ color: 'var(--color-text-muted)' }} /></div>
              <span style={{ flex: 1, fontSize: 13, fontWeight: selected?.id === c.id ? 600 : 400, color: 'var(--color-text-primary)' }}>#{c.name}</span>
            </button>
          ))}
        </div>
        {/* Members */}
        <div style={{ borderTop: '1px solid var(--color-border-subtle)', padding: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>Members</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(activeGroup.members || []).map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Avatar name={m.name} avatar={m.avatar} size="xs" status={m.status || 'online'} showStatus />
                <span style={{ flex: 1, fontSize: 11, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selected && (<>
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--color-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Hash size={16} style={{ color: 'var(--color-accent)' }} /></div>
            <div style={{ flex: 1 }}><h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>#{selected.name}</h2></div>
            <button onClick={() => setShowSearch(!showSearch)} className="btn-ghost btn-icon" style={{ width: 30, height: 30 }}><Search size={15} /></button>
          </div>
          {showSearch && (
            <div style={{ padding: '6px 20px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-bg-secondary)' }}>
              <Search size={14} style={{ color: 'var(--color-text-muted)' }} />
              <input className="input" placeholder="Search messages..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ border: 'none', background: 'transparent', padding: 0, height: 28, fontSize: 12 }} autoFocus />
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}><X size={14} style={{ color: 'var(--color-text-muted)' }} /></button>
            </div>
          )}
          <MessageList messages={filteredMessages} currentUserId={user?.id} />
          <MessageComposer channelName={`#${selected.name}`} onSend={handleSend} />
        </>)}
      </div>
    </div>
  );
}

function MessageList({ messages, currentUserId }) {
  const scrollRef = useRef(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);
  return (
    <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
      {messages.length === 0 && (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: 13 }}>No messages yet. Start the conversation!</div>)}
      {messages.map((m, i) => {
        const prev = messages[i - 1];
        const grouped = prev && prev.authorId === m.authorId;
        const isMe = m.authorId === currentUserId;
        return (
          <div key={m.id} style={{ display: 'flex', gap: 10, padding: '4px 8px', marginTop: grouped ? 2 : 12, borderRadius: 8, transition: 'background 0.15s' }} className="hover:bg-[var(--color-bg-hover)]">
            <div style={{ width: 34, flexShrink: 0 }}>{!grouped && <Avatar name={m.authorName} size="sm" status="online" showStatus />}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {!grouped && (<div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: isMe ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>{m.authorName}</span>
                <span style={{ fontSize: 10, color: 'var(--color-text-disabled)', fontStyle: 'italic' }}>{formatRelative(m.createdAt)}</span>
              </div>)}
              <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--color-text-primary)' }}>{m.body}</p>
              {m.reactions && m.reactions.length > 0 && (<div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                {m.reactions.map((r, ri) => (<button key={ri} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-default)', fontSize: 12, cursor: 'pointer' }}><span>{r.emoji}</span><span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{r.count}</span></button>))}
              </div>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MessageComposer({ channelName, onSend }) {
  const [msg, setMsg] = useState('');
  const handleSend = () => { if (!msg.trim()) return; onSend(msg.trim()); setMsg(''); };
  return (
    <div style={{ borderTop: '1px solid var(--color-border-subtle)', padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-default)', borderRadius: 12, padding: '6px 10px' }}>
        <textarea rows={1} value={msg} onChange={e => setMsg(e.target.value)} placeholder={`Message ${channelName}`}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, resize: 'none', minHeight: 24, maxHeight: 120, padding: '4px 0', color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        />
        <button onClick={handleSend} style={{ width: 32, height: 32, borderRadius: 10, background: msg.trim() ? 'var(--color-accent)' : 'var(--color-bg-hover)', color: msg.trim() ? 'white' : 'var(--color-text-disabled)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: msg.trim() ? 'pointer' : 'default', transition: 'all 0.2s' }}>
          <Send size={15} />
        </button>
      </div>
      <p style={{ fontSize: 10, color: 'var(--color-text-disabled)', marginTop: 4, paddingLeft: 4 }}>
        <kbd style={{ padding: '1px 4px', background: 'var(--color-bg-tertiary)', borderRadius: 3, fontSize: 9, fontFamily: 'var(--font-mono)' }}>Enter</kbd> to send
      </p>
    </div>
  );
}
