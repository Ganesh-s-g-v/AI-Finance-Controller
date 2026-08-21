import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar, NavTab } from '@/components/layout/Sidebar';
import { MetricsGrid } from '@/components/dashboard/MetricsGrid';
import { ReconciliationFlowVisualizer } from '@/components/dashboard/ReconciliationFlowVisualizer';
import { TransactionsTable } from '@/components/dashboard/TransactionsTable';
import { TransactionDrawer, DrawerTransaction } from '@/components/dashboard/TransactionDrawer';
import { UploadModal } from '@/components/upload/UploadModal';
import { Button } from '@/components/ui/Button';
import { Play, Download } from 'lucide-react';

export const App: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedTx, setSelectedTx] = useState<DrawerTransaction | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);

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
    alert(`Transaction ${id} approved successfully! Stored in audit trail.`);
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

  return (
    <div className="min-h-screen bg-background-primary text-foreground-primary flex flex-col font-sans antialiased selection:bg-brand/30 bg-mesh transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          exceptionCount={6}
          reviewCount={18}
        />

        {/* Center Content View */}
        <main className="flex-1 p-6 lg:p-8 space-y-8 overflow-y-auto max-w-[calc(100vw-16rem)]">
          {/* Executive Dashboard Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/80">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-surface-elevated text-foreground-secondary border border-border">
                  Q2 FY 2026-27
                </span>
                <span className="text-xs text-foreground-muted">•</span>
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Live Sync Active
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground-primary">
                Reconciliation Overview
              </h2>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Automated 3-way cross-verification: Invoices ➔ Razorpay Settlements ➔ Bank Statements.
              </p>
            </div>

            {/* Quick Primary Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={() => alert("Exporting comprehensive CA Reconciliation Audit Summary...")}
              >
                Export Audit Pack
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Play className="w-3.5 h-3.5 fill-current" />}
                onClick={() => setIsUploadOpen(true)}
                className="shadow-glow-indigo"
              >
                Run Batch Reconciliation
              </Button>
            </div>
          </div>

          {/* 1. Executive Metrics Grid (KPI Cards) */}
          <MetricsGrid />

          {/* 2. Three-Way Reconciliation Visualizer */}
          <ReconciliationFlowVisualizer />

          {/* 3. Detailed Financial Transactions Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground-primary tracking-tight">
                  Reconciliation Register
                </h3>
                <p className="text-xs text-foreground-secondary">
                  Inspect matched records, review ambiguous cases, and resolve exceptions.
                </p>
              </div>
            </div>

            <TransactionsTable
              onSelectTransaction={(tx) => setSelectedTx(tx)}
            />
          </div>
        </main>
      </div>

      {/* Side Drawer for Transaction Inspection & Gemini Explanation */}
      <TransactionDrawer
        isOpen={selectedTx !== null}
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onApprove={handleApproveTransaction}
        onReject={handleRejectTransaction}
      />

      {/* Upload 3-Source CSV Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
};

export default App;
