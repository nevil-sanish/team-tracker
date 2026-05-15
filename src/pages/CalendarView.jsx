import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Clock, Repeat, Edit3, Palette, AlignLeft, Upload } from 'lucide-react';
import { useStore } from '../store/useStore';
import { toDateKey, generateId, nowIST } from '../lib/utils';
import { saveEvent, deleteEvent as deleteEventFS, saveActivity } from '../lib/dataService';

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const SECTION_COLORS = [
  '#3b82f6', '#f97316', '#22c55e', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#eab308', '#6366f1', '#0ea5e9',
];
const COLOR_SWATCHES = [
  '#f97316', '#ef4444', '#ec4899', '#a855f7',
  '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9',
  '#14b8a6', '#22c55e', '#eab308', '#78716c',
];

function getEventColor(sections, event) {
  if (event.color) return event.color;
  const sec = sections.find(s => s.id === (event.section || 'default'));
  return sec?.color || SECTION_COLORS[0];
}

function parseICS(text) {
  const events = [];
  const blocks = text.split('BEGIN:VEVENT');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split('END:VEVENT')[0];
    const get = (key) => {
      const re = new RegExp(`^${key}[;:](.*)`, 'm');
      const m = block.match(re);
      if (!m) return '';
      let val = m[1];
      // For properties with parameters like DTSTART;VALUE=DATE:20260515
      if (val.includes(':')) val = val.split(':').pop();
      return val.trim();
    };
    const title = (block.match(/^SUMMARY[;:](.*)$/m) || ['',''])[1].replace(/^.*:/, '').trim() || 'Untitled';
    const desc = (block.match(/^DESCRIPTION[;:](.*)$/m) || ['',''])[1].replace(/^.*:/, '').replace(/\\n/g, '\n').trim();
    const dtStart = get('DTSTART');
    const dtEnd = get('DTEND');
    const parseDt = (dt) => {
      if (!dt) return { date: '', time: '', allDay: true };
      // 8-char = date-only (all day), 15-char+ = datetime
      if (dt.length === 8) {
        return { date: `${dt.slice(0,4)}-${dt.slice(4,6)}-${dt.slice(6,8)}`, time: '', allDay: true };
      }
      // Handle UTC (Z suffix) by converting to local time
      const y = +dt.slice(0,4), mo = +dt.slice(4,6)-1, d = +dt.slice(6,8);
      const h = +dt.slice(9,11), mi = +dt.slice(11,13);
      let jsDate;
      if (dt.endsWith('Z')) {
        jsDate = new Date(Date.UTC(y, mo, d, h, mi));
      } else {
        jsDate = new Date(y, mo, d, h, mi);
      }
      const localDate = `${jsDate.getFullYear()}-${String(jsDate.getMonth()+1).padStart(2,'0')}-${String(jsDate.getDate()).padStart(2,'0')}`;
      const localTime = `${String(jsDate.getHours()).padStart(2,'0')}:${String(jsDate.getMinutes()).padStart(2,'0')}`;
      return { date: localDate, time: localTime, allDay: false };
    };
    const start = parseDt(dtStart);
    const end = parseDt(dtEnd);
    if (!start.date) continue;
    // ICS all-day DTEND is exclusive (RFC 5545) — subtract 1 day for inclusive endDate
    let endDate = end.date || start.date;
    if (start.allDay && end.allDay && endDate > start.date) {
      const ed = new Date(endDate + 'T00:00:00');
      ed.setDate(ed.getDate() - 1);
      endDate = `${ed.getFullYear()}-${String(ed.getMonth()+1).padStart(2,'0')}-${String(ed.getDate()).padStart(2,'0')}`;
    }
    // If endDate equals startDate after correction, it's a single-day event
    events.push({
      id: generateId(),
      title,
      description: desc,
      date: start.date,
      endDate,
      startTime: start.allDay ? '00:00' : start.time,
      endTime: end.allDay ? '23:59' : (end.time || '23:59'),
      allDay: start.allDay,
      recurrence: 'none',
      forAll: true,
      forUsers: [],
      attendees: [],
      color: null,
    });
  }
  return events;
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
  const [dayDetailKey, setDayDetailKey] = useState(null);
  const [calSections, setCalSections] = useState(() => {
    try {
      const saved = localStorage.getItem('tt_cal_sections');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [{ id: 'default', name: 'General', color: SECTION_COLORS[0], enabled: true }];
  });
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionColor, setNewSectionColor] = useState(SECTION_COLORS[1]);
  const [editSectionId, setEditSectionId] = useState(null);
  const [importSectionId, setImportSectionId] = useState(null);
  const groupId = isGroup ? activeGroup.id : null;
  const members = isGroup ? (activeGroup.members || []) : [];

  // Persist sections to localStorage
  useEffect(() => {
    localStorage.setItem('tt_cal_sections', JSON.stringify(calSections));
  }, [calSections]);

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

  const handleImportICS = async (e, sectionId) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const text = await file.text();
      const parsed = parseICS(text);
      if (parsed.length === 0) {
        addNotification({ title: 'Import Failed', message: 'No events found in the .ics file', type: 'alert', section: 'Calendar' });
        return;
      }
      for (const ev of parsed) {
        const full = { ...ev, section: sectionId, createdBy: user?.name || 'Imported', createdById: user?.id || '' };
        if (isGroup && groupId) {
          await saveEvent(groupId, full);
        } else {
          addPersonalEvent(full);
        }
      }
      addNotification({ title: 'Events Imported', message: `${parsed.length} event${parsed.length > 1 ? 's' : ''} imported from "${file.name}"`, type: 'info', section: 'Calendar' });
    } catch (err) {
      addNotification({ title: 'Import Error', message: 'Failed to parse .ics file', type: 'alert', section: 'Calendar' });
    }
  };

  const enabledSections = calSections.filter(s => s.enabled).map(s => s.id);
  const filteredEvents = useMemo(() => {
    return events.filter(e => enabledSections.includes(e.section || 'default'));
  }, [events, enabledSections]);

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

  const addSection = () => { if (!newSectionName.trim()) return; setCalSections(s => [...s, { id: generateId(), name: newSectionName.trim(), color: newSectionColor, enabled: true }]); setNewSectionName(''); setNewSectionColor(SECTION_COLORS[(calSections.length) % SECTION_COLORS.length]); setShowAddSection(false); };
  const toggleSection = (id) => setCalSections(s => s.map(sec => sec.id === id ? { ...sec, enabled: !sec.enabled } : sec));
  const deleteSection = (id) => { if (id === 'default') return; setCalSections(s => s.filter(sec => sec.id !== id)); };
  const updateSectionColor = (id, color) => setCalSections(s => s.map(sec => sec.id === id ? { ...sec, color } : sec));

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Hidden ICS import input */}
      <input type="file" id="ics-import-input" accept=".ics,.ical" style={{ display: 'none' }} onChange={(e) => handleImportICS(e, importSectionId)} />
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
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {calSections.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 6, cursor: 'pointer', fontSize: 11, color: s.enabled ? 'var(--color-text-secondary)' : 'var(--color-text-disabled)', transition: 'all 0.15s' }}>
                  <input type="checkbox" checked={s.enabled} onChange={() => toggleSection(s.id)} style={{ accentColor: s.color || 'var(--color-accent)' }} />
                  <div onClick={() => setEditSectionId(editSectionId === s.id ? null : s.id)} style={{ width: 10, height: 10, borderRadius: 3, background: s.color || SECTION_COLORS[0], cursor: 'pointer', flexShrink: 0, border: '1px solid rgba(255,255,255,0.15)' }} title="Change color" />
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                  <button onClick={() => { setImportSectionId(s.id); document.getElementById('ics-import-input')?.click(); }} className="btn-ghost btn-icon" style={{ width: 16, height: 16, opacity: 0.4, flexShrink: 0 }} title="Import .ics"><Upload size={9} /></button>
                  {s.id !== 'default' && <button onClick={() => deleteSection(s.id)} className="btn-ghost btn-icon" style={{ width: 16, height: 16, opacity: 0.4, flexShrink: 0 }} title="Delete section"><Trash2 size={9} /></button>}
                </div>
              ))}
              {calSections.map(s => editSectionId === s.id && (
                <div key={s.id + '_colors'} style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '6px 6px 4px', marginBottom: 4, background: 'var(--color-bg-tertiary)', borderRadius: 6, border: '1px solid var(--color-border-subtle)' }}>
                  {SECTION_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => { updateSectionColor(s.id, c); setEditSectionId(null); }} style={{ width: 18, height: 18, borderRadius: 4, background: c, border: s.color === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer', boxShadow: s.color === c ? `0 0 0 1px ${c}` : 'none' }} />
                  ))}
                </div>
              ))}
            </div>
            {showAddSection && (
              <div style={{ marginTop: 6, padding: 8, background: 'var(--color-bg-tertiary)', borderRadius: 8, border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                  <input className="input" placeholder="Section name" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSection()} style={{ fontSize: 11, height: 26, flex: 1 }} autoFocus />
                  <button onClick={addSection} className="btn btn-primary" style={{ padding: '0 8px', height: 26, fontSize: 10 }}>Add</button>
                  <button onClick={() => setShowAddSection(false)} className="btn-ghost btn-icon" style={{ width: 26, height: 26 }}><X size={10} /></button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {SECTION_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setNewSectionColor(c)} style={{ width: 18, height: 18, borderRadius: 4, background: c, border: newSectionColor === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer', boxShadow: newSectionColor === c ? `0 0 0 1px ${c}` : 'none' }} />
                  ))}
                </div>
              </div>
            )}
          </div>
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
                              const c = getEventColor(calSections, e);
                              const timeLabel = e.allDay ? '' : e.startTime;
                              return (
                                <div key={e.id + (e._recurring ? '_r' : '')} onClick={(ev) => { ev.stopPropagation(); setDetailEvent(e); }} style={{ fontSize: 9, padding: '2px 4px', borderRadius: 4, background: c, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600, cursor: 'pointer', lineHeight: 1.3 }} title={e.title}>
                                  {timeLabel ? `${timeLabel} ` : ''}{e.title}
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
                      const c = getEventColor(calSections, e);
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
                          title={e.title}
                        >
                          {e.title}
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

      {showModal && <EventModal date={selectedDate} sections={calSections} user={user} onClose={() => setShowModal(false)} onSave={handleSave} />}
      {detailEvent && <EditEventModal event={detailEvent} sections={calSections} onClose={() => setDetailEvent(null)} onDelete={handleRemove} onSave={handleUpdate} />}
      {dayDetailKey && <DayEventsPopup dateKey={dayDetailKey} byDay={byDay} weekSpanData={weekSpanData} weeks={weeks} sections={calSections} onClose={() => setDayDetailKey(null)} onEventClick={(e) => { setDayDetailKey(null); setDetailEvent(e); }} />}
    </div>
  );
}

function EditEventModal({ event, sections, onClose, onDelete, onSave }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [allDay, setAllDay] = useState(event.allDay || false);
  const [startTime, setStartTime] = useState(event.startTime);
  const [endTime, setEndTime] = useState(event.endTime);
  const [date, setDate] = useState(event.date);
  const [endDate, setEndDate] = useState(event.endDate || '');
  const [recurrence, setRecurrence] = useState(event.recurrence || 'none');
  const [section, setSection] = useState(event.section || 'default');
  const [customColor, setCustomColor] = useState(event.color || '');
  const [description, setDescription] = useState(event.description || '');
  const c = getEventColor(sections, event);
  const sectionName = sections.find(s => s.id === (event.section || 'default'))?.name || 'General';
  const isFirstRender = useRef(true);
  const saveTimer = useRef(null);

  // Auto-save on any field change (debounced 600ms)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (!editing) return;
    if (!title.trim()) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onSave(event.id, {
        title: title.trim(), date, startTime: allDay ? '00:00' : startTime, endTime: allDay ? '23:59' : endTime,
        endDate: endDate || date, section, allDay,
        recurrence, forAll: true, forUsers: [],
        color: customColor || null,
        description: description.trim(),
        createdBy: event.createdBy, createdById: event.createdById, attendees: event.attendees || [],
      });
    }, 600);
    return () => clearTimeout(saveTimer.current);
  }, [title, date, startTime, endTime, endDate, section, allDay, recurrence, customColor, description, editing]);

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: c }} /><span>{sectionName}</span></div>
            {event.recurrence && event.recurrence !== 'none' && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Repeat size={13} />Repeats {event.recurrence}</div>}
          </div>
          {event.description && <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 6 }}><AlignLeft size={10} /> Description</div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{event.description}</p>
          </div>}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => onDelete(event.id)} className="btn-ghost btn-icon" style={{ width: 26, height: 26, color: 'var(--color-danger)' }} title="Delete"><Trash2 size={14} /></button>
            <button onClick={onClose} className="btn-ghost btn-icon" style={{ width: 26, height: 26 }}><X size={14} /></button>
          </div>
        </div>
        <div>
          <div style={{ marginBottom: 10 }}><label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}>Title</label><input className="input" value={title} onChange={e => setTitle(e.target.value)} autoFocus style={{ fontSize: 12, height: 32 }} /></div>
          <div style={{ marginBottom: 10 }}><label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}><AlignLeft size={10} /> Description</label><textarea className="input" placeholder="Add a description…" value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ fontSize: 12, resize: 'vertical', minHeight: 48, lineHeight: 1.5, padding: '6px 10px' }} /></div>
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
          {/* Color Picker */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}><Palette size={12} /> Event Color</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <button type="button" onClick={() => setCustomColor('')} title="Auto (section default)" style={{ width: 24, height: 24, borderRadius: 6, border: !customColor ? '2px solid var(--color-accent)' : '2px solid var(--color-border-default)', background: 'var(--color-bg-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--color-text-muted)', transition: 'all 0.15s' }}>A</button>
              {COLOR_SWATCHES.map(sw => (
                <button key={sw} type="button" onClick={() => setCustomColor(sw)} style={{ width: 24, height: 24, borderRadius: 6, background: sw, border: customColor === sw ? '2px solid white' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s', boxShadow: customColor === sw ? `0 0 0 2px ${sw}` : 'none' }} />
              ))}
            </div>
          </div>
          <p style={{ fontSize: 9, color: 'var(--color-text-disabled)', textAlign: 'center', margin: '4px 0 0' }}>Changes are saved automatically</p>
        </div>
      </div>
    </div>
  );
}

function EventModal({ date, sections, user, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [endDate, setEndDate] = useState('');
  const [recurrence, setRecurrence] = useState('none');
  const [section, setSection] = useState(sections[0]?.id || 'default');
  const [customColor, setCustomColor] = useState('');
  const [description, setDescription] = useState('');
  const dateStr = date ? toDateKey(date) : toDateKey(new Date());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(), date: dateStr, startTime: allDay ? '00:00' : startTime, endTime: allDay ? '23:59' : endTime,
      endDate: endDate || dateStr, section, allDay,
      recurrence,
      color: customColor || null,
      description: description.trim(),
      forAll: true, forUsers: [], attendees: [],
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
          <div style={{ marginBottom: 10 }}><label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 3 }}><AlignLeft size={10} /> Description</label><textarea className="input" placeholder="Add a description…" value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ fontSize: 12, resize: 'vertical', minHeight: 48, lineHeight: 1.5, padding: '6px 10px' }} /></div>
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

function DayEventsPopup({ dateKey, byDay, weekSpanData, weeks, sections, onClose, onEventClick }) {
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
            const c = getEventColor(sections, e);
            const timeLabel = e.allDay ? 'All Day' : `${e.startTime} – ${e.endTime}`;
            const isMulti = e.endDate && e.endDate > e.date;
            return (
              <div key={e.id} onClick={() => onEventClick(e)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--color-bg-tertiary)', cursor: 'pointer', transition: 'background 0.15s', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ width: 4, borderRadius: 2, alignSelf: 'stretch', background: c, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
                  {e.description && <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: 'italic' }}>{e.description}</div>}
                  <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    <Clock size={9} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                    {timeLabel}
                    {isMulti && <span> · {e.date} → {e.endDate}</span>}
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

function buildMonth(cursor) { const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1); const so = first.getDay(); const start = new Date(first); start.setDate(start.getDate() - so); const days = []; for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push({ date: d, inMonth: d.getMonth() === cursor.getMonth() }); } return days; }
function buildMiniMonth(cursor) { const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1); const so = first.getDay(); const start = new Date(first); start.setDate(start.getDate() - so); const days = []; for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push({ date: d, inMonth: d.getMonth() === cursor.getMonth() }); } return days; }
