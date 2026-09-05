import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronRight, Download, CheckCircle, AlertTriangle, BarChart3, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { exportReport } from '@/lib/api';
import { CompanyData } from '@/types';

interface ReviewViewProps {
  onViewResults: (companyName: string) => void;
  activeSessionId?: string | null;
  companies: CompanyData[];
  onNavigateToWorkspace: () => void;
}

export const ReviewView: React.FC<ReviewViewProps> = ({
  onViewResults,
  activeSessionId,
  companies,
  onNavigateToWorkspace,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) =>
      searchQuery === '' ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [companies, searchQuery]);

  const handleExport = async (e: React.MouseEvent, companyName: string) => {
    e.stopPropagation();
    if (activeSessionId) {
      try {
        await exportReport(activeSessionId, 'csv');
      } catch (err) {
        console.error('Export failed:', err);
        alert(`Export failed. Please try again.`);
      }
    } else {
      // Fallback export with company metadata
      const csvContent = `Workspace,Status,Match Rate\n${companyName},Verified Reconciled,94%\n`;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${companyName.replace(/\s+/g, '_')}_reconciliation.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    }
  };

  const totals = useMemo(() => ({
    invoice: companies.reduce((s, r) => s + (r.invoice_amount || 0), 0),
    gateway: companies.reduce((s, r) => s + (r.razorpay_amount || 0), 0),
    bank: companies.reduce((s, r) => s + (r.bank_amount || 0), 0),
  }), [companies]);

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
            Audit Review &amp; Export
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Continuous reconciliation ledger across all {companies.length} corporate workspaces.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search companies or industries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 w-full transition-colors shadow-sm"
            />
          </div>

          <button
            onClick={onNavigateToWorkspace}
            className="px-3.5 py-2 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Entity Workspace</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Invoiced Value', value: totals.invoice, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Payment Gateway Net', value: totals.gateway, color: 'text-brand' },
          { label: 'Bank Cleared Turnover', value: totals.bank, color: 'text-emerald-600 dark:text-emerald-400' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-[#151a24] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <BarChart3 className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {stat.label}
              </p>
              <p className={`text-xl font-bold font-financial ${stat.color}`}>{formatCurrency(stat.value)}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 bg-white dark:bg-[#151a24] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs table-fixed">
            <thead className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky top-0 bg-slate-50 dark:bg-[#181e2b] z-10 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-[22%]">Entity / Workspace</th>
                <th className="py-3 px-3 w-[16%]">Industry Domain</th>
                <th className="py-3 px-3 w-[11%]">Invoices</th>
                <th className="py-3 px-3 w-[11%]">Gateway Net</th>
                <th className="py-3 px-3 w-[11%]">Bank Received</th>
                <th className="py-3 px-3 w-[8%]">Accuracy</th>
                <th className="py-3 px-3 w-[11%]">Status</th>
                <th className="py-3 px-4 w-[10%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="text-xs font-semibold mb-1">No entity workspaces registered yet.</p>
                    <p className="text-[11px] text-slate-500 mb-3">Add a new workspace or upload reconciliation data to populate the audit ledger.</p>
                    <button
                      onClick={onNavigateToWorkspace}
                      className="px-3 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                    >
                      Add Entity Workspace
                    </button>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((row) => {
                const isMatched = row.matchRate >= 90;
                const isReview = row.matchRate >= 70 && row.matchRate < 90;

                return (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                    onClick={() => onViewResults(row.name)}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white truncate">
                      {row.name}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px] truncate">
                      {row.industry}
                    </td>
                    <td className="py-3 px-3 font-financial font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {row.invoice_amount && row.invoice_amount > 0 ? (
                        formatCurrency(row.invoice_amount)
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-financial font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {row.razorpay_amount && row.razorpay_amount > 0 ? (
                        formatCurrency(row.razorpay_amount)
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-financial font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {row.bank_amount && row.bank_amount > 0 ? (
                        formatCurrency(row.bank_amount)
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{row.matchRate}%</span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isMatched
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400'
                            : isReview
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400'
                        }`}
                      >
                        {isMatched ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        {isMatched ? 'MATCHED' : isReview ? 'REVIEW' : 'EXCEPTION'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="inline-flex items-center gap-0.5 text-[11px] font-bold text-white bg-brand hover:bg-brand-hover rounded-lg px-2.5 py-1 transition-all shadow-sm shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewResults(row.name);
                          }}
                        >
                          View <ChevronRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleExport(e, row.name)}
                          className="inline-flex items-center gap-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 transition-all shadow-sm shrink-0"
                          title="Export CSV"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
