import React, { useState, useMemo, useRef } from 'react';
import { Link as LinkIcon, FileText, Code, Folder, Plus, X, Trash2, Upload, Image, Film, File, Download, ExternalLink, Loader2, ChevronDown, Filter } from 'lucide-react';
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
  const [filterType, setFilterType] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [preview, setPreview] = useState(null);
  const groupId = activeGroup?.id;

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

  // Get unique categories/sections
  const sections = useMemo(() => {
    const s = new Set(resources.map(r => r.category || 'General'));
    return Array.from(s);
  }, [resources]);

  // Filter by type and section
  const filtered = useMemo(() => {
    let items = [...resources];
    if (filterType !== 'all') {
      if (filterType === 'text') items = items.filter(r => r.type === 'snippet');
      else if (filterType === 'file') items = items.filter(r => r.type === 'file' || r.fileType);
      else if (filterType === 'link') items = items.filter(r => r.type === 'link');
    }
    if (filterSection !== 'all') {
      items = items.filter(r => (r.category || 'General') === filterSection);
    }
    return items;
  }, [resources, filterType, filterSection]);

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
    <div className="h-full flex flex-col animate-fade-in">
      {/* Top Bar — Type dropdown + Section dropdown */}
      <div className="flex items-center gap-3 px-6 py-3" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        {/* Type filter dropdown */}
        <div style={{ position: 'relative' }}>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="input"
            style={{ paddingRight: 28, fontSize: 12, height: 32, minWidth: 140, appearance: 'none', cursor: 'pointer' }}
          >
            <option value="all">All Types</option>
            <option value="text">Text / Snippets</option>
            <option value="file">Files</option>
            <option value="link">Links</option>
          </select>
          <ChevronDown size={13} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)' }} />
        </div>

        {/* Section filter dropdown */}
        <div style={{ position: 'relative' }}>
          <select
            value={filterSection}
            onChange={e => setFilterSection(e.target.value)}
            className="input"
            style={{ paddingRight: 28, fontSize: 12, height: 32, minWidth: 140, appearance: 'none', cursor: 'pointer' }}
          >
            <option value="all">All Sections</option>
            {sections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={13} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--color-text-muted)' }} />
        </div>

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
          {filtered.length} resources
        </span>

        <button className="btn btn-primary btn-sm" onClick={() => setShowNew(true)}><Plus size={14} /> Add Resource</button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><LinkIcon size={24} style={{ color: 'var(--color-text-muted)' }} /></div>
              <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No resources match your filters.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(r => {
                const Icon = getTypeIcon(r);
                const { bg, color } = getTypeBg(r);
                const isImage = r.fileType?.startsWith('image/');
                const isVideo = r.fileType?.startsWith('video/');
                const isMedia = isImage || isVideo;

                return (
                  <div
                    key={r.id}
                    className="card"
                    style={{
                      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                      cursor: r.url ? 'pointer' : 'default', transition: 'all 0.15s',
                    }}
                    onClick={() => r.url && (isMedia ? setPreview(r) : window.open(r.url, '_blank'))}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} style={{ color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.title || r.fileName}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, fontSize: 11, color: 'var(--color-text-muted)' }}>
                        <span style={{ textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.08em' }}>{r.type || 'file'}</span>
                        {r.fileSize && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{formatFileSize(r.fileSize)}</span>}
                        {r.category && <span>· {r.category}</span>}
                      </div>
                    </div>
                    {/* Uploader info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <Avatar name={r.addedByName} size="xs" />
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{r.addedByName}</span>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--color-text-disabled)', fontStyle: 'italic', flexShrink: 0 }}>
                      {formatRelative(r.addedAt)}
                    </span>
                    {r.url && <ExternalLink size={12} style={{ color: 'var(--color-text-disabled)', flexShrink: 0 }} />}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemove(r.id); }}
                      className="btn-ghost btn-icon"
                      style={{ width: 24, height: 24, color: 'var(--color-danger)', flexShrink: 0 }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showNew && <NewResourceModal groupId={groupId} onClose={() => setShowNew(false)} onSave={handleAdd} />}
      {preview && <PreviewModal resource={preview} onClose={() => setPreview(null)} />}
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
    setUploading(true); setProgress(0); setError('');
    try {
      const result = await uploadResourceFile(groupId, file, setProgress);
      onSave({
        title: title.trim() || file.name,
        type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file',
        category, url: result.url, storagePath: result.storagePath,
        fileName: result.fileName, fileSize: result.fileSize, fileType: result.fileType,
        addedAt: new Date().toISOString(),
      });
    } catch (err) { setError(err.message || 'Upload failed'); }
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

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Title</label>
          <input className="input" placeholder="Resource name" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Section</label>
          <input className="input" placeholder="e.g. Design, Documents" value={category} onChange={e => setCategory(e.target.value)} />
        </div>

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

        {tab === 'file' && (
          <div>
            <input ref={fileRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.csv" style={{ display: 'none' }} onChange={handleFileUpload} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                width: '100%', padding: '28px 16px',
                border: '2px dashed var(--color-border-default)', borderRadius: 12,
                background: 'var(--color-bg-tertiary)', cursor: uploading ? 'default' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'all 0.2s',
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
