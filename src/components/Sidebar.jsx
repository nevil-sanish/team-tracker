import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, CheckSquare, FileText,
  Folder, MessageSquare,
  ChevronLeft, ChevronRight, LogOut, User, Users
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { logout } from '../lib/firebase';
import { leaveGroup as leaveGroupFS } from '../lib/groupService';
import Avatar from './Avatar';

const personalItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Calendar, label: 'Calendar', path: '/calendar' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: FileText, label: 'Notes', path: '/notes' },
];

const groupItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Calendar, label: 'Calendar', path: '/calendar' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: FileText, label: 'Notes', path: '/notes' },
  { icon: MessageSquare, label: 'Chat', path: '/chat' },
  { icon: Folder, label: 'Resources', path: '/resources' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { activeGroup, user, userStatus, mode, setMode, setActiveGroup, setShowGroupSetup, clearGroupData } = useStore();
  const navigate = useNavigate();

  const inGroup = !!activeGroup;
  const isGroupMode = mode === 'group';
  const visibleItems = isGroupMode && inGroup ? groupItems : personalItems;

  const handleLeaveGroup = async () => {
    if (activeGroup && user) {
      try {
        await leaveGroupFS(activeGroup.id, user.id);
      } catch (err) {
        console.error('Failed to leave group', err);
      }
    }
    clearGroupData();
    setActiveGroup(null);
    setMode('personal');
    navigate('/dashboard');
  };

  const handleModeSwitch = (newMode) => {
    if (newMode === 'group') {
      if (!inGroup) {
        setShowGroupSetup(true);
      }
      setMode('group');
    } else {
      setMode('personal');
      navigate('/dashboard');
    }
  };

  return (
    <aside
      className={cn(
        "flex flex-col border-r shrink-0 transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[256px]"
      )}
      style={{
        background: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border-subtle)',
      }}
    >
      {/* Brand + Collapse */}
      <div
        className={cn("flex items-center justify-between px-4", collapsed && "justify-center")}
        style={{ height: 60, borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <NavLink to="/" className="flex items-center gap-2.5 min-w-0" style={{ textDecoration: 'none' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 16, flexShrink: 0,
            boxShadow: '0 2px 12px rgba(249, 115, 22, 0.3)',
          }}>
            T
          </div>
          {!collapsed && (
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
              Team Tracker
            </span>
          )}
        </NavLink>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn-ghost btn-icon"
          style={{ width: 28, height: 28, borderRadius: 8, marginLeft: collapsed ? 0 : 'auto' }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Mode Toggle: Personal / Group */}
      <div className={cn("p-3", collapsed && "px-2")}>
        {!collapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Toggle buttons */}
            <div style={{
              display: 'flex', borderRadius: 10, overflow: 'hidden',
              border: '1px solid var(--color-border-default)',
              background: 'var(--color-bg-tertiary)',
            }}>
              <button
                onClick={() => handleModeSwitch('personal')}
                style={{
                  flex: 1, padding: '7px 0', fontSize: 11, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: !isGroupMode ? 'var(--color-accent)' : 'transparent',
                  color: !isGroupMode ? 'white' : 'var(--color-text-muted)',
                  borderRadius: !isGroupMode ? 9 : 0,
                }}
              >
                <User size={13} /> Personal
              </button>
              <button
                onClick={() => handleModeSwitch('group')}
                style={{
                  flex: 1, padding: '7px 0', fontSize: 11, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: isGroupMode ? 'var(--color-accent)' : 'transparent',
                  color: isGroupMode ? 'white' : 'var(--color-text-muted)',
                  borderRadius: isGroupMode ? 9 : 0,
                }}
              >
                <Users size={13} /> Group
              </button>
            </div>

            {/* Group info (only in group mode) */}
            {isGroupMode && inGroup && (
              <div style={{
                padding: '8px 10px', borderRadius: 10,
                background: 'var(--color-accent-soft)',
                border: '1px solid rgba(108,92,231,0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: 12, flexShrink: 0,
                  }}>
                    {activeGroup.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activeGroup.name}
                    </p>
                    <p style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>
                      {(activeGroup.members || []).length} member{(activeGroup.members || []).length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {/* Member list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 70, overflowY: 'auto', marginBottom: 6 }}>
                  {(activeGroup.members || []).map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: m.status === 'online' ? 'var(--color-status-online)' : 'var(--color-status-offline)',
                        flexShrink: 0,
                      }} />
                      <span style={{
                        fontSize: 10,
                        color: m.id === user?.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                        fontWeight: m.id === user?.id ? 600 : 400,
                      }}>
                        {m.name}{m.id === user?.id ? ' (you)' : ''}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setShowGroupSetup(true)} className="btn-sm btn-secondary" style={{ flex: 1, fontSize: 10, padding: '4px 8px' }}>
                    Switch
                  </button>
                  <button onClick={handleLeaveGroup} className="btn-sm btn-danger" style={{ flex: 1, fontSize: 10, padding: '4px 8px' }}>
                    Leave
                  </button>
                </div>
              </div>
            )}

            {/* Prompt to join if group mode but no group */}
            {isGroupMode && !inGroup && (
              <button
                onClick={() => setShowGroupSetup(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '10px 10px', background: 'var(--color-bg-tertiary)',
                  border: '1px dashed var(--color-border-default)', borderRadius: 10,
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                }}
                className="hover:bg-[var(--color-bg-hover)]"
              >
                <Users size={16} style={{ color: 'var(--color-text-muted)' }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>Join or Create Group</p>
                  <p style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>Tap to get started</p>
                </div>
              </button>
            )}
          </div>
        ) : (
          /* Collapsed mode toggle */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              onClick={() => handleModeSwitch('personal')}
              className="btn-ghost"
              style={{
                width: '100%', padding: 6, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: !isGroupMode ? 'var(--color-accent-soft)' : 'transparent',
                color: !isGroupMode ? 'var(--color-accent)' : 'var(--color-text-muted)',
              }}
              title="Personal"
            >
              <User size={16} />
            </button>
            <button
              onClick={() => handleModeSwitch('group')}
              className="btn-ghost"
              style={{
                width: '100%', padding: 6, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isGroupMode ? 'var(--color-accent-soft)' : 'transparent',
                color: isGroupMode ? 'var(--color-accent)' : 'var(--color-text-muted)',
              }}
              title={inGroup ? activeGroup.name : 'Group'}
            >
              <Users size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5" style={{ paddingBottom: 16 }}>
        {!collapsed && (
          <div style={{ padding: '6px 12px 4px', marginTop: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--color-text-disabled)' }}>
              {isGroupMode ? 'Workspace' : 'Personal'}
            </span>
          </div>
        )}

        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  collapsed && "justify-center px-2"
                )
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--color-accent-soft)' : 'transparent',
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                textDecoration: 'none',
                borderLeft: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
              })}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div style={{ borderTop: '1px solid var(--color-border-subtle)', padding: collapsed ? '12px 8px' : '12px 16px' }}>
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar name={user?.name} avatar={user?.avatar} size="md" status={userStatus} showStatus />
          {!collapsed && (
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: userStatus === 'online' ? 'var(--color-status-online)' : 'var(--color-status-offline)' }} />
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                  {userStatus === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              className="btn-ghost btn-icon"
              style={{ width: 28, height: 28, color: 'var(--color-danger)' }}
              title="Sign out"
              onClick={async () => {
                await logout();
                useStore.getState().clearGroupData();
                useStore.getState().setActiveGroup(null);
                useStore.getState().setUser(null);
                useStore.getState().setMode('personal');
              }}
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
