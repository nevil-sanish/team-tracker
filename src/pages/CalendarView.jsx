import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, Plus, X, Repeat, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { toDateKey } from '../lib/utils';
import { saveEvent, deleteEvent as deleteEventFS, saveActivity } from '../lib/dataService';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarView() {
  const { activeGroup, events, addEvent, removeEvent, user, addNotification } = useStore();
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState('month');
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const groupId = activeGroup?.id;

  const nav = (dir) => { const d = new Date(cursor); if (view==='month') d.setMonth(d.getMonth()+dir); else if (view==='week') d.setDate(d.getDate()+dir*7); else d.setDate(d.getDate()+dir); setCursor(d); };

  const viewLabel = view === 'month' ? cursor.toLocaleDateString(undefined,{month:'long',year:'numeric'}) : view === 'week' ? weekLabel(cursor) : cursor.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});

  const handleSaveEvent = async (event) => {
    const full = { ...event, createdBy: user?.name||'You' };
    if (groupId) { await saveEvent(groupId, full); await saveActivity(groupId,{kind:'event_created',actorName:user?.name||'You',target:event.title,at:new Date().toISOString()}); }
    else addEvent(full);
    addNotification({title:'Event Created',message:`"${event.title}" scheduled`,type:'info',section:'Calendar'});
    setShowModal(false);
  };

  const handleRemove = async (id) => {
    const ev = events.find(e=>e.id===id);
    if (groupId) await deleteEventFS(groupId,id); else removeEvent(id);
    addNotification({title:'Event Removed',message:`"${ev?.title||'An event'}" removed`,type:'alert',section:'Calendar'});
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="flex items-center justify-between px-6 py-4" style={{borderBottom:'1px solid var(--color-border-subtle)'}}>
        <div className="flex items-center gap-2">
          <button onClick={()=>nav(-1)} className="btn-ghost btn-icon" style={{width:32,height:32}}><ChevronLeft size={16}/></button>
          <button onClick={()=>setCursor(new Date())} className="btn-ghost btn-sm" style={{fontSize:11}}>Today</button>
          <button onClick={()=>nav(1)} className="btn-ghost btn-icon" style={{width:32,height:32}}><ChevronRight size={16}/></button>
          <h2 style={{fontSize:15,fontWeight:600,color:'var(--color-text-primary)',marginLeft:8}}>{viewLabel}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="tab-group">
            {['month','week','day'].map(v=>(<button key={v} className={`tab-item ${view===v?'active':''}`} onClick={()=>setView(v)} style={{textTransform:'capitalize',fontSize:11,padding:'4px 12px'}}>{v}</button>))}
          </div>
          <button className="btn btn-primary btn-sm" onClick={()=>{setSelectedDate(new Date());setShowModal(true);}}><Plus size={14}/> New Event</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {view==='month'&&<MonthView cursor={cursor} events={events} onDateClick={(d)=>{setSelectedDate(d);setShowModal(true);}} onRemove={handleRemove}/>}
        {view==='week'&&<WeekView cursor={cursor} events={events} onRemove={handleRemove}/>}
        {view==='day'&&<DayView cursor={cursor} events={events} onRemove={handleRemove}/>}
      </div>
      {showModal&&<EventModal date={selectedDate} onClose={()=>setShowModal(false)} onSave={handleSaveEvent}/>}
    </div>
  );
}

function MonthView({cursor,events,onDateClick,onRemove}) {
  const days = useMemo(()=>buildMonth(cursor),[cursor]);
  const byDay = useMemo(()=>{const m={};events.forEach(e=>(m[e.date]||=[]).push(e));return m;},[events]);
  return (
    <div style={{padding:'16px 20px'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:1,background:'var(--color-border-subtle)',borderRadius:12,overflow:'hidden',border:'1px solid var(--color-border-subtle)'}}>
        {DAYS.map(d=>(<div key={d} style={{background:'var(--color-bg-tertiary)',padding:'8px 10px',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--color-text-muted)'}}>{d}</div>))}
        {days.map(d=>{const key=toDateKey(d.date);const de=byDay[key]||[];const isToday=key===toDateKey(new Date());return(
          <div key={key} onClick={()=>onDateClick(d.date)} style={{background:d.inMonth?'var(--color-bg-elevated)':'var(--color-bg-secondary)',minHeight:100,padding:6,cursor:'pointer',transition:'background 0.15s',opacity:d.inMonth?1:0.4}} className="hover:bg-[var(--color-bg-hover)]">
            <div style={{fontSize:12,fontWeight:isToday?700:500,width:isToday?24:'auto',height:isToday?24:'auto',borderRadius:isToday?'50%':0,background:isToday?'var(--color-accent)':'transparent',color:isToday?'white':'var(--color-text-primary)',display:isToday?'flex':'block',alignItems:'center',justifyContent:'center',lineHeight:1,marginBottom:4}}>{d.date.getDate()}</div>
            <div style={{display:'flex',flexDirection:'column',gap:2,overflow:'hidden'}}>
              {de.slice(0,3).map(e=>(<div key={e.id} style={{fontSize:10,padding:'2px 6px',borderRadius:5,background:'var(--color-accent-soft)',color:'var(--color-accent)',display:'flex',alignItems:'center',gap:3,whiteSpace:'nowrap',overflow:'hidden'}} title={e.title}><span style={{width:4,height:4,borderRadius:'50%',background:'var(--color-accent)',flexShrink:0}}/><span style={{fontFamily:'var(--font-mono)',fontSize:9,opacity:0.7}}>{e.startTime}</span><span style={{overflow:'hidden',textOverflow:'ellipsis',flex:1}}>{e.title}</span></div>))}
              {de.length>3&&<span style={{fontSize:9,color:'var(--color-text-muted)',fontStyle:'italic'}}>+{de.length-3} more</span>}
            </div>
          </div>);})}
      </div>
    </div>
  );
}

function WeekView({cursor,events,onRemove}) {
  const weekDays = useMemo(()=>buildWeek(cursor),[cursor]);
  const hours = Array.from({length:14},(_,i)=>i+7);
  const byDay = useMemo(()=>{const m={};events.forEach(e=>(m[e.date]||=[]).push(e));return m;},[events]);
  return (
    <div style={{padding:'12px 16px',overflowX:'auto'}}>
      <div style={{display:'grid',gridTemplateColumns:'56px repeat(7,1fr)',gap:1,background:'var(--color-border-subtle)',borderRadius:12,overflow:'hidden',border:'1px solid var(--color-border-subtle)'}}>
        <div style={{background:'var(--color-bg-tertiary)',padding:8}}/>
        {weekDays.map(d=>{const key=toDateKey(d);const isT=key===toDateKey(new Date());return(<div key={key} style={{background:'var(--color-bg-tertiary)',padding:8,textAlign:'center'}}><div style={{fontSize:9,textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--color-text-muted)'}}>{d.toLocaleDateString(undefined,{weekday:'short'})}</div><div style={{fontSize:16,fontWeight:isT?700:500,color:isT?'var(--color-accent)':'var(--color-text-primary)',marginTop:2}}>{d.getDate()}</div></div>);})}
        {hours.map(h=>(<React.Fragment key={`h-${h}`}><div style={{background:'var(--color-bg-elevated)',padding:'8px 6px',fontSize:10,fontFamily:'var(--font-mono)',color:'var(--color-text-muted)',textAlign:'right'}}>{h%12===0?12:h%12}{h<12?'a':'p'}</div>
        {weekDays.map(d=>{const key=toDateKey(d);const he=(byDay[key]||[]).filter(e=>parseInt(e.startTime?.split(':')[0])===h);return(<div key={`${key}-${h}`} style={{background:'var(--color-bg-elevated)',minHeight:44,padding:2,borderTop:'1px solid var(--color-border-subtle)'}} className="hover:bg-[var(--color-bg-hover)]">{he.map(e=>(<div key={e.id} style={{fontSize:10,padding:'2px 6px',borderRadius:5,background:'var(--color-accent-soft)',color:'var(--color-accent)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.startTime} {e.title}</div>))}</div>);})}</React.Fragment>))}
      </div>
    </div>
  );
}

function DayView({cursor,events,onRemove}) {
  const key = toDateKey(cursor);
  const de = events.filter(e=>e.date===key);
  const hours = Array.from({length:16},(_,i)=>i+6);
  return (
    <div style={{padding:'20px 24px',maxWidth:800,margin:'0 auto'}}>
      <div style={{borderRadius:12,border:'1px solid var(--color-border-subtle)',overflow:'hidden'}}>
        {hours.map(h=>{const he=de.filter(e=>parseInt(e.startTime?.split(':')[0])===h);return(
          <div key={h} style={{display:'flex',borderBottom:'1px solid var(--color-border-subtle)'}} className="hover:bg-[var(--color-bg-hover)]">
            <div style={{width:64,flexShrink:0,padding:'12px 8px',textAlign:'right',fontSize:10,fontFamily:'var(--font-mono)',color:'var(--color-text-muted)',borderRight:'1px solid var(--color-border-subtle)'}}>{h%12===0?12:h%12}:00 {h<12?'AM':'PM'}</div>
            <div style={{flex:1,minHeight:52,padding:4,display:'flex',flexDirection:'column',gap:4}}>
              {he.map(e=>(<div key={e.id} className="card" style={{padding:'8px 12px',display:'flex',alignItems:'flex-start',gap:10,borderRadius:10}}>
                <div style={{width:3,height:32,borderRadius:2,background:'var(--color-accent)',flexShrink:0,marginTop:2}}/>
                <div style={{flex:1}}><p style={{fontSize:13,fontWeight:600,color:'var(--color-text-primary)'}}>{e.title}</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:10,marginTop:4,fontSize:11,color:'var(--color-text-muted)'}}>
                  <span style={{display:'flex',alignItems:'center',gap:3}}><Clock size={11}/> {e.startTime} – {e.endTime}</span>
                  {e.location&&<span style={{display:'flex',alignItems:'center',gap:3}}><MapPin size={11}/> {e.location}</span>}
                  <span style={{fontStyle:'italic'}}>by {e.createdBy}</span>
                </div></div>
                <button onClick={()=>onRemove(e.id)} className="btn-ghost btn-icon" style={{width:24,height:24,color:'var(--color-danger)',opacity:0.5}}><Trash2 size={13}/></button>
              </div>))}
            </div>
          </div>);})}
      </div>
    </div>
  );
}

function EventModal({date,onClose,onSave}) {
  const [title,setTitle]=useState('');const [startTime,setStartTime]=useState('09:00');const [endTime,setEndTime]=useState('10:00');const [location,setLocation]=useState('');const [recurrence,setRecurrence]=useState('none');
  const dateStr = date?toDateKey(date):toDateKey(new Date());
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e=>e.stopPropagation()} style={{maxWidth:440}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}><h2 style={{fontSize:16,fontWeight:700,color:'var(--color-text-primary)'}}>New Event</h2><button onClick={onClose} className="btn-ghost btn-icon" style={{width:28,height:28}}><X size={16}/></button></div>
        <p style={{fontSize:12,color:'var(--color-accent)',fontWeight:600,marginBottom:16}}>{new Date(dateStr+'T00:00:00').toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</p>
        <form onSubmit={e=>{e.preventDefault();if(title.trim())onSave({title:title.trim(),date:dateStr,startTime,endTime,location:location.trim()||undefined,recurrence:recurrence!=='none'?recurrence:undefined,attendees:[]});}}>
          <div style={{marginBottom:12}}><label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--color-text-secondary)',marginBottom:4}}>Event Title</label><input className="input" placeholder="What's happening?" value={title} onChange={e=>setTitle(e.target.value)} autoFocus/></div>
          <div style={{display:'flex',gap:10,marginBottom:12}}><div style={{flex:1}}><label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--color-text-secondary)',marginBottom:4}}>Start</label><input className="input" type="time" value={startTime} onChange={e=>setStartTime(e.target.value)}/></div><div style={{flex:1}}><label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--color-text-secondary)',marginBottom:4}}>End</label><input className="input" type="time" value={endTime} onChange={e=>setEndTime(e.target.value)}/></div></div>
          <div style={{marginBottom:12}}><label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--color-text-secondary)',marginBottom:4}}>Location</label><input className="input" placeholder="Where? (optional)" value={location} onChange={e=>setLocation(e.target.value)}/></div>
          <div style={{marginBottom:16}}><label style={{display:'block',fontSize:11,fontWeight:600,color:'var(--color-text-secondary)',marginBottom:4}}>Recurring</label><select className="input" value={recurrence} onChange={e=>setRecurrence(e.target.value)}><option value="none">No repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
          <div style={{display:'flex',gap:8}}><button type="button" onClick={onClose} className="btn btn-secondary" style={{flex:1}}>Cancel</button><button type="submit" className="btn btn-primary" style={{flex:1}}><Plus size={14}/> Save</button></div>
        </form>
      </div>
    </div>
  );
}

function buildMonth(cursor){const first=new Date(cursor.getFullYear(),cursor.getMonth(),1);const so=(first.getDay()+6)%7;const start=new Date(first);start.setDate(start.getDate()-so);const days=[];for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);days.push({date:d,inMonth:d.getMonth()===cursor.getMonth()});}return days;}
function buildWeek(cursor){const d=new Date(cursor);const dow=(d.getDay()+6)%7;d.setDate(d.getDate()-dow);return Array.from({length:7},(_,i)=>{const wd=new Date(d);wd.setDate(d.getDate()+i);return wd;});}
function weekLabel(cursor){const w=buildWeek(cursor);const f=d=>d.toLocaleDateString(undefined,{month:'short',day:'numeric'});return `${f(w[0])} – ${f(w[6])}, ${w[6].getFullYear()}`;}
