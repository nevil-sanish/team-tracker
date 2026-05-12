import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Clock, Users as UsersIcon, Repeat, Edit3, Palette } from 'lucide-react';
import { useStore } from '../store/useStore';
import { toDateKey, generateId, nowIST } from '../lib/utils';
import { saveEvent, deleteEvent as deleteEventFS, saveActivity } from '../lib/dataService';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
// No blue (#3b82f6) for single users — blue is reserved for multi-user events
const USER_COLORS = ['#f97316','#22c55e','#eab308','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#6366f1','#a855f7'];
const MULTI_COLOR = '#3b82f6';
const COLOR_SWATCHES = [
  '#f97316', '#ef4444', '#ec4899', '#a855f7',
  '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9',
  '#14b8a6', '#22c55e', '#eab308', '#78716c',
];

function getUserColor(members, userId) {
  if (!members?.length || !userId) return USER_COLORS[0];
  const idx = members.findIndex(m => m.id === userId);
  return idx >= 0 ? USER_COLORS[idx % USER_COLORS.length] : USER_COLORS[0];
}
function getEventColor(members, event) {
  if (event.color) return event.color;
  if (!event.forUsers || event.forUsers.length === 0 || event.forAll) return MULTI_COLOR;
  if (event.forUsers.length > 1) return MULTI_COLOR;
  return getUserColor(members, event.forUsers[0]);
}
function getForLabel(members, event) {
  if (event.forAll || !event.forUsers?.length) return 'All';
  return event.forUsers.map(uid => members.find(m => m.id === uid)?.name?.split(' ')[0] || 'User').join(', ');
}

export default function CalendarView() {
  const store = useStore();
  const { activeGroup, user, addNotification, mode, addPersonalEvent, removePersonalEvent, updatePersonalEvent, updateEvent, getActiveEvents } = store;
  const events = getActiveEvents();
  const isGroup = mode === 'group' && !!activeGroup;
  const [cursor, setCursor] = useState(() => new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const [filterUser, setFilterUser] = useState('all');
  const [dayDetailKey, setDayDetailKey] = useState(null);
  const [calSections, setCalSections] = useState([{ id: 'default', name: 'General', enabled: true }]);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const groupId = isGroup ? activeGroup.id : null;
  const members = isGroup ? (activeGroup.members || []) : [];

  const nav = (dir) => { const d = new Date(cursor); d.setMonth(d.getMonth() + dir); setCursor(d); };

  const handleSave = async (event) => {
    const full = { ...event, createdBy: user?.name || 'You', createdById: user?.id || '' };
    if (isGroup && groupId) {
      await saveEvent(groupId, full);
      await saveActivity(groupId, { kind: 'event_created', actorName: user?.name || 'You', target: event.title, at: new Date().toISOString() });
    } else addPersonalEvent(full);
    addNotification({ title: 'Event Created', message: `"${event.title}" scheduled`, type: 'info', section: 'Calendar' });
    setShowModal(false);
  };

  const handleUpdate = async (eventId, updates) => {
    if (isGroup && groupId) {
      await saveEvent(groupId, { ...updates, id: eventId });
    } else {
      updatePersonalEvent(eventId, updates);
    }
    addNotification({ title: 'Event Updated', message: `"${updates.title}" updated`, type: 'info', section: 'Calendar' });
    setDetailEvent(null);
  };

  const handleRemove = async (id) => {
    const ev = events.find(e => e.id === id);
    if (isGroup && groupId) {
      await deleteEventFS(groupId, id);
      await saveActivity(groupId, { kind: 'event_deleted', actorName: user?.name || 'You', target: ev?.title || 'Event', at: new Date().toISOString() });
    } else {
      removePersonalEvent(id);
    }
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
  // Single-day events map (excludes multi-day from per-cell rendering)
  const byDay = useMemo(() => {
    const m = {};
    const firstDay = monthDays[0]?.date, lastDay = monthDays[monthDays.length - 1]?.date;
    filteredEvents.forEach(e => {
      const isMultiDay = e.endDate && e.endDate > e.date;
      if (!isMultiDay) {
        (m[e.date] ||= []).push(e);
      }
      if (e.recurrence && e.recurrence !== 'none' && firstDay && lastDay) {
        const bd = new Date(e.date + 'T00:00:00'); let d = new Date(bd);
        for (let i = 0; i < 90; i++) {
          if (e.recurrence === 'daily') d.setDate(d.getDate() + 1);
          else if (e.recurrence === 'weekly') d.setDate(d.getDate() + 7);
          else if (e.recurrence === 'monthly') d.setMonth(d.getMonth() + 1);
          else break;
          if (d > lastDay) break;
          if (d >= firstDay) { const key = toDateKey(d); if (key !== e.date) (m[key] ||= []).push({ ...e, _recurring: true }); }
        }
      }
    });
    return m;
  }, [filteredEvents, monthDays]);
  const todayKey = toDateKey(nowIST());

  // Chunk into weeks
  const weeks = useMemo(() => {
    const w = [];
    for (let i = 0; i < monthDays.length; i += 7) w.push(monthDays.slice(i, i + 7));
    return w;
  }, [monthDays]);

  // Multi-day spanning data per week
  const weekSpanData = useMemo(() => {
    return weeks.map(week => {
      const wStartKey = toDateKey(week[0].date);
      const wEndKey = toDateKey(week[6].date);
      const spanning = filteredEvents
        .filter(e => e.endDate && e.endDate > e.date && e.date <= wEndKey && e.endDate >= wStartKey)
        .map(e => {
          let si = 0, ei = 6;
          for (let i = 0; i < 7; i++) { if (toDateKey(week[i].date) >= e.date) { si = i; break; } }
          if (e.date < wStartKey) si = 0;
          for (let i = 6; i >= 0; i--) { if (toDateKey(week[i].date) <= e.endDate) { ei = i; break; } }
          if (e.endDate > wEndKey) ei = 6;
          return { ...e, _si: si, _ei: ei, _span: ei - si + 1 };
        });
      // Assign lanes (rows) to avoid overlap
      const lanes = [];
      spanning.sort((a, b) => a._si - b._si || b._span - a._span);
      spanning.forEach(e => {
        let lane = 0;
        while (true) {
          if (!lanes[lane]) { lanes[lane] = []; break; }
          if (!lanes[lane].some(x => !(e._si > x._ei || e._ei < x._si))) break;
          lane++;
        }
        lanes[lane].push(e);
        e._lane = lane;
      });
      return { events: spanning, laneCount: lanes.length };
    });
  }, [weeks, filteredEvents]);

  const addSection = () => { if (!newSectionName.trim()) return; setCalSections(s => [...s, { id: generateId(), name: newSectionName.trim(), enabled: true }]); setNewSectionName(''); setShowAddSection(false); };
  const toggleSection = (id) => setCalSections(s => s.map(sec => sec.id === id ? { ...sec, enabled: !sec.enabled } : sec));

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 py-2" style={{ borderBottom: '1px solid var(--color-border-subtle)', flexShrink: 0 }}>
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(new Date())} className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}>Today</button>
          <button onClick={() => nav(-1)} className="btn-ghost btn-icon" style={{ width: 28, height: 28 }}><ChevronLeft size={14} /></button>
          <button onClick={() => nav(1)} className="btn-ghost btn-icon" style={{ width: 28, height: 28 }}><ChevronRight size={14} /></button>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', marginLeft: 4 }}>{cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setSelectedDate(new Date()); setShowModal(true); }}><Plus size={13} /> New Event</button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Left Sidebar */}
        <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: 12 }}>
          <button className="btn btn-primary" onClick={() => { setSelectedDate(new Date()); setShowModal(true); }} style={{ width: '100%', marginBottom: 14, borderRadius: 10, padding: '8px 14px', fontSize: 12 }}><Plus size={13} /> Create Event</button>
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
              {miniDays.map((d, i) => { const k = toDateKey(d.date); const isT = k === todayKey; return (
                <div key={i} onClick={() => setCursor(d.date)} style={{ fontSize: 10, fontWeight: isT ? 700 : 400, padding: '3px 0', cursor: 'pointer', borderRadius: 5, background: isT ? 'var(--color-accent)' : 'transparent', color: isT ? 'white' : d.inMonth ? 'var(--color-text-primary)' : 'var(--color-text-disabled)' }}>{d.date.getDate()}</div>
              ); })}
            </div>
          </div>
          {/* Sections */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)' }}>Sections</span>
              <button onClick={() => setShowAddSection(true)} className="btn-ghost btn-icon" style={{ width: 18, height: 18 }}><Plus size={10} /></button>
            </div>
            <div style={{ maxHeight: 120, overflowY: 'auto' }}>
              {calSections.map(s => <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px', borderRadius: 6, cursor: 'pointer', fontSize: 11, color: 'var(--color-text-secondary)' }}><input type="checkbox" checked={s.enabled} onChange={() => toggleSection(s.id)} style={{ accentColor: 'var(--color-accent)' }} />{s.name}</label>)}
            </div>
            {showAddSection && <div style={{ display: 'flex', gap: 4, marginTop: 6 }}><input className="input" placeholder="Section name" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSection()} style={{ fontSize: 11, height: 26, flex: 1 }} autoFocus /><button onClick={addSection} className="btn btn-primary" style={{ padding: '0 8px', height: 26, fontSize: 10 }}>Add</button><button onClick={() => setShowAddSection(false)} className="btn-ghost btn-icon" style={{ width: 26, height: 26 }}><X size={10} /></button></div>}
          </div>
          {/* Person Filter */}
          {members.length > 0 && <div>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>Filter by Person</span>
            <button onClick={() => setFilterUser('all')} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '4px 6px', borderRadius: 6, border: 'none', cursor: 'pointer', background: filterUser === 'all' ? 'var(--color-accent-soft)' : 'transparent', color: filterUser === 'all' ? 'var(--color-accent)' : 'var(--color-text-secondary)', fontSize: 11, fontWeight: filterUser === 'all' ? 600 : 400, textAlign: 'left' }}><UsersIcon size={11} /> All</button>
            {members.map((m, i) => <button key={m.id} onClick={() => setFilterUser(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '4px 6px', borderRadius: 6, border: 'none', cursor: 'pointer', background: filterUser === m.id ? 'var(--color-accent-soft)' : 'transparent', color: filterUser === m.id ? 'var(--color-accent)' : 'var(--color-text-secondary)', fontSize: 11, textAlign: 'left', marginTop: 1 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: USER_COLORS[i % USER_COLORS.length] }} />{m.name}{m.id === user?.id ? ' (you)' : ''}</button>)}
          </div>}
        </div>

        {/* Month Grid — fixed height rows */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '8px 12px' }}>
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--color-border-subtle)', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--color-border-subtle)', flexShrink: 0 }}>
              {DAYS.map(d => <div key={d} style={{ background: 'var(--color-bg-tertiary)', padding: 6, fontSize: 10, fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)' }}>{d}</div>)}
            </div>
            {/* Week rows */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {weeks.map((week, wi) => {
                const { events: multiEvents, laneCount } = weekSpanData[wi];
                const spanH = Math.min(laneCount, 2) * 20;
                return (
                  <div key={wi} style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', position: 'relative', borderBottom: wi < 5 ? '1px solid var(--color-border-subtle)' : 'none', minHeight: 0 }}>
                    {week.map((d, di) => {
                      const k = toDateKey(d.date); const de = byDay[k] || []; const isT = k === todayKey;
                      const isPast = k < todayKey;
                      const maxSingle = spanH > 20 ? 1 : 2;
                      const totalInCell = de.length + multiEvents.filter(e => di >= e._si && di <= e._ei).length;
                      return (
                        <div key={k} onClick={() => { setSelectedDate(d.date); setShowModal(true); }} style={{ background: d.inMonth ? 'var(--color-bg-elevated)' : 'var(--color-bg-elevated)', padding: '2px 3px', cursor: 'pointer', opacity: isPast ? 0.5 : 1, display: 'flex', flexDirection: 'column', borderTop: isT ? '2px solid var(--color-accent)' : '2px solid transparent', overflow: 'hidden', borderRight: di < 6 ? '1px solid var(--color-border-subtle)' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 1, flexShrink: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: isT ? 700 : 500, width: 22, height: 22, borderRadius: '50%', background: isT ? '#7986CB' : 'transparent', color: isT ? 'white' : 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{d.date.getDate()}</div>
                          </div>
                          {/* Spacer for multi-day lanes */}
                          <div style={{ height: spanH, flexShrink: 0 }} />
                          {/* Single-day events */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, overflow: 'hidden', flex: 1 }}>
                            {de.slice(0, maxSingle).map(e => {
                              const c = getEventColor(members, e);
                              const timeLabel = e.allDay ? '' : e.startTime;
                              const forLabel = getForLabel(members, e);
                              return (
                                <div key={e.id + (e._recurring ? '_r' : '')} onClick={(ev) => { ev.stopPropagation(); setDetailEvent(e); }} style={{ fontSize: 9, padding: '2px 4px', borderRadius: 4, background: c, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600, cursor: 'pointer', lineHeight: 1.3 }} title={`${e.title} (${forLabel})`}>
                                  {timeLabel ? `${timeLabel} ` : ''}{e.title}<span style={{ opacity: 0.75, fontWeight: 400 }}> · {forLabel}</span>
                                </div>
                              );
                            })}
                            {totalInCell > maxSingle && <div onClick={(ev) => { ev.stopPropagation(); setDayDetailKey(k); }} style={{ fontSize: 8, color: 'var(--color-text-muted)', fontWeight: 600, cursor: 'pointer', padding: '1px 4px', textAlign: 'left', marginTop: 1 }}>+{totalInCell - maxSingle} more</div>}
                          </div>
                        </div>
                      );
                    })}
                    {/* Multi-day spanning bars */}
                    {multiEvents.map(e => {
                      const c = getEventColor(members, e);
                      const isStartInWeek = e.date >= toDateKey(week[0].date);
                      const isEndInWeek = e.endDate <= toDateKey(week[6].date);
                      return (
                        <div
                          key={e.id + '_span_' + wi}
                          onClick={(ev) => { ev.stopPropagation(); setDetailEvent(e); }}
                          style={{
                            position: 'absolute',
                            top: 22 + (e._lane * 20),
                            left: `calc(${(e._si / 7) * 100}% + 3px)`,
                            width: `calc(${(e._span / 7) * 100}% - 6px)`,
                            height: 18,
                            background: c, color: 'white',
                            borderRadius: `${isStartInWeek ? 4 : 0}px ${isEndInWeek ? 4 : 0}px ${isEndInWeek ? 4 : 0}px ${isStartInWeek ? 4 : 0}px`,
                            fontSize: 9, fontWeight: 600,
                            padding: '2px 5px',
                            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                            cursor: 'pointer', zIndex: 2, lineHeight: '14px',
                          }}
                          title={`${e.title} (${getForLabel(members, e)})`}
                        >
                          {e.title}<span style={{ opacity: 0.75, fontWeight: 400, marginLeft: 4 }}>{getForLabel(members, e)}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showModal && <EventModal date={selectedDate} members={members} sections={calSections} user={user} onClose={() => setShowModal(false)} onSave={handleSave} />}
      {detailEvent && <EditEventModal event={detailEvent} members={members} sections={calSections} onClose={() => setDetailEvent(null)} onDelete={handleRemove} onSave={handleUpdate} />}
      {dayDetailKey && <DayEventsPopup dateKey={dayDetailKey} byDay={byDay} weekSpanData={weekSpanData} weeks={weeks} members={members} onClose={() => setDayDetailKey(null)} onEventClick={(e) => { setDayDetailKey(null); setDetailEvent(e); }} />}
    </div>
  );
}

function EditEventModal({ event, members, sections, onClose, onDelete, onSave }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [allDay, setAllDay] = useState(event.allDay || false);
  const [startTime, setStartTime] = useState(event.startTime);
  const [endTime, setEndTime] = useState(event.endTime);
  const [date, setDate] = useState(event.date);
  const [endDate, setEndDate] = useState(event.endDate || '');
  const [recurrence, setRecurrence] = useState(event.recurrence || 'none');
  const [section, setSection] = useState(event.section || 'default');
  const [forAll, setForAll] = useState(event.forAll !== false);
  const [forUsers, setForUsers] = useState(event.forUsers || []);
  const [customColor, setCustomColor] = useState(event.color || '');
  const c = getEventColor(members, event);
  const forNames = event.forAll ? 'All members' : (event.forUsers || []).map(uid => members.find(m => m.id === uid)?.name || uid).join(', ') || 'Everyone';
  const toggleUser = (uid) => setForUsers(s => s.includes(uid) ? s.filter(u => u !== uid) : [...s, uid]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(event.id, {
      title: title.trim(), date, startTime: allDay ? '00:00' : startTime, endTime: allDay ? '23:59' : endTime,
      endDate: endDate || date, section, allDay,
      recurrence, forAll, forUsers: forAll ? [] : forUsers,
      color: customColor || null,
      createdBy: event.createdBy, createdById: event.createdById, attendees: event.attendees || [],
    });
  };

  if (!editing) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div><h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>{event.title}</h2><p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>Created by {event.createdBy}</p></div>
            <button onClick={onClose} className="btn-ghost btn-icon" style={{ width: 26, height: 26 }}><X size={14} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={13} style={{ color: c }} /><span>{event.date} · {event.allDay ? 'All Day' : `${event.startTime} – ${event.endTime}`}</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><UsersIcon size={13} style={{ color: c }} /><span>For: {forNames}</span></div>
            {event.recurrence && event.recurrence !== 'none' && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Repeat size={13} />Repeats {event.recurrence}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => setEditing(true)} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Edit3 size={13} /> Edit</button>
            <button onClick={() => onDelete(event.id)} className="btn" style={{ flex: 1, background: 'var(--color-danger)', color: 'white', border: 'none', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Trash2 size={13} /> Delete</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)' }}>Edit Event</h2>
          <button onClick={onClose} className="btn-ghost btn-icon" style={{ width: 26, height: 26 }}><X size={14} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 10 }}><label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>Title</label><input className="input" value={title} onChange={e => setTitle(e.target.value)} autoFocus style={{ fontSize: 12, height: 32 }} /></div>
          <div style={{ marginBottom: 10 }}><label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>Date</label><input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ fontSize: 12, height: 32 }} /></div>
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} style={{ accentColor: 'var(--color-accent)' }} /> All Day
            </label>
          </div>
          {!allDay && <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>Start Time</label><input className="input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ fontSize: 12, height: 32 }} /></div>
            <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>End Time</label><input className="input" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ fontSize: 12, height: 32 }} /></div>
          </div>}
          <div style={{ marginBottom: 10 }}><label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>End Date (optional, multi-day)</label><input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ fontSize: 12, height: 32 }} /></div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>Section</label><select className="input" value={section} onChange={e => setSection(e.target.value)} style={{ fontSize: 12, height: 32 }}>{(sections || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>Repeat</label><select className="input" value={recurrence} onChange={e => setRecurrence(e.target.value)} style={{ fontSize: 12, height: 32 }}><option value="none">No repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
          </div>
          {members.length > 0 && <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>For</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <button type="button" onClick={() => { setForAll(true); setForUsers([]); }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid', borderColor: forAll ? 'var(--color-accent)' : 'var(--color-border-default)', background: forAll ? 'var(--color-accent-soft)' : 'var(--color-bg-tertiary)', color: forAll ? 'var(--color-accent)' : 'var(--color-text-muted)', fontSize: 11, fontWeight: forAll ? 600 : 400, cursor: 'pointer' }}>All</button>
              {members.map((m, i) => { const sel = !forAll && forUsers.includes(m.id); return (
                <button key={m.id} type="button" onClick={() => { setForAll(false); toggleUser(m.id); }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid', borderColor: sel ? USER_COLORS[i % USER_COLORS.length] : 'var(--color-border-default)', background: sel ? `${USER_COLORS[i % USER_COLORS.length]}18` : 'var(--color-bg-tertiary)', color: sel ? USER_COLORS[i % USER_COLORS.length] : 'var(--color-text-muted)', fontSize: 11, fontWeight: sel ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: USER_COLORS[i % USER_COLORS.length] }} />{m.name}
                </button>
              ); })}
            </div>
          </div>}
          {/* Color Picker */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}><Palette size={12} /> Event Color</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <button type="button" onClick={() => setCustomColor('')} title="Auto (default)" style={{ width: 24, height: 24, borderRadius: 6, border: !customColor ? '2px solid var(--color-accent)' : '2px solid var(--color-border-default)', background: 'var(--color-bg-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--color-text-muted)', transition: 'all 0.15s' }}>A</button>
              {COLOR_SWATCHES.map(sw => (
                <button key={sw} type="button" onClick={() => setCustomColor(sw)} style={{ width: 24, height: 24, borderRadius: 6, background: sw, border: customColor === sw ? '2px solid white' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s', boxShadow: customColor === sw ? `0 0 0 2px ${sw}` : 'none' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setEditing(false)} className="btn btn-secondary" style={{ flex: 1, fontSize: 12 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, fontSize: 12 }}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EventModal({ date, members, sections, user, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [endDate, setEndDate] = useState('');
  const [recurrence, setRecurrence] = useState('none');
  const [section, setSection] = useState(sections[0]?.id || 'default');
  const [forAll, setForAll] = useState(true);
  const [forUsers, setForUsers] = useState([]);
  const [customColor, setCustomColor] = useState('');
  const dateStr = date ? toDateKey(date) : toDateKey(new Date());
  const toggleUser = (uid) => setForUsers(s => s.includes(uid) ? s.filter(u => u !== uid) : [...s, uid]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(), date: dateStr, startTime: allDay ? '00:00' : startTime, endTime: allDay ? '23:59' : endTime,
      endDate: endDate || dateStr, section, allDay,
      recurrence,
      color: customColor || null,
      forAll, forUsers: forAll ? [] : forUsers, attendees: [],
    });
  };

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
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 10 }}><label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>Title</label><input className="input" placeholder="Event title" value={title} onChange={e => setTitle(e.target.value)} autoFocus style={{ fontSize: 12, height: 32 }} /></div>
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} style={{ accentColor: 'var(--color-accent)' }} /> All Day
            </label>
          </div>
          {!allDay && <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>Start Time</label><input className="input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ fontSize: 12, height: 32 }} /></div>
            <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>End Time</label><input className="input" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ fontSize: 12, height: 32 }} /></div>
          </div>}
          <div style={{ marginBottom: 10 }}><label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>End Date (optional, multi-day)</label><input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ fontSize: 12, height: 32 }} /></div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>Section</label><select className="input" value={section} onChange={e => setSection(e.target.value)} style={{ fontSize: 12, height: 32 }}>{sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>Repeat</label><select className="input" value={recurrence} onChange={e => setRecurrence(e.target.value)} style={{ fontSize: 12, height: 32 }}><option value="none">No repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
          </div>
          {members.length > 0 && <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>For</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <button type="button" onClick={() => { setForAll(true); setForUsers([]); }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid', borderColor: forAll ? 'var(--color-accent)' : 'var(--color-border-default)', background: forAll ? 'var(--color-accent-soft)' : 'var(--color-bg-tertiary)', color: forAll ? 'var(--color-accent)' : 'var(--color-text-muted)', fontSize: 11, fontWeight: forAll ? 600 : 400, cursor: 'pointer' }}>All</button>
              {members.map((m, i) => { const sel = !forAll && forUsers.includes(m.id); return (
                <button key={m.id} type="button" onClick={() => { setForAll(false); toggleUser(m.id); }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid', borderColor: sel ? USER_COLORS[i % USER_COLORS.length] : 'var(--color-border-default)', background: sel ? `${USER_COLORS[i % USER_COLORS.length]}18` : 'var(--color-bg-tertiary)', color: sel ? USER_COLORS[i % USER_COLORS.length] : 'var(--color-text-muted)', fontSize: 11, fontWeight: sel ? 600 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: USER_COLORS[i % USER_COLORS.length] }} />{m.name}
                </button>
              ); })}
            </div>
          </div>}
          {/* Color Picker */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}><Palette size={12} /> Event Color</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <button type="button" onClick={() => setCustomColor('')} title="Auto (default)" style={{ width: 24, height: 24, borderRadius: 6, border: !customColor ? '2px solid var(--color-accent)' : '2px solid var(--color-border-default)', background: 'var(--color-bg-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--color-text-muted)', transition: 'all 0.15s' }}>A</button>
              {COLOR_SWATCHES.map(sw => (
                <button key={sw} type="button" onClick={() => setCustomColor(sw)} style={{ width: 24, height: 24, borderRadius: 6, background: sw, border: customColor === sw ? '2px solid white' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s', boxShadow: customColor === sw ? `0 0 0 2px ${sw}` : 'none' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1, fontSize: 12 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, fontSize: 12 }}><Plus size={13} /> Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DayEventsPopup({ dateKey, byDay, weekSpanData, weeks, members, onClose, onEventClick }) {
  // Collect all events for this day: single-day + multi-day spanning
  const singleDay = byDay[dateKey] || [];
  const multiDay = [];
  weekSpanData.forEach((wd, wi) => {
    wd.events.forEach(e => {
      const weekDayKeys = weeks[wi].map(d => toDateKey(d.date));
      const di = weekDayKeys.indexOf(dateKey);
      if (di >= 0 && di >= e._si && di <= e._ei) {
        if (!multiDay.find(x => x.id === e.id)) multiDay.push(e);
      }
    });
  });
  const allEvents = [...multiDay, ...singleDay];
  const dateLabel = new Date(dateKey + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 380, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>{dateLabel}</h2>
          <button onClick={onClose} className="btn-ghost btn-icon" style={{ width: 26, height: 26 }}><X size={14} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
          {allEvents.length === 0 && <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', padding: 20 }}>No events</p>}
          {allEvents.map(e => {
            const c = getEventColor(members, e);
            const forLabel = getForLabel(members, e);
            const timeLabel = e.allDay ? 'All Day' : `${e.startTime} – ${e.endTime}`;
            const isMulti = e.endDate && e.endDate > e.date;
            return (
              <div key={e.id} onClick={() => onEventClick(e)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--color-bg-tertiary)', cursor: 'pointer', transition: 'background 0.15s', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ width: 4, borderRadius: 2, alignSelf: 'stretch', background: c, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    <Clock size={9} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                    {timeLabel}
                    {isMulti && <span> · {e.date} → {e.endDate}</span>}
                    <span style={{ marginLeft: 8 }}><UsersIcon size={9} style={{ marginRight: 3, verticalAlign: 'middle' }} />{forLabel}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function buildMonth(cursor) { const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1); const so = (first.getDay() + 6) % 7; const start = new Date(first); start.setDate(start.getDate() - so); const days = []; for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push({ date: d, inMonth: d.getMonth() === cursor.getMonth() }); } return days; }
function buildMiniMonth(cursor) { const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1); const so = first.getDay(); const start = new Date(first); start.setDate(start.getDate() - so); const days = []; for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push({ date: d, inMonth: d.getMonth() === cursor.getMonth() }); } return days; }
