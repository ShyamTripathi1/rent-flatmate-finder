import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { TenantDashboard } from './pages/TenantDashboard';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Loader } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login');

  const navigate = (page: string) => setAuthPage(page as 'login' | 'register');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 text-slate-400">
        <Loader className="w-8 h-8 animate-spin text-brand-500" />
        <p>Loading application...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return authPage === 'login' ? (
      <Login onNavigate={navigate} />
    ) : (
      <Register onNavigate={navigate} />
    );
  }

  return (
    <SocketProvider>
      {user?.role === 'TENANT' && <TenantDashboard />}
      {user?.role === 'OWNER' && <OwnerDashboard />}
      {user?.role === 'ADMIN' && <AdminDashboard />}
    </SocketProvider>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
