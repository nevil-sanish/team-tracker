import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Calendar, CheckSquare, FileText,
  Activity, Folder,
  ChevronLeft, ChevronRight, LogOut, User, Users
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { logout } from '../lib/firebase';
import { leaveGroup as leaveGroupFS } from '../lib/groupService';
import Avatar from './Avatar';
import StatusBadge from './StatusBadge';

const navItems = [
  { icon: Calendar, label: 'Calendar', path: '/calendar', requiresGroup: false },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks', requiresGroup: false },
  { icon: FileText, label: 'Notes', path: '/notes', requiresGroup: false },
  { icon: Activity, label: 'Activity', path: '/activity', requiresGroup: true },
  { icon: Folder, label: 'Resources', path: '/resources', requiresGroup: true },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { activeGroup, user, userStatus, setActiveGroup, setShowGroupSetup, clearGroupData } = useStore();

  const inGroup = !!activeGroup;
  const visibleItems = navItems.filter(item => !item.requiresGroup || inGroup);

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
  };

  const handleSwitchGroup = () => {
    setShowGroupSetup(true);
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
        style={{
          height: 60,
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        <NavLink to="/" className="flex items-center gap-2.5 min-w-0" style={{ textDecoration: 'none' }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: 16,
              flexShrink: 0,
              boxShadow: '0 2px 12px rgba(108, 92, 231, 0.3)',
            }}
          >
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

      {/* Group / Personal toggle area */}
      <div className={cn("p-3", collapsed && "px-2")}>
        {!collapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Group join/switch button */}
            <button
              onClick={handleSwitchGroup}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 10px',
                background: inGroup ? 'var(--color-accent-soft)' : 'var(--color-bg-tertiary)',
                border: inGroup ? '1px solid rgba(108,92,231,0.2)' : '1px solid var(--color-border-default)',
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
              }}
              className="hover:bg-[var(--color-bg-hover)]"
            >
              <div style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: inGroup
                  ? 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))'
                  : 'var(--color-bg-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: inGroup ? 'white' : 'var(--color-text-muted)',
                fontWeight: 700,
                fontSize: 13,
                flexShrink: 0,
              }}>
                {inGroup ? activeGroup.name.charAt(0).toUpperCase() : <Users size={14} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {inGroup ? activeGroup.name : 'No Group'}
                </p>
                <p style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>
                  {inGroup
                    ? `${(activeGroup.members || []).length} member${(activeGroup.members || []).length !== 1 ? 's' : ''}`
                    : 'Join or create a group'}
                </p>
              </div>
              <ChevronRight size={13} style={{ color: 'var(--color-text-disabled)', flexShrink: 0 }} />
            </button>

            {/* Group Info & Actions */}
            {inGroup && (
              <div style={{
                padding: '8px 10px',
                borderRadius: 8,
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border-subtle)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)' }}>
                    Members
                  </span>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-disabled)' }}>
                    {(activeGroup.members || []).length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 80, overflowY: 'auto' }}>
                  {(activeGroup.members || []).map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: m.status === 'online' ? 'var(--color-status-online)' : 'var(--color-status-offline)',
                        flexShrink: 0,
                      }} />
                      <span style={{
                        fontSize: 11,
                        color: m.id === user?.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                        fontWeight: m.id === user?.id ? 600 : 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {m.name}{m.id === user?.id ? ' (you)' : ''}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button
                    onClick={handleSwitchGroup}
                    className="btn-sm btn-secondary"
                    style={{ flex: 1, fontSize: 10, padding: '4px 8px' }}
                  >
                    Switch
                  </button>
                  <button
                    onClick={handleLeaveGroup}
                    className="btn-sm btn-danger"
                    style={{ flex: 1, fontSize: 10, padding: '4px 8px' }}
                  >
                    Leave
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleSwitchGroup}
            className="btn-ghost"
            style={{
              width: '100%',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={inGroup ? activeGroup.name : 'Join a Group'}
          >
            {inGroup ? (
              <div style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 11,
                fontWeight: 700,
              }}>
                {activeGroup.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <Users size={16} />
            )}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5" style={{ paddingBottom: 16 }}>
        {/* Personal section label */}
        {!collapsed && (
          <div style={{ padding: '6px 12px 4px', marginTop: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--color-text-disabled)' }}>
              {inGroup ? 'Workspace' : 'Personal'}
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
      <div
        style={{
          borderTop: '1px solid var(--color-border-subtle)',
          padding: collapsed ? '12px 8px' : '12px 16px',
        }}
      >
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar
            name={user?.name}
            avatar={user?.avatar}
            size="md"
            status={userStatus}
            showStatus
          />
          {!collapsed && (
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'User'}
              </div>
              <StatusBadge status={userStatus} showLabel size="sm" />
            </div>
          )}
          {!collapsed && (
            <button
              className="btn-ghost btn-icon"
              style={{ width: 28, height: 28, color: 'var(--color-danger)' }}
              title="Sign out"
              onClick={async () => {
                // Leave current group if any
                if (activeGroup && user) {
                  try {
                    await leaveGroupFS(activeGroup.id, user.id);
                  } catch (err) {
                    console.error(err);
                  }
                }
                await logout();
                useStore.getState().clearGroupData();
                useStore.getState().setActiveGroup(null);
                useStore.getState().setUser(null);
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
