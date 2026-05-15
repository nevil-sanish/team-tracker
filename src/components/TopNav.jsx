import React, { useState, useRef, useEffect } from 'react';
import { Bell, Sun, Moon, Users, X, CheckCheck, Trash2, UserMinus, Shield } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn, formatRelative } from '../lib/utils';
import Avatar from './Avatar';
import { removeMember, promoteToAdmin } from '../lib/groupService';

export function TopBar({ title, subtitle, actions }) {
  const { activeGroup, user, userStatus, notifications, markNotificationRead, markAllNotificationsRead, deleteNotification } = useStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved !== 'light';
  });
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const membersRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const currentUserIsAdmin = activeGroup && (
    activeGroup.createdBy === user?.id || 
    activeGroup.members?.find(m => m.id === user?.id)?.isAdmin
  );

  const handleRemoveMember = async (mId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await removeMember(activeGroup.id, mId);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handlePromote = async (mId) => {
    if (window.confirm('Are you sure you want to promote this member to admin?')) {
      try {
        await promoteToAdmin(activeGroup.id, mId);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (membersRef.current && !membersRef.current.contains(e.target)) setShowMembers(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const inGroup = !!activeGroup;
  const displayTitle = title || (inGroup ? activeGroup.name : 'Personal Workspace');

  return (
    <header
      className="flex items-center justify-between shrink-0 gap-4 top-bar-mobile"
      style={{
        height: 60,
        padding: '0 24px',
        background: darkMode ? 'rgba(10, 10, 15, 0.8)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border-subtle)',
        zIndex: 10,
      }}
    >
      {/* Left: Title */}
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
      </div>

      {/* Right: Actions + Members + Theme + Notifications + Profile */}
      <div className="flex items-center gap-2">
        {actions}

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="btn-ghost btn-icon"
          style={{ width: 32, height: 32 }}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>


        {/* Members Button (Group only) */}
        {inGroup && (
          <div ref={membersRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMembers(!showMembers)}
              className="btn-ghost btn-icon"
              style={{ width: 32, height: 32, position: 'relative' }}
              title="Group Members"
            >
              <Users size={16} />
              <span style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: 'var(--color-accent)',
                color: 'white',
                fontSize: 8,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}>
                {(activeGroup.members || []).length}
              </span>
            </button>
            {showMembers && (
              <div className="dropdown-content animate-scale-in" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, width: 280, maxHeight: 400, overflowY: 'auto', zIndex: 50 }}>
                <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>Members</span>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{(activeGroup.members || []).length} total</span>
                </div>
                <div className="dropdown-separator" />
                {(activeGroup.members || []).map(m => (
                  <div
                    key={m.id}
                    className="dropdown-item"
                    style={{ cursor: 'default', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                      <Avatar name={m.name} avatar={m.avatar} size="sm" status={m.status || 'offline'} showStatus />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 12,
                          fontWeight: m.id === user?.id ? 700 : 500,
                          color: m.id === user?.id ? 'var(--color-accent)' : 'var(--color-text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          {m.name}{m.id === user?.id ? ' (you)' : ''}
                          {(m.isAdmin || activeGroup.createdBy === m.id) && <Shield size={10} color="var(--color-accent)" />}
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{m.email}</p>
                      </div>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: m.status === 'online' ? 'var(--color-status-online)' : 'var(--color-status-offline)',
                        flexShrink: 0,
                      }} />
                    </div>

                    {currentUserIsAdmin && m.id !== user?.id && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                        {!m.isAdmin && activeGroup.createdBy !== m.id && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePromote(m.id); }}
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                              padding: '6px 0',
                              fontSize: 10,
                              fontWeight: 600,
                              background: 'var(--color-bg-tertiary)',
                              color: 'var(--color-text-primary)',
                              border: '1px solid var(--color-border-default)',
                              borderRadius: 4,
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-secondary)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-bg-tertiary)'; }}
                          >
                            <Shield size={10} /> Promote
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveMember(m.id); }}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            padding: '6px 0',
                            fontSize: 10,
                            fontWeight: 600,
                            background: 'var(--color-danger-soft)',
                            color: 'var(--color-danger)',
                            border: '1px solid transparent',
                            borderRadius: 4,
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                        >
                          <UserMinus size={10} /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
            <div className="dropdown-content animate-scale-in" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, width: 340, maxHeight: 440, overflowY: 'auto', zIndex: 50 }}>
              <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>Notifications</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{unreadCount} unread</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markAllNotificationsRead(); }}
                      title="Mark all as read"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: '3px 8px',
                        borderRadius: 6,
                        border: '1px solid var(--color-border-default)',
                        background: 'var(--color-bg-tertiary)',
                        color: 'var(--color-accent)',
                        fontSize: 9,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent-soft)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-bg-tertiary)'; }}
                    >
                      <CheckCheck size={10} /> Mark all read
                    </button>
                  )}
                </div>
              </div>
              <div className="dropdown-separator" />
              {notifications.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)' }}>
                  No notifications yet
                </div>
              ) : (
                notifications.slice(0, 20).map(n => (
                  <div
                    key={n.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: '10px 12px',
                      opacity: n.read ? 0.6 : 1,
                      borderLeft: !n.read ? '3px solid var(--color-accent)' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      gap: 8,
                    }}
                    className="dropdown-item"
                    onClick={() => markNotificationRead(n.id)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>{n.title}</p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.3 }}>{n.message}</p>
                      {n.section && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'var(--color-accent)',
                          marginTop: 3,
                          display: 'inline-block',
                        }}>
                          {n.section}
                        </span>
                      )}
                      <p style={{ fontSize: 10, color: 'var(--color-text-disabled)', marginTop: 3 }}>{n.time ? formatRelative(n.time) : ''}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                      title="Delete notification"
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-text-disabled)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                        marginTop: 1,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-danger-soft)'; e.currentTarget.style.color = 'var(--color-danger)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-disabled)'; }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} style={{ position: 'relative' }} className="top-bar-profile-desktop">
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: userStatus === 'online' ? 'var(--color-status-online)' : 'var(--color-status-offline)' }} />
                <p style={{ fontSize: 9, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {userStatus === 'online' ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            <Avatar name={user?.name} avatar={user?.avatar} size="sm" status={userStatus} showStatus />
          </button>
        </div>
      </div>
    </header>
  );
}
