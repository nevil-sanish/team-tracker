import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ChevronLeft, ChevronRight, Plus, Clock, Video } from 'lucide-react';
import { cn } from '../components/Sidebar';

export default function CalendarView() {
  const { mode, teams } = useStore();
  const [view, setView] = useState('Month'); // Month, Week, Day

  const calendars = mode === 'group' ? [
    { id: 'personal', name: 'Personal', color: 'bg-indigo-500' },
    ...teams.map(t => ({ id: t.id, name: t.name, color: `bg-${t.color}-500` }))
  ] : [
    { id: 'personal', name: 'Personal', color: 'bg-indigo-500' }
  ];

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Mock grid for a month
  const grid = Array.from({ length: 35 }, (_, i) => i + 1);

  return (
    <div className="h-full flex gap-6">
      {/* Calendar Sidebar */}
      <div className="w-64 shrink-0 flex flex-col gap-6">
        <button className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
          <Plus size={16} />
          <span>New Event</span>
        </button>

        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          {/* Mini Calendar mock */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold">August 2026</span>
            <div className="flex gap-1">
              <ChevronLeft size={16} className="text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white" />
              <ChevronRight size={16} className="text-slate-400 cursor-pointer hover:text-slate-900 dark:hover:text-white" />
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-slate-500 mb-2">
            {days.map(d => <div key={d}>{d.charAt(0)}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {grid.slice(0, 31).map(d => (
              <div key={d} className={cn(
                "w-7 h-7 flex items-center justify-center rounded-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 mx-auto transition-colors",
                d === 24 ? "bg-primary text-white hover:bg-primary" : "text-slate-700 dark:text-slate-300"
              )}>
                {d}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex-1">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Calendars</h3>
          <div className="space-y-3">
            {calendars.map(cal => (
              <label key={cal.id} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center w-4 h-4 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900">
                  <input type="checkbox" className="peer absolute opacity-0 w-full h-full cursor-pointer" defaultChecked />
                  <div className={cn("hidden peer-checked:block w-2.5 h-2.5 rounded-sm", cal.color)}></div>
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{cal.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
        {/* Calendar Header */}
        <div className="h-16 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white w-32">August 2026</h2>
            <div className="flex gap-1 items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
              <button className="p-1 rounded text-slate-500 hover:bg-white dark:hover:bg-slate-800 shadow-sm"><ChevronLeft size={16} /></button>
              <button className="px-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Today</button>
              <button className="p-1 rounded text-slate-500 hover:bg-white dark:hover:bg-slate-800 shadow-sm"><ChevronRight size={16} /></button>
            </div>
          </div>
          
          <div className="flex bg-slate-50 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            {['Month', 'Week', 'Day'].map(v => (
              <button 
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  view === v ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Grid (Mock) */}
        <div className="flex-1 flex flex-col">
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 shrink-0">
            {days.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-100 dark:border-slate-800 last:border-r-0">
                {d}
              </div>
            ))}
          </div>
          <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-slate-100 dark:bg-slate-800 gap-[1px]">
            {grid.map(day => {
              const isToday = day === 24;
              return (
                <div key={day} className="bg-white dark:bg-slate-950 p-2 relative group hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <span className={cn(
                    "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full",
                    isToday ? "bg-primary text-white" : day > 31 ? "text-slate-300 dark:text-slate-700" : "text-slate-700 dark:text-slate-300"
                  )}>
                    {day > 31 ? day - 31 : day}
                  </span>
                  
                  {/* Mock Event */}
                  {day === 24 && (
                    <div className="mt-1 flex flex-col gap-1">
                      <div className="text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded truncate border border-blue-200 dark:border-blue-800/50">
                        10:00 AM Design Sync
                      </div>
                      <div className="text-[10px] font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded truncate border border-indigo-200 dark:border-indigo-800/50">
                        2:00 PM Team Meeting
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
