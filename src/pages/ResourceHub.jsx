import React, { useState, useMemo, useRef } from 'react';
import { Link as LinkIcon, FileText, Code, Grid3X3, List, Search, Folder, Plus, X, Trash2, Upload, Image, Film, File, Download, ExternalLink, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatRelative } from '../lib/utils';
import { saveResource, deleteResource as deleteResourceFS, saveActivity, uploadResourceFile, deleteStorageFile } from '../lib/dataService';
import Avatar from '../components/Avatar';

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function getTypeIcon(resource) {
  if (resource.fileType?.startsWith('image/')) return Image;
  if (resource.fileType?.startsWith('video/')) return Film;
  if (resource.type === 'link') return LinkIcon;
  if (resource.type === 'snippet') return Code;
  return File;
}

function getTypeBg(resource) {
  if (resource.fileType?.startsWith('image/')) return { bg: 'var(--color-success-soft)', color: 'var(--color-success)' };
  if (resource.fileType?.startsWith('video/')) return { bg: 'var(--color-danger-soft)', color: 'var(--color-danger)' };
  if (resource.type === 'link') return { bg: 'var(--color-info-soft)', color: 'var(--color-info)' };
  if (resource.type === 'snippet') return { bg: 'var(--color-warning-soft)', color: 'var(--color-warning)' };
  return { bg: 'var(--color-accent-soft)', color: 'var(--color-accent)' };
}

export default function ResourceHub() {
  const { activeGroup, resources, addResource, removeResource, user, addNotification } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showNew, setShowNew] = useState(false);
  const [preview, setPreview] = useState(null);
  const groupId = activeGroup?.id;

  const [filterType, setFilterType] = useState('all');
  const [filterSection, setFilterSection] = useState('all');

  if (!activeGroup) {
    return (
      <div className="h-full flex items-center justify-center animate-fade-in">
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><Folder size={24} style={{ color: 'var(--color-text-muted)' }} /></div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>Resource Hub</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Join a group to access shared resources.</p>
        </div>
      </div>
    );
  }

  // Get unique categories for the section dropdown
  const allCategories = useMemo(() => {
    const cats = new Set(resources.map(r => r.category || 'General'));
    return Array.from(cats);
  }, [resources]);

  const filtered = useMemo(() => {
    let items = resources;
    // Type filter
    if (filterType !== 'all') {
      items = items.filter(r => {
        if (filterType === 'file') return r.type === 'file' || r.type === 'image' || r.type === 'video';
        if (filterType === 'link') return r.type === 'link';
        if (filterType === 'text') return r.type === 'snippet';
        return true;
      });
    }
    // Section filter
    if (filterSection !== 'all') {
      items = items.filter(r => (r.category || 'General') === filterSection);
    }
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(r => r.title?.toLowerCase().includes(q) || r.category?.toLowerCase().includes(q) || r.fileName?.toLowerCase().includes(q));
    }
    return items;
  }, [resources, filterType, filterSection, searchQuery]);

  const byCategory = useMemo(() => {
    const map = {};
    filtered.forEach(r => (map[r.category || 'General'] ||= []).push(r));
    return map;
  }, [filtered]);

  const handleAdd = async (res) => {
    const full = { ...res, addedByName: user?.name || 'You' };
    if (groupId) {
      await saveResource(groupId, full);
      await saveActivity(groupId, { kind: 'resource_added', actorName: user?.name || 'You', target: res.title || res.fileName, at: new Date().toISOString() });
    } else addResource(full);
    addNotification({ title: 'Resource Added', message: `"${res.title || res.fileName}" added`, type: 'info', section: 'Resources' });
    setShowNew(false);
  };

  const handleRemove = async (id) => {
    const res = resources.find(r => r.id === id);
    if (groupId) {
      if (res?.storagePath) await deleteStorageFile(res.storagePath);
      await deleteResourceFS(groupId, id);
    } else removeResource(id);
    addNotification({ title: 'Resource Removed', message: `"${res?.title || res?.fileName || 'A resource'}" removed`, type: 'alert', section: 'Resources' });
  };

  return (
    <div className="h-full overflow-y-auto animate-fade-in" style={{ padding: '24px 32px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* ── Filter Bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {/* Type dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Type:</span>
            <select
              className="input"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              style={{ width: 120, height: 32, fontSize: 12 }}
            >
              <option value="all">All Types</option>
              <option value="text">Text / Snippet</option>
              <option value="file">File</option>
              <option value="link">Link</option>
            </select>
          </div>

          {/* Section dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Section:</span>
            <select
              className="input"
              value={filterSection}
              onChange={e => setFilterSection(e.target.value)}
              style={{ width: 140, height: 32, fontSize: 12 }}
            >
              <option value="all">All Sections</option>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ flex: 1 }} />
          <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}><Plus size={14} /> Add Resource</button>
        </div>

        {Object.entries(byCategory).map(([category, items]) => (
          <section key={category} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Folder size={14} style={{ color: 'var(--color-text-muted)' }} />
              <h3 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--color-text-muted)' }}>{category}</h3>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border-subtle)' }} />
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-disabled)' }}>{items.length}</span>
            </div>
            {viewMode === 'grid' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {items.map(r => <ResourceCard key={r.id} resource={r} onRemove={handleRemove} onPreview={setPreview} />)}
              </div>
            ) : (
              <div className="card-flat" style={{ overflow: 'hidden', borderRadius: 12 }}>
                {items.map((r, i) => <ResourceRow key={r.id} resource={r} onRemove={handleRemove} onPreview={setPreview} isLast={i === items.length - 1} />)}
              </div>
            )}
          </section>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><LinkIcon size={24} style={{ color: 'var(--color-text-muted)' }} /></div>
            <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>{searchQuery ? 'No resources match your search.' : 'No resources yet. Add links, files, and more.'}</p>
          </div>
        )}
      </div>

      {showNew && <NewResourceModal groupId={groupId} onClose={() => setShowNew(false)} onSave={handleAdd} />}
      {preview && <PreviewModal resource={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function ResourceCard({ resource, onRemove, onPreview }) {
  const Icon = getTypeIcon(resource);
  const { bg, color } = getTypeBg(resource);
  const isImage = resource.fileType?.startsWith('image/');
  const isVideo = resource.fileType?.startsWith('video/');

  return (
    <div className="card group" style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => resource.url && (isImage || isVideo ? onPreview(resource) : window.open(resource.url, '_blank'))}>
      {/* Thumbnail for images */}
      {isImage && resource.url && (
        <div style={{ height: 140, overflow: 'hidden', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <img src={resource.url} alt={resource.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      {isVideo && resource.url && (
        <div style={{ height: 140, overflow: 'hidden', borderBottom: '1px solid var(--color-border-subtle)', position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Film size={32} style={{ color: 'rgba(255,255,255,0.5)' }} />
          <div style={{ position: 'absolute', bottom: 6, right: 8, fontSize: 9, color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4 }}>Video</div>
        </div>
      )}
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={16} style={{ color }} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resource.title || resource.fileName}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)' }}>{resource.type || 'file'}</span>
              {resource.fileSize && <span style={{ fontSize: 9, color: 'var(--color-text-disabled)', fontFamily: 'var(--font-mono)' }}>{formatFileSize(resource.fileSize)}</span>}
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onRemove(resource.id); }} className="btn-ghost btn-icon" style={{ width: 24, height: 24, color: 'var(--color-danger)', opacity: 0 }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}><Trash2 size={12} /></button>
        </div>
        {resource.body && (<p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', padding: 8, background: 'var(--color-bg-tertiary)', borderRadius: 6, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{resource.body}</p>)}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <Avatar name={resource.addedByName} size="xs" />
          <span style={{ fontSize: 10, color: 'var(--color-text-disabled)', fontStyle: 'italic', flex: 1 }}>{resource.addedByName} · {formatRelative(resource.addedAt)}</span>
          {resource.url && <ExternalLink size={12} style={{ color: 'var(--color-text-disabled)' }} />}
        </div>
      </div>
    </div>
  );
}

function ResourceRow({ resource, onRemove, onPreview, isLast }) {
  const Icon = getTypeIcon(resource);
  const { color } = getTypeBg(resource);
  const isMedia = resource.fileType?.startsWith('image/') || resource.fileType?.startsWith('video/');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: !isLast ? '1px solid var(--color-border-subtle)' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
      className="hover:bg-[var(--color-bg-hover)]"
      onClick={() => resource.url && (isMedia ? onPreview(resource) : window.open(resource.url, '_blank'))}
    >
      <Icon size={15} style={{ color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resource.title || resource.fileName}</p></div>
      {resource.fileSize && <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-disabled)' }}>{formatFileSize(resource.fileSize)}</span>}
      <span style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--color-text-muted)', width: 50, textAlign: 'center' }}>{resource.type || 'file'}</span>
      <Avatar name={resource.addedByName} size="xs" />
      <span style={{ fontSize: 10, color: 'var(--color-text-disabled)', fontStyle: 'italic', flexShrink: 0, width: 60 }}>{formatRelative(resource.addedAt)}</span>
      <button onClick={(e) => { e.stopPropagation(); onRemove(resource.id); }} className="btn-ghost btn-icon" style={{ width: 24, height: 24, color: 'var(--color-danger)' }}><Trash2 size={12} /></button>
    </div>
  );
}

function PreviewModal({ resource, onClose }) {
  const isImage = resource.fileType?.startsWith('image/');
  const isVideo = resource.fileType?.startsWith('video/');
  return (
    <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{resource.title || resource.fileName}</p>
          <a href={resource.url} download target="_blank" style={{ color: 'white', opacity: 0.7 }}><Download size={16} /></a>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', opacity: 0.7 }}><X size={18} /></button>
        </div>
        {isImage && <img src={resource.url} alt={resource.title} style={{ maxWidth: '85vw', maxHeight: '80vh', borderRadius: 8, objectFit: 'contain' }} />}
        {isVideo && <video src={resource.url} controls autoPlay style={{ maxWidth: '85vw', maxHeight: '80vh', borderRadius: 8 }} />}
      </div>
    </div>
  );
}

function NewResourceModal({ groupId, onClose, onSave }) {
  const [tab, setTab] = useState('link');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [url, setUrl] = useState('');
  const [body, setBody] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!groupId) { setError('Join a group to upload files'); return; }

    setUploading(true);
    setProgress(0);
    setError('');
    try {
      const result = await uploadResourceFile(groupId, file, setProgress);
      onSave({
        title: title.trim() || file.name,
        type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
        category,
        url: result.url,
        storagePath: result.storagePath,
        fileName: result.fileName,
        fileSize: result.fileSize,
        fileType: result.fileType,
        addedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err.message || 'Upload failed');
    }
    setUploading(false);
  };

  const handleLinkSave = (e) => {
    e.preventDefault();
    if (!title.trim() && !url.trim()) return;
    onSave({
      title: title.trim() || url.trim(),
      type: tab === 'link' ? 'link' : 'snippet',
      category,
      url: tab === 'link' ? url.trim() : undefined,
      body: tab === 'snippet' ? body.trim() : undefined,
      addedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Add Resource</h2>
          <button onClick={onClose} className="btn-ghost btn-icon" style={{ width: 28, height: 28 }}><X size={16} /></button>
        </div>

        <div className="tab-group" style={{ marginBottom: 16 }}>
          {[
            { id: 'link', label: 'Link', icon: LinkIcon },
            { id: 'file', label: 'File Upload', icon: Upload },
            { id: 'snippet', label: 'Snippet', icon: Code },
          ].map(t => (
            <button key={t.id} className={`tab-item ${tab === t.id ? 'active' : ''}`} onClick={() => { setTab(t.id); setError(''); }} style={{ flex: 1, fontSize: 11, padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <t.icon size={12} /> {t.label}
            </button>
          ))}
        </div>

        {/* Common fields */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Title</label>
          <input className="input" placeholder="Resource name" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Category</label>
          <input className="input" placeholder="e.g. Design, Documents" value={category} onChange={e => setCategory(e.target.value)} />
        </div>

        {/* Link tab */}
        {tab === 'link' && (
          <form onSubmit={handleLinkSave}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>URL</label>
              <input className="input" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}><Plus size={14} /> Add Link</button>
            </div>
          </form>
        )}

        {/* File Upload tab */}
        {tab === 'file' && (
          <div>
            <input ref={fileRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.csv" style={{ display: 'none' }} onChange={handleFileUpload} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                width: '100%',
                padding: '28px 16px',
                border: '2px dashed var(--color-border-default)',
                borderRadius: 12,
                background: 'var(--color-bg-tertiary)',
                cursor: uploading ? 'default' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s',
              }}
              className="hover:bg-[var(--color-bg-hover)]"
            >
              {uploading ? (
                <>
                  <Loader2 size={24} style={{ color: 'var(--color-accent)' }} className="animate-spin" />
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Uploading... {progress}%</span>
                  <div style={{ width: '100%', height: 4, background: 'var(--color-bg-hover)', borderRadius: 2, overflow: 'hidden', maxWidth: 200 }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: 'var(--color-accent)', borderRadius: 2, transition: 'width 0.3s' }} />
                  </div>
                </>
              ) : (
                <>
                  <Upload size={24} style={{ color: 'var(--color-text-muted)' }} />
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Click to upload a file</span>
                  <span style={{ fontSize: 10, color: 'var(--color-text-disabled)' }}>Images, videos, PDFs, documents, and more</span>
                </>
              )}
            </button>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Snippet tab */}
        {tab === 'snippet' && (
          <form onSubmit={handleLinkSave}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Content</label>
              <textarea className="input" placeholder="Paste code or text..." value={body} onChange={e => setBody(e.target.value)} rows={4} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}><Plus size={14} /> Add Snippet</button>
            </div>
          </form>
        )}

        {error && <p style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 8 }}>{error}</p>}
      </div>
    </div>
  );
}
