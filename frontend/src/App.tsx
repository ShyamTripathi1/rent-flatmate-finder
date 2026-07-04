import React, { useState, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Loader } from 'lucide-react';

// Lazy-load heavy dashboard pages — Vite will split them into separate chunks.
// Login/register loads instantly; dashboards are fetched only when needed.
const TenantDashboard = lazy(() =>
  import('./pages/TenantDashboard').then((m) => ({ default: m.TenantDashboard }))
);
const OwnerDashboard = lazy(() =>
  import('./pages/OwnerDashboard').then((m) => ({ default: m.OwnerDashboard }))
);
const AdminDashboard = lazy(() =>
  import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);

const DashboardLoader = () => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 text-slate-400">
    <Loader className="w-8 h-8 animate-spin text-brand-500" />
    <p>Loading dashboard...</p>
  </div>
);

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

  const renderDashboard = () => {
    if (user?.role === 'TENANT') return <TenantDashboard />;
    if (user?.role === 'OWNER') return <OwnerDashboard />;
    if (user?.role === 'ADMIN') return <AdminDashboard />;
    return <div>Unknown role</div>;
  };

  return (
    <SocketProvider>
      <Suspense fallback={<DashboardLoader />}>
        {renderDashboard()}
      </Suspense>
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
