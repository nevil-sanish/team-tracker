import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { FileText, Plus, Folder, Search, MoreVertical, Edit3, Image as ImageIcon, History } from 'lucide-react';

export default function Notes() {
  const { mode } = useStore();
  const [activeNote, setActiveNote] = useState(1);

  const notes = [
    { id: 1, title: 'Project Plan & Roadmap', folder: 'Planning', updatedBy: 'Alex', updatedAt: '2h ago', content: 'We need to finalize the feature set by Friday...' },
    { id: 2, title: 'Design System Guidelines', folder: 'Design', updatedBy: 'Maria', updatedAt: '1d ago', content: 'Primary colors are blue and slate...' },
    { id: 3, title: 'Meeting Notes - Aug 24', folder: 'Meetings', updatedBy: 'Jordan', updatedAt: '3d ago', content: 'Action items: Alex to setup repository...' },
  ];

  return (
    <div className="h-full flex gap-6">
      {/* Sidebar for Notes */}
      <div className="w-72 flex flex-col bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden shrink-0">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-4">
          <button className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
            <Plus size={16} />
            <span>New Note</span>
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search notes..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-primary transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {notes.map(note => (
            <div 
              key={note.id}
              onClick={() => setActiveNote(note.id)}
              className={`p-3 rounded-xl cursor-pointer transition-colors ${activeNote === note.id ? 'bg-primary/10 dark:bg-primary/20 border border-primary/20' : 'hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent'}`}
            >
              <h4 className={`text-sm font-semibold truncate ${activeNote === note.id ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>{note.title}</h4>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <Folder size={12} />
                <span>{note.folder}</span>
              </div>
              <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400 font-medium">
                <span>{note.updatedAt}</span>
                {mode === 'group' && <span>By {note.updatedBy}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Editor Toolbar */}
        <div className="h-14 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-slate-900 dark:hover:text-white p-1 rounded transition-colors"><Edit3 size={18} /></button>
            <button className="text-slate-500 hover:text-slate-900 dark:hover:text-white p-1 rounded transition-colors"><ImageIcon size={18} /></button>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-2"></div>
            <select className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 outline-none">
              <option>Heading 1</option>
              <option>Heading 2</option>
              <option>Normal Text</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
              <History size={14} />
              <span>History</span>
            </button>
            <button className="text-slate-500 hover:text-slate-900 dark:hover:text-white"><MoreVertical size={18} /></button>
          </div>
        </div>
        
        {/* Editor Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {activeNote ? (
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-6 outline-none" contentEditable suppressContentEditableWarning>
                {notes.find(n => n.id === activeNote)?.title}
              </h1>
              {mode === 'group' && (
                <div className="flex items-center gap-2 mb-8 text-sm text-slate-500 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-full w-fit border border-slate-100 dark:border-slate-800">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${notes.find(n => n.id === activeNote)?.updatedBy}`} className="w-5 h-5 rounded-full" alt="" />
                  Last edited by <span className="font-medium text-slate-700 dark:text-slate-300">{notes.find(n => n.id === activeNote)?.updatedBy}</span> {notes.find(n => n.id === activeNote)?.updatedAt}
                </div>
              )}
              <div className="prose dark:prose-invert max-w-none outline-none text-slate-700 dark:text-slate-300 leading-relaxed" contentEditable suppressContentEditableWarning>
                {notes.find(n => n.id === activeNote)?.content}
                <br /><br />
                <p>This is a rich text editor area where users can type notes. In a real application, this would use a library like Tiptap or Quill, and possibly integrate a canvas for drawing.</p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              Select a note to edit or create a new one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
