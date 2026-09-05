import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CheckCircle,
  FileText,
  History,
  LogOut,
  Shield,
} from 'lucide-react';
import { NavTab } from './PillNavigation';
import { useAuth } from '@/lib/authContext';
import { CompanyData } from '@/types';

interface GlassTopBarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  selectedCompany: string;
  onSelectCompany: (company: string) => void;
  companies: CompanyData[];
  onOpenAuth: () => void;
  onOpenHistory: () => void;
  onNavigateToWorkspace: () => void;
}

const navItems: { id: NavTab; label: string; icon: React.FC<any> }[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'workspace', label: 'Workspace', icon: LayoutDashboard },
  { id: 'results', label: 'Reconciliation', icon: CheckCircle },
  { id: 'review', label: 'Review Queue', icon: FileText },
];

export const GlassTopBar: React.FC<GlassTopBarProps> = ({
  activeTab,
  onSelectTab,
  isDark,
  onToggleTheme,
  selectedCompany: _selectedCompany,
  onSelectCompany: _onSelectCompany,
  companies: _companies,
  onOpenAuth,
  onOpenHistory,
  onNavigateToWorkspace: _onNavigateToWorkspace,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-2.5 bg-white/90 dark:bg-[#0d1117]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors duration-200">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center font-bold text-sm shadow-md shadow-brand/20 group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <span className="font-bold text-slate-900 dark:text-white tracking-tight text-sm hidden sm:inline">
            Finance<span className="text-brand">Ops</span>
          </span>
        </div>
      </div>

      {/* Center: Navigation Pills */}
      <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-full p-1 border border-slate-200/80 dark:border-slate-700/80 shadow-inner">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative px-4 py-1.5 text-xs font-semibold transition-colors duration-200 rounded-full flex items-center gap-1.5 ${
                isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active-bg"
                  className="absolute inset-0 bg-white dark:bg-[#1a2130] rounded-full border border-slate-200 dark:border-slate-700 shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right Actions: History, Theme, Auth & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Audit / Session History Button */}
        <button
          onClick={onOpenHistory}
          title="Open Audit History"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all shadow-sm"
        >
          <History className="w-3.5 h-3.5 text-brand" />
          <span className="hidden lg:inline">History</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isDark ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            )}
          </svg>
        </button>

        {/* Auth / Profile Area */}
        {isAuthenticated && user ? (
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2 p-1 pl-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-all shadow-sm"
            >
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user.name}</div>
                <div className="text-[10px] text-brand font-semibold leading-tight">{user.role}</div>
              </div>
              <div className="w-7 h-7 rounded-lg bg-brand/15 text-brand font-bold flex items-center justify-center text-xs overflow-hidden border border-brand/20">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0)
                )}
              </div>
            </button>

            <AnimatePresence>
              {isProfileDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  className="absolute top-full right-0 mt-2 w-60 bg-white dark:bg-[#181e2b] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-50"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{user.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-brand/10 text-brand">
                      {user.role}
                    </span>
                  </div>

                  <div className="py-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        onOpenHistory();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <History className="w-3.5 h-3.5 text-brand" />
                      My Audit History
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl shadow-md shadow-brand/20 transition-all"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </div>
  );
};
