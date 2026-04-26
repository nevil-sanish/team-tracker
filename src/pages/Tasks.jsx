import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { LayoutList, LayoutGrid, Plus, Filter, MoreHorizontal, Clock } from 'lucide-react';
import { cn } from '../components/Sidebar';

export default function Tasks() {
  const { mode } = useStore();
  const [view, setView] = useState('kanban'); // kanban or list

  const tasks = [
    { id: 1, title: 'Design System Update', status: 'todo', priority: 'high', assignee: 'Alex', due: 'Today' },
    { id: 2, title: 'Homepage Hero Banner', status: 'in-progress', priority: 'medium', assignee: 'Maria', due: 'Tomorrow' },
    { id: 3, title: 'Fix Navigation Bug', status: 'review', priority: 'high', assignee: 'Jordan', due: 'Overdue' },
    { id: 4, title: 'Weekly Report', status: 'done', priority: 'low', assignee: 'Alex', due: 'Yesterday' },
  ];

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
    { id: 'review', title: 'Review', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
    { id: 'done', title: 'Done', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
  ];

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your {mode === 'group' ? 'team\'s ' : ''}work and deadlines.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button 
              className={cn("p-1.5 rounded-md transition-colors", view === 'list' ? "bg-white dark:bg-slate-950 shadow-sm text-primary" : "text-slate-500")}
              onClick={() => setView('list')}
            >
              <LayoutList size={18} />
            </button>
            <button 
              className={cn("p-1.5 rounded-md transition-colors", view === 'kanban' ? "bg-white dark:bg-slate-950 shadow-sm text-primary" : "text-slate-500")}
              onClick={() => setView('kanban')}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Filter size={16} />
            <span>Filter</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
            <Plus size={16} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
          {columns.map(col => (
            <div key={col.id} className="flex flex-col w-80 shrink-0 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-md", col.color)}>
                  {col.title}
                </span>
                <span className="text-xs font-medium text-slate-500 bg-white dark:bg-slate-800 px-2 py-1 rounded-full shadow-sm">
                  {tasks.filter(t => t.status === col.id).length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3">
                {tasks.filter(t => t.status === col.id).map(task => (
                  <div key={task.id} className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary/50 cursor-pointer transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <div className={cn(
                        "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm",
                        task.priority === 'high' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        task.priority === 'medium' ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      )}>
                        {task.priority}
                      </div>
                      <button className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{task.title}</h4>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Clock size={14} className={task.due === 'Overdue' ? 'text-red-500' : ''} />
                        <span className={task.due === 'Overdue' ? 'text-red-500 font-semibold' : ''}>{task.due}</span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden border border-slate-300 dark:border-slate-700">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee}`} alt={task.assignee} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Task Name</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Assignee</th>
                <th className="px-6 py-4 font-medium">Due Date</th>
                <th className="px-6 py-4 font-medium">Priority</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{task.title}</td>
                  <td className="px-6 py-4">
                    <span className="capitalize px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {task.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee}`} className="w-6 h-6 rounded-full" alt="" />
                      <span className="text-slate-600 dark:text-slate-400">{task.assignee}</span>
                    </div>
                  </td>
                  <td className={cn("px-6 py-4 font-medium", task.due === 'Overdue' ? 'text-red-500' : 'text-slate-600 dark:text-slate-400')}>
                    {task.due}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm",
                      task.priority === 'high' ? "bg-red-100 text-red-700" :
                      task.priority === 'medium' ? "bg-yellow-100 text-yellow-700" :
                      "bg-green-100 text-green-700"
                    )}>
                      {task.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
