import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, User, Building, Shield, Sparkles, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { UserRole } from '@/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register' | 'demo';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const { login, register, demoLogin } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'demo'>(defaultTab);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('CONTROLLER');
  const [regCompany, setRegCompany] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
      onClose();
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
      onClose();
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
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Soft clean backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white dark:bg-[#151a24] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header Banner */}
          <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#151a24]">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Finance Controller</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Enterprise Verification &amp; Reconciliation</p>
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
            <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-start gap-2.5 text-rose-700 dark:text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Tab 1: Sign In */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 shadow-sm"
                  />
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
            </form>
          )}

          {/* Tab 2: Sign Up */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-3.5 max-h-[70vh] overflow-y-auto custom-scrollbar">
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
                  Email
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
                    Company
                  </label>
                  <div className="relative">
                    <Building className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Apex Tech"
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
            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Click a role to enter with full operational datasets:
              </p>

              {/* CFO Option */}
              <button
                type="button"
                onClick={() => handleDemoClick('cfo')}
                disabled={isLoading}
                className="w-full text-left p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 hover:border-brand/50 transition-all group flex items-center justify-between shadow-sm"
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
                      Chief Financial Officer • Apex Technologies
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
                className="w-full text-left p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 hover:border-brand/50 transition-all group flex items-center justify-between shadow-sm"
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
                className="w-full text-left p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800 hover:border-brand/50 transition-all group flex items-center justify-between shadow-sm"
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
      </div>
    </AnimatePresence>
  );
};
