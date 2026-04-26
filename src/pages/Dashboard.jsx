import React from 'react';
import { useStore } from '../store/useStore';
import { Clock, CheckCircle, AlertCircle, Users } from 'lucide-react';

export default function Dashboard() {
  const { mode, user } = useStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Good morning, {user.name.split(' ')[0]}!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Here's what's happening in your {mode === 'group' ? 'team' : 'personal'} workspace today.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tasks Due Today', value: '5', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Completed Tasks', value: '12', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
          { label: 'Overdue Tasks', value: '2', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
          { label: 'Upcoming Meetings', value: '3', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm min-h-[400px]">
          <h3 className="text-lg font-semibold mb-4">Upcoming Schedule</h3>
          <div className="space-y-4">
            <div className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col items-center justify-center w-14 h-14 bg-white dark:bg-slate-950 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-red-500">AUG</span>
                <span className="text-lg font-bold">24</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">Design Sync</h4>
                <p className="text-sm text-slate-500 mt-1">10:00 AM - 11:30 AM</p>
                <div className="flex -space-x-2 mt-3">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200" alt="" />
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Maria" className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200" alt="" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm min-h-[400px]">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-3 space-y-6">
            <div className="relative pl-6">
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white dark:border-slate-950"></div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Maria completed <span className="text-blue-500">Design Mockups</span></p>
              <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
            </div>
            <div className="relative pl-6">
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green-500 border-4 border-white dark:border-slate-950"></div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">Jordan joined the voice call</p>
              <p className="text-xs text-slate-500 mt-1">4 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
