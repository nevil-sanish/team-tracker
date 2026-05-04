import React, { useState, useEffect } from 'react';
import { Users, LogIn, Plus, X, RefreshCw, Shield, Loader2, Crown, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { createGroup, joinGroup, fetchAllGroups, deleteGroup, isAdmin } from '../lib/groupService';
import { initGroupDefaults } from '../lib/dataService';
import Avatar from './Avatar';

export default function GroupSetup() {
  const { user, setActiveGroup, setShowGroupSetup, setMode } = useStore();
  const [tab, setTab] = useState('join');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Fetch available groups on mount
  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoadingGroups(true);
    try {
      const groups = await fetchAllGroups();
      setAvailableGroups(groups);
    } catch (err) {
      console.error('Failed to fetch groups', err);
    }
    setLoadingGroups(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Group name is required'); return; }
    if (!password.trim()) { setError('Password is required'); return; }

    setLoading(true);
    setError('');
    try {
      const group = await createGroup(name.trim(), password.trim(), user);
      await initGroupDefaults(group.id);
      setActiveGroup(group);
      setMode('group');
      setShowGroupSetup(false);
    } catch (err) {
      setError(err.message || 'Failed to create group');
    }
    setLoading(false);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Group name is required'); return; }
    if (!password.trim()) { setError('Password is required'); return; }

    setLoading(true);
    setError('');
    try {
      const group = await joinGroup(name.trim(), password.trim(), user);
      setActiveGroup(group);
      setMode('group');
      setShowGroupSetup(false);
    } catch (err) {
      setError(err.message || 'Failed to join group');
    }
    setLoading(false);
  };

  const handleQuickJoin = async (groupInfo) => {
    setName(groupInfo.name);
    setTab('join');
    setPassword('');
    setError('');
  };

  const handleClose = () => {
    setShowGroupSetup(false);
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    if (!isAdmin(user)) return;
    if (!confirm(`Are you sure you want to permanently delete "${groupName}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await deleteGroup(groupId);
      await loadGroups();
      // If the deleted group was active, clear it
      if (useStore.getState().activeGroup?.id === groupId) {
        useStore.getState().setActiveGroup(null);
        useStore.getState().clearGroupData();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete group');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, maxHeight: '90vh' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'var(--color-accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Users size={20} style={{ color: 'var(--color-accent)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {tab === 'create' ? 'Create Group' : 'Join Group'}
              </h2>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                {tab === 'create' ? 'Start a new workspace for your team' : 'Browse or enter group credentials'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="btn-ghost btn-icon" style={{ width: 28, height: 28 }}>
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="tab-group" style={{ marginBottom: 20 }}>
          <button
            className={`tab-item ${tab === 'join' ? 'active' : ''}`}
            onClick={() => { setTab('join'); setError(''); }}
            style={{ flex: 1 }}
          >
            <LogIn size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            Join
          </button>
          <button
            className={`tab-item ${tab === 'create' ? 'active' : ''}`}
            onClick={() => { setTab('create'); setError(''); }}
            style={{ flex: 1 }}
          >
            <Plus size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            Create
          </button>
        </div>

        {/* Available Groups (shown in Join tab) */}
        {tab === 'join' && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-muted)' }}>
                Available Groups
              </span>
              <button
                onClick={loadGroups}
                className="btn-ghost btn-icon"
                style={{ width: 24, height: 24 }}
                title="Refresh"
              >
                <RefreshCw size={12} className={loadingGroups ? 'animate-spin' : ''} />
              </button>
            </div>

            {loadingGroups ? (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div className="animate-pulse-soft" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Loader2 size={14} style={{ color: 'var(--color-text-muted)' }} className="animate-spin" />
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Loading groups...</span>
                </div>
              </div>
            ) : availableGroups.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '20px 12px',
                background: 'var(--color-bg-tertiary)',
                borderRadius: 10,
                border: '1px dashed var(--color-border-default)',
              }}>
                <Users size={20} style={{ color: 'var(--color-text-disabled)', margin: '0 auto 6px' }} />
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>No groups yet. Create one to get started!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                {availableGroups.map(g => (
                  <button
                    key={g.id}
                    onClick={() => handleQuickJoin(g)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '10px 12px',
                      background: name === g.name ? 'var(--color-accent-soft)' : 'var(--color-bg-tertiary)',
                      border: name === g.name ? '1px solid rgba(108,92,231,0.3)' : '1px solid var(--color-border-default)',
                      borderRadius: 10,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                    className="hover:bg-[var(--color-bg-hover)]"
                  >
                    {/* Group Icon */}
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 14,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {g.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {g.name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        {/* Active Members Avatars */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {(g.members || []).slice(0, 4).map((m, idx) => (
                            <div
                              key={m.id}
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                background: m.avatar ? `url(${m.avatar}) center/cover` : 'var(--color-accent)',
                                border: '2px solid var(--color-bg-tertiary)',
                                marginLeft: idx > 0 ? -6 : 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 8,
                                fontWeight: 700,
                                color: 'white',
                                position: 'relative',
                                zIndex: 4 - idx,
                                overflow: 'hidden',
                              }}
                            >
                              {m.avatar ? (
                                <img src={m.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                              ) : (
                                m.name?.charAt(0)?.toUpperCase()
                              )}
                            </div>
                          ))}
                          {g.memberCount > 4 && (
                            <div style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              background: 'var(--color-bg-hover)',
                              border: '2px solid var(--color-bg-tertiary)',
                              marginLeft: -6,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 7,
                              fontWeight: 600,
                              color: 'var(--color-text-muted)',
                            }}>
                              +{g.memberCount - 4}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                          {g.memberCount} {g.memberCount === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                    </div>
                    {isAdmin(user) ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.id, g.name); }}
                        className="btn-ghost btn-icon"
                        style={{ width: 28, height: 28, color: 'var(--color-danger)', flexShrink: 0 }}
                        title="Delete group (Admin)"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <Shield size={13} style={{ color: 'var(--color-text-disabled)', flexShrink: 0 }} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={tab === 'create' ? handleCreate : handleJoin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              Group Name
            </label>
            <input
              type="text"
              className="input"
              placeholder={tab === 'create' ? 'My Awesome Team' : 'Enter group name'}
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              className="input"
              placeholder={tab === 'create' ? 'Set a team password' : 'Enter group password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
            />
          </div>

          {error && (
            <p style={{ fontSize: 12, color: 'var(--color-danger)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: 6, height: 40, fontSize: 13, fontWeight: 600, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <><Loader2 size={15} className="animate-spin" /> {tab === 'create' ? 'Creating...' : 'Joining...'}</>
            ) : tab === 'create' ? (
              <><Plus size={15} /> Create Group</>
            ) : (
              <><LogIn size={15} /> Join Group</>
            )}
          </button>
        </form>

        <p style={{ fontSize: 10, color: 'var(--color-text-disabled)', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
          {tab === 'create'
            ? 'Share the group name and password with your team members so they can join.'
            : 'Select a group above or enter the name and password to join.'}
        </p>
      </div>
    </div>
  );
}
