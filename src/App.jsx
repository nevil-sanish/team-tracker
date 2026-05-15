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

  // Automatic online/offline presence
  useEffect(() => {
    if (!user?.id || !activeGroup?.id) return;

    const gid = activeGroup.id;
    const uid = user.id;

    // Set online when page is visible
    const setOnline = () => {
      updateMemberStatus(gid, uid, 'online').catch(() => {});
      useStore.getState().setUserStatus('online');
    };

    // Set offline when page is hidden or closing
    const setOffline = () => {
      updateMemberStatus(gid, uid, 'offline').catch(() => {});
      useStore.getState().setUserStatus('offline');
    };

    // Mark online immediately
    setOnline();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setOnline();
      } else {
        setOffline();
      }
    };

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline update on tab close
      setOffline();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Mark offline when effect cleans up (e.g. leaving group)
      setOffline();
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
