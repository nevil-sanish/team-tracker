import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Hash, Send, Search, X, Plus, Users, Lock, Globe, ChevronDown, MessageSquare } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatRelative } from '../lib/utils';
import { saveMessage, saveChannel } from '../lib/dataService';
import Avatar from '../components/Avatar';

export default function Chat() {
  const { activeGroup, channels, messages, user, addNotification } = useStore();
  const groupId = activeGroup?.id;

  if (!activeGroup) {
    return (
      <div className="h-full flex items-center justify-center animate-fade-in">
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <MessageSquare size={24} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>Group Chat</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Join a group to start chatting with your team.</p>
        </div>
      </div>
    );
  }

  const [selectedId, setSelectedId] = useState(channels[0]?.id ?? null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!selectedId && channels.length > 0) setSelectedId(channels[0].id);
  }, [channels, selectedId]);

  const selected = channels.find(c => c.id === selectedId) ?? channels[0];
  const channelMessages = useMemo(() => selected ? messages.filter(m => m.channelId === selected.id) : [], [messages, selected]);

  const handleSend = async (body) => {
    const msg = { channelId: selected.id, authorId: user?.id, authorName: user?.name || 'You', authorAvatar: user?.avatar || null, body, createdAt: new Date().toISOString(), reactions: [] };
    if (groupId) await saveMessage(groupId, msg);
    addNotification({ title: 'New Message', message: `in #${selected.name}: "${body.slice(0, 50)}"`, type: 'info', section: 'Chat' });
  };

  const handleCreateChannel = async (channelData) => {
    if (!groupId) return;
    await saveChannel(groupId, channelData);
    setSelectedId(channelData.id);
    setShowCreate(false);
  };

  // Separate general/default channels from custom groups
  const defaultChannels = channels.filter(c => !c.isGroup);
  const groupChannels = channels.filter(c => c.isGroup);

  return (
    <div className="h-full flex animate-fade-in" style={{ overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col" style={{ width: 260, borderRight: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-secondary)', flexShrink: 0 }}>
        {/* Header */}
        <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>Chat</span>
          <button onClick={() => setShowCreate(true)} className="btn-ghost btn-icon" style={{ width: 28, height: 28 }} title="Create channel">
            <Plus size={15} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
          {/* Channels Section */}
          <div style={{ padding: '8px 10px 4px' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-muted)' }}>Channels</span>
          </div>
          {defaultChannels.map(c => (
            <ChannelButton key={c.id} channel={c} selected={selected?.id === c.id} onClick={() => setSelectedId(c.id)} messages={messages} />
          ))}

          {/* Group Chats Section */}
          <div style={{ padding: '12px 10px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-muted)' }}>Group Chats</span>
            <button onClick={() => setShowCreate(true)} className="btn-ghost btn-icon" style={{ width: 20, height: 20 }}>
              <Plus size={11} />
            </button>
          </div>
          {groupChannels.length === 0 ? (
            <p style={{ fontSize: 11, color: 'var(--color-text-disabled)', padding: '4px 12px', fontStyle: 'italic' }}>No group chats yet</p>
          ) : groupChannels.map(c => (
            <ChannelButton key={c.id} channel={c} selected={selected?.id === c.id} onClick={() => setSelectedId(c.id)} messages={messages} isGroup />
          ))}
        </div>

        {/* Members */}
        <div style={{ borderTop: '1px solid var(--color-border-subtle)', padding: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>Online · {(activeGroup.members || []).filter(m => m.status === 'online').length}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 120, overflowY: 'auto' }}>
            {(activeGroup.members || []).map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Avatar name={m.name} avatar={m.avatar} size="xs" status={m.status || 'online'} showStatus />
                <span style={{ flex: 1, fontSize: 11, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selected && (<>
          {/* Channel Header */}
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: selected.isGroup ? 'var(--color-bg-tertiary)' : 'var(--color-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selected.isGroup ? <Users size={15} style={{ color: 'var(--color-text-muted)' }} /> : <Hash size={16} style={{ color: 'var(--color-accent)' }} />}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {selected.isGroup ? selected.name : `#${selected.name}`}
              </h2>
              {selected.memberNames && (
                <p style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{selected.memberNames.join(', ')}</p>
              )}
            </div>
          </div>

          <MessageList messages={channelMessages} currentUserId={user?.id} />
          <MessageComposer channelName={selected.isGroup ? selected.name : `#${selected.name}`} onSend={handleSend} />
        </>)}
      </div>

      {/* Create Channel Modal */}
      {showCreate && (
        <CreateChannelModal
          members={activeGroup.members || []}
          currentUserId={user?.id}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateChannel}
        />
      )}
    </div>
  );
}

function ChannelButton({ channel, selected, onClick, messages, isGroup }) {
  const unread = messages.filter(m => m.channelId === channel.id).length;
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px',
      background: selected ? 'var(--color-bg-elevated)' : 'transparent',
      border: selected ? '1px solid var(--color-border-default)' : '1px solid transparent',
      borderRadius: 8, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', marginBottom: 2,
    }} className="hover:bg-[var(--color-bg-hover)]">
      <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isGroup ? <Users size={12} style={{ color: 'var(--color-text-muted)' }} /> : <Hash size={12} style={{ color: 'var(--color-text-muted)' }} />}
      </div>
      <span style={{ flex: 1, fontSize: 12, fontWeight: selected ? 600 : 400, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {isGroup ? channel.name : `#${channel.name}`}
      </span>
    </button>
  );
}

function MessageList({ messages, currentUserId }) {
  const scrollRef = useRef(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);
  return (
    <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
      {messages.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
          <MessageSquare size={32} style={{ color: 'var(--color-text-disabled)' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No messages yet. Start the conversation!</p>
        </div>
      )}
      {messages.map((m, i) => {
        const prev = messages[i - 1];
        const grouped = prev && prev.authorId === m.authorId;
        const isMe = m.authorId === currentUserId;
        return (
          <div key={m.id || i} style={{ display: 'flex', gap: 10, padding: '4px 8px', marginTop: grouped ? 2 : 12, borderRadius: 8, transition: 'background 0.15s' }} className="hover:bg-[var(--color-bg-hover)]">
            <div style={{ width: 34, flexShrink: 0 }}>
              {!grouped && <Avatar name={m.authorName} avatar={m.authorAvatar} size="sm" status="online" showStatus />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {!grouped && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isMe ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>{m.authorName}</span>
                  <span style={{ fontSize: 10, color: 'var(--color-text-disabled)' }}>{formatRelative(m.createdAt)}</span>
                </div>
              )}
              <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--color-text-primary)', wordBreak: 'break-word' }}>{m.body}</p>
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
        <button onClick={handleSend} style={{
          width: 32, height: 32, borderRadius: 10,
          background: msg.trim() ? 'var(--color-accent)' : 'var(--color-bg-hover)',
          color: msg.trim() ? 'white' : 'var(--color-text-disabled)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none',
          cursor: msg.trim() ? 'pointer' : 'default', transition: 'all 0.2s',
        }}>
          <Send size={15} />
        </button>
      </div>
      <p style={{ fontSize: 10, color: 'var(--color-text-disabled)', marginTop: 4, paddingLeft: 4 }}>
        <kbd style={{ padding: '1px 4px', background: 'var(--color-bg-tertiary)', borderRadius: 3, fontSize: 9, fontFamily: 'var(--font-mono)' }}>Enter</kbd> to send
      </p>
    </div>
  );
}

function CreateChannelModal({ members, currentUserId, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [error, setError] = useState('');

  const otherMembers = members.filter(m => m.id !== currentUserId);

  const toggleMember = (memberId) => {
    setSelectedMembers(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    if (isGroup && selectedMembers.length === 0) { setError('Select at least one member'); return; }

    const channelId = `ch_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const memberNames = isGroup
      ? members.filter(m => selectedMembers.includes(m.id) || m.id === currentUserId).map(m => m.name)
      : [];

    onCreate({
      id: channelId,
      name: name.trim(),
      isGroup,
      memberIds: isGroup ? [...selectedMembers, currentUserId] : [],
      memberNames,
      createdAt: new Date().toISOString(),
      createdBy: currentUserId,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={18} style={{ color: 'var(--color-accent)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>Create Channel</h2>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Add a new channel or group chat</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost btn-icon" style={{ width: 28, height: 28 }}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Type Toggle */}
          <div className="tab-group" style={{ marginBottom: 16 }}>
            <button type="button" className={`tab-item ${!isGroup ? 'active' : ''}`} onClick={() => setIsGroup(false)} style={{ flex: 1 }}>
              <Hash size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> Channel
            </button>
            <button type="button" className={`tab-item ${isGroup ? 'active' : ''}`} onClick={() => setIsGroup(true)} style={{ flex: 1 }}>
              <Users size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> Group Chat
            </button>
          </div>

          {/* Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              {isGroup ? 'Group Name' : 'Channel Name'}
            </label>
            <input type="text" className="input" placeholder={isGroup ? 'e.g. Design Team' : 'e.g. announcements'} value={name} onChange={e => { setName(e.target.value); setError(''); }} autoFocus />
          </div>

          {/* Member Selection (group only) */}
          {isGroup && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                Select Members ({selectedMembers.length} selected)
              </label>
              <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--color-border-default)', borderRadius: 10, background: 'var(--color-bg-tertiary)' }}>
                {otherMembers.length === 0 ? (
                  <p style={{ padding: 16, textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)' }}>No other members in this group</p>
                ) : otherMembers.map(m => (
                  <label key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer',
                    borderBottom: '1px solid var(--color-border-subtle)', transition: 'background 0.15s',
                    background: selectedMembers.includes(m.id) ? 'var(--color-accent-soft)' : 'transparent',
                  }}>
                    <input type="checkbox" checked={selectedMembers.includes(m.id)} onChange={() => toggleMember(m.id)}
                      style={{ width: 16, height: 16, accentColor: 'var(--color-accent)', cursor: 'pointer' }} />
                    <Avatar name={m.name} avatar={m.avatar} size="xs" />
                    <span style={{ fontSize: 12, color: 'var(--color-text-primary)', fontWeight: 500 }}>{m.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && <p style={{ fontSize: 12, color: 'var(--color-danger)', marginBottom: 12 }}>{error}</p>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', height: 38, fontSize: 13, fontWeight: 600 }}>
            <Plus size={15} /> Create {isGroup ? 'Group Chat' : 'Channel'}
          </button>
        </form>
      </div>
    </div>
  );
}
