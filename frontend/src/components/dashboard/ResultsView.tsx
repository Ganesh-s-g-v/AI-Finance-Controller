import React, { useState, useEffect } from 'react';
import { Search, Filter, UploadCloud } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { DrawerTransaction } from './TransactionDrawer';
import { ReconciliationPanel } from './ReconciliationPanel';
import { getReconciliationResults } from '@/lib/api';

interface ResultsViewProps {
  companyName: string;
  sessionId?: string;
  onSelectTransaction: (tx: DrawerTransaction | null) => void;
  onNavigateToWorkspace?: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  companyName,
  sessionId,
  onSelectTransaction: _onSelectTransaction,
  onNavigateToWorkspace,
}) => {
  const [liveData, setLiveData] = useState<DrawerTransaction[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setLiveData([]);
      return;
    }
    getReconciliationResults(sessionId)
      .then(({ results }) => {
        if (!results || results.length === 0) {
          setLiveData([]);
          return;
        }
        const dTxns: DrawerTransaction[] = results.map((r) => ({
          id: r.id,
          orderId: r.settlement?.order_id || r.invoice?.order_id || r.bank_transaction?.extracted_order_id || 'N/A',
          customerName: r.invoice?.customer_name || 'Customer',
          invoiceId: r.invoice?.invoice_id || 'N/A',
          invoiceDate: r.invoice?.issue_date || 'N/A',
          invoiceGross: Number(r.invoice?.total_amount || 0),
          settlementId: r.settlement?.settlement_id || 'N/A',
          settlementDate: r.settlement?.settlement_date || 'N/A',
          settlementGross: Number(r.settlement?.gross_amount || 0),
          fee: Number(r.settlement?.fee || 0),
          tax: Number(r.settlement?.tax || 0),
          settlementNet: Number(r.settlement?.net_amount || 0),
          bankDate: r.bank_transaction?.txn_date || 'N/A',
          bankDesc: r.bank_transaction?.description || 'N/A',
          bankRef: r.bank_transaction?.reference || 'N/A',
          bankCredit: Number(r.bank_transaction?.credit || r.bank_transaction?.amount || 0),
          confidenceScore: r.confidence_score,
          status: r.status,
          amountDiff: Number(r.amount_difference || 0),
          aiExplanation:
            r.ai_explanation ||
            (r.status === 'MATCHED'
              ? 'All records reconciled successfully.'
              : 'Discrepancy detected across sources.'),
        }));
        setLiveData(dTxns);
        if (dTxns.length > 0) {
          setSelectedId(dTxns[0].id);
        }
      })
      .catch((err) => {
        console.debug('Results load note:', err.message);
        setLiveData([]);
      });
  }, [sessionId]);

  const allData = liveData ?? [];
  const filteredData = allData.filter(
    (t) =>
      searchFilter === '' ||
      t.orderId.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.invoiceId.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const selectedTx = allData.find((t) => t.id === selectedId) || allData[0] || null;

  const handleSelect = (tx: DrawerTransaction) => {
    setSelectedId(tx.id);
  };

  const handleApprove = (id: string) => {
    setLiveData((prev) => {
      const current = prev ?? [];
      return current.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'MATCHED' as const,
              confidenceScore: 99,
              aiExplanation: '✅ Approved by Auditor. Reconciled and marked as MATCHED with full compliance.',
            }
          : t
      );
    });
  };

  const handleReject = (id: string) => {
    setLiveData((prev) => {
      const current = prev ?? [];
      return current.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'EXCEPTION' as const,
              confidenceScore: 40,
              aiExplanation: '⚠️ Flagged by Auditor as unresolved exception. Discrepancy logged for escalation.',
            }
          : t
      );
    });
  };

  const statusBadge = (status: string) => {
    if (status === 'MATCHED') {
      return (
        <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
          Matched
        </span>
      );
    }
    if (status === 'REVIEW_REQUIRED' || status === 'REVIEW') {
      return (
        <span className="bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
          Review
        </span>
      );
    }
    return (
      <span className="bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
        Exception
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
            Reconciliation Audit Engine
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Active Entity: <span className="font-semibold text-brand">{companyName}</span> • {allData.length} records processed
          </p>
        </div>
      </div>

      {allData.length === 0 ? (
        <div className="flex-1 bg-white dark:bg-[#151a24] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-4">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            No active reconciliation batch loaded
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-6">
            Upload your Bank Statement, Payment Gateway Settlements, and Invoices in the Workspace to run a 3-way reconciliation, or resume a previous audit session.
          </p>
          {onNavigateToWorkspace && (
            <button
              onClick={onNavigateToWorkspace}
              className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Go to Workspace &amp; Reconcile</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-[580px]">
          {/* Left Pane: Master List */}
          <div className="flex-[4] flex flex-col bg-white dark:bg-[#151a24] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex gap-2.5 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex-1 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search order, invoice, or customer..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand/40 shadow-sm"
                />
              </div>
              <button className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
                <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="px-3.5 py-2.5">Status</th>
                    <th className="px-3.5 py-2.5">Date</th>
                    <th className="px-3.5 py-2.5">Reference &amp; Client</th>
                    <th className="px-3.5 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredData.map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => handleSelect(tx)}
                      className={`cursor-pointer transition-colors ${
                        selectedId === tx.id
                          ? 'bg-brand/10 dark:bg-brand/20 font-semibold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <td className="px-3.5 py-2.5 w-[90px]">{statusBadge(tx.status)}</td>
                      <td className="px-3.5 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                        {tx.invoiceDate}
                      </td>
                      <td className="px-3.5 py-2.5 truncate max-w-[170px]">
                        <div className="text-slate-900 dark:text-white font-medium truncate">{tx.customerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">{tx.invoiceId !== 'N/A' ? tx.invoiceId : tx.orderId}</div>
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-financial font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(tx.invoiceGross)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Pane: Detail Inspector Panel */}
          <div className="flex-[5] relative h-full">
            <ReconciliationPanel
              transaction={selectedTx}
              onClose={() => setSelectedId(null)}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </div>
        </div>
      )}
    </div>
  );
};
