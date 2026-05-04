import React, { useState, useMemo } from 'react';
import { CheckCircle2, PlusCircle, Pencil, Calendar, Share2, Pin, BarChart2, TrendingUp, AlertCircle, Clock, Users } from 'lucide-react';
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
  const [filterUser, setFilterUser] = useState('all');
  const members = activeGroup?.members || [];

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

  // Filter activities to the past week and by selected user
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const list = useMemo(() => {
    let items = [...activities]
      .filter(a => new Date(a.at) >= oneWeekAgo)
      .sort((a, b) => new Date(b.at) - new Date(a.at));
    if (filterUser !== 'all') {
      items = items.filter(a => a.actorName === filterUser);
    }
    return items;
  }, [activities, filterUser]);

  const grouped = useMemo(() => {
    const groups = {};
    list.forEach(a => {
      const key = new Date(a.at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
      (groups[key] ||= []).push(a);
    });
    return groups;
  }, [list]);

  // Get unique actor names for filter
  const uniqueActors = useMemo(() => {
    const names = new Set(activities.map(a => a.actorName));
    return Array.from(names);
  }, [activities]);

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* ── User Filter Tabs (Top) ── */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid var(--color-border-subtle)',
        background: 'var(--color-bg-secondary)',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setFilterUser('all')}
            style={{
              padding: '8px 16px', borderRadius: 10, border: '1px solid',
              borderColor: filterUser === 'all' ? 'var(--color-accent)' : 'var(--color-border-default)',
              background: filterUser === 'all' ? 'var(--color-accent-soft)' : 'var(--color-bg-elevated)',
              color: filterUser === 'all' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Users size={13} /> All Members
          </button>
          {(members.length > 0 ? members : uniqueActors.map(n => ({ name: n }))).map((m, i) => {
            const name = m.name || m;
            const isActive = filterUser === name;
            return (
              <button
                key={name}
                onClick={() => setFilterUser(isActive ? 'all' : name)}
                style={{
                  padding: '8px 16px', borderRadius: 10, border: '1px solid',
                  borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border-default)',
                  background: isActive ? 'var(--color-accent-soft)' : 'var(--color-bg-elevated)',
                  color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  fontWeight: isActive ? 600 : 400, fontSize: 12, cursor: 'pointer',
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Avatar name={name} size="xs" />
                {name}
              </button>
            );
          })}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            Past 7 days · {list.length} events
          </span>
        </div>
      </div>

      {/* ── Activity Feed ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
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
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: meta.color }} />
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
          {list.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: 13 }}>
              {filterUser !== 'all' ? `No activity from ${filterUser} in the past week.` : 'No activity in the past week. Start collaborating!'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
