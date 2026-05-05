import React, { useState, useMemo, useRef } from 'react';
import { Link as LinkIcon, FileText, Code, Folder, Plus, X, Trash2, Upload, Image, Film, File, Download, ExternalLink, Loader2, ChevronDown, Filter, Search, Edit2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatRelative } from '../lib/utils';
import { saveResource, deleteResource as deleteResourceFS, saveActivity, uploadResourceFile, deleteStorageFile, saveResourceFolder, deleteResourceFolder } from '../lib/dataService';
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
  const { activeGroup, resources, addResource, removeResource, user, addNotification, resourceFolders } = useStore();
  const [showNew, setShowNew] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [preview, setPreview] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [editingResource, setEditingResource] = useState(null);
  const groupId = activeGroup?.id;

  const folders = resourceFolders || [];
  const activeFolderId = selectedFolderId || (folders.length > 0 ? folders[0].id : null);
  const activeFolder = folders.find(f => f.id === activeFolderId);
  const activeFolderName = activeFolder?.name || 'General';

  const filtered = useMemo(() => {
    let items = resources.filter(r => (r.category || 'General') === activeFolderName);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(r => (r.title || r.fileName || '').toLowerCase().includes(q));
    }
    return items;
  }, [resources, activeFolderName, searchQuery]);

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

  const handleAdd = async (res) => {
    const isUpdate = !!res.id;
    const full = { ...res, addedByName: user?.name || 'You' };
    if (groupId) {
      await saveResource(groupId, full);
      if (!isUpdate) {
        await saveActivity(groupId, { kind: 'resource_added', actorName: user?.name || 'You', target: res.title || res.fileName, at: new Date().toISOString() });
      }
    } else {
      // For local development without active group saving
      addResource(full);
    }
    addNotification({ title: isUpdate ? 'Resource Updated' : 'Resource Added', message: `"${res.title || res.fileName}" ${isUpdate ? 'updated' : 'added'}`, type: 'info', section: 'Resources' });
    setShowNew(false);
    setEditingResource(null);
  };

  const handleRemove = async (id) => {
    const res = resources.find(r => r.id === id);
    if (groupId) {
      if (res?.storagePath) await deleteStorageFile(res.storagePath);
      await deleteResourceFS(groupId, id);
    } else removeResource(id);
    addNotification({ title: 'Resource Removed', message: `"${res?.title || res?.fileName || 'A resource'}" removed`, type: 'alert', section: 'Resources' });
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim() || !groupId) return;
    try {
      await saveResourceFolder(groupId, { name: newFolderName.trim() });
      setNewFolderName('');
      setShowNewFolder(false);
      addNotification({ title: 'Folder Created', message: `Folder "${newFolderName.trim()}" created`, type: 'success', section: 'Resources' });
    } catch (e) {}
  };

  const handleDeleteFolder = async (folder) => {
    if (folder.name === 'General') return;
    if (window.confirm(`Delete folder "${folder.name}"?`)) {
      if (groupId) await deleteResourceFolder(groupId, folder.id);
      if (activeFolderId === folder.id) setSelectedFolderId(null);
    }
  };

  const links = filtered.filter(r => r.type === 'link');
  const snippets = filtered.filter(r => r.type === 'snippet');
  const files = filtered.filter(r => r.type !== 'link' && r.type !== 'snippet');

  const toggleSnippet = (id) => {
    setExpandedFolders(s => ({ ...s, [`snippet_${id}`]: !s[`snippet_${id}`] }));
  };

  return (
    <div className="h-full flex animate-fade-in" style={{ overflow: 'hidden' }}>
      <aside className="hidden md:flex flex-col" style={{ width: 280, borderRight: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-secondary)', flexShrink: 0 }}>
        <div style={{ padding: 12, borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-disabled)' }} />
            <input className="input" placeholder="Search resources..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 32, height: 30, fontSize: 11 }} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }} onClick={() => setShowNew(true)}>
            <Plus size={14} /> Add Resource
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Folders</span>
            <button onClick={() => setShowNewFolder(true)} className="btn-ghost btn-icon" style={{ width: 20, height: 20, color: 'var(--color-text-muted)' }}>
              <Plus size={12} />
            </button>
          </div>
          {showNewFolder && (
            <div style={{ padding: '0 8px', marginBottom: 8 }}>
              <input
                autoFocus
                className="input"
                style={{ fontSize: 11, padding: '4px 8px', height: 24, marginBottom: 4 }}
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddFolder();
                  if (e.key === 'Escape') setShowNewFolder(false);
                }}
                onBlur={() => { if (!newFolderName.trim()) setShowNewFolder(false); }}
                placeholder="Folder name..."
              />
            </div>
          )}
          {folders.map(folder => (
            <div key={folder.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
              <button onClick={() => setSelectedFolderId(folder.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, padding: '8px 10px', background: activeFolderId === folder.id ? 'var(--color-bg-elevated)' : 'transparent', border: activeFolderId === folder.id ? '1px solid var(--color-border-default)' : '1px solid transparent', borderRadius: 8, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }} className="hover:bg-[var(--color-bg-hover)]">
                <Folder size={14} style={{ color: activeFolderId === folder.id ? 'var(--color-accent)' : 'var(--color-text-muted)', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: activeFolderId === folder.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</span>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--color-text-disabled)' }}>{resources.filter(r => (r.category || 'General') === folder.name).length}</span>
              </button>
              {folder.name !== 'General' && activeFolderId === folder.id && (
                <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder); }} className="btn-ghost btn-icon" style={{ width: 24, height: 24, color: 'var(--color-danger)', marginLeft: 4 }}>
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-bg-primary)' }}>
         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid var(--color-border-subtle)', flexShrink: 0 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>{activeFolderName}</h2>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{filtered.length} resources</p>
            </div>
         </div>
         
         <div style={{ flex: 1, padding: 24, overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 24, height: '100%', minWidth: 600 }}>
              
              {/* Column 1: Links */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-bg-secondary)', borderRadius: 12, border: '1px solid var(--color-border-subtle)', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-elevated)' }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>Links</h3>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {links.length === 0 ? <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', padding: 24 }}>No links</p> : links.map(r => (
                    <div key={r.id} className="card group" style={{ padding: 12, position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                        <button onClick={() => setEditingResource(r)} className="btn-ghost btn-icon" style={{ width: 24, height: 24, color: 'var(--color-text-muted)' }}><Edit2 size={12}/></button>
                        <button onClick={() => handleRemove(r.id)} className="btn-ghost btn-icon" style={{ width: 24, height: 24, color: 'var(--color-danger)' }}><Trash2 size={12}/></button>
                      </div>
                      <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4, paddingRight: 50 }}>{r.title}</h4>
                      <a href={/^https?:\/\//i.test(r.url) ? r.url : `https://${r.url}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--color-info)', textDecoration: 'underline', wordBreak: 'break-all', display: 'block', marginBottom: 8 }}>{r.url}</a>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Avatar name={r.addedByName} size="xs" />
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{r.addedByName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 3: Snippets */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-bg-secondary)', borderRadius: 12, border: '1px solid var(--color-border-subtle)', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-elevated)' }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>Snippets</h3>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {snippets.length === 0 ? <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', padding: 24 }}>No snippets</p> : snippets.map(r => {
                    const isExpanded = expandedFolders[`snippet_${r.id}`];
                    return (
                      <div key={r.id} className="card group" style={{ padding: 12, position: 'relative', cursor: 'pointer' }} onClick={() => toggleSnippet(r.id)}>
                        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                          <button onClick={(e) => { e.stopPropagation(); setEditingResource(r); }} className="btn-ghost btn-icon" style={{ width: 24, height: 24, color: 'var(--color-text-muted)' }}><Edit2 size={12}/></button>
                          <button onClick={(e) => { e.stopPropagation(); handleRemove(r.id); }} className="btn-ghost btn-icon" style={{ width: 24, height: 24, color: 'var(--color-danger)' }}><Trash2 size={12}/></button>
                        </div>
                        <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8, paddingRight: 50 }}>{r.title}</h4>
                        <pre style={{ fontSize: 11, fontFamily: 'var(--font-mono)', background: 'var(--color-bg-tertiary)', padding: 8, borderRadius: 6, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', maxHeight: isExpanded ? 'none' : 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.body}
                        </pre>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                          <Avatar name={r.addedByName} size="xs" />
                          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{r.addedByName}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
         </div>
      </div>

      {(showNew || editingResource) && <NewResourceModal groupId={groupId} onClose={() => { setShowNew(false); setEditingResource(null); }} onSave={handleAdd} defaultCategory={activeFolderName} folders={folders} initialData={editingResource} />}
      {preview && <PreviewModal resource={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function PreviewModal({ resource, onClose }) {
  const isImage = resource.fileType?.startsWith('image/');
  const isVideo = resource.fileType?.startsWith('video/');
  return (
    <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(0,0,0,0.85)', zIndex: 999 }}>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{resource.title || resource.fileName}</p>
          <a href={resource.url} download target="_blank" rel="noreferrer" style={{ color: 'white', opacity: 0.7 }}><Download size={16} /></a>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', opacity: 0.7 }}><X size={18} /></button>
        </div>
        {isImage && <img src={resource.url} alt={resource.title} style={{ maxWidth: '85vw', maxHeight: '80vh', borderRadius: 8, objectFit: 'contain' }} />}
        {isVideo && <video src={resource.url} controls autoPlay style={{ maxWidth: '85vw', maxHeight: '80vh', borderRadius: 8 }} />}
      </div>
    </div>
  );
}

function NewResourceModal({ groupId, onClose, onSave, defaultCategory, folders = [], initialData = null }) {
  const isEditing = !!initialData;
  const initialTab = initialData ? (initialData.type === 'link' ? 'link' : 'snippet') : 'link';
  const [tab, setTab] = useState(initialTab);
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState(initialData?.category || defaultCategory || (folders.length > 0 ? folders[0].name : 'General'));
  const [url, setUrl] = useState(initialData?.url || '');
  const [body, setBody] = useState(initialData?.body || '');
  const [error, setError] = useState('');

  const displayFolders = folders.length > 0 ? folders : [{ id: 'default', name: 'General' }];

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim() && !url.trim() && tab === 'link') return;
    if (!title.trim() && !body.trim() && tab === 'snippet') return;
    
    const payload = {
      ...(initialData || {}),
      title: title.trim() || (tab === 'link' ? url.trim() : 'Snippet'),
      category: category || 'General',
      addedAt: initialData?.addedAt || new Date().toISOString(),
      type: tab === 'link' ? 'link' : 'snippet'
    };
    
    if (tab === 'link') payload.url = url.trim();
    if (tab === 'snippet') payload.body = body.trim();

    onSave(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>{isEditing ? 'Edit Resource' : 'Add Resource'}</h2>
          <button onClick={onClose} className="btn-ghost btn-icon" style={{ width: 28, height: 28 }}><X size={16} /></button>
        </div>

        {!isEditing && (
          <div className="tab-group" style={{ marginBottom: 16 }}>
            {[
              { id: 'link', label: 'Link', icon: LinkIcon },
              { id: 'snippet', label: 'Snippet', icon: Code },
            ].map(t => (
              <button key={t.id} className={`tab-item ${tab === t.id ? 'active' : ''}`} onClick={() => { setTab(t.id); setError(''); }} style={{ flex: 1, fontSize: 11, padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <t.icon size={12} /> {t.label}
              </button>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Title</label>
          <input className="input" placeholder="Resource name" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Folder Section</label>
          <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
            {displayFolders.map(f => (
              <option key={f.id} value={f.name}>{f.name}</option>
            ))}
          </select>
        </div>

        {tab === 'link' && (
          <form onSubmit={handleSave}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ padding: '8px 12px', background: 'var(--color-bg-tertiary)', borderRadius: 8, marginBottom: 12, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <LinkIcon size={14} style={{ color: 'var(--color-info)', marginTop: 2, flexShrink: 0 }} />
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  To share a file, please upload it to Google Drive or Dropbox and paste the shareable link below.
                </p>
              </div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>URL</label>
              <input className="input" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{isEditing ? 'Save Changes' : <><Plus size={14} /> Add Link</>}</button>
            </div>
          </form>
        )}

        {tab === 'snippet' && (
          <form onSubmit={handleSave}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Content</label>
              <textarea className="input" placeholder="Paste code or text..." value={body} onChange={e => setBody(e.target.value)} rows={4} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{isEditing ? 'Save Changes' : <><Plus size={14} /> Add Snippet</>}</button>
            </div>
          </form>
        )}

        {error && <p style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 8 }}>{error}</p>}
      </div>
    </div>
  );
}
