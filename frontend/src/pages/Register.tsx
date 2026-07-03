import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Home, Mail, Lock, User, Shield, ArrowRight, AlertCircle, Loader, UserCheck } from 'lucide-react';

interface RegisterProps {
  onNavigate: (page: string) => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'TENANT' | 'OWNER'>('TENANT');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      setError('Please fill in all fields.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await register(email, password, role, name);
      // After successful registration, navigate to login so that the owner/tenant quick login sections reflect the new user.
      onNavigate('login');
    } catch (err: any) {
      setError(err || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-orange-100 to-amber-200 py-12 px-4 relative overflow-hidden">
      {/* Background gradients (warm) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-300/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-300/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/40 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-2xl shadow-sm relative">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-red-100 rounded-xl mb-3 border border-red-200 text-red-500">
            <Home className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Create Account
          </h2>
          <p className="text-sm text-slate-500 mt-2 text-center">
            Sign up to find rooms or manage rental listings
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
              />
            </div>
          </div>

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
                placeholder="john@example.com"
                className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Choose Your Role
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('TENANT')}
                className={`p-4 rounded-xl border text-left transition-all focus:outline-none flex flex-col justify-between h-28 ${
                  role === 'TENANT'
                    ? 'border-red-500 bg-red-50 text-red-900'
                    : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <UserCheck className={`w-6 h-6 ${role === 'TENANT' ? 'text-red-500' : 'text-slate-400'}`} />
                  {role === 'TENANT' && <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />}
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">Looking for room</p>
                  <p className="text-xs text-slate-500 mt-0.5">I need a place to rent</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('OWNER')}
                className={`p-4 rounded-xl border text-left transition-all focus:outline-none flex flex-col justify-between h-28 ${
                  role === 'OWNER'
                    ? 'border-red-500 bg-red-50 text-red-900'
                    : 'border-slate-300 bg-white text-slate-500 hover:border-slate-400'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <Shield className={`w-6 h-6 ${role === 'OWNER' ? 'text-red-500' : 'text-slate-400'}`} />
                  {role === 'OWNER' && <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />}
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">Room Owner</p>
                  <p className="text-xs text-slate-500 mt-0.5">I have space to lease</p>
                </div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl py-3.5 px-4 font-semibold shadow-lg shadow-red-500/15 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                Sign Up
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-200 pt-6">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-red-500 hover:text-red-600 font-semibold transition-colors focus:outline-none"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
export default Register;
