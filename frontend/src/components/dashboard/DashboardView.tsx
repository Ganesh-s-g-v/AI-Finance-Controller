import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, CheckCircle, AlertTriangle, UploadCloud, FileText, Activity } from 'lucide-react';
import { getDashboardSummary } from '@/lib/api';
import { CompanyData } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface DashboardViewProps {
  onViewCompany: (companyName: string) => void;
  onNavigate: (tab: string) => void;
  companies: CompanyData[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onViewCompany, onNavigate, companies: initialCompanies }) => {
  const [companiesList, setCompaniesList] = useState<CompanyData[]>(initialCompanies);
  const [totalReconciled, setTotalReconciled] = useState<number>(0);
  const [avgMatchRate, setAvgMatchRate] = useState<number>(100);
  const [pendingExceptions, setPendingExceptions] = useState<number>(0);

  useEffect(() => {
    if (initialCompanies) {
      setCompaniesList(initialCompanies);
      const total = initialCompanies.reduce((sum, c) => sum + (c.invoice_amount || c.bank_amount || 0), 0);
      setTotalReconciled(total);
      if (initialCompanies.length > 0) {
        const avg = Math.round(initialCompanies.reduce((sum, c) => sum + c.matchRate, 0) / initialCompanies.length);
        setAvgMatchRate(avg);
      }
    }
  }, [initialCompanies]);

  useEffect(() => {
    getDashboardSummary()
      .then((summary) => {
        if (summary) {
          setTotalReconciled(Number(summary.total_amount_reconciled || 0));
          setAvgMatchRate(Math.round(summary.match_rate || (summary.total_transactions === 0 ? 100 : 0)));
          setPendingExceptions(summary.exceptions || 0);
        }
      })
      .catch((err) => console.debug('Dashboard summary note:', err.message));
  }, []);

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="w-full mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-[32px] font-semibold tracking-tight text-foreground-primary">Financial Overview</h2>
          <p className="text-[15px] text-foreground-secondary mt-1">
            Enterprise Multi-Entity Continuous Reconciliation &amp; Audit Engine
          </p>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 auto-rows-[160px]">
        {/* Large Main Stat (Total Reconciled) */}
        <motion.div
          className="md:col-span-8 row-span-2 relative overflow-hidden bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/5 rounded-3xl p-8 shadow-apple-glass flex flex-col justify-between group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-brand/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold tracking-wide text-foreground-secondary uppercase mb-2">
                Total Reconciled Turnover
              </p>
              <h3 className="text-6xl font-bold font-financial tracking-tighter text-foreground-primary">
                {formatCurrency(totalReconciled)}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm font-semibold">
              <TrendingUp className="w-4 h-4" />
              +12.4%
            </div>
          </div>

          <div className="relative z-10 flex items-end justify-between mt-8">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-foreground-secondary uppercase font-semibold mb-1">Avg Accuracy</p>
                <p className="text-2xl font-bold text-foreground-primary">{avgMatchRate}%</p>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary uppercase font-semibold mb-1">Pending Exceptions</p>
                <p className="text-2xl font-bold text-warning">{pendingExceptions} Items</p>
              </div>
            </div>

            {/* Sparkline */}
            <div className="flex items-end gap-1.5 h-16 opacity-60">
              {[40, 70, 45, 90, 65, 100, 80, 120, 95, 110, 85, 130].map((h, i) => (
                <div key={i} className="w-2.5 bg-brand rounded-t-sm" style={{ height: `${(h / 130) * 100}%` }} />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions (Top Right) */}
        <motion.div
          className="md:col-span-4 row-span-1 bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/5 rounded-3xl p-6 shadow-apple-glass flex flex-col justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-sm font-semibold tracking-wide text-foreground-secondary uppercase mb-4">
            Quick Actions
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => onNavigate('workspace')}
              className="flex-1 bg-surface border border-border rounded-xl p-3 flex flex-col items-center gap-2 hover:border-brand/30 hover:bg-white/50 dark:hover:bg-white/5 transition-all shadow-sm cursor-pointer"
            >
              <UploadCloud className="w-5 h-5 text-brand" />
              <span className="text-xs font-semibold">Upload</span>
            </button>
            <button
              onClick={() => onNavigate('review')}
              className="flex-1 bg-surface border border-border rounded-xl p-3 flex flex-col items-center gap-2 hover:border-warning/30 hover:bg-white/50 dark:hover:bg-white/5 transition-all shadow-sm cursor-pointer"
            >
              <AlertTriangle className="w-5 h-5 text-warning" />
              <span className="text-xs font-semibold">Review</span>
            </button>
            <button
              onClick={() => onNavigate('review')}
              className="flex-1 bg-surface border border-border rounded-xl p-3 flex flex-col items-center gap-2 hover:border-info/30 hover:bg-white/50 dark:hover:bg-white/5 transition-all shadow-sm cursor-pointer"
            >
              <FileText className="w-5 h-5 text-info" />
              <span className="text-xs font-semibold">Export</span>
            </button>
          </div>
        </motion.div>

        {/* Active Workspaces / Companies (Right Middle & Bottom) */}
        <motion.div
          className="md:col-span-4 row-span-2 bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/5 rounded-3xl p-6 shadow-apple-glass flex flex-col overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold tracking-wide text-foreground-secondary uppercase">
                Active Client Entities
              </p>
              <span className="text-xs text-foreground-tertiary">{companiesList.length} registered workspaces</span>
            </div>
            <button
              onClick={() => onNavigate('review')}
              className="text-xs font-semibold text-brand hover:underline"
            >
              View All
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-1 custom-scrollbar">
            {companiesList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <p className="text-xs font-semibold text-foreground-secondary mb-1">No entities registered</p>
                <p className="text-[11px] text-foreground-tertiary mb-3">Upload your first transaction batch in Workspace.</p>
                <button
                  onClick={() => onNavigate('workspace')}
                  className="px-3 py-1.5 bg-brand hover:bg-brand-hover text-white text-[11px] font-semibold rounded-lg shadow-sm transition-all"
                >
                  Go to Workspace
                </button>
              </div>
            ) : (
              companiesList.map((company) => (
                <div
                  key={company.id}
                  onClick={() => onViewCompany(company.name)}
                  className="bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-2xl p-3.5 cursor-pointer hover:border-brand/40 transition-all group flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3 truncate pr-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        company.matchRate >= 90
                          ? 'bg-success/10 text-success'
                          : company.matchRate >= 70
                          ? 'bg-warning/10 text-warning'
                          : 'bg-error/10 text-error'
                      }`}
                    >
                      {company.matchRate >= 90 ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Activity className="w-4 h-4" />
                      )}
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-semibold text-foreground-primary group-hover:text-brand transition-colors truncate">
                        {company.name}
                      </h4>
                      <p className="text-[11px] text-foreground-secondary truncate">{company.industry}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                      company.matchRate >= 90 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                    }`}>
                      {company.matchRate}%
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-foreground-muted group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* System Health / Exceptions (Bottom Left) */}
        <motion.div
          className="md:col-span-8 row-span-1 bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/20 dark:border-white/5 rounded-3xl p-6 shadow-apple-glass flex items-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="w-14 h-14 rounded-2xl bg-error/10 text-error flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground-primary">
              Forensic Audit Engine Ready
            </h3>
            <p className="text-xs text-foreground-secondary mt-0.5">
              Three-source deterministic verification across invoices, settlements, and bank credits.
            </p>
          </div>
          <button
            onClick={() => onNavigate('review')}
            className="px-4 py-2 rounded-xl bg-surface border border-border shadow-sm text-xs font-semibold hover:bg-surface-elevated transition-colors cursor-pointer shrink-0"
          >
            Review Queue
          </button>
        </motion.div>
      </div>
    </div>
  );
};
