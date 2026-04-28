import React, { useMemo } from 'react';
import { BarChart2, TrendingUp, AlertCircle, Clock, Download, Users } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn, statusMeta, priorityMeta } from '../lib/utils';

export default function Analytics() {
  const { mode, group, tasks, activities, calls } = useStore();

  if (mode === 'personal') {
    return (
      <div className="h-full flex items-center justify-center animate-fade-in">
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <BarChart2 size={24} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>Team Analytics</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Switch to Group mode to view analytics.</p>
        </div>
      </div>
    );
  }

  const groupTasks = tasks.filter(t => t.teamId === 'group');
  const completed = groupTasks.filter(t => t.status === 'done').length;
  const overdue = groupTasks.filter(t => t.status !== 'done' && new Date(t.dueDate) < new Date(new Date().toDateString())).length;
  const totalActivity = activities.length;

  const statusDist = {};
  groupTasks.forEach(t => { statusDist[t.status] = (statusDist[t.status] || 0) + 1; });

  const priorityDist = {};
  groupTasks.forEach(t => { priorityDist[t.priority] = (priorityDist[t.priority] || 0) + 1; });

  return (
    <div className="h-full overflow-y-auto animate-fade-in" style={{ padding: '24px 32px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>Team Analytics</h2>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{group?.name || 'Group'} · Dashboard</p>
          </div>
          <button className="btn btn-secondary btn-sm">
            <Download size={13} /> Export
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Tasks', value: groupTasks.length, icon: BarChart2, color: 'var(--color-accent)' },
            { label: 'Completed', value: completed, icon: TrendingUp, color: 'var(--color-success)' },
            { label: 'Overdue', value: overdue, icon: AlertCircle, color: 'var(--color-danger)' },
            { label: 'Activity Events', value: totalActivity, icon: Clock, color: 'var(--color-info)' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>
                    {stat.label}
                  </span>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} style={{ color: stat.color }} />
                  </div>
                </div>
                <p style={{ fontSize: 28, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
          {/* Task Status Distribution */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 16 }}>Task Status Distribution</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(statusMeta).map(([key, meta]) => {
                const count = statusDist[key] || 0;
                const pct = groupTasks.length > 0 ? (count / groupTasks.length) * 100 : 0;
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{meta.label}</span>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{count}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--color-bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: meta.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 16 }}>Priority Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(priorityMeta).map(([key, meta]) => {
                const count = priorityDist[key] || 0;
                const pct = groupTasks.length > 0 ? (count / groupTasks.length) * 100 : 0;
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }} />
                        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{meta.label}</span>
                      </div>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{count}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--color-bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: meta.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activity Heatmap placeholder */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 16 }}>Activity Heatmap</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
            {Array.from({ length: 28 }, (_, i) => {
              const intensity = Math.random();
              return (
                <div
                  key={i}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 4,
                    background: intensity > 0.7
                      ? 'var(--color-accent)'
                      : intensity > 0.4
                        ? 'var(--color-accent-soft)'
                        : 'var(--color-bg-tertiary)',
                    transition: 'transform 0.15s',
                    cursor: 'pointer',
                  }}
                  className="hover:scale-110"
                  title={`${Math.round(intensity * 10)} activities`}
                />
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 10, color: 'var(--color-text-disabled)' }}>Less</span>
            {[0.1, 0.3, 0.5, 0.8, 1].map((v, i) => (
              <div key={i} style={{ width: 12, height: 12, borderRadius: 3, background: v > 0.6 ? 'var(--color-accent)' : v > 0.3 ? 'var(--color-accent-soft)' : 'var(--color-bg-tertiary)' }} />
            ))}
            <span style={{ fontSize: 10, color: 'var(--color-text-disabled)' }}>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
