import React from 'react';
import { BarChart2, TrendingUp, Clock, CheckCircle } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Team Analytics</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Monitor your team's productivity and engagement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Tasks Completed', value: '124', icon: CheckCircle, color: 'text-green-500', trend: '+12% this week' },
          { label: 'Productivity Score', value: '92%', icon: TrendingUp, color: 'text-blue-500', trend: '+4% this week' },
          { label: 'Avg. Call Duration', value: '34m', icon: Clock, color: 'text-purple-500', trend: '-5m this week' },
          { label: 'Active Members', value: '8/10', icon: BarChart2, color: 'text-yellow-500', trend: 'Same as last week' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-900 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className="text-xs font-medium text-slate-500">{stat.trend}</span>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[300px] flex flex-col">
          <h3 className="font-semibold mb-6">Tasks by Member</h3>
          <div className="flex-1 flex items-end gap-4 px-4">
            {/* Mock Bar Chart */}
            {[
              { name: 'Alex', val: 80 },
              { name: 'Maria', val: 100 },
              { name: 'Jordan', val: 65 },
              { name: 'Kim', val: 40 },
            ].map(b => (
              <div key={b.name} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t-md relative group">
                  <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-md transition-all duration-1000" style={{ height: `${b.val}%` }}></div>
                </div>
                <span className="text-xs text-slate-500 font-medium">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[300px] flex flex-col">
          <h3 className="font-semibold mb-6">Productivity Heatmap</h3>
          <div className="flex-1 grid grid-cols-7 gap-2 content-center">
            {/* Mock Heatmap */}
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className={`aspect-square rounded-md ${
                Math.random() > 0.7 ? 'bg-green-500' : 
                Math.random() > 0.4 ? 'bg-green-300 dark:bg-green-500/60' : 
                'bg-slate-100 dark:bg-slate-800'
              }`}></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
