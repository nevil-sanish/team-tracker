import React, { useMemo, useState, useEffect } from 'react';
import { Calendar, CheckSquare, Clock, Users, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn, toDateKey, formatRelative, statusMeta, priorityMeta } from '../lib/utils';
import { NavLink } from 'react-router-dom';
import { getSummary } from '../lib/groqService';

export default function Dashboard() {
  const { activeGroup, user, events, tasks } = useStore();
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

  // AI Summary
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchSummary = async () => {
      setAiLoading(true);
      try {
        const result = await getSummary(todayEvents, uncompletedTasks);
        if (!cancelled) setAiSummary(result);
      } catch {
        if (!cancelled) setAiSummary('• Check your calendar and tasks for today.\n• Focus on high priority items first.');
      }
      if (!cancelled) setAiLoading(false);
    };
    fetchSummary();
    return () => { cancelled = true; };
  }, [todayEvents.length, uncompletedTasks.length]);

  return (
    <div className="h-full flex flex-col animate-fade-in" style={{ padding: '14px 20px', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>

        {/* Hero */}
        <div style={{ padding: '14px 20px', borderRadius: 12, background: 'linear-gradient(135deg, var(--color-bg-elevated), var(--color-bg-tertiary))', border: '1px solid var(--color-border-default)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(249,115,22,0.06)', filter: 'blur(50px)' }} />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', position: 'relative' }}>
            {greeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p style={{ fontSize: 11, color: 'var(--color-accent)', marginTop: 3, fontWeight: 500, position: 'relative' }}>
            {inGroup ? <>{activeGroup.name} · <Users size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {(activeGroup.members || []).length} members</> : 'Your personal workspace'}
          </p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flexShrink: 0 }}>
          <NavLink to="/tasks" className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckSquare size={18} style={{ color: 'var(--color-success)' }} />
            </div>
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-success)', lineHeight: 1 }}>{completedCount}</p>
              <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 1 }}>Tasks Done</p>
            </div>
          </NavLink>
          <NavLink to="/tasks" className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--color-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckSquare size={18} style={{ color: 'var(--color-accent)' }} />
            </div>
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1 }}>{totalTasks}</p>
              <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 1 }}>Tasks Created</p>
            </div>
          </NavLink>
        </div>

        {/* Summary */}
        <div className="card" style={{ padding: '10px 16px', borderLeft: '3px solid var(--color-accent)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Sparkles size={13} style={{ color: 'var(--color-accent)' }} />
            <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>AI Summary</h3>
            {aiLoading && <Loader2 size={12} style={{ color: 'var(--color-accent)', animation: 'spin 1s linear infinite' }} />}
          </div>
          <pre style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', whiteSpace: 'pre-wrap', margin: 0 }}>
            {aiLoading ? 'Generating summary...' : aiSummary}
          </pre>
        </div>

        {/* Bottom Two Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1, minHeight: 0 }}>
          {/* Today's Events */}
          <NavLink to="/calendar" className="card" style={{ padding: '10px 14px', textDecoration: 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={13} style={{ color: 'var(--color-accent)' }} />
                <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>Today's Events</h3>
              </div>
              <span style={{ fontSize: 10, color: 'var(--color-accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>View All <ArrowRight size={10} /></span>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {todayEvents.length === 0 ? (
                <div style={{ padding: '12px 8px', textAlign: 'center' }}>
                  <Calendar size={22} style={{ color: 'var(--color-text-disabled)', margin: '0 auto 4px' }} />
                  <p style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>No events today</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {todayEvents.slice(0, 3).map(e => (
                    <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, background: 'var(--color-bg-tertiary)', borderLeft: '2px solid var(--color-accent)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</p>
                        <p style={{ fontSize: 9, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={9} /> {e.startTime} – {e.endTime}</p>
                      </div>
                      <span style={{ fontSize: 8, color: 'var(--color-text-disabled)', flexShrink: 0 }}>by {e.createdBy}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </NavLink>

          {/* Uncompleted Tasks */}
          <NavLink to="/tasks" className="card" style={{ padding: '10px 14px', textDecoration: 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckSquare size={13} style={{ color: 'var(--color-warning)' }} />
                <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>Uncompleted Tasks</h3>
              </div>
              <span style={{ fontSize: 10, color: 'var(--color-accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>View All <ArrowRight size={10} /></span>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {uncompletedTasks.length === 0 ? (
                <div style={{ padding: '12px 8px', textAlign: 'center' }}>
                  <CheckSquare size={22} style={{ color: 'var(--color-success)', margin: '0 auto 4px' }} />
                  <p style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>All tasks completed! 🎉</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {uncompletedTasks.slice(0, 3).map(t => {
                    const pMeta = priorityMeta[t.priority] || priorityMeta.medium;
                    const overdue = new Date(t.dueDate) < new Date(new Date().toDateString());
                    return (
                      <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, background: 'var(--color-bg-tertiary)', borderLeft: overdue ? '2px solid var(--color-danger)' : '2px solid var(--color-border-strong)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                          <p style={{ fontSize: 9, color: overdue ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>{statusMeta[t.status]?.label || t.status}{overdue && ' · Overdue'}</p>
                        </div>
                        <span className="badge" style={{ background: pMeta.bg, color: pMeta.text, fontSize: 8 }}>{pMeta.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </NavLink>
        </div>
      </div>
    </div>
  );
}
