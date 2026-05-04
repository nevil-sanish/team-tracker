import { create } from 'zustand';
import { generateId } from '../lib/utils';

// ── localStorage helpers for personal data ──
const PERSONAL_KEY = 'tt_personal';
function loadPersonal() {
  try { return JSON.parse(localStorage.getItem(PERSONAL_KEY)) || {}; }
  catch { return {}; }
}
function savePersonal(data) {
  localStorage.setItem(PERSONAL_KEY, JSON.stringify(data));
}

const initP = loadPersonal();

export const useStore = create((set, get) => ({
  // ── Auth ──
  user: null,
  setUser: (user) => set({ user }),

  // ── Mode: 'personal' or 'group' ──
  mode: 'personal',
  setMode: (mode) => set({ mode }),

  // ── Active Group ──
  activeGroup: null,
  setActiveGroup: (group) => set({ activeGroup: group }),

  // ── Group Selection Modal ──
  showGroupSetup: false,
  setShowGroupSetup: (v) => set({ showGroupSetup: v }),

  leaveGroup: () => set({ activeGroup: null }),

  // ── User Status ──
  userStatus: 'online',
  setUserStatus: (status) => set({ userStatus: status }),

  // ═══════════════════════════════════════════
  // GROUP-SCOPED DATA (from Firestore)
  // ═══════════════════════════════════════════
  events: [],
  setEvents: (events) => set({ events }),
  addEvent: (event) => set(s => ({ events: [...s.events, { ...event, id: event.id || generateId() }] })),
  removeEvent: (id) => set(s => ({ events: s.events.filter(e => e.id !== id) })),
  updateEvent: (id, updates) => set(s => ({ events: s.events.map(e => e.id === id ? { ...e, ...updates } : e) })),

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

  channels: [],
  setChannels: (channels) => set({ channels }),
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) => set(s => ({ messages: [...s.messages, { ...msg, id: msg.id || generateId(), createdAt: new Date().toISOString(), reactions: [] }] })),
  addReaction: (msgId, emoji) => set(s => ({
    messages: s.messages.map(m => {
      if (m.id !== msgId) return m;
      const existing = m.reactions.find(r => r.emoji === emoji);
      if (existing) return { ...m, reactions: m.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r) };
      return { ...m, reactions: [...m.reactions, { emoji, count: 1 }] };
    })
  })),

  activities: [],
  setActivities: (activities) => set({ activities }),
  addActivity: (activity) => set(s => ({
    activities: [{ ...activity, id: activity.id || generateId(), at: new Date().toISOString() }, ...s.activities]
  })),

  resources: [],
  setResources: (resources) => set({ resources }),
  addResource: (resource) => set(s => ({ resources: [...s.resources, { ...resource, id: resource.id || generateId(), addedAt: new Date().toISOString() }] })),
  removeResource: (id) => set(s => ({ resources: s.resources.filter(r => r.id !== id) })),

  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  markNotificationRead: (id) => set(s => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),
  addNotification: (notif) => set(s => ({
    notifications: [{ ...notif, id: notif.id || generateId(), read: false, time: new Date().toISOString() }, ...s.notifications]
  })),

  calls: [],
  setCalls: (calls) => set({ calls }),
  addCall: (call) => set(s => ({ calls: [...s.calls, { ...call, id: call.id || generateId() }] })),

  clearGroupData: () => set({
    events: [], tasks: [], notes: [], noteFolders: [],
    channels: [], messages: [], activities: [], resources: [],
    notifications: [], calls: [],
  }),

  // ═══════════════════════════════════════════
  // PERSONAL DATA (localStorage only, never touches Firestore)
  // ═══════════════════════════════════════════
  personalEvents: initP.events || [],
  personalTasks: initP.tasks || [],
  personalNotes: initP.notes || [],

  _savePersonal: () => {
    const s = get();
    savePersonal({ events: s.personalEvents, tasks: s.personalTasks, notes: s.personalNotes });
  },

  addPersonalEvent: (event) => { set(s => ({ personalEvents: [...s.personalEvents, { ...event, id: event.id || generateId() }] })); get()._savePersonal(); },
  removePersonalEvent: (id) => { set(s => ({ personalEvents: s.personalEvents.filter(e => e.id !== id) })); get()._savePersonal(); },

  addPersonalTask: (task) => { set(s => ({ personalTasks: [...s.personalTasks, { ...task, id: task.id || generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }] })); get()._savePersonal(); },
  removePersonalTask: (id) => { set(s => ({ personalTasks: s.personalTasks.filter(t => t.id !== id) })); get()._savePersonal(); },
  updatePersonalTask: (id, updates) => { set(s => ({ personalTasks: s.personalTasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t) })); get()._savePersonal(); },
  movePersonalTask: (id, newStatus) => { set(s => ({ personalTasks: s.personalTasks.map(t => t.id === id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t) })); get()._savePersonal(); },

  addPersonalNote: (note) => { set(s => ({ personalNotes: [...s.personalNotes, { ...note, id: note.id || generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), versions: 1 }] })); get()._savePersonal(); },
  removePersonalNote: (id) => { set(s => ({ personalNotes: s.personalNotes.filter(n => n.id !== id) })); get()._savePersonal(); },
  updatePersonalNote: (id, updates) => { set(s => ({ personalNotes: s.personalNotes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n) })); get()._savePersonal(); },

  // ═══════════════════════════════════════════
  // ACTIVE DATA GETTERS (returns correct data based on mode)
  // ═══════════════════════════════════════════
  getActiveEvents: () => { const s = get(); return s.mode === 'group' && s.activeGroup ? s.events : s.personalEvents; },
  getActiveTasks: () => { const s = get(); return s.mode === 'group' && s.activeGroup ? s.tasks : s.personalTasks; },
  getActiveNotes: () => { const s = get(); return s.mode === 'group' && s.activeGroup ? s.notes : s.personalNotes; },
}));
