import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopNav';
import { useStore } from './store/useStore';
import GroupSetup from './components/JoinCreateTeamModal';
import Login from './pages/Login';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { subscribeToGroup, leaveGroup as leaveGroupFS, updateMemberStatus, getUserGroups } from './lib/groupService';
import {
  subscribeTasks, subscribeEvents, subscribeNotes,
  subscribeNoteFolders, subscribeResourceFolders, subscribeChannels, subscribeMessages,
  subscribeActivities, subscribeResources, subscribeCalendarSections,
  subscribePersonalCalendarSections,
} from './lib/dataService';

// Pages
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import CalendarView from './pages/CalendarView';
import Notes from './pages/Notes';
import Chat from './pages/Chat';
import Activity from './pages/Activity';
// Analytics merged into Activity page
import ResourceHub from './pages/ResourceHub';

export default function App() {
  const {
    user, setUser, activeGroup, setActiveGroup, showGroupSetup,
    setMode, setTasks, setEvents, setNotes, setNoteFolders, setResourceFolders,
    setChannels, setMessages, setActivities, setResources, setCalendarSections,
    setPersonalCalendarSections, clearGroupData,
  } = useStore();
  const [loading, setLoading] = useState(true);

  // Auth listener — auto-restore group membership on login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL || null,
          status: 'offline'
        };
        setUser(userData);

        // Auto-restore: check if user belongs to any groups
        try {
          const lastGroupId = localStorage.getItem(`lastGroup_${firebaseUser.uid}`);
          const userGroups = await getUserGroups(firebaseUser.uid);

          if (userGroups.length > 0) {
            // Prefer the last active group, otherwise pick the first
            const preferred = lastGroupId
              ? userGroups.find(g => g.id === lastGroupId) || userGroups[0]
              : userGroups[0];
            setActiveGroup(preferred);
            setMode('group');
          }
        } catch (err) {
          if (import.meta.env.DEV) console.error('Failed to restore groups:', err);
        }
      } else {
        setUser(null);
        setActiveGroup(null);
        clearGroupData();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser]);

  // Subscribe to group data when activeGroup changes
  useEffect(() => {
    if (!activeGroup?.id) {
      clearGroupData();
      return;
    }

    const gid = activeGroup.id;

    // Persist last active group for this user
    if (user?.id) {
      localStorage.setItem(`lastGroup_${user.id}`, gid);
    }

    const unsubs = [
      subscribeToGroup(gid, (groupData) => {
        setActiveGroup(groupData);
      }),
      subscribeTasks(gid, setTasks),
      subscribeEvents(gid, setEvents),
      subscribeCalendarSections(gid, setCalendarSections),
      subscribeNotes(gid, setNotes),
      subscribeNoteFolders(gid, setNoteFolders),
      subscribeResourceFolders(gid, setResourceFolders),
      subscribeChannels(gid, setChannels),
      subscribeMessages(gid, setMessages),
      subscribeActivities(gid, setActivities),
      subscribeResources(gid, setResources),
    ];

    return () => {
      unsubs.forEach(u => u && u());
    };
  }, [activeGroup?.id]);

  // Subscribe to personal calendar sections (user-level, always active when logged in)
  useEffect(() => {
    if (!user?.id) return;
    const unsub = subscribePersonalCalendarSections(user.id, (sections) => {
      setPersonalCalendarSections(sections);
    });
    return () => unsub();
  }, [user?.id]);

  // ── Activity-based presence: active on interaction, inactive after 5 min ──
  // Only real interactions (click, keydown, scroll) count.
  // Tab hidden → immediate inactive. Tab visible → still needs interaction.
  useEffect(() => {
    if (!user?.id || !activeGroup?.id) return;

    const gid = activeGroup.id;
    const uid = user.id;
    const INACTIVE_MS = 5 * 60 * 1000; // 5 minutes
    const DEBOUNCE_MS = 60 * 1000;     // write to Firestore at most once per 60s
    const HEARTBEAT_MS = 60 * 1000;    // check every 60s as fallback

    let inactivityTimer = null;
    let lastFirestoreWrite = 0;
    let isCurrentlyOnline = false;
    let lastInteractionAt = 0; // track the actual timestamp of last interaction

    const writeOnlineToFirestore = () => {
      const now = Date.now();
      if (now - lastFirestoreWrite > DEBOUNCE_MS) {
        lastFirestoreWrite = now;
        updateMemberStatus(gid, uid, 'online').catch(() => {});
      }
    };

    const markOnline = () => {
      lastInteractionAt = Date.now();
      if (!isCurrentlyOnline) {
        isCurrentlyOnline = true;
        useStore.getState().setUserStatus('online');
      }
      writeOnlineToFirestore();
    };

    const markInactive = () => {
      if (!isCurrentlyOnline) return; // already inactive
      isCurrentlyOnline = false;
      lastFirestoreWrite = 0; // reset so next activation writes immediately
      useStore.getState().setUserStatus('offline');
      updateMemberStatus(gid, uid, 'offline').catch(() => {});
    };

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(markInactive, INACTIVE_MS);
    };

    // On any real user interaction → mark online + reset the 5-min countdown
    const handleActivity = () => {
      // Ignore events when tab is hidden (synthetic / background events)
      if (document.visibilityState === 'hidden') return;
      markOnline();
      resetInactivityTimer();
    };

    // Tab visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        // Tab went to background → mark inactive immediately
        clearTimeout(inactivityTimer);
        markInactive();
      }
      // When tab becomes visible again, do NOT auto-mark online.
      // Wait for a real interaction (click/keydown/scroll).
    };

    // Heartbeat: browsers throttle setTimeout in background tabs, so
    // we also run an interval to catch stale "online" states.
    const heartbeat = setInterval(() => {
      if (!isCurrentlyOnline) return;
      const elapsed = Date.now() - lastInteractionAt;
      if (elapsed >= INACTIVE_MS) {
        markInactive();
      }
    }, HEARTBEAT_MS);

    // Do NOT auto-mark online on page load.
    // Start as inactive — first interaction will activate.
    updateMemberStatus(gid, uid, 'offline').catch(() => {});
    useStore.getState().setUserStatus('offline');

    // Listen for real user interactions only
    document.addEventListener('click', handleActivity, true);
    document.addEventListener('keydown', handleActivity, true);
    document.addEventListener('scroll', handleActivity, true);
    document.addEventListener('visibilitychange', handleVisibility);

    // Handle tab close / navigate away
    const handleBeforeUnload = () => {
      markInactive();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimeout(inactivityTimer);
      clearInterval(heartbeat);
      document.removeEventListener('click', handleActivity, true);
      document.removeEventListener('keydown', handleActivity, true);
      document.removeEventListener('scroll', handleActivity, true);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Mark inactive on cleanup (e.g. leaving group)
      markInactive();
    };
  }, [user?.id, activeGroup?.id]);

  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-primary)',
        gap: 16,
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-hover))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 800,
          fontSize: 20,
          boxShadow: '0 4px 20px rgba(249, 115, 22, 0.3)',
        }}>
          T
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="animate-pulse-soft" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)' }} />
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
            Loading Team Tracker...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <div style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
      }}>
        <div className="desktop-sidebar">
          <Sidebar />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <TopBar />
          <main className="app-main-content" style={{ flex: 1, overflow: 'hidden', background: 'var(--color-bg-primary)' }}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/activity" element={<Activity />} />

              <Route path="/resources" element={<ResourceHub />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>

      <MobileBottomNav />
      {showGroupSetup && <GroupSetup />}
    </BrowserRouter>
  );
}

/* ── Mobile Bottom Navigation ── */
function MobileBottomNav() {
  const { mode, activeGroup } = useStore();
  const inGroup = mode === 'group' && !!activeGroup;

  const items = [
    { path: '/dashboard', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/calendar', label: 'Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { path: '/tasks', label: 'Tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { path: '/notes', label: 'Notes', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    ...(inGroup ? [
      { path: '/chat', label: 'Chat', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
      { path: '/resources', label: 'Files', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
    ] : []),
  ];

  return (
    <nav className="mobile-bottom-nav">
      {items.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={item.icon} />
          </svg>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
