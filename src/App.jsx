import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopNav';
import { useStore } from './store/useStore';
import GroupSetup from './components/JoinCreateTeamModal';
import Login from './pages/Login';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Pages
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import CalendarView from './pages/CalendarView';
import Notes from './pages/Notes';
import Chat from './pages/Chat';
import Calls from './pages/Calls';
import Activity from './pages/Activity';
import Analytics from './pages/Analytics';
import ResourceHub from './pages/ResourceHub';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/calendar': 'Calendar',
  '/tasks': 'Tasks',
  '/notes': 'Notes',
  '/chat': 'Chat',
  '/calls': 'Calls',
  '/activity': 'Activity',
  '/analytics': 'Analytics',
  '/resources': 'Resources',
};

export default function App() {
  const { mode, group, user, setUser, showGroupSetup } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL || null,
          status: 'online'
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser]);

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
          boxShadow: '0 4px 20px rgba(108, 92, 231, 0.3)',
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
              <Route path="/calls" element={<Calls />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/analytics" element={<Analytics />} />
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
