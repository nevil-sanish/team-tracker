import React, { useState } from 'react';
import { Search, Bell, Moon, Sun, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from './Sidebar';

export function TopNav() {
  const [darkMode, setDarkMode] = useState(false);
  const { user, mode, activeTeamId, teams, notifications } = useStore();
  
  const activeTeam = teams.find(t => t.id === activeTeamId);
  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const statusColors = {
    online: 'bg-green-500',
    busy: 'bg-red-500',
    'in-a-call': 'bg-purple-500',
    focus: 'bg-yellow-500',
    offline: 'bg-slate-400'
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 z-10 shrink-0">
      <div className="flex items-center gap-4 flex-1">
        <h1 className="text-xl font-semibold capitalize text-slate-800 dark:text-slate-100 hidden sm:block">
          {mode === 'group' && activeTeam ? activeTeam.name : 'Personal Workspace'}
        </h1>
        
        <div className="relative max-w-md w-full ml-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search tasks, notes, messages..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border-transparent focus:border-primary focus:bg-white dark:focus:bg-slate-800 rounded-full text-sm outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="hidden sm:flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
          <Plus size={16} />
          <span>Create</span>
        </button>

        <button 
          onClick={toggleDarkMode}
          className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-950"></span>
          )}
        </button>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <img src={user.avatar} alt="Avatar" className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            <div className={cn(
              "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-950",
              statusColors[user.status]
            )}></div>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user.status.replace('-', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
