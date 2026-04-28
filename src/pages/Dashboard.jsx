import React, { useMemo } from 'react';
import { Calendar, CheckSquare, FileText, MessageSquare, Clock, AlertCircle, TrendingUp, Activity } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn, toDateKey, formatRelative, statusMeta, priorityMeta } from '../lib/utils';
import { NavLink } from 'react-router-dom';

export default function Dashboard() {
  const { mode, group, user, events, tasks, notes, activities } = useStore();

  const filteredTasks = useMemo(() =>
    tasks.filter(t => mode === 'personal' ? !t.teamId : t.teamId === 'group'),
    [tasks, mode]
  );

  const todayEvents = useMemo(() => {
    const today = toDateKey(new Date());
    return events.filter(e => e.date === today && (mode === 'personal' ? !e.teamId : e.teamId === 'group'));
  }, [events, mode]);

  const overdueCount = filteredTasks.filter(
    t => t.status !== 'done' && new Date(t.dueDate) < new Date(new Date().toDateString())
  ).length;

  const completedCount = filteredTasks.filter(t => t.status === 'done').length;
  const inProgressCount = filteredTasks.filter(t => t.status === 'in_progress').length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="h-full overflow-y-auto animate-fade-in" style={{ padding: '24px 32px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Welcome Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
            {greeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
            {mode === 'personal'
              ? 'Here\'s your personal dashboard.'
              : `Working in ${group?.name || 'Group'} · Team dashboard`}
          </p>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Today\'s Events', value: todayEvents.length, icon: Calendar, color: 'var(--color-accent)', to: '/calendar' },
            { label: 'In Progress', value: inProgressCount, icon: TrendingUp, color: 'var(--color-info)', to: '/tasks' },
            { label: 'Completed', value: completedCount, icon: CheckSquare, color: 'var(--color-success)', to: '/tasks' },
            { label: 'Overdue', value: overdueCount, icon: AlertCircle, color: 'var(--color-danger)', to: '/tasks' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <NavLink
                key={i}
                to={stat.to}
                className="card"
                style={{ padding: 16, display: 'block', textDecoration: 'none', transition: 'all 0.2s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
                    {stat.label}
                  </span>
                  <Icon size={16} style={{ color: stat.color }} />
                </div>
                <p style={{ fontSize: 26, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
              </NavLink>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* Today's Schedule */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>Today's Schedule</h3>
              <NavLink to="/calendar" style={{ fontSize: 11, color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
                View All →
              </NavLink>
            </div>
            {todayEvents.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: 16, textAlign: 'center' }}>
                No events today.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {todayEvents.slice(0, 5).map(e => (
                  <div key={e.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                    borderRadius: 8, background: 'var(--color-bg-tertiary)', transition: 'background 0.15s',
                  }} className="hover:bg-[var(--color-bg-hover)]">
                    <div style={{ width: 3, height: 28, borderRadius: 2, background: 'var(--color-accent)' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>{e.title}</p>
                      <p style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} /> {e.startTime} – {e.endTime}
                      </p>
                    </div>
                    <span style={{ fontSize: 9, color: 'var(--color-text-disabled)', fontStyle: 'italic' }}>by {e.createdBy}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Tasks */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>Recent Tasks</h3>
              <NavLink to="/tasks" style={{ fontSize: 11, color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>
                View All →
              </NavLink>
            </div>
            {filteredTasks.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: 16, textAlign: 'center' }}>
                No tasks yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredTasks.slice(0, 5).map(t => {
                  const pMeta = priorityMeta[t.priority] || priorityMeta.medium;
                  const overdue = t.status !== 'done' && new Date(t.dueDate) < new Date(new Date().toDateString());
                  return (
                    <div key={t.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                      borderRadius: 8, background: 'var(--color-bg-tertiary)', transition: 'background 0.15s',
                      borderLeft: overdue ? '3px solid var(--color-danger)' : '3px solid transparent',
                    }} className="hover:bg-[var(--color-bg-hover)]">
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: t.status === 'done' ? 'var(--color-text-muted)' : 'var(--color-text-primary)', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</p>
                        <p style={{ fontSize: 10, color: 'var(--color-text-disabled)' }}>{statusMeta[t.status]?.label}</p>
                      </div>
                      <span className="badge" style={{ background: pMeta.bg, color: pMeta.text, fontSize: 9 }}>{pMeta.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        {activities.length > 0 && (
          <div className="card" style={{ padding: 18, marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={14} /> Recent Activity
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {activities.slice(0, 5).map(a => (
                <div key={a.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px',
                  borderRadius: 6, fontSize: 12, color: 'var(--color-text-secondary)',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)', flexShrink: 0 }} />
                  <span>
                    <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{a.actorName}</span>{' '}
                    {a.kind.replace('_', ' ')}{' '}
                    <span style={{ fontWeight: 600 }}>{a.target}</span>
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--color-text-disabled)', fontStyle: 'italic', flexShrink: 0 }}>
                    {formatRelative(a.at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
