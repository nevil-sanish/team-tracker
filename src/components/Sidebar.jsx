import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Calendar, CheckSquare, FileText, MessageSquare, 
  Video, Activity, BarChart2, Folder, 
  Menu, X, Sun, Moon, LogOut, Settings, User
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { mode, toggleMode, activeTeamId, setActiveTeamId, teams } = useStore();

  const navItems = [
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: FileText, label: 'Notes', path: '/notes' },
    { icon: MessageSquare, label: 'Chat', path: '/chat' },
    { icon: Video, label: 'Calls', path: '/calls' },
    { icon: Activity, label: 'Activity', path: '/activity' },
  ];

  const groupOnlyItems = [
    { icon: BarChart2, label: 'Analytics', path: '/analytics' },
    { icon: Folder, label: 'Resource Hub', path: '/resources' },
  ];

  const displayedNavItems = mode === 'group' 
    ? [...navItems, ...groupOnlyItems] 
    : navItems;

  return (
    <aside 
      className={cn(
        "bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 relative z-20",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
              S
            </div>
            TeamSync
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 mx-auto rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl">
            S
          </div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500",
            collapsed && "absolute -right-3 top-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm"
          )}
        >
          {collapsed ? <Menu size={16} /> : <X size={20} />}
        </button>
      </div>

      <div className="p-4">
        {/* Mode Toggle */}
        <div 
          className="relative flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer select-none"
          onClick={toggleMode}
        >
          <div 
            className={cn(
              "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-slate-950 shadow-sm rounded-md transition-all duration-300",
              mode === 'personal' ? "left-1" : "left-[calc(50%+2px)]"
            )}
          />
          <div className={cn(
            "relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors",
            mode === 'personal' ? "text-primary" : "text-slate-500 dark:text-slate-400"
          )}>
            <User size={16} />
            {!collapsed && <span>Personal</span>}
          </div>
          <div className={cn(
            "relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors",
            mode === 'group' ? "text-primary" : "text-slate-500 dark:text-slate-400"
          )}>
            <Menu size={16} />
            {!collapsed && <span>Group</span>}
          </div>
        </div>

        {/* Team Selector if Group Mode */}
        {mode === 'group' && !collapsed && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Active Team</p>
            <select 
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm rounded-md px-3 py-2 outline-none focus:border-primary"
              value={activeTeamId || ''}
              onChange={(e) => setActiveTeamId(e.target.value)}
            >
              <option value="" disabled>Select a Team...</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {displayedNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary dark:bg-primary/20" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              <item.icon size={20} className={collapsed ? "mx-auto" : ""} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
          <Settings size={20} />
          {!collapsed && <span>Settings</span>}
        </div>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-red-500 hover:text-red-600">
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </div>
      </div>
    </aside>
  );
}
