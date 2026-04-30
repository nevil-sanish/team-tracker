import React, { useState, useMemo } from 'react';
import { CheckCircle2, PlusCircle, Pencil, Calendar, Share2, Pin, Filter, BarChart2, TrendingUp, AlertCircle, Clock, Users } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatRelative, statusMeta, priorityMeta } from '../lib/utils';
import Avatar from '../components/Avatar';

const kindIcons = {
  task_completed: { icon: CheckCircle2, color: 'var(--color-success)' },
  task_created: { icon: PlusCircle, color: 'var(--color-info)' },
  task_updated: { icon: Pencil, color: 'var(--color-warning)' },
  task_deleted: { icon: AlertCircle, color: 'var(--color-danger)' },
  note_created: { icon: PlusCircle, color: 'var(--color-success)' },
  note_edited: { icon: Pencil, color: 'var(--color-success)' },
  event_created: { icon: Calendar, color: 'var(--color-info)' },
  file_shared: { icon: Share2, color: 'var(--color-danger)' },
  message_pinned: { icon: Pin, color: 'var(--color-warning)' },
  resource_added: { icon: PlusCircle, color: 'var(--color-accent)' },
};

const kindDesc = { task_completed:'completed', task_created:'created', task_updated:'updated', task_deleted:'deleted', note_created:'created', note_edited:'edited', event_created:'scheduled', file_shared:'shared', message_pinned:'pinned', resource_added:'added' };

export default function Activity() {
  const { activeGroup, activities, tasks } = useStore();
  const [tab, setTab] = useState('activity');
  const [filterKind, setFilterKind] = useState(null);

  if (!activeGroup) {
    return (
      <div className="h-full flex items-center justify-center animate-fade-in">
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><BarChart2 size={24} style={{ color: 'var(--color-text-muted)' }} /></div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>Activity & Analytics</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Join a group to see team activity and analytics.</p>
        </div>
      </div>
    );
  }

  const list = useMemo(() => {
    let items = [...activities].sort((a, b) => new Date(b.at) - new Date(a.at));
    if (filterKind) items = items.filter(a => a.kind.startsWith(filterKind));
    return items;
  }, [activities, filterKind]);

  const grouped = useMemo(() => {
    const groups = {};
    list.forEach(a => { const key = new Date(a.at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }); (groups[key] ||= []).push(a); });
    return groups;
  }, [list]);

  // Analytics data
  const completed = tasks.filter(t => t.status === 'done').length;
  const overdue = tasks.filter(t => t.status !== 'done' && new Date(t.dueDate) < new Date(new Date().toDateString())).length;
  const statusDist = {}; tasks.forEach(t => { statusDist[t.status] = (statusDist[t.status] || 0) + 1; });
  const priorityDist = {}; tasks.forEach(t => { priorityDist[t.priority] = (priorityDist[t.priority] || 0) + 1; });

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Tabs */}
      <div className="flex items-center gap-3 px-6 py-3" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        <div className="tab-group">
          <button className={`tab-item ${tab === 'activity' ? 'active' : ''}`} onClick={() => setTab('activity')} style={{ fontSize: 11, padding: '4px 14px' }}>Activity Feed</button>
          <button className={`tab-item ${tab === 'analytics' ? 'active' : ''}`} onClick={() => setTab('analytics')} style={{ fontSize: 11, padding: '4px 14px' }}>Analytics</button>
        </div>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
          {activeGroup.name} · {(activeGroup.members || []).length} members
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {tab === 'analytics' ? (
            <>
              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
                {[
                  { label: 'Total Tasks', value: tasks.length, icon: BarChart2, color: 'var(--color-accent)' },
                  { label: 'Completed', value: completed, icon: TrendingUp, color: 'var(--color-success)' },
                  { label: 'Overdue', value: overdue, icon: AlertCircle, color: 'var(--color-danger)' },
                  { label: 'Activity Events', value: activities.length, icon: Clock, color: 'var(--color-info)' },
                  { label: 'Members', value: (activeGroup.members || []).length, icon: Users, color: 'var(--color-accent)' },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="card" style={{ padding: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>{stat.label}</span>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: `color-mix(in srgb, ${stat.color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} style={{ color: stat.color }} /></div>
                      </div>
                      <p style={{ fontSize: 28, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
                    </div>
                  );
                })}
              </div>
              {/* Distribution Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="card" style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 16 }}>Task Status</h3>
                  {Object.entries(statusMeta).map(([key, meta]) => {
                    const count = statusDist[key] || 0;
                    const pct = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
                    return (<div key={key} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{meta.label}</span><span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{count}</span></div>
                      <div style={{ height: 6, background: 'var(--color-bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, background: meta.color, borderRadius: 3, transition: 'width 0.5s ease' }} /></div>
                    </div>);
                  })}
                </div>
                <div className="card" style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 16 }}>Priority Breakdown</h3>
                  {Object.entries(priorityMeta).map(([key, meta]) => {
                    const count = priorityDist[key] || 0;
                    const pct = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
                    return (<div key={key} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }} /><span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{meta.label}</span></div><span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{count}</span></div>
                      <div style={{ height: 6, background: 'var(--color-bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, background: meta.color, borderRadius: 3, transition: 'width 0.5s ease' }} /></div>
                    </div>);
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Activity Filters */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div className="tab-group">
                  {['All', 'task', 'note', 'event', 'resource'].map(kind => (
                    <button key={kind} className={`tab-item ${filterKind === kind || (kind === 'All' && !filterKind) ? 'active' : ''}`} onClick={() => setFilterKind(kind === 'All' ? null : kind)} style={{ fontSize: 11, padding: '4px 10px', textTransform: 'capitalize' }}>
                      {kind === 'All' ? 'All' : kind + 's'}
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>{list.length} items</span>
              </div>
              {/* Timeline */}
              {Object.entries(grouped).map(([dateLabel, items]) => (
                <div key={dateLabel} style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{dateLabel}</h3>
                    <div style={{ flex: 1, height: 1, background: 'var(--color-border-subtle)' }} />
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-disabled)' }}>{items.length}</span>
                  </div>
                  <ol style={{ position: 'relative', borderLeft: '2px solid var(--color-border-default)', marginLeft: 10, paddingLeft: 20, listStyle: 'none' }}>
                    {items.map(a => {
                      const meta = kindIcons[a.kind] || { icon: Pencil, color: 'var(--color-text-muted)' };
                      const Icon = meta.icon;
                      return (
                        <li key={a.id} style={{ position: 'relative', marginBottom: 12 }}>
                          <span style={{ position: 'absolute', left: -27, top: 6, width: 12, height: 12, borderRadius: '50%', background: 'var(--color-bg-elevated)', border: '2px solid var(--color-border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-accent)' }} />
                          </span>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', borderRadius: 10, transition: 'background 0.15s', cursor: 'pointer' }} className="hover:bg-[var(--color-bg-hover)]">
                            <Avatar name={a.actorName} size="sm" status="online" showStatus />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, lineHeight: 1.4 }}>
                                <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{a.actorName}</span>{' '}
                                <span style={{ color: 'var(--color-text-muted)' }}>{kindDesc[a.kind] || 'touched'}</span>{' '}
                                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{a.target}</span>
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                <Icon size={13} style={{ color: meta.color }} />
                                <span style={{ fontSize: 10, color: 'var(--color-text-disabled)', fontStyle: 'italic' }}>{formatRelative(a.at)}</span>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
              {list.length === 0 && (<div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: 13 }}>No activity yet. Start collaborating!</div>)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
