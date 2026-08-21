import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronRight, 
  Download,
  Sparkles
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { DrawerTransaction } from './TransactionDrawer';

interface TransactionsTableProps {
  onSelectTransaction: (tx: DrawerTransaction) => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  onSelectTransaction,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MATCHED' | 'REVIEW_REQUIRED' | 'EXCEPTION'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Production-grade mock sample dataset based on locked CSV schemas
  const [transactions] = useState<DrawerTransaction[]>([
    {
      id: 'tx-1',
      orderId: 'ORD-1001',
      customerName: 'Apex Technologies Pvt Ltd',
      invoiceId: 'INV-2026-001',
      invoiceDate: '2026-08-10',
      invoiceGross: 11800.00,
      settlementId: 'SETTL-8001',
      settlementDate: '2026-08-11',
      settlementGross: 11800.00,
      fee: 236.00,
      tax: 42.48,
      settlementNet: 11521.52,
      bankDate: '2026-08-11',
      bankDesc: 'Razorpay Settlement ORD-1001',
      bankRef: 'CMS-RP-8001',
      bankCredit: 11521.52,
      confidenceScore: 98,
      status: 'MATCHED',
      amountDiff: 0.00,
      aiExplanation: '100% deterministic match. Order ID exact match. Razorpay settlement fee formula validated. Bank credit matches net payout with ₹0.00 variance.',
    },
    {
      id: 'tx-2',
      orderId: 'ORD-1002',
      customerName: 'Zenith Retail Solutions',
      invoiceId: 'INV-2026-002',
      invoiceDate: '2026-08-11',
      invoiceGross: 17700.00,
      settlementId: 'SETTL-8002',
      settlementDate: '2026-08-12',
      settlementGross: 17700.00,
      fee: 354.00,
      tax: 63.72,
      settlementNet: 17282.28,
      bankDate: '2026-08-12',
      bankDesc: 'Razorpay Settlement ORD-1002',
      bankRef: 'CMS-RP-8002',
      bankCredit: 17282.28,
      confidenceScore: 96,
      status: 'MATCHED',
      amountDiff: 0.00,
      aiExplanation: 'Perfect 3-way reconciliation across all 3 source CSV records. Order ID matches reference.',
    },
    {
      id: 'tx-3',
      orderId: 'ORD-1003',
      customerName: 'Bluefin Logistics Ltd',
      invoiceId: 'INV-2026-003',
      invoiceDate: '2026-08-12',
      invoiceGross: 10030.00,
      settlementId: 'SETTL-8003',
      settlementDate: '2026-08-13',
      settlementGross: 10030.00,
      fee: 200.60,
      tax: 36.11,
      settlementNet: 9793.29,
      bankDate: '2026-08-13',
      bankDesc: 'Razorpay Payout ORD-1003',
      bankRef: '',
      bankCredit: 9793.29,
      confidenceScore: 88,
      status: 'MATCHED',
      amountDiff: 0.00,
      aiExplanation: 'Bank reference was blank, but order_id was deterministically extracted from narration string "Razorpay Payout ORD-1003". Net amount matches accurately.',
    },
    {
      id: 'tx-4',
      orderId: 'ORD-1004',
      customerName: 'CloudNova Infotech',
      invoiceId: 'INV-2026-004',
      invoiceDate: '2026-08-13',
      invoiceGross: 29500.00,
      settlementId: 'SETTL-8004',
      settlementDate: '2026-08-14',
      settlementGross: 29500.00,
      fee: 590.00,
      tax: 106.20,
      settlementNet: 28803.80,
      bankDate: '2026-08-14',
      bankDesc: 'Razorpay Settlement ORD-1004',
      bankRef: 'CMS-RP-8004',
      bankCredit: 28803.80,
      confidenceScore: 98,
      status: 'MATCHED',
      amountDiff: 0.00,
      aiExplanation: 'Full 3-source match verified. Fee formula exact.',
    },
    {
      id: 'tx-5',
      orderId: 'ORD-1005',
      customerName: 'Starlight Ventures LLP',
      invoiceId: 'INV-2026-005',
      invoiceDate: '2026-08-14',
      invoiceGross: 7080.00,
      settlementId: 'SETTL-8005',
      settlementDate: '2026-08-15',
      settlementGross: 7080.00,
      fee: 141.60,
      tax: 25.49,
      settlementNet: 6912.91,
      bankDate: '2026-08-15',
      bankDesc: 'Settlement credit ORD-1005',
      bankRef: '',
      bankCredit: 6912.91,
      confidenceScore: 88,
      status: 'MATCHED',
      amountDiff: 0.00,
      aiExplanation: 'Order ID extracted from narration. Zero amount variance.',
    },
    {
      id: 'tx-6',
      orderId: 'ORD-1007',
      customerName: 'Hyperion Systems',
      invoiceId: 'INV-2026-007',
      invoiceDate: '2026-08-16',
      invoiceGross: 4720.00,
      settlementId: 'SETTL-8006',
      settlementDate: '2026-08-17',
      settlementGross: 4720.00,
      fee: 94.40,
      tax: 16.99,
      settlementNet: 4608.61,
      bankDate: '2026-08-18',
      bankDesc: 'Razorpay Settlement ORD-1007',
      bankRef: 'CMS-RP-8006',
      bankCredit: 4608.61,
      confidenceScore: 74,
      status: 'REVIEW_REQUIRED',
      amountDiff: 0.00,
      aiExplanation: 'Order ID and amount match with zero variance. However, bank transaction date (2026-08-18) was recorded 1 day after Razorpay settlement date (2026-08-17) due to banking holiday. Deterministic confidence: 74/100. Recommend CA confirmation.',
    },
    {
      id: 'tx-7',
      orderId: 'ORD-1009',
      customerName: 'Vanguard Media',
      invoiceId: 'INV-2026-009',
      invoiceDate: '2026-08-18',
      invoiceGross: 21240.00,
      settlementId: 'SETTL-8007',
      settlementDate: '2026-08-19',
      settlementGross: 21240.00,
      fee: 424.80,
      tax: 76.46,
      settlementNet: 20738.74,
      bankDate: '2026-08-20',
      bankDesc: 'Razorpay Settlement ORD-1009',
      bankRef: 'CMS-RP-8007',
      bankCredit: 20738.74,
      confidenceScore: 74,
      status: 'REVIEW_REQUIRED',
      amountDiff: 0.00,
      aiExplanation: '1-day banking settlement delay detected. Amount and order_id match with 100% precision.',
    },
    {
      id: 'tx-8',
      orderId: 'ORD-9999',
      customerName: 'Unlinked Settlement',
      invoiceId: 'NO_INVOICE',
      invoiceDate: '',
      invoiceGross: 0,
      settlementId: 'SETTL-8009',
      settlementDate: '2026-08-21',
      settlementGross: 5000.00,
      fee: 100.00,
      tax: 18.00,
      settlementNet: 4882.00,
      bankDate: '',
      bankDesc: 'No bank deposit linked',
      bankRef: '',
      bankCredit: 0,
      confidenceScore: 35,
      status: 'EXCEPTION',
      amountDiff: 4882.00,
      aiExplanation: 'Settlement SETTL-8009 for ORD-9999 has no corresponding invoice record in the uploaded Invoice CSV or Bank Statement. Flagged for investigation.',
    },
    {
      id: 'tx-9',
      orderId: 'ORD-1011',
      customerName: 'Fee Mismatch Batch',
      invoiceId: 'INV-2026-011',
      invoiceDate: '2026-08-21',
      invoiceGross: 10000.00,
      settlementId: 'SETTL-8010',
      settlementDate: '2026-08-21',
      settlementGross: 10000.00,
      fee: 200.00,
      tax: 36.00,
      settlementNet: 9000.00,
      bankDate: '',
      bankDesc: 'Fee discrepancy',
      bankRef: '',
      bankCredit: 0,
      confidenceScore: 20,
      status: 'EXCEPTION',
      amountDiff: 764.00,
      aiExplanation: 'Fee validation failure: Expected net payout was ₹9,764.00 (10000 - 200 - 36), but CSV reported ₹9,000.00 (discrepancy > ₹0.01). Deterministic rule rejected auto-matching.',
    },
  ]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesFilter = 
        activeFilter === 'ALL' ? true : tx.status === activeFilter;

      const matchesSearch = 
        searchQuery === '' ||
        tx.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.bankRef.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [transactions, activeFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: transactions.length,
      matched: transactions.filter(t => t.status === 'MATCHED').length,
      review: transactions.filter(t => t.status === 'REVIEW_REQUIRED').length,
      exception: transactions.filter(t => t.status === 'EXCEPTION').length,
    };
  }, [transactions]);

  return (
    <Card padding="none" className="overflow-hidden border border-border">
      {/* Top Filter Tabs & Search Header */}
      <div className="p-4 sm:p-5 border-b border-border bg-surface-elevated/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-background-primary/80 p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFilter === 'ALL'
                ? 'bg-surface-elevated text-foreground-primary shadow-sm border border-border'
                : 'text-foreground-secondary hover:text-foreground-primary'
            }`}
          >
            All <span className="font-mono text-[11px] text-foreground-muted ml-1">({counts.all})</span>
          </button>

          <button
            onClick={() => setActiveFilter('MATCHED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeFilter === 'MATCHED'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                : 'text-foreground-secondary hover:text-emerald-400'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Matched <span className="font-mono text-[11px] ml-0.5">({counts.matched})</span>
          </button>

          <button
            onClick={() => setActiveFilter('REVIEW_REQUIRED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeFilter === 'REVIEW_REQUIRED'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm'
                : 'text-foreground-secondary hover:text-amber-400'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Review Required <span className="font-mono text-[11px] ml-0.5">({counts.review})</span>
          </button>

          <button
            onClick={() => setActiveFilter('EXCEPTION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeFilter === 'EXCEPTION'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm'
                : 'text-foreground-secondary hover:text-rose-400'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Exceptions <span className="font-mono text-[11px] ml-0.5">({counts.exception})</span>
          </button>
        </div>

        {/* Search & Export Buttons */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search by Order ID, UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-background-primary border border-border text-xs text-foreground-primary placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-brand w-52 sm:w-64"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={() => alert("Downloading CA Reconciliation Audit Report (CSV)...")}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Financial Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-elevated/40 border-b border-border text-foreground-muted font-medium uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Order ID & Customer</th>
              <th className="py-3 px-4">Invoice Gross</th>
              <th className="py-3 px-4">Razorpay Net</th>
              <th className="py-3 px-4">Bank Credit</th>
              <th className="py-3 px-4">Confidence</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-foreground-muted">
                  No reconciliation records match your filter criteria.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const statusBadge = 
                  tx.status === 'MATCHED' ? 'matched' :
                  tx.status === 'REVIEW_REQUIRED' ? 'review' : 'exception';

                return (
                  <tr
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className="hover:bg-white/[0.02] cursor-pointer transition-colors group"
                  >
                    {/* Order ID & Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-semibold text-foreground-primary group-hover:text-brand transition-colors">
                        {tx.orderId}
                      </div>
                      <div className="text-[11px] text-foreground-secondary truncate max-w-[180px]">
                        {tx.customerName}
                      </div>
                    </td>

                    {/* Invoice Gross */}
                    <td className="py-3.5 px-4 font-financial text-foreground-primary">
                      {tx.invoiceGross > 0 ? formatCurrency(tx.invoiceGross) : '-'}
                    </td>

                    {/* Razorpay Net */}
                    <td className="py-3.5 px-4 font-financial font-medium text-brand">
                      {tx.settlementNet > 0 ? formatCurrency(tx.settlementNet) : '-'}
                    </td>

                    {/* Bank Credit */}
                    <td className="py-3.5 px-4 font-financial font-medium text-emerald-400">
                      {tx.bankCredit > 0 ? formatCurrency(tx.bankCredit) : '-'}
                    </td>

                    {/* Confidence Score Bar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-background-primary rounded-full h-1.5 overflow-hidden border border-border">
                          <div
                            className={`h-full rounded-full ${
                              tx.confidenceScore >= 80 ? 'bg-emerald-400' :
                              tx.confidenceScore >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                            }`}
                            style={{ width: `${tx.confidenceScore}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-semibold text-foreground-secondary">
                          {tx.confidenceScore}%
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <Badge variant={statusBadge} dot size="sm">
                        {tx.status.replace('_', ' ')}
                      </Badge>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] text-foreground-muted group-hover:text-brand font-medium transition-colors">
                        Inspect <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-surface-elevated/20 border-t border-border flex items-center justify-between text-[11px] text-foreground-muted">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand" />
          Click any transaction row to inspect the full 3-source audit trail and AI explanation.
        </span>
        <span className="font-mono">Showing {filteredTransactions.length} of {transactions.length} records</span>
      </div>
    </Card>
  );
};
