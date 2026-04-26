import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Hash, Search, Phone, Video, MoreVertical, Smile, Paperclip, Send, Mic } from 'lucide-react';
import { cn } from '../components/Sidebar';

export default function Chat() {
  const { mode, user } = useStore();
  const [message, setMessage] = useState('');

  const channels = mode === 'group' ? [
    { id: 'c1', name: 'general', unread: 0 },
    { id: 'c2', name: 'design', unread: 3 },
    { id: 'c3', name: 'engineering', unread: 0 },
  ] : [
    { id: 'u1', name: 'Maria Designer', status: 'online', unread: 1, avatar: 'Maria' },
    { id: 'u2', name: 'Jordan Dev', status: 'busy', unread: 0, avatar: 'Jordan' },
  ];

  const messages = [
    { id: 1, sender: 'Jordan Dev', avatar: 'Jordan', time: '10:30 AM', content: 'Has anyone seen the latest designs for the dashboard?' },
    { id: 2, sender: 'Maria Designer', avatar: 'Maria', time: '10:32 AM', content: 'Yes, I just uploaded them to Figma. Let me drop the link here.' },
    { id: 3, sender: 'Maria Designer', avatar: 'Maria', time: '10:33 AM', content: 'figma.com/file/xyz123', isLink: true },
    { id: 4, sender: user.name, avatar: user.name.split(' ')[0], time: '10:35 AM', content: 'Awesome, taking a look now. Thanks Maria!', isMe: true },
  ];

  return (
    <div className="h-full flex bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Sidebar Channels/DMs */}
      <div className="w-64 border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
            {mode === 'group' ? 'Channels' : 'Direct Messages'}
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-sm outline-none focus:border-primary transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {channels.map(c => (
            <div key={c.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer group transition-colors">
              <div className="flex items-center gap-2">
                {mode === 'group' ? (
                  <Hash size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                ) : (
                  <div className="relative">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.avatar}`} className="w-6 h-6 rounded-full bg-slate-200" alt="" />
                    <div className={cn(
                      "absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white dark:border-slate-900",
                      c.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    )}></div>
                  </div>
                )}
                <span className={cn("text-sm font-medium", c.unread > 0 ? "text-slate-900 dark:text-white font-bold" : "text-slate-600 dark:text-slate-400")}>
                  {c.name}
                </span>
              </div>
              {c.unread > 0 && (
                <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                  {c.unread}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-950">
        {/* Chat Header */}
        <div className="h-16 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            {mode === 'group' ? (
              <Hash size={20} className="text-slate-400" />
            ) : null}
            <h2 className="font-semibold text-lg text-slate-900 dark:text-white">
              {mode === 'group' ? 'design' : 'Maria Designer'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-primary transition-colors"><Phone size={18} /></button>
            <button className="text-slate-400 hover:text-primary transition-colors"><Video size={18} /></button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><MoreVertical size={18} /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map(msg => (
            <div key={msg.id} className={cn("flex gap-4 max-w-2xl", msg.isMe ? "ml-auto flex-row-reverse" : "")}>
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.avatar}`} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0" alt="" />
              <div className={cn("flex flex-col gap-1", msg.isMe ? "items-end" : "items-start")}>
                <div className={cn("flex items-center gap-2", msg.isMe ? "flex-row-reverse" : "")}>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{msg.sender}</span>
                  <span className="text-xs text-slate-400">{msg.time}</span>
                </div>
                <div className={cn(
                  "px-4 py-2.5 rounded-2xl text-sm max-w-fit shadow-sm",
                  msg.isMe 
                    ? "bg-primary text-white rounded-tr-sm" 
                    : "bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-200 dark:border-slate-800",
                  msg.isLink && !msg.isMe ? "text-blue-500 hover:underline cursor-pointer" : ""
                )}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              <Plus size={20} />
            </button>
            <textarea 
              rows={1}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 text-sm py-2 px-1 text-slate-800 dark:text-slate-200"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="flex items-center gap-1 pb-1">
              <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><Smile size={18} /></button>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><Mic size={18} /></button>
              <button className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors ml-1 shadow-sm">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
