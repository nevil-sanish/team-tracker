import { create } from 'zustand';

export const useStore = create((set) => ({
  mode: 'personal', // 'personal' or 'group'
  toggleMode: () => set((state) => ({ mode: state.mode === 'personal' ? 'group' : 'personal' })),
  
  activeTeamId: null,
  setActiveTeamId: (id) => set({ activeTeamId: id }),
  
  user: {
    id: 'u1',
    name: 'Alex Developer',
    email: 'alex@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    status: 'online' // online, busy, in-a-call, focus, offline
  },
  setUser: (user) => set({ user }),

  teams: [
    { id: 't1', name: 'Design Team', color: 'blue' },
    { id: 't2', name: 'Engineering', color: 'indigo' },
  ],
  
  notifications: [
    { id: 'n1', title: 'Task Due', message: 'Design mockup due today', read: false, time: new Date().toISOString() }
  ],
  markNotificationRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),
}));
