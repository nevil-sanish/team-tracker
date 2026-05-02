import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatRelative(iso) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function toDateKey(d) {
  return d.toISOString().slice(0, 10);
}

export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export const priorityMeta = {
  low: { label: 'Low', color: 'var(--color-priority-low)', bg: 'rgba(99,110,114,0.15)', text: 'var(--color-priority-low)' },
  medium: { label: 'Medium', color: 'var(--color-priority-medium)', bg: 'var(--color-success-soft)', text: 'var(--color-success)' },
  high: { label: 'High', color: 'var(--color-priority-high)', bg: 'var(--color-warning-soft)', text: 'var(--color-warning)' },
  critical: { label: 'Critical', color: 'var(--color-priority-critical)', bg: 'var(--color-danger-soft)', text: 'var(--color-danger)' },
};

export const statusMeta = {
  todo: { label: 'To Do', color: 'var(--color-text-muted)' },
  in_progress: { label: 'In Progress', color: 'var(--color-info)' },
  review: { label: 'Review', color: 'var(--color-warning)' },
  done: { label: 'Done', color: 'var(--color-success)' },
};

export const presenceMeta = {
  online: { label: 'Online', color: 'var(--color-status-online)', icon: '🟢' },
  busy: { label: 'Busy', color: 'var(--color-status-busy)', icon: '🔴' },
  focus: { label: 'Focus Mode', color: 'var(--color-status-focus)', icon: '🎯' },
  sleeping: { label: 'Sleeping', color: 'var(--color-status-call)', icon: '😴' },
  offline: { label: 'Offline', color: 'var(--color-status-offline)', icon: '⚫' },
};
