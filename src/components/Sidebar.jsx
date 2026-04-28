import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Calendar, CheckSquare, FileText, MessageSquare,
  Phone, Activity, BarChart2, Folder,
  ChevronLeft, ChevronRight, Settings, LogOut, User, Users
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { logout } from '../lib/firebase';
import Avatar from './Avatar';
import StatusBadge from './StatusBadge';

const navItems = [
  { icon: Calendar, label: 'Calendar', path: '/calendar', modes: ['personal', 'group'] },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks', modes: ['personal', 'group'] },
  { icon: FileText, label: 'Notes', path: '/notes', modes: ['personal', 'group'] },
  { icon: MessageSquare, label: 'Chat', path: '/chat', modes: ['personal', 'group'] },
  { icon: Phone, label: 'Calls', path: '/calls', modes: ['personal', 'group'] },
  { icon: Activity, label: 'Activity', path: '/activity', modes: ['group'] },
  { icon: BarChart2, label: 'Analytics', path: '/analytics', modes: ['group'] },
  { icon: Folder, label: 'Resources', path: '/resources', modes: ['group'] },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { mode, toggleMode, user, userStatus, group, exitGroup, setShowGroupSetup } = useStore();

  const visibleItems = navItems.filter(item => item.modes.includes(mode));

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

      {/* Mode Toggle */}
      <div className={cn("p-3", collapsed && "px-2")}>
        {!collapsed ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: 3,
              background: 'var(--color-bg-tertiary)',
              borderRadius: 10,
              cursor: 'pointer',
              position: 'relative',
            }}
            onClick={toggleMode}
          >
            <div
              style={{
                position: 'absolute',
                top: 3,
                bottom: 3,
                width: 'calc(50% - 3px)',
                background: 'var(--color-bg-elevated)',
                borderRadius: 8,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                left: mode === 'personal' ? 3 : 'calc(50%)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '7px 0',
                fontSize: 12,
                fontWeight: 600,
                position: 'relative',
                zIndex: 1,
                color: mode === 'personal' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                transition: 'color 0.2s',
              }}
            >
              <User size={14} />
              <span>Personal</span>
            </div>
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '7px 0',
                fontSize: 12,
                fontWeight: 600,
                position: 'relative',
                zIndex: 1,
                color: mode === 'group' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                transition: 'color 0.2s',
              }}
            >
              <Users size={14} />
              <span>Group</span>
            </div>
          </div>
        ) : (
          <button
            onClick={toggleMode}
            className="btn-ghost"
            style={{
              width: '100%',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={mode === 'personal' ? 'Switch to Group' : 'Switch to Personal'}
          >
            {mode === 'personal' ? <User size={16} /> : <Users size={16} />}
          </button>
        )}

        {/* Group Info */}
        {mode === 'group' && group && !collapsed && (
          <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--color-accent-soft)', border: '1px solid rgba(108,92,231,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-accent)' }}>Active Group</span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginTop: 2 }}>{group.name}</p>
            <p style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
              PW: {group.password || 'None'}
            </p>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button
                onClick={() => setShowGroupSetup(true)}
                className="btn-sm btn-secondary"
                style={{ flex: 1, fontSize: 10, padding: '4px 8px' }}
              >
                Switch
              </button>
              <button
                onClick={exitGroup}
                className="btn-sm btn-danger"
                style={{ flex: 1, fontSize: 10, padding: '4px 8px' }}
              >
                Exit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5" style={{ paddingBottom: 16 }}>
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
            <div style={{ display: 'flex', gap: 2 }}>
              <button className="btn-ghost btn-icon" style={{ width: 28, height: 28 }} title="Settings">
                <Settings size={15} />
              </button>
              <button
                className="btn-ghost btn-icon"
                style={{ width: 28, height: 28, color: 'var(--color-danger)' }}
                title="Sign out"
                onClick={async () => {
                  await logout();
                  useStore.getState().setUser(null);
                }}
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
