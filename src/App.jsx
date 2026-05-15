import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
          status: 'online'
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
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <TopBar />
          <main style={{ flex: 1, overflow: 'hidden', background: 'var(--color-bg-primary)' }}>
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

      {showGroupSetup && <GroupSetup />}
    </BrowserRouter>
  );
}
