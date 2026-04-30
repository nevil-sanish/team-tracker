import { create } from 'zustand';
import { generateId } from '../lib/utils';

export const useStore = create((set, get) => ({
  // ── Auth ──
  user: null,
  setUser: (user) => set({ user }),

  // ── Active Group ──
  // { id, name, password, members: [], createdBy, createdAt }
  activeGroup: null,
  setActiveGroup: (group) => set({ activeGroup: group }),

  // ── Group Selection Modal ──
  showGroupSetup: false,
  setShowGroupSetup: (v) => set({ showGroupSetup: v }),

  leaveGroup: () => {
    set({ activeGroup: null });
  },

  // ── User Status ──
  userStatus: 'online',
  setUserStatus: (status) => set({ userStatus: status }),

  // ── Calendar Events (group-scoped, loaded from Firestore) ──
  events: [],
  setEvents: (events) => set({ events }),
  addEvent: (event) => set(s => ({ events: [...s.events, { ...event, id: event.id || generateId() }] })),
  removeEvent: (id) => set(s => ({ events: s.events.filter(e => e.id !== id) })),
  updateEvent: (id, updates) => set(s => ({ events: s.events.map(e => e.id === id ? { ...e, ...updates } : e) })),

  // ── Tasks (group-scoped, loaded from Firestore) ──
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set(s => ({ tasks: [...s.tasks, { ...task, id: task.id || generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }] })),
  removeTask: (id) => set(s => ({ tasks: s.tasks.filter(t => t.id !== id) })),
  updateTask: (id, updates) => set(s => ({
    tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)
  })),
  moveTask: (id, newStatus) => set(s => ({
    tasks: s.tasks.map(t => t.id === id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t)
  })),

  // ── Notes (group-scoped) ──
  noteFolders: [],
  setNoteFolders: (folders) => set({ noteFolders: folders }),
  notes: [],
  setNotes: (notes) => set({ notes }),
  addNote: (note) => set(s => ({ notes: [...s.notes, { ...note, id: note.id || generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), versions: 1 }] })),
  removeNote: (id) => set(s => ({ notes: s.notes.filter(n => n.id !== id) })),
  updateNote: (id, updates) => set(s => ({
    notes: s.notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString(), versions: (n.versions || 0) + 1 } : n)
  })),
  addNoteFolder: (folder) => set(s => ({ noteFolders: [...s.noteFolders, { ...folder, id: folder.id || generateId() }] })),

  // ── Chat (group-scoped) ──
  channels: [],
  setChannels: (channels) => set({ channels }),
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set(s => ({ messages: [...s.messages, { ...msg, id: msg.id || generateId(), createdAt: new Date().toISOString(), reactions: [] }] })),
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

  // ── Activity Feed (group-scoped) ──
  activities: [],
  setActivities: (activities) => set({ activities }),
  addActivity: (activity) => set(s => ({
    activities: [{ ...activity, id: activity.id || generateId(), at: new Date().toISOString() }, ...s.activities]
  })),

  // ── Resources (group-scoped) ──
  resources: [],
  setResources: (resources) => set({ resources }),
  addResource: (resource) => set(s => ({ resources: [...s.resources, { ...resource, id: resource.id || generateId(), addedAt: new Date().toISOString() }] })),
  removeResource: (id) => set(s => ({ resources: s.resources.filter(r => r.id !== id) })),

  // ── Notifications ──
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  markNotificationRead: (id) => set(s => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),
  addNotification: (notif) => set(s => ({
    notifications: [{ ...notif, id: notif.id || generateId(), read: false, time: new Date().toISOString() }, ...s.notifications]
  })),

  // ── Call History ──
  calls: [],
  setCalls: (calls) => set({ calls }),
  addCall: (call) => set(s => ({ calls: [...s.calls, { ...call, id: call.id || generateId() }] })),

  // ── Clear all group data (when leaving a group) ──
  clearGroupData: () => set({
    events: [],
    tasks: [],
    notes: [],
    noteFolders: [],
    channels: [],
    messages: [],
    activities: [],
    resources: [],
    notifications: [],
    calls: [],
  }),
}));
