import React, { useState } from 'react';
import { Lock, Mail, ArrowLeft, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { ThemeToggle } from '../components/ThemeToggle';
import { LunoraLogo } from '../components/LunoraLogo';

interface AdminLoginPageProps {
  onLoginSuccess: (userEmail: string) => void;
  onBack: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onBack,
  onShowToast,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Invalid email or password.');
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabase();
      if (!supabase) {
        setErrorMessage('Invalid email or password.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error || !data?.session || !data?.user) {
        setErrorMessage('Invalid email or password.');
        setLoading(false);
        return;
      }

      onLoginSuccess(data.user.email || cleanEmail);
      onShowToast('Signed in successfully.', 'success');
    } catch {
      setErrorMessage('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Top Controls: Back Link & Theme Toggle */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-[#a09c91] hover:text-[#e6ca85] transition-colors py-1.5 px-3 rounded-lg bg-white/5 border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </button>

          <ThemeToggle variant="admin" />
        </div>

        {/* Login Box */}
        <div className="rounded-xl glass-card p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          
          <div className="text-center space-y-3 pb-6 border-b border-[#e6ca85]/15">
            <div className="flex justify-center">
              <LunoraLogo size="sm" />
            </div>
            <h1 className="font-serif text-2xl font-normal text-[#edebe6]">
              Admin Login
            </h1>
          </div>

          {errorMessage && (
            <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-light flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-[#a09c91] mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#e6ca85]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 min-h-[44px] sm:min-h-[46px] rounded-lg bg-[#0b0c0f]/80 border border-[#e6ca85]/30 text-[16px] sm:text-xs text-[#edebe6] focus:outline-none focus:border-[#e6ca85]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest text-[#a09c91] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#e6ca85]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 min-h-[44px] sm:min-h-[46px] rounded-lg bg-[#0b0c0f]/80 border border-[#e6ca85]/30 text-[16px] sm:text-xs text-[#edebe6] focus:outline-none focus:border-[#e6ca85]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#a09c91] hover:text-[#e6ca85] transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] sm:min-h-[46px] px-4 rounded-lg text-xs sm:text-[13px] font-semibold uppercase tracking-wider bg-gradient-to-r from-[#e6ca85] via-[#d8b86d] to-[#c8aa62] text-[#0b0c0f] hover:brightness-105 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-sm disabled:opacity-50 mt-2"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
