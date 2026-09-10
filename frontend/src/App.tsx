import React, { useState, useEffect } from 'react';
import { NavTab } from '@/components/layout/PillNavigation';
import { GlassTopBar } from '@/components/layout/GlassTopBar';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { WorkspaceUpload } from '@/components/upload/WorkspaceUpload';
import { ResultsView } from '@/components/dashboard/ResultsView';
import { ReviewView } from '@/components/dashboard/ReviewView';
import { TransactionDrawer, DrawerTransaction } from '@/components/dashboard/TransactionDrawer';
import { AuthProvider, useAuth } from '@/lib/authContext';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { AuthModal } from '@/components/auth/AuthModal';
import { SessionHistoryModal } from '@/components/dashboard/SessionHistoryModal';
import { getCompaniesApi } from '@/lib/api';
import { CompanyData } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

const MainApp: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isDark, setIsDark] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedTx, setSelectedTx] = useState<DrawerTransaction | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyData[]>([]);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  // Load companies
  const loadCompanies = async () => {
    try {
      const data = await getCompaniesApi();
      setCompanies(data);
      if (data.length > 0) {
        setSelectedCompany((prev) => prev || data[0].name);
      } else if (user?.company_name) {
        setSelectedCompany(user.company_name);
      }
    } catch (err) {
      console.debug('Error loading companies:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.company_name) {
        setSelectedCompany(user.company_name);
      }
      loadCompanies();
    }
  }, [isAuthenticated, user]);

  // Theme persistence & DOM class toggle
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  const handleApproveTransaction = (id: string) => {
    if (selectedTx && selectedTx.id === id) {
      setSelectedTx({
        ...selectedTx,
        status: 'MATCHED',
        confidenceScore: 95,
        aiExplanation: '✅ Approved by Chartered Accountant. Marked as MATCHED.',
      });
    }
    alert(`Transaction ${id} approved successfully!`);
  };

  const handleRejectTransaction = (id: string) => {
    if (selectedTx && selectedTx.id === id) {
      setSelectedTx({
        ...selectedTx,
        status: 'EXCEPTION',
        aiExplanation: '⚠️ Flagged by Chartered Accountant as an unresolved exception.',
      });
    }
    alert(`Transaction ${id} flagged as Exception.`);
  };

  const handleViewCompany = (companyName: string) => {
    setSelectedCompany(companyName);
    setActiveTab('results');
  };

  const handleResumeSession = (sessionId: string, companyName: string) => {
    setActiveSessionId(sessionId);
    setSelectedCompany(companyName);
    setActiveTab('results');
  };

  // ── AUTH GATE: show a loader while restoring the session so the
  // dashboard never flashes for a second on failed logins, then the
  // dedicated clean Auth Screen before login ──────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0b0e14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand text-white flex items-center justify-center font-bold text-lg shadow-md shadow-brand/20 animate-pulse">
            ⚡
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Restoring your workspace…
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthScreen
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />
    );
  }

  const renderContent = () => {
    const animationProps = {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 },
      transition: { duration: 0.2 },
      className: 'h-full w-full flex flex-col relative z-10',
    };

    switch (activeTab) {
      case 'dashboard':
        return (
          <motion.div key="dashboard" {...animationProps}>
            <DashboardView
              companies={companies}
              onViewCompany={handleViewCompany}
              onNavigate={(tab) => setActiveTab(tab as NavTab)}
            />
          </motion.div>
        );
      case 'workspace':
        return (
          <motion.div key="workspace" {...animationProps}>
            <WorkspaceUpload
              currentCompanyName={selectedCompany}
              onCompanyNameChange={setSelectedCompany}
              onRunReconciliation={(sessionId, companyName) => {
                if (sessionId) setActiveSessionId(sessionId);
                if (companyName) setSelectedCompany(companyName);
                loadCompanies();
                setActiveTab('results');
              }}
            />
          </motion.div>
        );
      case 'results':
        return (
          <motion.div key="results" {...animationProps}>
            <ResultsView
              companyName={selectedCompany || 'Apex Technologies Pvt Ltd'}
              sessionId={activeSessionId ?? undefined}
              onSelectTransaction={(tx) => setSelectedTx(tx)}
              onNavigateToWorkspace={() => setActiveTab('workspace')}
            />
          </motion.div>
        );
      case 'review':
        return (
          <motion.div key="review" {...animationProps}>
            <ReviewView
              companies={companies}
              activeSessionId={activeSessionId}
              onNavigateToWorkspace={() => setActiveTab('workspace')}
              onViewResults={(company) => {
                setSelectedCompany(company);
                setActiveTab('results');
              }}
            />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0e14] text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased transition-colors duration-200 relative overflow-hidden">
      {/* Top Navigation Bar */}
      <GlassTopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        selectedCompany={selectedCompany}
        onSelectCompany={setSelectedCompany}
        companies={companies}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onNavigateToWorkspace={() => setActiveTab('workspace')}
      />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 flex flex-col relative z-10 min-h-0">
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </main>

      {/* Transaction Detail Drawer */}
      <TransactionDrawer
        isOpen={selectedTx !== null}
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onApprove={handleApproveTransaction}
        onReject={handleRejectTransaction}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Session / Audit History Modal */}
      <SessionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onResumeSession={handleResumeSession}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
