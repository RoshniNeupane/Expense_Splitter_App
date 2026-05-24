import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import ExpensesPage from './pages/ExpensesPage';
import SettlementsPage from './pages/SettlementsPage';
import ActivityPage from './pages/ActivityPage';
import ProfilePage from './pages/ProfilePage';
import './index.css';

function AppInner() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState('login');
  const [page, setPage] = useState('dashboard');
  const [selectedGroup, setSelectedGroup] = useState(null);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, var(--gold) 0%, #b8960c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#0a0d14', margin: '0 auto 16px', animation: 'pulse 1.5s ease-in-out infinite' }}>S</div>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</p>
      </div>
    </div>
  );

  if (!user) {
    return authMode === 'login'
      ? <LoginPage onSwitch={() => setAuthMode('register')} />
      : <RegisterPage onSwitch={() => setAuthMode('login')} />;
  }

  const navigate = (p) => { setPage(p); if (p !== 'groups') setSelectedGroup(null); };

  const renderPage = () => {
    if (page === 'groups' && selectedGroup) {
      return (
        <GroupDetailPage
          group={selectedGroup}
          onBack={() => setSelectedGroup(null)}
          onNavigateExpenses={() => { setSelectedGroup(null); setPage('expenses'); }}
        />
      );
    }
    switch (page) {
      case 'dashboard': return <DashboardPage onNavigate={navigate} />;
      case 'groups': return <GroupsPage onSelectGroup={g => setSelectedGroup(g)} />;
      case 'expenses': return <ExpensesPage selectedGroup={selectedGroup} onNavigate={navigate} />;
      case 'settlements': return <SettlementsPage />;
      case 'activity': return <ActivityPage />;
      case 'profile': return <ProfilePage />;
      default: return <DashboardPage onNavigate={navigate} />;
    }
  };

  return (
    <Layout activePage={page} onNavigate={navigate}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
      <Toaster position="bottom-right" toastOptions={{
        className: 'es-toast',
        duration: 3500,
        style: { background: '#1c2340', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', fontFamily: "'DM Sans', sans-serif", fontSize: 14 },
        success: { iconTheme: { primary: '#2dd4a0', secondary: '#0a0d14' } },
        error: { iconTheme: { primary: '#f05060', secondary: '#0a0d14' } },
      }} />
    </AuthProvider>
  );
}
