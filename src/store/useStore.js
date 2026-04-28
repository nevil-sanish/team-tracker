import { create } from 'zustand';
import { generateId } from '../lib/utils';

const today = new Date();
const dayISO = (offset) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};
const dateAt = (dayOffset, hour, min = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};

export const useStore = create((set, get) => ({
  // ── Auth ──
  user: null,
  setUser: (user) => set({ user }),

  // ── Mode ──
  mode: 'personal', // 'personal' or 'group'
  setMode: (mode) => set({ mode }),
  toggleMode: () => {
    const state = get();
    if (state.mode === 'personal') {
      if (state.group) {
        set({ mode: 'group' });
      } else {
        set({ showGroupSetup: true });
      }
    } else {
      set({ mode: 'personal' });
    }
  },

  // ── Single Group ──
  group: null, // { id, name, password, members: [], createdBy, createdAt }
  showGroupSetup: false,
  setShowGroupSetup: (v) => set({ showGroupSetup: v }),

  joinOrCreateGroup: (name, password) => {
    const user = get().user;
    const group = {
      id: generateId(),
      name,
      password,
      members: [{ id: user.id, name: user.name, email: user.email, avatar: user.avatar, status: 'online' }],
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    };
    set({ group, mode: 'group', showGroupSetup: false });
  },

  exitGroup: () => {
    set({ group: null, mode: 'personal', showGroupSetup: false });
  },

  // ── User Status ──
  userStatus: 'online',
  setUserStatus: (status) => set({ userStatus: status }),

  // ── Calendar Events ──
  events: [
    { id: 'ev1', title: 'Team Standup', date: dayISO(0), startTime: '09:00', endTime: '09:30', teamId: null, createdBy: 'You', attendees: [], location: 'Zoom', recurrence: 'daily' },
    { id: 'ev2', title: 'Design Review', date: dayISO(1), startTime: '14:00', endTime: '15:00', teamId: null, createdBy: 'You', attendees: [], location: 'Meeting Room A' },
    { id: 'ev3', title: 'Sprint Planning', date: dayISO(2), startTime: '10:00', endTime: '11:30', teamId: null, createdBy: 'You', attendees: [], location: 'Conference' },
    { id: 'ev4', title: 'Lunch with Client', date: dayISO(3), startTime: '12:00', endTime: '13:30', teamId: null, createdBy: 'You', attendees: [] },
    { id: 'ev5', title: 'Code Freeze', date: dayISO(5), startTime: '17:00', endTime: '17:30', teamId: null, createdBy: 'You', attendees: [], isDeadline: true },
  ],
  addEvent: (event) => set(s => ({ events: [...s.events, { ...event, id: generateId() }] })),
  removeEvent: (id) => set(s => ({ events: s.events.filter(e => e.id !== id) })),
  updateEvent: (id, updates) => set(s => ({ events: s.events.map(e => e.id === id ? { ...e, ...updates } : e) })),

  // ── Tasks ──
  tasks: [
    { id: 't1', title: 'Design landing page mockup', description: 'Create high-fidelity mockup for the new landing page', assignee: 'You', teamId: null, status: 'in_progress', priority: 'high', dueDate: dayISO(2), createdAt: dateAt(-3, 10), updatedAt: dateAt(0, 14), updatedBy: 'You', comments: 3, attachments: 1, progress: 65 },
    { id: 't2', title: 'Fix navigation bug', description: 'Menu items not highlighting correctly on mobile', assignee: 'You', teamId: null, status: 'todo', priority: 'critical', dueDate: dayISO(-1), createdAt: dateAt(-5, 9), updatedAt: dateAt(-1, 16), updatedBy: 'You', comments: 2, attachments: 0 },
    { id: 't3', title: 'Write API documentation', description: 'Document all REST endpoints for v2', assignee: 'You', teamId: null, status: 'review', priority: 'medium', dueDate: dayISO(4), createdAt: dateAt(-7, 11), updatedAt: dateAt(0, 10), updatedBy: 'You', comments: 5, attachments: 2 },
    { id: 't4', title: 'Update dependencies', description: 'Bump all npm packages to latest versions', assignee: 'You', teamId: null, status: 'done', priority: 'low', dueDate: dayISO(-3), createdAt: dateAt(-10, 14), updatedAt: dateAt(-2, 9), updatedBy: 'You', comments: 0, attachments: 0 },
    { id: 't5', title: 'Setup CI/CD pipeline', description: 'Configure GitHub Actions for auto-deploy', assignee: 'You', teamId: null, status: 'todo', priority: 'high', dueDate: dayISO(6), createdAt: dateAt(-2, 10), updatedAt: dateAt(-1, 11), updatedBy: 'You', comments: 1, attachments: 0 },
    { id: 't6', title: 'Database migration script', description: 'Migrate user data to new schema', assignee: 'You', teamId: null, status: 'in_progress', priority: 'medium', dueDate: dayISO(3), createdAt: dateAt(-4, 15), updatedAt: dateAt(0, 8), updatedBy: 'You', comments: 4, attachments: 1, progress: 40 },
  ],
  addTask: (task) => set(s => ({ tasks: [...s.tasks, { ...task, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }] })),
  removeTask: (id) => set(s => ({ tasks: s.tasks.filter(t => t.id !== id) })),
  updateTask: (id, updates) => set(s => ({
    tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)
  })),
  moveTask: (id, newStatus) => set(s => ({
    tasks: s.tasks.map(t => t.id === id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t)
  })),

  // ── Notes ──
  noteFolders: [
    { id: 'nf1', name: 'Personal', teamId: null },
    { id: 'nf2', name: 'Work', teamId: null },
    { id: 'nf3', name: 'Ideas', teamId: null },
  ],
  notes: [
    { id: 'n1', title: 'Meeting Notes — Q2 Planning', folderId: 'nf2', teamId: null, body: 'Key objectives for Q2:\n\n1. Launch new feature set\n2. Improve user retention by 15%\n3. Reduce load times by 40%\n\nAction items:\n- Schedule weekly syncs\n- Create feature spec documents\n- Setup A/B testing framework', updatedAt: dateAt(0, 10), updatedBy: 'You', createdAt: dateAt(-5, 14), versions: 4, hasDrawing: false },
    { id: 'n2', title: 'Design System Tokens', folderId: 'nf2', teamId: null, body: 'Color palette decisions:\n\nPrimary: Deep violet (#6c5ce7)\nSuccess: Mint (#00b894)\nWarning: Gold (#fdcb6e)\nDanger: Coral (#e17055)\n\nTypography scale:\nH1: 32px / 700\nH2: 24px / 600\nBody: 14px / 400\nCaption: 12px / 500', updatedAt: dateAt(-1, 15), updatedBy: 'You', createdAt: dateAt(-10, 9), versions: 7, hasDrawing: false },
    { id: 'n3', title: 'App Architecture Sketch', folderId: 'nf3', teamId: null, body: 'Frontend: React + Vite + Zustand\nBackend: Firebase (Auth, Firestore, RTDB)\nRealtime: Firebase Realtime Database for chat/presence\nStorage: Firebase Storage for file uploads\n\nKey patterns:\n- Optimistic UI updates\n- Offline-first with sync queue\n- Component-level code splitting', updatedAt: dateAt(-2, 11), updatedBy: 'You', createdAt: dateAt(-8, 16), versions: 3, hasDrawing: true },
    { id: 'n4', title: 'Daily Journal', folderId: 'nf1', teamId: null, body: 'Today was productive. Finished the sidebar redesign and started on the calendar component. Need to focus on the event creation modal tomorrow.\n\nGratitude:\n- Great weather for a walk\n- Coffee was perfect today\n- Team was supportive', updatedAt: dateAt(0, 20), updatedBy: 'You', createdAt: dateAt(0, 8), versions: 1, hasDrawing: false },
  ],
  addNote: (note) => set(s => ({ notes: [...s.notes, { ...note, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), versions: 1 }] })),
  removeNote: (id) => set(s => ({ notes: s.notes.filter(n => n.id !== id) })),
  updateNote: (id, updates) => set(s => ({
    notes: s.notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString(), versions: (n.versions || 0) + 1 } : n)
  })),
  addNoteFolder: (folder) => set(s => ({ noteFolders: [...s.noteFolders, { ...folder, id: generateId() }] })),

  // ── Chat ──
  channels: [
    { id: 'ch_general', name: 'general', teamId: 'group', isDM: false, unread: 0 },
    { id: 'ch_random', name: 'random', teamId: 'group', isDM: false, unread: 0 },
    { id: 'ch_design', name: 'design', teamId: 'group', isDM: false, unread: 0 },
  ],
  messages: [],
  addMessage: (msg) => set(s => ({ messages: [...s.messages, { ...msg, id: generateId(), createdAt: new Date().toISOString(), reactions: [] }] })),
  addReaction: (msgId, emoji) => set(s => ({
    messages: s.messages.map(m => {
      if (m.id !== msgId) return m;
      const existing = m.reactions.find(r => r.emoji === emoji);
      if (existing) {
        return { ...m, reactions: m.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r) };
      }
      return { ...m, reactions: [...m.reactions, { emoji, count: 1 }] };
    })
  })),

  // ── Activity Feed ──
  activities: [
    { id: 'a1', kind: 'task_completed', actorName: 'You', target: 'Update dependencies', at: dateAt(-2, 9) },
    { id: 'a2', kind: 'note_edited', actorName: 'You', target: 'Meeting Notes — Q2 Planning', at: dateAt(0, 10) },
    { id: 'a3', kind: 'event_created', actorName: 'You', target: 'Team Standup', at: dateAt(-1, 8) },
  ],
  addActivity: (activity) => set(s => ({
    activities: [{ ...activity, id: generateId(), at: new Date().toISOString() }, ...s.activities]
  })),

  // ── Resources ──
  resources: [],
  addResource: (resource) => set(s => ({ resources: [...s.resources, { ...resource, id: generateId(), addedAt: new Date().toISOString() }] })),
  removeResource: (id) => set(s => ({ resources: s.resources.filter(r => r.id !== id) })),

  // ── Notifications ──
  notifications: [
    { id: 'notif1', title: 'Task Overdue', message: 'Fix Navigation Bug was due yesterday', read: false, time: dateAt(-1, 16), type: 'alert' },
    { id: 'notif2', title: 'Meeting in 1 hour', message: 'Design Review starts at 2:00 PM', read: false, time: dateAt(0, 13), type: 'reminder' },
  ],
  markNotificationRead: (id) => set(s => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),
  addNotification: (notif) => set(s => ({
    notifications: [{ ...notif, id: generateId(), read: false, time: new Date().toISOString() }, ...s.notifications]
  })),

  // ── Call History ──
  calls: [],
  addCall: (call) => set(s => ({ calls: [...s.calls, { ...call, id: generateId() }] })),
}));
