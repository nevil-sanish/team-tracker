import React from 'react';
import { presenceMeta } from '../lib/utils';

export default function StatusBadge({ status, showLabel = false, size = 'sm' }) {
  const meta = presenceMeta[status] || presenceMeta.offline;
  const dotSize = size === 'sm' ? 8 : size === 'md' ? 10 : 12;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: meta.color,
          flexShrink: 0,
          boxShadow: status === 'online' ? `0 0 6px ${meta.color}` : 'none',
        }}
      />
      {showLabel && (
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          {meta.label}
        </span>
      )}
    </div>
  );
}
