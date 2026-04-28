import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, Sun, Moon, LogOut, ChevronDown } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn, formatRelative, presenceMeta } from '../lib/utils';
import Avatar from './Avatar';

export function TopBar({ title, subtitle, actions }) {
  const { mode, group, user, userStatus, setUserStatus, notifications, markNotificationRead } = useStore();
  const [query, setQuery] = useState('');
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const statusRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (statusRef.current && !statusRef.current.contains(e.target)) setShowStatus(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayTitle = title || (mode === 'personal' ? 'Personal' : group?.name || 'Group');

  return (
    <header
      className="flex items-center justify-between shrink-0 gap-4"
      style={{
        height: 60,
        padding: '0 24px',
        background: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border-subtle)',
        zIndex: 10,
      }}
    >
      {/* Left: Title + Search */}
      <div className="flex items-center gap-5 min-w-0 flex-1">
        <div style={{ minWidth: 0 }}>
          <h1 style={{
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
          }}>
            {displayTitle}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md" style={{ position: 'relative' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-disabled)',
            }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="input"
            style={{
              paddingLeft: 36,
              height: 34,
              fontSize: 12,
              borderRadius: 10,
              background: 'var(--color-bg-tertiary)',
            }}
          />
        </div>
      </div>

      {/* Right: Actions + Notifications + Profile */}
      <div className="flex items-center gap-2">
        {actions}

        {/* Status Selector */}
        <div ref={statusRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowStatus(!showStatus)}
            className="btn-ghost btn-icon"
            style={{ width: 32, height: 32, position: 'relative' }}
            title="Set status"
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: presenceMeta[userStatus]?.color || 'var(--color-status-online)',
                boxShadow: `0 0 6px ${presenceMeta[userStatus]?.color || 'var(--color-status-online)'}`,
              }}
            />
          </button>
          {showStatus && (
            <div className="dropdown-content animate-scale-in" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, minWidth: 160, zIndex: 50 }}>
              <div style={{ padding: '8px 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)' }}>
                Set Status
              </div>
              <div className="dropdown-separator" />
              {Object.entries(presenceMeta).map(([key, meta]) => (
                <button
                  key={key}
                  className="dropdown-item"
                  onClick={() => { setUserStatus(key); setShowStatus(false); }}
                  style={{ fontWeight: userStatus === key ? 600 : 400, color: userStatus === key ? 'var(--color-text-primary)' : undefined }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                  {meta.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="btn-ghost btn-icon"
            style={{ width: 32, height: 32, position: 'relative' }}
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 3,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: 'var(--color-danger)',
                  color: 'white',
                  fontSize: 9,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
                className="animate-pulse-soft"
              >
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="dropdown-content animate-scale-in" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, width: 320, maxHeight: 400, overflowY: 'auto', zIndex: 50 }}>
              <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>Notifications</span>
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{unreadCount} unread</span>
              </div>
              <div className="dropdown-separator" />
              {notifications.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)' }}>
                  No notifications
                </div>
              ) : (
                notifications.slice(0, 8).map(n => (
                  <button
                    key={n.id}
                    className="dropdown-item"
                    onClick={() => markNotificationRead(n.id)}
                    style={{
                      alignItems: 'flex-start',
                      padding: '10px 12px',
                      opacity: n.read ? 0.6 : 1,
                      borderLeft: !n.read ? '3px solid var(--color-accent)' : '3px solid transparent',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>{n.title}</p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.3 }}>{n.message}</p>
                      <p style={{ fontSize: 10, color: 'var(--color-text-disabled)', marginTop: 3 }}>{formatRelative(n.time)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Group badge in top bar */}
        {mode === 'group' && group && (
          <div
            className="hidden lg:flex"
            style={{
              flexDirection: 'column',
              alignItems: 'flex-end',
              padding: '4px 12px',
              borderLeft: '1px solid var(--color-border-subtle)',
              marginLeft: 4,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)' }}>{group.name}</span>
            <span style={{ fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              PW: {group.password || 'none'}
            </span>
          </div>
        )}

        {/* Profile */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="hidden lg:flex items-center gap-2.5"
            style={{
              padding: '4px 8px 4px 12px',
              borderLeft: '1px solid var(--color-border-subtle)',
              marginLeft: 4,
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              borderRadius: 8,
              transition: 'background 0.2s',
            }}
          >
            <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>{user?.name || 'User'}</p>
              <p style={{ fontSize: 9, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {presenceMeta[userStatus]?.label}
              </p>
            </div>
            <Avatar name={user?.name} avatar={user?.avatar} size="sm" status={userStatus} showStatus />
          </button>
        </div>
      </div>
    </header>
  );
}
