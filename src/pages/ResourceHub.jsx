import React, { useState, useMemo } from 'react';
import { Link as LinkIcon, FileText, Code, Search, Grid3X3, List, ExternalLink, Copy, Folder, Plus, X, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn, formatRelative } from '../lib/utils';
import Avatar from '../components/Avatar';

export default function ResourceHub() {
  const { mode, group, resources, addResource, removeResource, user } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showNew, setShowNew] = useState(false);

  const teamResources = useMemo(() => resources.filter(r => r.teamId === 'group'), [resources]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return teamResources;
    const q = searchQuery.toLowerCase();
    return teamResources.filter(r =>
      r.title.toLowerCase().includes(q) || r.category.toLowerCase().includes(q) || r.body?.toLowerCase().includes(q)
    );
  }, [teamResources, searchQuery]);

  const byCategory = useMemo(() => {
    const map = {};
    filtered.forEach(r => (map[r.category] ||= []).push(r));
    return map;
  }, [filtered]);

  if (mode === 'personal') {
    return (
      <div className="h-full flex items-center justify-center animate-fade-in">
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Folder size={24} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>Resource Hub</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Switch to Group mode to access shared resources.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto animate-fade-in" style={{ padding: '24px 32px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Search + View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-disabled)' }} />
            <input
              className="input"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 36, height: 36 }}
            />
          </div>
          <div className="tab-group">
            <button className={`tab-item ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} style={{ padding: 6 }}>
              <Grid3X3 size={15} />
            </button>
            <button className={`tab-item ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} style={{ padding: 6 }}>
              <List size={15} />
            </button>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}>
            <Plus size={14} /> Add Resource
          </button>
        </div>

        {/* Resources by Category */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {Object.entries(byCategory).map(([category, items]) => (
            <section key={category}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Folder size={14} style={{ color: 'var(--color-text-muted)' }} />
                <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--color-text-muted)' }}>
                  {category}
                </h3>
                <div style={{ flex: 1, height: 1, background: 'var(--color-border-subtle)' }} />
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-disabled)' }}>{items.length}</span>
              </div>

              {viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {items.map(r => {
                    const Icon = r.type === 'link' ? LinkIcon : r.type === 'doc' ? FileText : Code;
                    const iconBg = r.type === 'link' ? 'var(--color-info-soft)' : r.type === 'doc' ? 'var(--color-warning-soft)' : 'var(--color-danger-soft)';
                    const iconColor = r.type === 'link' ? 'var(--color-info)' : r.type === 'doc' ? 'var(--color-warning)' : 'var(--color-danger)';
                    return (
                      <div key={r.id} className="card group" style={{ padding: 14, cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={16} style={{ color: iconColor }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</p>
                            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginTop: 1 }}>{r.type}</p>
                          </div>
                          <ExternalLink size={13} style={{ color: 'var(--color-text-muted)', opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }} className="group-hover:opacity-100" />
                        </div>
                        {r.body && (
                          <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', padding: 8, background: 'var(--color-bg-tertiary)', borderRadius: 6, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {r.body}
                          </p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                          <Avatar name={r.addedByName} size="xs" />
                          <span style={{ fontSize: 10, color: 'var(--color-text-disabled)', fontStyle: 'italic' }}>
                            {r.addedByName} · {formatRelative(r.addedAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="card-flat" style={{ overflow: 'hidden' }}>
                  {items.map((r, i) => {
                    const Icon = r.type === 'link' ? LinkIcon : r.type === 'doc' ? FileText : Code;
                    return (
                      <div key={r.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                        borderBottom: i < items.length - 1 ? '1px solid var(--color-border-subtle)' : 'none',
                        cursor: 'pointer', transition: 'background 0.15s',
                      }} className="hover:bg-[var(--color-bg-hover)]">
                        <Icon size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</p>
                          {r.body && <p style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.body}</p>}
                        </div>
                        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>{r.type}</span>
                        <Avatar name={r.addedByName} size="xs" />
                        <span style={{ fontSize: 10, color: 'var(--color-text-disabled)', fontStyle: 'italic', flexShrink: 0 }}>{formatRelative(r.addedAt)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <LinkIcon size={24} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              {searchQuery ? 'No resources match your search.' : 'No resources yet. Add links, documents, and snippets.'}
            </p>
          </div>
        )}
      </div>

      {showNew && (
        <NewResourceModal
          onClose={() => setShowNew(false)}
          onSave={(res) => {
            addResource({ ...res, teamId: 'group', addedByName: user?.name || 'You' });
            setShowNew(false);
          }}
        />
      )}
    </div>
  );
}

function NewResourceModal({ onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('link');
  const [category, setCategory] = useState('General');
  const [url, setUrl] = useState('');
  const [body, setBody] = useState('');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Add Resource</h2>
          <button onClick={onClose} className="btn-ghost btn-icon" style={{ width: 28, height: 28 }}><X size={16} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); if (title.trim()) onSave({ title: title.trim(), type, category, url: url.trim() || undefined, body: body.trim() || undefined }); }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Title</label>
            <input className="input" placeholder="Resource name" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Type</label>
              <select className="input" value={type} onChange={e => setType(e.target.value)}>
                <option value="link">Link</option>
                <option value="doc">Document</option>
                <option value="snippet">Snippet</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Category</label>
              <input className="input" placeholder="e.g. Design, API" value={category} onChange={e => setCategory(e.target.value)} />
            </div>
          </div>
          {type === 'link' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>URL</label>
              <input className="input" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
            </div>
          )}
          {type === 'snippet' && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Content</label>
              <textarea className="input" placeholder="Paste snippet..." value={body} onChange={e => setBody(e.target.value)} rows={3} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}><Plus size={14} /> Add</button>
          </div>
        </form>
      </div>
    </div>
  );
}
