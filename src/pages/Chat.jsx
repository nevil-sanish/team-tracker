import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Hash, Pin, Send, Smile, Paperclip, Search, Reply, BarChart3,
  Mic, Image, X, AtSign, Plus
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn, formatRelative, presenceMeta } from '../lib/utils';
import Avatar from '../components/Avatar';

export default function Chat() {
  const { mode, group, channels, messages, addMessage, addReaction, user } = useStore();

  const visibleChannels = useMemo(() => {
    if (mode === 'personal') return [{ id: 'ch_dm_self', name: 'Notes to Self', isDM: true, unread: 0 }];
    return channels;
  }, [mode, channels]);

  const [selectedId, setSelectedId] = useState(visibleChannels[0]?.id ?? null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selected = visibleChannels.find(c => c.id === selectedId) ?? visibleChannels[0];
  const channelMessages = useMemo(
    () => selected ? messages.filter(m => m.channelId === selected.id) : [],
    [messages, selected]
  );

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return channelMessages;
    const q = searchQuery.toLowerCase();
    return channelMessages.filter(m => m.body.toLowerCase().includes(q));
  }, [channelMessages, searchQuery]);

  return (
    <div className="h-full flex animate-fade-in" style={{ overflow: 'hidden' }}>
      {/* Channel Sidebar */}
      <aside className="hidden md:flex flex-col" style={{
        width: 252,
        borderRight: '1px solid var(--color-border-subtle)',
        background: 'var(--color-bg-secondary)',
        flexShrink: 0,
      }}>
        <div style={{ padding: 10, borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-disabled)' }} />
            <input className="input" placeholder="Search channels..." style={{ paddingLeft: 32, height: 30, fontSize: 11 }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
          {mode === 'group' && (
            <div style={{ padding: '6px 10px', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-muted)' }}>
                Channels
              </span>
            </div>
          )}
          {visibleChannels.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 10px',
                background: selected?.id === c.id ? 'var(--color-bg-elevated)' : 'transparent',
                border: selected?.id === c.id ? '1px solid var(--color-border-default)' : '1px solid transparent',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                marginBottom: 2,
              }}
              className="hover:bg-[var(--color-bg-hover)]"
            >
              {c.isDM ? (
                <Avatar name={c.name} size="sm" status="online" showStatus />
              ) : (
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Hash size={14} style={{ color: 'var(--color-text-muted)' }} />
                </div>
              )}
              <span style={{ flex: 1, fontSize: 13, fontWeight: selected?.id === c.id ? 600 : 400, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.isDM ? c.name : `#${c.name}`}
              </span>
              {c.unread > 0 && (
                <span style={{
                  width: 18, height: 18, borderRadius: '50%', background: 'var(--color-accent)',
                  color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {c.unread}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Online Members (Group mode) */}
        {mode === 'group' && group && (
          <div style={{ borderTop: '1px solid var(--color-border-subtle)', padding: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
              Members
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(group.members || []).map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Avatar name={m.name} avatar={m.avatar} size="xs" status={m.status} showStatus />
                  <span style={{ flex: 1, fontSize: 11, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                  <span style={{ fontSize: 9, color: 'var(--color-text-disabled)', fontStyle: 'italic' }}>{presenceMeta[m.status]?.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selected && (
          <>
            {/* Channel Header */}
            <div style={{
              padding: '10px 20px',
              borderBottom: '1px solid var(--color-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              {selected.isDM ? (
                <Avatar name={selected.name} size="sm" status="online" showStatus />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--color-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Hash size={16} style={{ color: 'var(--color-accent)' }} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {selected.isDM ? selected.name : `#${selected.name}`}
                </h2>
              </div>
              <button onClick={() => setShowSearch(!showSearch)} className="btn-ghost btn-icon" style={{ width: 30, height: 30 }}>
                <Search size={15} />
              </button>
              <button className="btn-ghost btn-icon" style={{ width: 30, height: 30 }}>
                <Pin size={15} />
              </button>
            </div>

            {showSearch && (
              <div style={{ padding: '6px 20px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-bg-secondary)' }}>
                <Search size={14} style={{ color: 'var(--color-text-muted)' }} />
                <input
                  className="input"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ border: 'none', background: 'transparent', padding: 0, height: 28, fontSize: 12 }}
                  autoFocus
                />
                <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
                  <X size={14} style={{ color: 'var(--color-text-muted)' }} />
                </button>
              </div>
            )}

            {/* Messages */}
            <MessageList messages={filteredMessages} currentUserId={user?.id} />

            {/* Composer */}
            <MessageComposer
              channelName={selected.isDM ? selected.name : `#${selected.name}`}
              onSend={(body) => {
                addMessage({
                  channelId: selected.id,
                  authorId: user?.id,
                  authorName: user?.name || 'You',
                  body,
                });
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

function MessageList({ messages, currentUserId }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  return (
    <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
      {messages.length === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: 13 }}>
          No messages yet. Start the conversation!
        </div>
      )}
      {messages.map((m, i) => {
        const prev = messages[i - 1];
        const grouped = prev && prev.authorId === m.authorId;
        const isMe = m.authorId === currentUserId;
        return (
          <div
            key={m.id}
            style={{
              display: 'flex',
              gap: 10,
              padding: '4px 8px',
              marginTop: grouped ? 2 : 12,
              borderRadius: 8,
              transition: 'background 0.15s',
            }}
            className="hover:bg-[var(--color-bg-hover)] group"
          >
            <div style={{ width: 34, flexShrink: 0 }}>
              {!grouped && <Avatar name={m.authorName} size="sm" status="online" showStatus />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {!grouped && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isMe ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
                    {m.authorName}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--color-text-disabled)', fontStyle: 'italic' }}>
                    {formatRelative(m.createdAt)}
                  </span>
                  {m.pinned && (
                    <span style={{ fontSize: 10, color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Pin size={10} /> pinned
                    </span>
                  )}
                </div>
              )}

              {m.replyTo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4, borderLeft: '2px solid var(--color-accent)', paddingLeft: 8 }}>
                  <Reply size={11} /> Replying to a message
                </div>
              )}

              <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--color-text-primary)' }}>{m.body}</p>

              {m.reactions && m.reactions.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  {m.reactions.map((r, ri) => (
                    <button key={ri} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
                      borderRadius: 20, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-default)',
                      fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                    }} className="hover:bg-[var(--color-bg-hover)]">
                      <span>{r.emoji}</span>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{r.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MessageComposer({ channelName, onSend }) {
  const [msg, setMsg] = useState('');

  const handleSend = () => {
    if (!msg.trim()) return;
    onSend(msg.trim());
    setMsg('');
  };

  return (
    <div style={{ borderTop: '1px solid var(--color-border-subtle)', padding: 12 }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 6,
        background: 'var(--color-bg-tertiary)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 12,
        padding: '6px 10px',
        transition: 'border-color 0.2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {[Paperclip, Image, Mic, BarChart3].map((Icon, i) => (
            <button key={i} className="btn-ghost btn-icon" style={{ width: 28, height: 28 }} title={Icon.name}>
              <Icon size={15} />
            </button>
          ))}
        </div>
        <textarea
          rows={1}
          value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder={`Message ${channelName}`}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 13,
            resize: 'none',
            minHeight: 24,
            maxHeight: 120,
            padding: '4px 0',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-sans)',
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button className="btn-ghost btn-icon" style={{ width: 28, height: 28 }}><AtSign size={15} /></button>
          <button className="btn-ghost btn-icon" style={{ width: 28, height: 28 }}><Smile size={15} /></button>
          <button
            onClick={handleSend}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: msg.trim() ? 'var(--color-accent)' : 'var(--color-bg-hover)',
              color: msg.trim() ? 'white' : 'var(--color-text-disabled)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: msg.trim() ? 'pointer' : 'default',
              transition: 'all 0.2s',
              transform: msg.trim() ? 'scale(1)' : 'scale(0.95)',
            }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
      <p style={{ fontSize: 10, color: 'var(--color-text-disabled)', marginTop: 4, paddingLeft: 4 }}>
        <kbd style={{ padding: '1px 4px', background: 'var(--color-bg-tertiary)', borderRadius: 3, fontSize: 9, fontFamily: 'var(--font-mono)' }}>Enter</kbd> to send · <kbd style={{ padding: '1px 4px', background: 'var(--color-bg-tertiary)', borderRadius: 3, fontSize: 9, fontFamily: 'var(--font-mono)' }}>Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}
