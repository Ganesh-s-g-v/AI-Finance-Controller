import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, User, Building, Shield, Sparkles, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { UserRole } from '@/types';

interface AuthScreenProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ isDark, onToggleTheme }) => {
  const { login, register, demoLogin } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'demo'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('CONTROLLER');
  const [regCompany, setRegCompany] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await register(regName, regEmail, regPassword, regRole, regCompany || undefined);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoClick = async (role: 'cfo' | 'auditor' | 'admin') => {
    setError(null);
    setIsLoading(true);
    try {
      await demoLogin(role);
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0b0e14] text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200 relative overflow-hidden">
      {/* Top Bar with Brand & Theme Toggle */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center font-bold text-sm shadow-md shadow-brand/20">
            ⚡
          </div>
          <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base">
            Finance<span className="text-brand">Ops</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isDark ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Main Center Card */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md bg-white dark:bg-[#151a24] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden"
        >
          {/* Header Card */}
          <div className="px-7 pt-7 pb-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#151a24]">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">AI Finance Controller</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Deterministic 3-Source Reconciliation &amp; Audit</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 mt-4 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => { setTab('login'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  tab === 'login'
                    ? 'bg-white dark:bg-[#1a2130] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setTab('register'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  tab === 'register'
                    ? 'bg-white dark:bg-[#1a2130] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => { setTab('demo'); setError(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  tab === 'demo'
                    ? 'bg-brand text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                Demo 1-Click
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mx-7 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-start gap-2.5 text-rose-700 dark:text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Tab 1: Sign In */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="p-7 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="controller@company.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <span className="text-[11px] text-brand hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl shadow-md shadow-brand/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {isLoading ? 'Authenticating...' : 'Sign In to Workspace'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="text-center pt-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Or test immediately with{' '}
                  <button
                    type="button"
                    onClick={() => setTab('demo')}
                    className="text-brand font-semibold hover:underline"
                  >
                    Demo 1-Click
                  </button>
                </span>
              </div>
            </form>
          )}

          {/* Tab 2: Sign Up */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="p-7 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Sarah Jenkins"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="sarah@apextech.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand/40 shadow-sm"
                  >
                    <option value="CONTROLLER">Finance Controller</option>
                    <option value="AUDITOR">Forensic Auditor</option>
                    <option value="ADMIN">Administrator</option>
                    <option value="ANALYST">Financial Analyst</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company / Entity
                  </label>
                  <div className="relative">
                    <Building className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Apex Tech Pvt Ltd"
                      value={regCompany}
                      onChange={(e) => setRegCompany(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 shadow-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl shadow-md shadow-brand/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-3"
              >
                {isLoading ? 'Creating Account...' : 'Create Account & Start'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Tab 3: Demo 1-Click Switcher */}
          {tab === 'demo' && (
            <div className="p-7 space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Click any pre-configured role to immediately enter the dashboard with full operational datasets:
              </p>

              {/* CFO Option */}
              <button
                type="button"
                onClick={() => handleDemoClick('cfo')}
                disabled={isLoading}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 hover:border-brand/50 transition-all group flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center text-xs border border-purple-200 dark:border-purple-500/30">
                    CFO
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand transition-colors">
                      Sarah Jenkins
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Chief Financial Officer • Apex Technologies Pvt Ltd
                    </p>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-brand opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Auditor Option */}
              <button
                type="button"
                onClick={() => handleDemoClick('auditor')}
                disabled={isLoading}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 hover:border-brand/50 transition-all group flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-200 dark:border-emerald-500/30">
                    AUD
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand transition-colors">
                      Marcus Vance
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Senior Forensic Auditor • Zenith Retail Solutions
                    </p>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Admin Option */}
              <button
                type="button"
                onClick={() => handleDemoClick('admin')}
                disabled={isLoading}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 hover:border-brand/50 transition-all group flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-200 dark:border-amber-500/30">
                    ADM
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand transition-colors">
                      Alexander Wright
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      System Administrator • Acme Global Financials
                    </p>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-4 text-center text-xs text-slate-400">
        AI Finance Controller • Continuous Verification Engine
      </footer>
    </div>
  );
};
