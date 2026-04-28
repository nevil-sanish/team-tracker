import React, { useState, useMemo } from 'react';
import {
  CheckCircle2, PlusCircle, Pencil, Calendar, PhoneCall, PhoneOff,
  Share2, Pin, Filter, RefreshCw
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn, formatRelative } from '../lib/utils';
import Avatar from '../components/Avatar';

const kindIcons = {
  task_completed: { icon: CheckCircle2, color: 'var(--color-success)' },
  task_created: { icon: PlusCircle, color: 'var(--color-info)' },
  task_updated: { icon: Pencil, color: 'var(--color-warning)' },
  note_edited: { icon: Pencil, color: 'var(--color-success)' },
  event_created: { icon: Calendar, color: 'var(--color-info)' },
  call_joined: { icon: PhoneCall, color: 'var(--color-status-call)' },
  call_left: { icon: PhoneOff, color: 'var(--color-text-muted)' },
  file_shared: { icon: Share2, color: 'var(--color-danger)' },
  message_pinned: { icon: Pin, color: 'var(--color-warning)' },
};

const kindDescriptions = {
  task_completed: 'completed',
  task_created: 'created',
  task_updated: 'updated',
  note_edited: 'edited',
  event_created: 'scheduled',
  call_joined: 'joined call',
  call_left: 'left call',
  file_shared: 'shared',
  message_pinned: 'pinned',
};

export default function Activity() {
  const { activities, mode, group } = useStore();
  const [filterKind, setFilterKind] = useState(null);

  const list = useMemo(() => {
    let items = [...activities].sort((a, b) => new Date(b.at) - new Date(a.at));
    if (filterKind) items = items.filter(a => a.kind.startsWith(filterKind));
    return items;
  }, [activities, filterKind]);

  // Group by date
  const grouped = useMemo(() => {
    const groups = {};
    list.forEach(a => {
      const d = new Date(a.at);
      const key = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
      (groups[key] ||= []).push(a);
    });
    return groups;
  }, [list]);

  if (mode === 'personal') {
    return (
      <div className="h-full flex items-center justify-center animate-fade-in">
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Filter size={24} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>Activity Feed</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Switch to Group mode to see team activity.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {/* Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div className="tab-group">
              {['All', 'task', 'note', 'event', 'call', 'file'].map(kind => (
                <button
                  key={kind}
                  className={`tab-item ${filterKind === kind || (kind === 'All' && !filterKind) ? 'active' : ''}`}
                  onClick={() => setFilterKind(kind === 'All' ? null : kind)}
                  style={{ fontSize: 11, padding: '4px 10px', textTransform: 'capitalize' }}
                >
                  {kind === 'All' ? 'All' : kind + 's'}
                </button>
              ))}
            </div>

            {filterKind && (
              <button onClick={() => setFilterKind(null)} style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Clear
              </button>
            )}

            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>
              {list.length} items
            </span>
          </div>

          {/* Timeline */}
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {dateLabel}
                </h3>
                <div style={{ flex: 1, height: 1, background: 'var(--color-border-subtle)' }} />
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-disabled)' }}>{items.length}</span>
              </div>

              <ol style={{ position: 'relative', borderLeft: '2px solid var(--color-border-default)', marginLeft: 10, paddingLeft: 20, listStyle: 'none' }}>
                {items.map(a => {
                  const meta = kindIcons[a.kind] || { icon: Pencil, color: 'var(--color-text-muted)' };
                  const Icon = meta.icon;
                  return (
                    <li key={a.id} style={{ position: 'relative', marginBottom: 12 }}>
                      <span style={{
                        position: 'absolute', left: -27, top: 6,
                        width: 12, height: 12, borderRadius: '50%',
                        background: 'var(--color-bg-elevated)', border: '2px solid var(--color-border-default)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--color-accent)' }} />
                      </span>
                      <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', borderRadius: 10,
                        transition: 'background 0.15s', cursor: 'pointer',
                      }} className="hover:bg-[var(--color-bg-hover)]">
                        <Avatar name={a.actorName} size="sm" status="online" showStatus />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, lineHeight: 1.4 }}>
                            <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{a.actorName}</span>{' '}
                            <span style={{ color: 'var(--color-text-muted)' }}>{kindDescriptions[a.kind] || 'touched'}</span>{' '}
                            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{a.target}</span>
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <Icon size={13} style={{ color: meta.color }} />
                            <span style={{ fontSize: 10, color: 'var(--color-text-disabled)', fontStyle: 'italic' }}>
                              {formatRelative(a.at)}
                            </span>
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
              No activity matching your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
