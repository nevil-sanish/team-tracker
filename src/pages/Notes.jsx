import React, { useState, useMemo } from 'react';
import {
  Folder, FileText, PenTool, Type, Layers, Search, Plus, X,
  Bold, Italic, Underline, List, ListOrdered, Code, Link, Image,
  Undo2, Redo2, History, Download, Trash2, Clock, Pencil
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn, formatRelative } from '../lib/utils';
import Avatar from '../components/Avatar';

export default function Notes() {
  const { mode, notes, noteFolders, addNote, removeNote, updateNote, addNoteFolder, user } = useStore();

  const visibleNotes = useMemo(() =>
    notes.filter(n => mode === 'personal' ? !n.teamId : n.teamId === 'group'),
    [notes, mode]
  );

  const visibleFolders = useMemo(() =>
    noteFolders.filter(f => mode === 'personal' ? !f.teamId : f.teamId === 'group'),
    [noteFolders, mode]
  );

  const [selectedId, setSelectedId] = useState(visibleNotes[0]?.id ?? null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(() => {
    const init = {};
    visibleFolders.forEach(f => init[f.id] = true);
    return init;
  });
  const [showNewNote, setShowNewNote] = useState(false);

  const selected = visibleNotes.find(n => n.id === selectedId) ?? visibleNotes[0];

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return visibleNotes;
    const q = searchQuery.toLowerCase();
    return visibleNotes.filter(n =>
      n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
    );
  }, [visibleNotes, searchQuery]);

  return (
    <div className="h-full flex animate-fade-in" style={{ overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col" style={{
        width: 280,
        borderRight: '1px solid var(--color-border-subtle)',
        background: 'var(--color-bg-secondary)',
        flexShrink: 0,
      }}>
        {/* Search */}
        <div style={{ padding: 12, borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-disabled)' }} />
            <input
              className="input"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 32, height: 30, fontSize: 11 }}
            />
          </div>
        </div>

        {/* Folders + Notes */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {visibleFolders.map(f => {
            const folderNotes = filteredNotes.filter(n => n.folderId === f.id);
            const isExpanded = expandedFolders[f.id] ?? true;
            if (searchQuery && folderNotes.length === 0) return null;
            return (
              <div key={f.id} style={{ marginBottom: 8 }}>
                <button
                  onClick={() => setExpandedFolders(s => ({ ...s, [f.id]: !isExpanded }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    width: '100%',
                    padding: '4px 8px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    transition: 'color 0.15s',
                  }}
                  className="hover:text-[var(--color-text-primary)]"
                >
                  <span style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s', fontSize: 8 }}>▶</span>
                  <Folder size={13} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{f.name}</span>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)' }}>{folderNotes.length}</span>
                </button>
                {isExpanded && (
                  <div style={{ marginLeft: 12, marginTop: 2 }}>
                    {folderNotes.map(n => (
                      <button
                        key={n.id}
                        onClick={() => setSelectedId(n.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 8,
                          width: '100%',
                          padding: '8px 10px',
                          background: selected?.id === n.id ? 'var(--color-bg-elevated)' : 'transparent',
                          border: selected?.id === n.id ? '1px solid var(--color-border-default)' : '1px solid transparent',
                          borderRadius: 8,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                          marginBottom: 2,
                        }}
                        className="hover:bg-[var(--color-bg-hover)]"
                      >
                        {n.hasDrawing ? (
                          <PenTool size={14} style={{ marginTop: 2, color: 'var(--color-accent)', flexShrink: 0 }} />
                        ) : (
                          <FileText size={14} style={{ marginTop: 2, color: 'var(--color-text-muted)', flexShrink: 0 }} />
                        )}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {n.title}
                          </p>
                          <p style={{ fontSize: 10, color: 'var(--color-text-disabled)', fontStyle: 'italic', marginTop: 2 }}>
                            {n.updatedBy} · {formatRelative(n.updatedAt)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* New Note/Folder */}
        <div style={{ padding: 8, borderTop: '1px solid var(--color-border-subtle)' }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={() => setShowNewNote(true)}
          >
            <Plus size={14} /> New Note
          </button>
        </div>
      </aside>

      {/* Editor */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {selected ? <NoteEditor note={selected} onUpdate={updateNote} onRemove={removeNote} /> : <EmptyState />}
      </div>

      {showNewNote && (
        <NewNoteModal
          folders={visibleFolders}
          mode={mode}
          onClose={() => setShowNewNote(false)}
          onSave={(note) => {
            addNote({ ...note, teamId: mode === 'group' ? 'group' : null, updatedBy: user?.name || 'You' });
            setShowNewNote(false);
          }}
        />
      )}
    </div>
  );
}

/* ── Note Editor ── */
function NoteEditor({ note, onUpdate, onRemove }) {
  const [showVersions, setShowVersions] = useState(false);
  const [editorMode, setEditorMode] = useState(note.hasDrawing ? 'mixed' : 'write');
  const [body, setBody] = useState(note.body);
  const [title, setTitle] = useState(note.title);

  // Sync when note changes
  React.useEffect(() => {
    setBody(note.body);
    setTitle(note.title);
    setEditorMode(note.hasDrawing ? 'mixed' : 'write');
  }, [note.id]);

  const handleSave = () => {
    onUpdate(note.id, { title, body });
  };

  return (
    <article style={{ maxWidth: 800, margin: '0 auto', padding: '24px 32px' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
        paddingBottom: 14,
        borderBottom: '1px solid var(--color-border-subtle)',
        flexWrap: 'wrap',
      }}>
        {/* Mode tabs */}
        <div className="tab-group" style={{ marginRight: 8 }}>
          {[
            { key: 'write', icon: Type, label: 'Write' },
            { key: 'draw', icon: PenTool, label: 'Draw' },
            { key: 'mixed', icon: Layers, label: 'Mixed' },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              className={`tab-item ${editorMode === key ? 'active' : ''}`}
              onClick={() => setEditorMode(key)}
              style={{ fontSize: 11, padding: '4px 10px' }}
            >
              <Icon size={12} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} /> {label}
            </button>
          ))}
        </div>

        {/* Formatting tools */}
        {editorMode !== 'draw' && (
          <>
            <div style={{ display: 'flex', gap: 1, borderRight: '1px solid var(--color-border-subtle)', paddingRight: 8 }}>
              {[Bold, Italic, Underline].map((Icon, i) => (
                <button key={i} className="btn-ghost btn-icon" style={{ width: 26, height: 26 }}>
                  <Icon size={13} />
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 1, borderRight: '1px solid var(--color-border-subtle)', paddingRight: 8 }}>
              {[List, ListOrdered, Code].map((Icon, i) => (
                <button key={i} className="btn-ghost btn-icon" style={{ width: 26, height: 26 }}>
                  <Icon size={13} />
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 1 }}>
              {[Link, Image].map((Icon, i) => (
                <button key={i} className="btn-ghost btn-icon" style={{ width: 26, height: 26 }}>
                  <Icon size={13} />
                </button>
              ))}
            </div>
          </>
        )}

        <div style={{ display: 'flex', gap: 1, marginLeft: 4 }}>
          <button className="btn-ghost btn-icon" style={{ width: 26, height: 26 }}><Undo2 size={13} /></button>
          <button className="btn-ghost btn-icon" style={{ width: 26, height: 26 }}><Redo2 size={13} /></button>
        </div>

        <div style={{ flex: 1 }} />

        <button className="btn btn-ghost btn-sm" onClick={() => setShowVersions(!showVersions)}>
          <History size={13} /> {note.versions} versions
        </button>
        <button className="btn btn-ghost btn-sm" onClick={handleSave} style={{ color: 'var(--color-success)' }}>
          <Download size={13} /> Save
        </button>
        <button
          className="btn-ghost btn-icon"
          style={{ width: 28, height: 28, color: 'var(--color-danger)' }}
          onClick={() => { if (confirm('Delete this note?')) onRemove(note.id); }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Version history */}
      {showVersions && (
        <div className="card-flat animate-slide-in" style={{ padding: 14, marginBottom: 20 }}>
          <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginBottom: 10 }}>
            Version History
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Array.from({ length: Math.min(note.versions, 5) }, (_, i) => {
              const d = new Date(note.updatedAt);
              d.setHours(d.getHours() - i * 3);
              return (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 10px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }} className="hover:bg-[var(--color-bg-hover)]">
                  <Clock size={13} style={{ color: 'var(--color-text-muted)' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>
                      {i === 0 ? 'Current version' : `Version ${note.versions - i}`}
                    </p>
                    <p style={{ fontSize: 10, color: 'var(--color-text-disabled)', fontStyle: 'italic' }}>
                      {formatRelative(d.toISOString())} by {note.updatedBy}
                    </p>
                  </div>
                  {i > 0 && (
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: '2px 8px', height: 22 }}>
                      Restore
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Note header */}
      <header style={{ marginBottom: 28 }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleSave}
          style={{
            width: '100%',
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            marginBottom: 8,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
          <Avatar name={note.updatedBy} size="xs" status="online" showStatus />
          <span>
            Last edited by <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{note.updatedBy}</span>
            {' · '}<span style={{ fontStyle: 'italic' }}>{formatRelative(note.updatedAt)}</span>
          </span>
        </div>
      </header>

      {/* Drawing canvas */}
      {(editorMode === 'draw' || editorMode === 'mixed') && (
        <div style={{
          marginBottom: 24,
          borderRadius: 12,
          border: '2px dashed var(--color-border-default)',
          background: 'var(--color-bg-tertiary)',
          aspectRatio: '2 / 1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color 0.2s',
        }} className="hover:border-[var(--color-accent)]">
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'var(--color-accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              <Pencil size={24} style={{ color: 'var(--color-accent)' }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>Drawing Canvas</p>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', maxWidth: 260 }}>
              Click to open whiteboard for sketches and diagrams
            </p>
          </div>
        </div>
      )}

      {/* Text content */}
      {(editorMode === 'write' || editorMode === 'mixed') && (
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          onBlur={handleSave}
          style={{
            width: '100%',
            minHeight: 400,
            fontSize: 14,
            lineHeight: 1.7,
            color: 'var(--color-text-primary)',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'var(--font-sans)',
          }}
        />
      )}
    </article>
  );
}

function EmptyState() {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <FileText size={24} style={{ color: 'var(--color-text-muted)' }} />
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Select a note to read or edit.</p>
      </div>
    </div>
  );
}

function NewNoteModal({ folders, mode, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState(folders[0]?.id || '');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>New Note</h2>
          <button onClick={onClose} className="btn-ghost btn-icon" style={{ width: 28, height: 28 }}><X size={16} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); if (title.trim()) onSave({ title: title.trim(), folderId, body: '', hasDrawing: false }); }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Title</label>
            <input className="input" placeholder="Note title" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Folder</label>
            <select className="input" value={folderId} onChange={e => setFolderId(e.target.value)}>
              {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}><Plus size={14} /> Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}
