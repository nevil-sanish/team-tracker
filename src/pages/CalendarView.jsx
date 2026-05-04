import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, Plus, X, Trash2, Users as UsersIcon, Filter } from 'lucide-react';
import { useStore } from '../store/useStore';
import { toDateKey } from '../lib/utils';
import { saveEvent, deleteEvent as deleteEventFS, saveActivity } from '../lib/dataService';

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAYS_FULL  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Assign a deterministic color to each user
const USER_COLORS = [
  '#f97316', '#3b82f6', '#22c55e', '#eab308', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1',
];

function getUserColor(members, userId) {
  if (!members || !userId) return USER_COLORS[0];
  const idx = members.findIndex(m => m.id === userId);
  return USER_COLORS[idx % USER_COLORS.length];
}

export default function CalendarView() {
  const { activeGroup, events, addEvent, removeEvent, user, addNotification } = useStore();
  const [cursor, setCursor] = useState(() => new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filterUser, setFilterUser] = useState('all'); // 'all' or a userId
  const groupId = activeGroup?.id;
  const members = activeGroup?.members || [];

  const nav = (dir) => {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + dir);
    setCursor(d);
  };

  const viewLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const handleSaveEvent = async (event) => {
    const full = { ...event, createdBy: user?.name || 'You', createdById: user?.id || '' };
    if (groupId) {
      await saveEvent(groupId, full);
      await saveActivity(groupId, {
        kind: 'event_created', actorName: user?.name || 'You',
        target: event.title, at: new Date().toISOString(),
      });
    } else {
      addEvent(full);
    }
    addNotification({ title: 'Event Created', message: `"${event.title}" scheduled`, type: 'info', section: 'Calendar' });
    setShowModal(false);
  };

  const handleRemove = async (id) => {
    const ev = events.find(e => e.id === id);
    if (groupId) await deleteEventFS(groupId, id);
    else removeEvent(id);
    addNotification({ title: 'Event Removed', message: `"${ev?.title || 'An event'}" removed`, type: 'alert', section: 'Calendar' });
  };

  // Filter events by selected user
  const filteredEvents = useMemo(() => {
    if (filterUser === 'all') return events;
    return events.filter(e => e.createdById === filterUser);
  }, [events, filterUser]);

  // Mini calendar data
  const miniDays = useMemo(() => buildMiniMonth(cursor), [cursor]);

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setCursor(new Date())} className="btn btn-secondary btn-sm" style={{ fontWeight: 600 }}>
            Today
          </button>
          <button onClick={() => nav(-1)} className="btn-ghost btn-icon" style={{ width: 30, height: 30 }}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => nav(1)} className="btn-ghost btn-icon" style={{ width: 30, height: 30 }}>
            <ChevronRight size={16} />
          </button>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text-primary)', marginLeft: 4 }}>
            {viewLabel}
          </h2>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setSelectedDate(new Date()); setShowModal(true); }}>
          <Plus size={14} /> New Event
        </button>
      </div>

      {/* Main Content: Sidebar + Calendar Grid */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left Sidebar ── */}
        <div style={{
          width: 260, flexShrink: 0, borderRight: '1px solid var(--color-border-subtle)',
          background: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column',
          overflowY: 'auto', padding: '16px',
        }}>

          {/* Create button */}
          <button
            className="btn btn-primary"
            onClick={() => { setSelectedDate(new Date()); setShowModal(true); }}
            style={{ width: '100%', marginBottom: 20, borderRadius: 12, padding: '10px 16px', fontSize: 13, fontWeight: 600 }}
          >
            <Plus size={15} /> Create Event
          </button>

          {/* Mini Calendar */}
          <div style={{
            background: 'var(--color-bg-tertiary)', borderRadius: 12,
            padding: '12px', border: '1px solid var(--color-border-subtle)',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </span>
              <div style={{ display: 'flex', gap: 2 }}>
                <button onClick={() => nav(-1)} className="btn-ghost btn-icon" style={{ width: 22, height: 22 }}>
                  <ChevronLeft size={12} />
                </button>
                <button onClick={() => nav(1)} className="btn-ghost btn-icon" style={{ width: 22, height: 22 }}>
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, textAlign: 'center' }}>
              {DAYS_SHORT.map((d, i) => (
                <div key={i} style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-text-disabled)', padding: '4px 0', textTransform: 'uppercase' }}>
                  {d}
                </div>
              ))}
              {miniDays.map((d, i) => {
                const key = toDateKey(d.date);
                const isToday = key === toDateKey(new Date());
                const hasEvents = events.some(e => e.date === key);
                return (
                  <div
                    key={i}
                    onClick={() => {
                      setCursor(d.date);
                    }}
                    style={{
                      fontSize: 11, fontWeight: isToday ? 700 : 400,
                      padding: '4px 0',
                      cursor: 'pointer',
                      borderRadius: 6,
                      background: isToday ? 'var(--color-accent)' : 'transparent',
                      color: isToday ? 'white' : d.inMonth ? 'var(--color-text-primary)' : 'var(--color-text-disabled)',
                      position: 'relative',
                      transition: 'all 0.15s',
                    }}
                  >
                    {d.date.getDate()}
                    {hasEvents && !isToday && (
                      <div style={{
                        width: 4, height: 4, borderRadius: '50%',
                        background: 'var(--color-accent)', margin: '1px auto 0',
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filter by Person */}
          {members.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'var(--color-text-muted)',
              }}>
                <Filter size={11} /> Filter by Person
              </div>

              <button
                onClick={() => setFilterUser('all')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '6px 8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: filterUser === 'all' ? 'var(--color-accent-soft)' : 'transparent',
                  color: filterUser === 'all' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  fontSize: 12, fontWeight: filterUser === 'all' ? 600 : 400,
                  transition: 'all 0.15s', textAlign: 'left',
                }}
              >
                <UsersIcon size={13} /> All Members
              </button>

              {members.map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => setFilterUser(m.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '6px 8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: filterUser === m.id ? 'var(--color-accent-soft)' : 'transparent',
                    color: filterUser === m.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    fontSize: 12, fontWeight: filterUser === m.id ? 600 : 400,
                    transition: 'all 0.15s', textAlign: 'left',
                    marginTop: 2,
                  }}
                >
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: USER_COLORS[idx % USER_COLORS.length], flexShrink: 0,
                  }} />
                  {m.name}{m.id === user?.id ? ' (you)' : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Main Calendar Grid (Month View) ── */}
        <div className="flex-1 overflow-auto" style={{ padding: '16px 20px' }}>
          <MonthView
            cursor={cursor}
            events={filteredEvents}
            members={members}
            onDateClick={(d) => { setSelectedDate(d); setShowModal(true); }}
            onRemove={handleRemove}
          />
        </div>
      </div>

      {showModal && (
        <EventModal
          date={selectedDate}
          members={members}
          user={user}
          onClose={() => setShowModal(false)}
          onSave={handleSaveEvent}
        />
      )}
    </div>
  );
}

/* ─────────── Month View ─────────── */
function MonthView({ cursor, events, members, onDateClick, onRemove }) {
  const days = useMemo(() => buildMonth(cursor), [cursor]);
  const byDay = useMemo(() => {
    const m = {};
    events.forEach(e => (m[e.date] ||= []).push(e));
    return m;
  }, [events]);

  const todayKey = toDateKey(new Date());

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1,
      background: 'var(--color-border-subtle)', borderRadius: 12,
      overflow: 'hidden', border: '1px solid var(--color-border-subtle)',
    }}>
      {DAYS_FULL.map(d => (
        <div key={d} style={{
          background: 'var(--color-bg-tertiary)', padding: '10px',
          fontSize: 11, fontWeight: 700, textAlign: 'center',
          textTransform: 'uppercase', letterSpacing: '0.1em',
          color: 'var(--color-text-muted)',
        }}>
          {d}
        </div>
      ))}
      {days.map(d => {
        const key = toDateKey(d.date);
        const de = byDay[key] || [];
        const isToday = key === todayKey;
        const isPast = d.date < new Date(new Date().toDateString()) && !isToday;

        return (
          <div
            key={key}
            onClick={() => onDateClick(d.date)}
            style={{
              background: isToday
                ? 'rgba(249, 115, 22, 0.04)'
                : d.inMonth ? 'var(--color-bg-elevated)' : 'var(--color-bg-secondary)',
              minHeight: 110, padding: '6px 8px',
              cursor: 'pointer', transition: 'all 0.15s',
              opacity: d.inMonth ? (isPast ? 0.6 : 1) : 0.35,
              display: 'flex', flexDirection: 'column',
              borderTop: isToday ? '2px solid var(--color-accent)' : '2px solid transparent',
            }}
            className="hover:bg-[var(--color-bg-hover)]"
          >
            {/* Date number */}
            <div style={{
              display: 'flex', justifyContent: 'flex-end', marginBottom: 4,
            }}>
              <div style={{
                fontSize: 12, fontWeight: isToday ? 700 : 500,
                width: 26, height: 26, borderRadius: '50%',
                background: isToday ? 'var(--color-accent)' : 'transparent',
                color: isToday ? 'white' : 'var(--color-text-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {d.date.getDate()}
              </div>
            </div>

            {/* Events in the cell */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden', flex: 1 }}>
              {de.slice(0, 3).map(e => {
                const evColor = getUserColor(members, e.createdById);
                return (
                  <div key={e.id} style={{
                    fontSize: 10, padding: '2px 6px', borderRadius: 5,
                    background: `${evColor}18`, color: evColor,
                    display: 'flex', alignItems: 'center', gap: 4,
                    whiteSpace: 'nowrap', overflow: 'hidden', fontWeight: 600,
                    borderLeft: `3px solid ${evColor}`,
                  }} title={`${e.title} (${e.startTime} – ${e.endTime}) by ${e.createdBy}`}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{e.title}</span>
                  </div>
                );
              })}
              {de.length > 3 && (
                <span style={{ fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 600, paddingLeft: 4 }}>
                  +{de.length - 3} more
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────── Event Modal ─────────── */
function EventModal({ date, members, user, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [recurrence, setRecurrence] = useState('none');
  const dateStr = date ? toDateKey(date) : toDateKey(new Date());

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>New Event</h2>
          <button onClick={onClose} className="btn-ghost btn-icon" style={{ width: 28, height: 28 }}><X size={16} /></button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-accent)', fontWeight: 600, marginBottom: 16 }}>
          {new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        <form onSubmit={e => {
          e.preventDefault();
          if (title.trim()) onSave({
            title: title.trim(), date: dateStr, startTime, endTime,
            location: location.trim() || undefined,
            recurrence: recurrence !== 'none' ? recurrence : undefined,
            attendees: [],
          });
        }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Event Title</label>
            <input className="input" placeholder="What's happening?" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Start</label>
              <input className="input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>End</label>
              <input className="input" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Location</label>
            <input className="input" placeholder="Where? (optional)" value={location} onChange={e => setLocation(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Recurring</label>
            <select className="input" value={recurrence} onChange={e => setRecurrence(e.target.value)}>
              <option value="none">No repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}><Plus size={14} /> Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────── Helpers ─────────── */
function buildMonth(cursor) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const so = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(start.getDate() - so);
  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({ date: d, inMonth: d.getMonth() === cursor.getMonth() });
  }
  return days;
}

function buildMiniMonth(cursor) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const so = first.getDay(); // Sunday = 0
  const start = new Date(first);
  start.setDate(start.getDate() - so);
  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({ date: d, inMonth: d.getMonth() === cursor.getMonth() });
  }
  return days;
}
