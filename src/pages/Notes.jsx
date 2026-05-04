import React, { useState, useMemo } from 'react';
import { Folder, FileText, PenTool, Type, Layers, Search, Plus, X, Bold, Italic, Underline, List, ListOrdered, Code, Link, Image, Undo2, Redo2, History, Download, Trash2, Clock, Pencil } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatRelative } from '../lib/utils';
import { saveNote, deleteNote as deleteNoteFS, updateNoteDoc, saveNoteFolder, saveActivity } from '../lib/dataService';
import Avatar from '../components/Avatar';

export default function Notes() {
  const store = useStore();
  const { activeGroup, noteFolders, addNote, removeNote, updateNote, addNoteFolder,
    addPersonalNote, removePersonalNote, updatePersonalNote,
    getActiveNotes, user, addNotification, mode } = store;
  const notes = getActiveNotes();
  const isGroup = mode === 'group' && !!activeGroup;
  const groupId = isGroup ? activeGroup.id : null;
  const [selectedId, setSelectedId] = useState(notes[0]?.id ?? null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({});
  const [showNewNote, setShowNewNote] = useState(false);

  const selected = notes.find(n => n.id === selectedId) ?? notes[0];

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(n => n.title.toLowerCase().includes(q) || n.body?.toLowerCase().includes(q));
  }, [notes, searchQuery]);

  const handleAddNote = async (note) => {
    const full = { ...note, updatedBy: user?.name || 'You' };
    if (isGroup && groupId) {
      await saveNote(groupId, full);
      await saveActivity(groupId, { kind: 'note_created', actorName: user?.name || 'You', target: note.title, at: new Date().toISOString() });
    } else addPersonalNote(full);
    addNotification({ title: 'Note Created', message: `"${note.title}" added`, type: 'info', section: 'Notes' });
    setShowNewNote(false);
  };

  const handleUpdate = async (id, updates) => {
    if (isGroup && groupId) await updateNoteDoc(groupId, id, { ...updates, updatedBy: user?.name || 'You' });
    else updatePersonalNote(id, updates);
  };

  const handleRemove = async (id) => {
    const note = notes.find(n => n.id === id);
    if (isGroup && groupId) await deleteNoteFS(groupId, id);
    else removePersonalNote(id);
    addNotification({ title: 'Note Deleted', message: `"${note?.title || 'A note'}" removed`, type: 'alert', section: 'Notes' });
    if (selectedId === id) setSelectedId(null);
  };

  const handleAddFolder = async (folder) => {
    if (isGroup && groupId) await saveNoteFolder(groupId, folder);
    else addNoteFolder(folder);
  };

  return (
    <div className="h-full flex animate-fade-in" style={{ overflow: 'hidden' }}>
      <aside className="hidden md:flex flex-col" style={{ width: 280, borderRight: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-secondary)', flexShrink: 0 }}>
        <div style={{ padding: 12, borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-disabled)' }} />
            <input className="input" placeholder="Search notes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 32, height: 30, fontSize: 11 }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {noteFolders.map(f => {
            const folderNotes = filtered.filter(n => n.folderId === f.id);
            const isExp = expandedFolders[f.id] !== false;
            if (searchQuery && folderNotes.length === 0) return null;
            return (
              <div key={f.id} style={{ marginBottom: 8 }}>
                <button onClick={() => setExpandedFolders(s => ({ ...s, [f.id]: !isExp }))} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '4px 8px', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  <span style={{ transform: isExp ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s', fontSize: 8 }}>▶</span>
                  <Folder size={13} /><span style={{ flex: 1, textAlign: 'left' }}>{f.name}</span>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)' }}>{folderNotes.length}</span>
                </button>
                {isExp && <div style={{ marginLeft: 12, marginTop: 2 }}>
                  {folderNotes.map(n => (
                    <button key={n.id} onClick={() => setSelectedId(n.id)} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%', padding: '8px 10px', background: selected?.id === n.id ? 'var(--color-bg-elevated)' : 'transparent', border: selected?.id === n.id ? '1px solid var(--color-border-default)' : '1px solid transparent', borderRadius: 8, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', marginBottom: 2 }} className="hover:bg-[var(--color-bg-hover)]">
                      <FileText size={14} style={{ marginTop: 2, color: 'var(--color-text-muted)', flexShrink: 0 }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</p>
                        <p style={{ fontSize: 10, color: 'var(--color-text-disabled)', fontStyle: 'italic', marginTop: 2 }}>{n.updatedBy} · {formatRelative(n.updatedAt)}</p>
                      </div>
                    </button>
                  ))}
                </div>}
              </div>
            );
          })}
          {/* Uncategorized notes */}
          {filtered.filter(n => !noteFolders.some(f => f.id === n.folderId)).map(n => (
            <button key={n.id} onClick={() => setSelectedId(n.id)} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%', padding: '8px 10px', background: selected?.id === n.id ? 'var(--color-bg-elevated)' : 'transparent', border: '1px solid transparent', borderRadius: 8, cursor: 'pointer', textAlign: 'left', marginBottom: 2 }} className="hover:bg-[var(--color-bg-hover)]">
              <FileText size={14} style={{ marginTop: 2, color: 'var(--color-text-muted)' }} />
              <div><p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>{n.title}</p></div>
            </button>
          ))}
        </div>
        <div style={{ padding: 8, borderTop: '1px solid var(--color-border-subtle)' }}>
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => setShowNewNote(true)}>
            <Plus size={14} /> New Note
          </button>
        </div>
      </aside>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {selected ? <NoteEditor note={selected} onUpdate={handleUpdate} onRemove={handleRemove} /> : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><FileText size={24} style={{ color: 'var(--color-text-muted)' }} /></div>
              <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Select or create a note.</p>
            </div>
          </div>
        )}
      </div>
      {showNewNote && <NewNoteModal folders={noteFolders} onClose={() => setShowNewNote(false)} onSave={handleAddNote} />}
    </div>
  );
}

function NoteEditor({ note, onUpdate, onRemove }) {
  const [body, setBody] = useState(note.body || '');
  const [title, setTitle] = useState(note.title);
  React.useEffect(() => { setBody(note.body || ''); setTitle(note.title); }, [note.id]);
  const handleSave = () => onUpdate(note.id, { title, body });
  return (
    <article style={{ maxWidth: 800, margin: '0 auto', padding: '24px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--color-border-subtle)' }}>
        <button className="btn btn-ghost btn-sm" onClick={handleSave} style={{ color: 'var(--color-success)' }}><Download size={13} /> Save</button>
        <div style={{ flex: 1 }} />
        <button className="btn-ghost btn-icon" style={{ width: 28, height: 28, color: 'var(--color-danger)' }} onClick={() => { if (confirm('Delete this note?')) onRemove(note.id); }}><Trash2 size={14} /></button>
      </div>
      <header style={{ marginBottom: 28 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} onBlur={handleSave} style={{ width: '100%', fontSize: 28, fontWeight: 700, color: 'var(--color-text-primary)', background: 'transparent', border: 'none', outline: 'none', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 8 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
          <Avatar name={note.updatedBy} size="xs" status="online" showStatus />
          <span>Last edited by <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{note.updatedBy}</span> · <span style={{ fontStyle: 'italic' }}>{formatRelative(note.updatedAt)}</span></span>
        </div>
      </header>
      <textarea value={body} onChange={e => setBody(e.target.value)} onBlur={handleSave} style={{ width: '100%', minHeight: 400, fontSize: 14, lineHeight: 1.7, color: 'var(--color-text-primary)', background: 'transparent', border: 'none', outline: 'none', resize: 'vertical', fontFamily: 'var(--font-sans)' }} />
    </article>
  );
}

function NewNoteModal({ folders, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState(folders[0]?.id || '');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>New Note</h2><button onClick={onClose} className="btn-ghost btn-icon" style={{ width: 28, height: 28 }}><X size={16} /></button></div>
        <form onSubmit={e => { e.preventDefault(); if (title.trim()) onSave({ title: title.trim(), folderId, body: '', hasDrawing: false }); }}>
          <div style={{ marginBottom: 12 }}><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Title</label><input className="input" placeholder="Note title" value={title} onChange={e => setTitle(e.target.value)} autoFocus /></div>
          {folders.length > 0 && <div style={{ marginBottom: 16 }}><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Folder</label><select className="input" value={folderId} onChange={e => setFolderId(e.target.value)}>{folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>}
          <div style={{ display: 'flex', gap: 8 }}><button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button><button type="submit" className="btn btn-primary" style={{ flex: 1 }}><Plus size={14} /> Create</button></div>
        </form>
      </div>
    </div>
  );
}
