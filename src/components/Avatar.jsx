import React from 'react';
import { getInitials } from '../lib/utils';

export default function Avatar({ name, avatar, size = 'md', status, showStatus = false }) {
  const sizes = {
    xs: { container: 24, text: 9, dot: 7 },
    sm: { container: 30, text: 10, dot: 8 },
    md: { container: 36, text: 12, dot: 10 },
    lg: { container: 44, text: 14, dot: 12 },
  };

  const s = sizes[size] || sizes.md;
  const initials = getInitials(name);

  const statusColors = {
    online: 'var(--color-status-online)',
    busy: 'var(--color-status-busy)',
    call: 'var(--color-status-call)',
    focus: 'var(--color-status-focus)',
    offline: 'var(--color-status-offline)',
  };

  return (
    <div style={{ position: 'relative', width: s.container, height: s.container, flexShrink: 0 }}>
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          style={{
            width: s.container,
            height: s.container,
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div
          style={{
            width: s.container,
            height: s.container,
            borderRadius: '50%',
            background: `hsl(${(name || '').charCodeAt(0) * 37 % 360}, 60%, 45%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: s.text,
            fontWeight: 600,
            color: 'white',
            letterSpacing: '0.02em',
          }}
        >
          {initials}
        </div>
      )}
      {showStatus && status && (
        <div
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: s.dot,
            height: s.dot,
            borderRadius: '50%',
            background: statusColors[status] || statusColors.offline,
            border: '2px solid var(--color-bg-primary)',
          }}
        />
      )}
    </div>
  );
}
