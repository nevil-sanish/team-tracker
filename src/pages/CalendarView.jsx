import React, { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Clock, Users as UsersIcon, Repeat } from 'lucide-react';
import { useStore } from '../store/useStore';
import { toDateKey, generateId } from '../lib/utils';
import { saveEvent, deleteEvent as deleteEventFS, saveActivity } from '../lib/dataService';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const USER_COLORS = ['#f97316','#3b82f6','#22c55e','#eab308','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#6366f1'];
const MULTI_COLOR = '#3b82f6';

function getUserColor(members, userId) {
  if (!members?.length || !userId) return USER_COLORS[0];
  const idx = members.findIndex(m => m.id === userId);
  return idx >= 0 ? USER_COLORS[idx % USER_COLORS.length] : USER_COLORS[0];
}

function getEventColor(members, event) {
  if (!event.forUsers || event.forUsers.length === 0 || event.forAll) return MULTI_COLOR;
  if (event.forUsers.length > 1) return MULTI_COLOR;
  return getUserColor(members, event.forUsers[0]);
}

export default function CalendarView() {
  const { activeGroup, events, addEvent, removeEvent, user, addNotification } = useStore();
  const [cursor, setCursor] = useState(() => new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const [filterUser, setFilterUser] = useState('all');
  const [calSections, setCalSections] = useState([{ id: 'default', name: 'General', enabled: true }]);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const groupId = activeGroup?.id;
  const members = activeGroup?.members || [];

  const nav = (dir) => { const d = new Date(cursor); d.setMonth(d.getMonth() + dir); setCursor(d); };

  const handleSave = async (event) => {
    const full = { ...event, createdBy: user?.name || 'You', createdById: user?.id || '' };
    if (groupId) { await saveEvent(groupId, full); await saveActivity(groupId, { kind: 'event_created', actorName: user?.name || 'You', target: event.title, at: new Date().toISOString() }); }
    else addEvent(full);
    addNotification({ title: 'Event Created', message: `"${event.title}" scheduled`, type: 'info', section: 'Calendar' });
    setShowModal(false);
  };

  const handleRemove = async (id) => {
    const ev = events.find(e => e.id === id);
    if (groupId) await deleteEventFS(groupId, id); else removeEvent(id);
    addNotification({ title: 'Event Removed', message: `"${ev?.title || 'Event'}" removed`, type: 'alert', section: 'Calendar' });
    setDetailEvent(null);
  };

  const enabledSections = calSections.filter(s => s.enabled).map(s => s.id);

  const filteredEvents = useMemo(() => {
    let items = events.filter(e => enabledSections.includes(e.section || 'default'));
    if (filterUser !== 'all') items = items.filter(e => e.forAll || (e.forUsers && e.forUsers.includes(filterUser)));
    return items;
  }, [events, filterUser, enabledSections]);

  const miniDays = useMemo(() => buildMiniMonth(cursor), [cursor]);
  const monthDays = useMemo(() => buildMonth(cursor), [cursor]);

  // Expand recurring events across all visible days
  const byDay = useMemo(() => {
    const m = {};
    const firstDay = monthDays[0]?.date;
    const lastDay = monthDays[monthDays.length - 1]?.date;
    filteredEvents.forEach(e => {
      // Always add on original date
      (m[e.date] ||= []).push(e);
      // Expand recurrence
      if (e.recurrence && e.recurrence !== 'none' && firstDay && lastDay) {
        const baseDate = new Date(e.date + 'T00:00:00');
        let d = new Date(baseDate);
        for (let i = 0; i < 90; i++) {
          if (e.recurrence === 'daily') d.setDate(d.getDate() + 1);
          else if (e.recurrence === 'weekly') d.setDate(d.getDate() + 7);
          else if (e.recurrence === 'monthly') { d.setMonth(d.getMonth() + 1); }
          else break;
          if (d > lastDay) break;
          if (d >= firstDay) {
            const key = toDateKey(d);
            if (key !== e.date) (m[key] ||= []).push({ ...e, _recurring: true });
          }
        }
      }
    });
    return m;
  }, [filteredEvents, monthDays]);
  const todayKey = toDateKey(new Date());

  const addSection = () => {
    if (!newSectionName.trim()) return;
    setCalSections(s => [...s, { id: generateId(), name: newSectionName.trim(), enabled: true }]);
    setNewSectionName(''); setShowAddSection(false);
  };

  const toggleSection = (id) => setCalSections(s => s.map(sec => sec.id === id ? { ...sec, enabled: !sec.enabled } : sec));

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 py-2" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(new Date())} className="btn btn-secondary btn-sm" style={{ fontSize: 11, fontWeight: 600 }}>Today</button>
          <button onClick={() => nav(-1)} className="btn-ghost btn-icon" style={{ width: 28, height: 28 }}><ChevronLeft size={14} /></button>
          <button onClick={() => nav(1)} className="btn-ghost btn-icon" style={{ width: 28, height: 28 }}><ChevronRight size={14} /></button>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginLeft: 4 }}>
            {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </h2>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setSelectedDate(new Date()); setShowModal(true); }}><Plus size={13} /> New Event</button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: 12 }}>
          {/* Create */}
          <button className="btn btn-primary" onClick={() => { setSelectedDate(new Date()); setShowModal(true); }} style={{ width: '100%', marginBottom: 14, borderRadius: 10, padding: '8px 14px', fontSize: 12 }}>
            <Plus size={13} /> Create Event
          </button>

          {/* Mini Calendar */}
          <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: 10, padding: 10, border: '1px solid var(--color-border-subtle)', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-primary)' }}>{cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
              <div style={{ display: 'flex', gap: 2 }}>
                <button onClick={() => nav(-1)} className="btn-ghost btn-icon" style={{ width: 20, height: 20 }}><ChevronLeft size={10} /></button>
                <button onClick={() => nav(1)} className="btn-ghost btn-icon" style={{ width: 20, height: 20 }}><ChevronRight size={10} /></button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', textAlign: 'center' }}>
              {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} style={{ fontSize: 8, fontWeight: 700, color: 'var(--color-text-disabled)', padding: '3px 0' }}>{d}</div>)}
              {miniDays.map((d, i) => {
                const k = toDateKey(d.date); const isT = k === todayKey; const has = events.some(e => e.date === k);
                return (<div key={i} onClick={() => setCursor(d.date)} style={{ fontSize: 10, fontWeight: isT ? 700 : 400, padding: '3px 0', cursor: 'pointer', borderRadius: 5, background: isT ? 'var(--color-accent)' : 'transparent', color: isT ? 'white' : d.inMonth ? 'var(--color-text-primary)' : 'var(--color-text-disabled)', position: 'relative' }}>
                  {d.date.getDate()}{has && !isT && <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--color-accent)', margin: '0 auto' }} />}
                </div>);
              })}
            </div>
          </div>

          {/* Calendar Sections */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)' }}>Sections</span>
              <button onClick={() => setShowAddSection(true)} className="btn-ghost btn-icon" style={{ width: 18, height: 18 }}><Plus size={10} /></button>
            </div>
            <div style={{ maxHeight: 120, overflowY: 'auto' }}>
              {calSections.map(s => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px', borderRadius: 6, cursor: 'pointer', fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  <input type="checkbox" checked={s.enabled} onChange={() => toggleSection(s.id)} style={{ accentColor: 'var(--color-accent)' }} />
                  {s.name}
                </label>
              ))}
            </div>
            {showAddSection && (
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                <input className="input" placeholder="Section name" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSection()} style={{ fontSize: 11, height: 26, flex: 1 }} autoFocus />
                <button onClick={addSection} className="btn btn-primary" style={{ padding: '0 8px', height: 26, fontSize: 10 }}>Add</button>
                <button onClick={() => setShowAddSection(false)} className="btn-ghost btn-icon" style={{ width: 26, height: 26 }}><X size={10} /></button>
              </div>
            )}
          </div>

          {/* Person Filter */}
          {members.length > 0 && (
            <div>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>Filter by Person</span>
              <button onClick={() => setFilterUser('all')} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '4px 6px', borderRadius: 6, border: 'none', cursor: 'pointer', background: filterUser === 'all' ? 'var(--color-accent-soft)' : 'transparent', color: filterUser === 'all' ? 'var(--color-accent)' : 'var(--color-text-secondary)', fontSize: 11, fontWeight: filterUser === 'all' ? 600 : 400, textAlign: 'left' }}>
                <UsersIcon size={11} /> All
              </button>
              {members.map((m, i) => (
                <button key={m.id} onClick={() => setFilterUser(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '4px 6px', borderRadius: 6, border: 'none', cursor: 'pointer', background: filterUser === m.id ? 'var(--color-accent-soft)' : 'transparent', color: filterUser === m.id ? 'var(--color-accent)' : 'var(--color-text-secondary)', fontSize: 11, fontWeight: filterUser === m.id ? 600 : 400, textAlign: 'left', marginTop: 1 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: USER_COLORS[i % USER_COLORS.length] }} /> {m.name}{m.id === user?.id ? ' (you)' : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Month Grid */}
        <div className="flex-1 overflow-auto" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1, background: 'var(--color-border-subtle)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--color-border-subtle)' }}>
            {DAYS.map(d => <div key={d} style={{ background: 'var(--color-bg-tertiary)', padding: 8, fontSize: 10, fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)' }}>{d}</div>)}
            {monthDays.map(d => {
              const k = toDateKey(d.date); const de = byDay[k] || []; const isT = k === todayKey;
              const isPast = d.date < new Date(new Date().toDateString()) && !isT;
              return (
                <div key={k} onClick={() => { setSelectedDate(d.date); setShowModal(true); }} style={{ background: isT ? 'rgba(249,115,22,0.04)' : d.inMonth ? 'var(--color-bg-elevated)' : 'var(--color-bg-secondary)', minHeight: 90, padding: '4px 6px', cursor: 'pointer', transition: 'all 0.15s', opacity: d.inMonth ? (isPast ? 0.5 : 1) : 0.3, display: 'flex', flexDirection: 'column', borderTop: isT ? '2px solid var(--color-accent)' : '2px solid transparent' }} className="hover:bg-[var(--color-bg-hover)]">
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 3 }}>
                    <div style={{ fontSize: 10, fontWeight: isT ? 700 : 500, width: 20, height: 20, borderRadius: '50%', background: isT ? 'var(--color-accent)' : 'transparent', color: isT ? 'white' : 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{d.date.getDate()}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden', flex: 1 }}>
                    {de.slice(0, 3).map(e => { const c = getEventColor(members, e); return (
                      <div key={e.id} onClick={(ev) => { ev.stopPropagation(); setDetailEvent(e); }} style={{ fontSize: 9, padding: '1px 4px', borderRadius: 4, background: `${c}18`, color: c, borderLeft: `2px solid ${c}`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600, cursor: 'pointer' }} title={e.title}>{e.title}</div>
                    ); })}
                    {de.length > 3 && <span style={{ fontSize: 8, color: 'var(--color-text-muted)', fontWeight: 600 }}>+{de.length - 3} more</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showModal && <EventModal date={selectedDate} members={members} sections={calSections} user={user} onClose={() => setShowModal(false)} onSave={handleSave} />}
      {detailEvent && <EventDetail event={detailEvent} members={members} onClose={() => setDetailEvent(null)} onDelete={handleRemove} />}
    </div>
  );
}

/* ── Event Detail Popup ── */
function EventDetail({ event, members, onClose, onDelete }) {
  const c = getEventColor(members, event);
  const forNames = event.forAll ? 'All members' : (event.forUsers || []).map(uid => members.find(m => m.id === uid)?.name || uid).join(', ') || 'Everyone';
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>{event.title}</h2>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>Created by {event.createdBy}</p>
          </div>
          <button onClick={onClose} className="btn-ghost btn-icon" style={{ width: 26, height: 26 }}><X size={14} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={13} style={{ color: c }} /> <span>{event.date} · {event.startTime} – {event.endTime}</span></div>
          {event.endDate && event.endDate !== event.date && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={13} /> <span>Until {event.endDate}</span></div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><UsersIcon size={13} style={{ color: c }} /> <span>For: {forNames}</span></div>
          {event.section && <div>Section: {event.section}</div>}
          {event.recurrence && event.recurrence !== 'none' && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Repeat size={13} /> Repeats {event.recurrence}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Close</button>
          <button onClick={() => onDelete(event.id)} className="btn" style={{ flex: 1, background: 'var(--color-danger)', color: 'white', border: 'none', borderRadius: 10 }}><Trash2 size={13} /> Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ── Event Creation Modal ── */
function EventModal({ date, members, sections, user, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [endDate, setEndDate] = useState('');
  const [recurrence, setRecurrence] = useState('none');
  const [section, setSection] = useState(sections[0]?.id || 'default');
  const [forAll, setForAll] = useState(true);
  const [forUsers, setForUsers] = useState([]);
  const dateStr = date ? toDateKey(date) : toDateKey(new Date());

  const toggleUser = (uid) => setForUsers(s => s.includes(uid) ? s.filter(u => u !== uid) : [...s, uid]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>New Event</h2>
          <button onClick={onClose} className="btn-ghost btn-icon" style={{ width: 26, height: 26 }}><X size={14} /></button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--color-accent)', fontWeight: 600, marginBottom: 12 }}>
          {new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        <form onSubmit={e => { e.preventDefault(); if (title.trim()) onSave({ title: title.trim(), date: dateStr, startTime, endTime, endDate: endDate || dateStr, section, recurrence: recurrence !== 'none' ? recurrence : undefined, forAll, forUsers: forAll ? [] : forUsers, attendees: [] }); }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>Title</label>
            <input className="input" placeholder="Event title" value={title} onChange={e => setTitle(e.target.value)} autoFocus style={{ fontSize: 12, height: 32 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>Start Time</label><input className="input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ fontSize: 12, height: 32 }} /></div>
            <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>End Time</label><input className="input" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ fontSize: 12, height: 32 }} /></div>
          </div>
          <div style={{ marginBottom: 10 }}><label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>End Date (optional, for multi-day)</label><input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ fontSize: 12, height: 32 }} /></div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>Section</label>
              <select className="input" value={section} onChange={e => setSection(e.target.value)} style={{ fontSize: 12, height: 32 }}>{sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            </div>
            <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>Repeat</label>
              <select className="input" value={recurrence} onChange={e => setRecurrence(e.target.value)} style={{ fontSize: 12, height: 32 }}><option value="none">No repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select>
            </div>
          </div>
          {/* For which users */}
          {members.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>For</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <button type="button" onClick={() => { setForAll(true); setForUsers([]); }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid', borderColor: forAll ? 'var(--color-accent)' : 'var(--color-border-default)', background: forAll ? 'var(--color-accent-soft)' : 'var(--color-bg-tertiary)', color: forAll ? 'var(--color-accent)' : 'var(--color-text-muted)', fontSize: 11, fontWeight: forAll ? 600 : 400, cursor: 'pointer' }}>All</button>
                {members.map((m, i) => { const sel = !forAll && forUsers.includes(m.id); return (
                  <button key={m.id} type="button" onClick={() => { setForAll(false); toggleUser(m.id); }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid', borderColor: sel ? USER_COLORS[i % USER_COLORS.length] : 'var(--color-border-default)', background: sel ? `${USER_COLORS[i % USER_COLORS.length]}18` : 'var(--color-bg-tertiary)', color: sel ? USER_COLORS[i % USER_COLORS.length] : 'var(--color-text-muted)', fontSize: 11, fontWeight: sel ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: USER_COLORS[i % USER_COLORS.length] }} />{m.name}
                  </button>
                ); })}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1, fontSize: 12 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, fontSize: 12 }}><Plus size={13} /> Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function buildMonth(cursor) { const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1); const so = (first.getDay() + 6) % 7; const start = new Date(first); start.setDate(start.getDate() - so); const days = []; for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push({ date: d, inMonth: d.getMonth() === cursor.getMonth() }); } return days; }
function buildMiniMonth(cursor) { const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1); const so = first.getDay(); const start = new Date(first); start.setDate(start.getDate() - so); const days = []; for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push({ date: d, inMonth: d.getMonth() === cursor.getMonth() }); } return days; }
