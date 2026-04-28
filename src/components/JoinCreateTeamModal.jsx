import React, { useState } from 'react';
import { Users, LogIn, Plus, X } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function GroupSetup() {
  const { joinOrCreateGroup, setShowGroupSetup, setMode } = useStore();
  const [tab, setTab] = useState('create');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    joinOrCreateGroup(name.trim(), password.trim());
  };

  const handleClose = () => {
    setShowGroupSetup(false);
    setMode('personal');
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
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
                {tab === 'create' ? 'Start a new workspace' : 'Enter existing credentials'}
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
            className={`tab-item ${tab === 'create' ? 'active' : ''}`}
            onClick={() => { setTab('create'); setError(''); }}
            style={{ flex: 1 }}
          >
            <Plus size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            Create
          </button>
          <button
            className={`tab-item ${tab === 'join' ? 'active' : ''}`}
            onClick={() => { setTab('join'); setError(''); }}
            style={{ flex: 1 }}
          >
            <LogIn size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            Join
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
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
            style={{ width: '100%', marginTop: 6, height: 40, fontSize: 13, fontWeight: 600 }}
          >
            {tab === 'create' ? (
              <><Plus size={15} /> Create Group</>
            ) : (
              <><LogIn size={15} /> Join Group</>
            )}
          </button>
        </form>

        <p style={{ fontSize: 10, color: 'var(--color-text-disabled)', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
          {tab === 'create'
            ? 'Share the group name and password with your team members so they can join.'
            : 'Ask your team admin for the group name and password.'}
        </p>
      </div>
    </div>
  );
}
