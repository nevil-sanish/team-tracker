import React, { useMemo } from 'react';
import { Calendar, CheckSquare, Clock, Users, Sparkles, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn, toDateKey, formatRelative, statusMeta, priorityMeta } from '../lib/utils';
import { NavLink } from 'react-router-dom';

export default function Dashboard() {
  const { activeGroup, user, events, tasks, activities } = useStore();

  const inGroup = !!activeGroup;

  const todayEvents = useMemo(() => {
    const today = toDateKey(new Date());
    return events.filter(e => e.date === today);
  }, [events]);

  const completedCount = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length;
  const uncompletedTasks = tasks.filter(t => t.status !== 'done');

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Build a simple daily summary text
  const summaryText = useMemo(() => {
    const lines = [];
    if (todayEvents.length > 0) {
      lines.push(`📅 You have ${todayEvents.length} event${todayEvents.length > 1 ? 's' : ''} today:`);
      todayEvents.slice(0, 3).forEach((e, i) => {
        lines.push(`   ${i + 1}. ${e.title} (${e.startTime} – ${e.endTime})`);
      });
    } else {
      lines.push('📅 No events scheduled for today.');
    }

    if (uncompletedTasks.length > 0) {
      lines.push('');
      lines.push(`✅ ${uncompletedTasks.length} task${uncompletedTasks.length > 1 ? 's' : ''} still pending:`);
      uncompletedTasks.slice(0, 3).forEach((t, i) => {
        const pMeta = priorityMeta[t.priority] || priorityMeta.medium;
        lines.push(`   ${i + 1}. ${t.title} — ${statusMeta[t.status]?.label || t.status} · ${pMeta.label} priority`);
      });
      if (uncompletedTasks.length > 3) {
        lines.push(`   … and ${uncompletedTasks.length - 3} more`);
      }
    } else {
      lines.push('');
      lines.push('✅ All tasks are done! Great job 🎉');
    }

    lines.push('');
    if (todayEvents.length > 0 || uncompletedTasks.length > 0) {
      lines.push('💡 Focus on your highest priority tasks first, and check your calendar before starting.');
    } else {
      lines.push('💡 Your day is clear — a perfect time to plan ahead or help a teammate!');
    }
    return lines.join('\n');
  }, [todayEvents, uncompletedTasks]);

  return (
    <div className="h-full overflow-y-auto animate-fade-in" style={{ padding: '24px 28px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Hero Section ── */}
        <div style={{
          padding: '28px 32px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, var(--color-bg-elevated), var(--color-bg-tertiary))',
          border: '1px solid var(--color-border-default)',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* subtle glow */}
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 200, height: 200,
            borderRadius: '50%', background: 'rgba(249, 115, 22, 0.06)', filter: 'blur(60px)',
          }} />
          <h1 style={{
            fontSize: 26, fontWeight: 800, color: 'var(--color-text-primary)',
            letterSpacing: '-0.02em', position: 'relative',
          }}>
            {greeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-accent)', marginTop: 6, fontWeight: 500, position: 'relative' }}>
            {inGroup
              ? <>{activeGroup.name} · <Users size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {(activeGroup.members || []).length} members</>
              : 'Your personal workspace — join a group to collaborate!'}
          </p>
        </div>

        {/* ── Stat Cards (2 cards) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
          {/* Done task count */}
          <NavLink to="/tasks" className="card" style={{
            padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16,
            textDecoration: 'none', transition: 'all 0.2s',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'var(--color-success-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckSquare size={22} style={{ color: 'var(--color-success)' }} />
            </div>
            <div>
              <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-success)', lineHeight: 1 }}>
                {completedCount}
              </p>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
                Tasks Done
              </p>
            </div>
          </NavLink>

          {/* Tasks created count */}
          <NavLink to="/tasks" className="card" style={{
            padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16,
            textDecoration: 'none', transition: 'all 0.2s',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'var(--color-accent-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckSquare size={22} style={{ color: 'var(--color-accent)' }} />
            </div>
            <div>
              <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1 }}>
                {totalTasks}
              </p>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>
                Tasks Created
              </p>
            </div>
          </NavLink>
        </div>

        {/* ── Daily Summary ── */}
        <div className="card" style={{
          padding: '20px 24px', marginBottom: 24,
          borderLeft: '4px solid var(--color-accent)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Sparkles size={16} style={{ color: 'var(--color-accent)' }} />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Today's Summary
            </h3>
          </div>
          <pre style={{
            fontSize: 12, lineHeight: 1.7, color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-sans)', whiteSpace: 'pre-wrap', margin: 0,
          }}>
            {summaryText}
          </pre>
        </div>

        {/* ── Bottom Two Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>

          {/* Today's Events */}
          <NavLink to="/calendar" className="card" style={{ padding: '20px 24px', textDecoration: 'none', display: 'block' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={16} style={{ color: 'var(--color-accent)' }} />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>Today's Events</h3>
              </div>
              <span style={{ fontSize: 11, color: 'var(--color-accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                View All <ArrowRight size={12} />
              </span>
            </div>
            {todayEvents.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <Calendar size={28} style={{ color: 'var(--color-text-disabled)', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>No events scheduled today</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {todayEvents.slice(0, 4).map(e => (
                  <div key={e.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                    borderRadius: 10, background: 'var(--color-bg-tertiary)',
                    borderLeft: '3px solid var(--color-accent)',
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.title}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Clock size={11} /> {e.startTime} – {e.endTime}
                      </p>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--color-text-disabled)', fontStyle: 'italic', flexShrink: 0 }}>
                      by {e.createdBy}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </NavLink>

          {/* Uncompleted Tasks */}
          <NavLink to="/tasks" className="card" style={{ padding: '20px 24px', textDecoration: 'none', display: 'block' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckSquare size={16} style={{ color: 'var(--color-warning)' }} />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>Uncompleted Tasks</h3>
              </div>
              <span style={{ fontSize: 11, color: 'var(--color-accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                View All <ArrowRight size={12} />
              </span>
            </div>
            {uncompletedTasks.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <CheckSquare size={28} style={{ color: 'var(--color-success)', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>All tasks completed! 🎉</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {uncompletedTasks.slice(0, 4).map(t => {
                  const pMeta = priorityMeta[t.priority] || priorityMeta.medium;
                  const overdue = new Date(t.dueDate) < new Date(new Date().toDateString());
                  return (
                    <div key={t.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                      borderRadius: 10, background: 'var(--color-bg-tertiary)',
                      borderLeft: overdue ? '3px solid var(--color-danger)' : '3px solid var(--color-border-strong)',
                      transition: 'all 0.15s',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.title}
                        </p>
                        <p style={{ fontSize: 11, color: overdue ? 'var(--color-danger)' : 'var(--color-text-muted)', marginTop: 2 }}>
                          {statusMeta[t.status]?.label || t.status}
                          {overdue && ' · Overdue'}
                        </p>
                      </div>
                      <span className="badge" style={{ background: pMeta.bg, color: pMeta.text, fontSize: 9 }}>
                        {pMeta.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </NavLink>
        </div>
      </div>
    </div>
  );
}
