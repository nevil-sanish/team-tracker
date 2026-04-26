import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Activity as ActivityIcon, CheckCircle, MessageSquare, FileText, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { cn } from '../components/Sidebar';

export default function Activity() {
  const { mode } = useStore();
  const [filter, setFilter] = useState('all'); // all, tasks, notes, chat, calendar

  const activities = [
    { id: 1, type: 'task', user: 'Alex', action: 'completed task', target: 'Design mockup', time: '10 mins ago', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-500/20' },
    { id: 2, type: 'calendar', user: 'Maria', action: 'created event', target: 'Team Sync', time: '1 hour ago', icon: CalendarIcon, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/20' },
    { id: 3, type: 'note', user: 'Jordan', action: 'edited note', target: 'Meeting Agenda', time: '3 hours ago', icon: FileText, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-500/20' },
    { id: 4, type: 'chat', user: 'Kim', action: 'shared a file in', target: '#general', time: 'Yesterday', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-500/20' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Activity Feed</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Stay updated with everything happening in your {mode === 'group' ? 'team' : 'workspace'}.
          </p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <Filter size={16} />
          <span>Filter</span>
        </button>
      </div>

      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit">
        {['all', 'tasks', 'notes', 'calendar'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all",
              filter === f ? "bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-8">
          {activities.filter(a => filter === 'all' || a.type === filter).map(activity => (
            <div key={activity.id} className="relative pl-8">
              <div className={cn(
                "absolute -left-[17px] top-0 w-8 h-8 rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center",
                activity.bg, activity.color
              )}>
                <activity.icon size={14} />
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-900 dark:text-white">
                      <span className="font-semibold">{activity.user}</span>{' '}
                      <span className="text-slate-600 dark:text-slate-400">{activity.action}</span>{' '}
                      <span className="font-semibold">{activity.target}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                  </div>
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.user}`} className="w-8 h-8 rounded-full bg-slate-200" alt="" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
