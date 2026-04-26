import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { useStore } from './store/useStore';

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

export default function App() {
  const mode = useStore(state => state.mode);

  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav />
          
          <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900">
            <div className="h-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/calendar" element={<CalendarView />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/calls" element={<Calls />} />
                <Route path="/activity" element={<Activity />} />
                
                {/* Group Mode Only Routes */}
                {mode === 'group' && (
                  <>
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/resources" element={<ResourceHub />} />
                  </>
                )}
                
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
