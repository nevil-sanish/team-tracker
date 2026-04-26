import React from 'react';
import { useStore } from '../store/useStore';
import { Video, Phone, Mic, MicOff, Camera, CameraOff, MonitorUp, MessageSquare, Users, History, Plus } from 'lucide-react';
import { cn } from '../components/Sidebar';

export default function Calls() {
  const { mode } = useStore();

  return (
    <div className="h-full flex gap-6">
      {/* Active Call Area */}
      <div className="flex-1 bg-slate-900 rounded-2xl overflow-hidden flex flex-col relative shadow-lg shadow-slate-900/20">
        <div className="p-4 flex items-center justify-between text-white bg-gradient-to-b from-black/50 to-transparent absolute top-0 w-full z-10">
          <div className="flex items-center gap-3">
            <div className="bg-red-500 w-2.5 h-2.5 rounded-full animate-pulse"></div>
            <span className="font-semibold">{mode === 'group' ? 'Design Team Sync' : 'Call with Maria'}</span>
            <span className="text-white/60 text-sm">45:12</span>
          </div>
          <button className="bg-white/10 hover:bg-white/20 p-2 rounded-lg backdrop-blur-sm transition-colors">
            <Users size={20} />
          </button>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-4 flex items-center justify-center pt-16 pb-24 gap-4">
          <div className="relative w-full max-w-2xl aspect-video bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl">
            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80" className="w-full h-full object-cover" alt="Maria" />
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-md text-white text-sm font-medium flex items-center gap-2">
              Maria Designer
            </div>
          </div>
          {mode === 'group' && (
             <div className="w-64 flex flex-col gap-4 h-full max-h-[calc(100vh-200px)] overflow-y-auto">
               <div className="relative aspect-video bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                 <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80" className="w-full h-full object-cover" alt="Jordan" />
                 <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-white text-xs">Jordan Dev</div>
               </div>
               <div className="relative aspect-video bg-slate-800 rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
                 <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-white border-2 border-slate-600">A</div>
                 <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-white text-xs">Alex (You)</div>
                 <div className="absolute top-2 right-2 bg-red-500/80 text-white p-1 rounded-full"><MicOff size={12} /></div>
               </div>
             </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/10 shadow-2xl">
          <button className="flex flex-col items-center gap-1.5 text-white hover:text-red-400 transition-colors w-12 group">
            <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-red-500/20 flex items-center justify-center transition-colors">
              <MicOff size={22} />
            </div>
            <span className="text-[10px] font-medium">Mute</span>
          </button>
          <button className="flex flex-col items-center gap-1.5 text-white hover:text-white/80 transition-colors w-12 group">
            <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
              <Camera size={22} />
            </div>
            <span className="text-[10px] font-medium">Video</span>
          </button>
          <button className="flex flex-col items-center gap-1.5 text-white hover:text-white/80 transition-colors w-12 group">
            <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
              <MonitorUp size={22} />
            </div>
            <span className="text-[10px] font-medium">Share</span>
          </button>
          <div className="w-px h-8 bg-white/20 mx-2"></div>
          <button className="flex flex-col items-center gap-1.5 text-white hover:text-white/80 transition-colors w-12 group">
            <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors relative">
              <MessageSquare size={22} />
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></span>
            </div>
            <span className="text-[10px] font-medium">Chat</span>
          </button>
          <button className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium shadow-sm transition-colors ml-4">
            Leave Call
          </button>
        </div>
      </div>

      {/* Sidebar History */}
      <div className="w-80 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <History size={18} />
            Call History
          </h3>
          <button className="p-1.5 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {[
            { id: 1, name: 'Design Sync', type: 'video', time: 'Today, 10:00 AM', duration: '45 min', missed: false },
            { id: 2, name: 'Jordan Dev', type: 'voice', time: 'Yesterday, 2:30 PM', duration: '12 min', missed: false },
            { id: 3, name: 'Engineering Weekly', type: 'video', time: 'Aug 22, 11:00 AM', duration: 'Missed', missed: true },
          ].map(call => (
            <div key={call.id} className="flex gap-3 items-start">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
                call.missed ? "bg-red-50 dark:bg-red-900/20 text-red-500 border-red-100 dark:border-red-900" : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800"
              )}>
                {call.type === 'video' ? <Video size={18} /> : <Phone size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold truncate", call.missed ? "text-red-500" : "text-slate-900 dark:text-white")}>{call.name}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>{call.time}</span>
                  <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                  <span>{call.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
