import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Home, Mail, Lock, ArrowRight, AlertCircle, Loader, ChevronDown, ChevronRight } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

interface LoginProps {
  onNavigate: (page: string) => void;
}

interface QuickUser {
  name: string;
  email: string;
  role: string;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [tenantUsers, setTenantUsers] = useState<QuickUser[]>([]);
  const [ownerUsers, setOwnerUsers] = useState<QuickUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showTenants, setShowTenants] = useState(false);
  const [showOwners, setShowOwners] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const fetchQuickUsers = () => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    setUsersLoading(true);
    fetch(`${apiBase}/auth/quick-login-users`)
      .then(r => r.json())
      .then(data => {
        if (data.users && Array.isArray(data.users)) {
          setTenantUsers(data.users.filter((u: QuickUser) => u.role === 'TENANT'));
          setOwnerUsers(data.users.filter((u: QuickUser) => u.role === 'OWNER'));
        }
      })
      .catch(() => { })
      .finally(() => setUsersLoading(false));
  };

  // Fetch on mount and poll every 30 s so counts update automatically after new registrations
  useEffect(() => {
    fetchQuickUsers();
    const interval = setInterval(fetchQuickUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleTenants = () => {
    const next = !showTenants;
    setShowTenants(next);
    if (next) fetchQuickUsers(); // Refresh when opening
  };

  const handleToggleOwners = () => {
    const next = !showOwners;
    setShowOwners(next);
    if (next) fetchQuickUsers(); // Refresh when opening
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      setError(null);
      try {
        await loginWithGoogle(tokenResponse.access_token);
      } catch (err: any) {
        setError(err?.message || 'Google sign-in failed. Please try again.');
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => {
      setError('Google sign-in was cancelled or failed.');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login(email);
      // Auth context updates user state, which triggers app re-render and dashboard routing
    } catch (err: any) {
      setError(err || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string) => {
    setEmail(quickEmail);
    setError(null);
    setIsSubmitting(true);
    try {
      await login(quickEmail);
    } catch (err: any) {
      setError(err || 'Failed to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 px-4 relative overflow-hidden">

      {/* Soft glow blobs (subtle light on red background) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-400/20 rounded-full blur-[120px] pointer-events-none" />

      {/* No text or patterns, just the gradient background */}


      <div className="w-full max-w-[1400px] grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-stretch min-h-screen relative z-10">

        {/* Left Column: Marketing Content */}
        <div className="hidden md:flex flex-col justify-start items-center text-center self-start pt-12 md:pt-16 w-full">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-4 leading-tight">
            India's favourite flatmate finder
          </h1>
          <p className="text-2xl md:text-3xl text-red-100 font-semibold mt-2 mb-12">
            Free to list, search &amp; communicate
          </p>

          {/* Marketing Image */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 w-full max-w-[90%] lg:max-w-[550px] mx-auto mt-16 transform hover:scale-[1.02] transition-transform duration-500">
            <img
              src="https://play-lh.googleusercontent.com/qrAkN3LSRwBSgUXSFkOYDVJXGb1EgtlPwD_he1ad65sSQa9es4-LQe_RLuHPrmzkXTs=w3840-h2160-rw"
              alt="Flatmate Finders"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* Right Column: Login Card */}
        <div className="flex justify-center md:justify-end w-full self-center">
          <div className="w-full max-w-md bg-gradient-to-br from-yellow-100 via-pink-100 to-pink-200 border border-pink-300 p-8 rounded-2xl shadow-sm relative">
            <div className="flex flex-col items-center mb-8">
              <div className="p-3 bg-brand-50 rounded-xl mb-3 border border-brand-100 text-brand-600">
                <Home className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Flatmate Finder
              </h2>
              <p className="text-sm text-slate-500 mt-2 text-center">
                Sign in to search rooms and discover compatible flatmates
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Sign-In Button — only shown when Client ID is configured */}
            {googleClientId && (
              <>
                <button
                  type="button"
                  onClick={() => handleGoogleLogin()}
                  disabled={isGoogleLoading || isSubmitting}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-xl py-3 px-4 font-semibold text-slate-700 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mb-5"
                >
                  {isGoogleLoading ? (
                    <Loader className="w-5 h-5 animate-spin text-slate-500" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
                </button>

                {/* OR divider */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-medium">OR</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-xl py-3.5 px-4 font-semibold shadow-lg shadow-brand-500/15 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Quick login options */}
            <div className="mt-6 pt-6 border-t border-red-200">
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wider text-center mb-3">
                Quick Sign-In (Test Accounts)
              </p>

              {/* Tenants - Collapsible */}
              <div className="mb-2">
                <button
                  onClick={handleToggleTenants}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors group"
                >
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-red-500 transition-colors flex items-center gap-1.5">
                    {usersLoading && tenantUsers.length === 0
                      ? <Loader className="w-3 h-3 animate-spin" />
                      : null}
                    Tenants ({tenantUsers.length})
                  </span>
                  {showTenants
                    ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                {showTenants && (
                  <div className="space-y-1 mt-1">
                    {tenantUsers.map(u => (
                      <button
                        key={u.email}
                        onClick={() => handleQuickLogin(u.email)}
                        className="w-full text-left px-3 py-2 border border-red-100 rounded-xl text-xs font-medium bg-red-50 hover:bg-red-100 hover:border-red-300 transition-colors flex justify-between items-center"
                      >
                        <span className="font-semibold text-slate-700">{u.name}</span>
                        <span className="text-slate-500 truncate max-w-[55%] text-right">{u.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Owners - Collapsible */}
              <div className="mb-2">
                <button
                  onClick={handleToggleOwners}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors group"
                >
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-red-500 transition-colors flex items-center gap-1.5">
                    {usersLoading && ownerUsers.length === 0
                      ? <Loader className="w-3 h-3 animate-spin" />
                      : null}
                    Owners ({ownerUsers.length})
                  </span>
                  {showOwners
                    ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                {showOwners && (
                  <div className="space-y-1 mt-1">
                    {ownerUsers.map(u => (
                      <button
                        key={u.email}
                        onClick={() => handleQuickLogin(u.email)}
                        className="w-full text-left px-3 py-2 border border-red-100 rounded-xl text-xs font-medium bg-red-50 hover:bg-red-100 hover:border-red-300 transition-colors flex justify-between items-center"
                      >
                        <span className="font-semibold text-slate-700">{u.name}</span>
                        <span className="text-slate-500 truncate max-w-[55%] text-right">{u.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin */}
              <div className="mt-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 px-2">Admin</p>
                <button
                  onClick={() => handleQuickLogin('admin@flatmatefinder.com')}
                  className="w-full text-left px-3 py-2 border border-red-200 rounded-xl text-xs font-medium bg-red-50 hover:bg-red-100 hover:border-red-400 transition-colors flex justify-between items-center"
                >
                  <span className="font-semibold text-slate-700">Platform Admin</span>
                  <span className="text-slate-500 truncate max-w-[55%] text-right">admin@flatmatefinder.com</span>
                </button>
              </div>
            </div>

            <div className="mt-6 text-center border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-500">
                Don't have an account?{' '}
                <button
                  onClick={() => onNavigate('register')}
                  className="text-brand-600 hover:text-brand-500 font-semibold transition-colors focus:outline-none"
                >
                  Sign up today
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
