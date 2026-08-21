import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  FileText, 
  CreditCard, 
  Building2, 
  Check,
  Ban
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';

export interface DrawerTransaction {
  id: string;
  orderId: string;
  customerName: string;
  invoiceId: string;
  invoiceDate: string;
  invoiceGross: number;
  
  settlementId: string;
  settlementDate: string;
  settlementGross: number;
  fee: number;
  tax: number;
  settlementNet: number;
  
  bankDate: string;
  bankDesc: string;
  bankRef: string;
  bankCredit: number;
  
  confidenceScore: number;
  status: 'MATCHED' | 'REVIEW_REQUIRED' | 'EXCEPTION';
  amountDiff: number;
  aiExplanation?: string;
}

interface TransactionDrawerProps {
  isOpen: boolean;
  transaction: DrawerTransaction | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const TransactionDrawer: React.FC<TransactionDrawerProps> = ({
  isOpen,
  transaction,
  onClose,
  onApprove,
  onReject,
}) => {
  if (!transaction) return null;

  const statusVariant = 
    transaction.status === 'MATCHED' ? 'matched' :
    transaction.status === 'REVIEW_REQUIRED' ? 'review' : 'exception';

  const defaultExplanation = transaction.aiExplanation || (
    transaction.status === 'MATCHED'
      ? `Deterministic 3-way match verified. Exact order_id match across Invoice, Razorpay, and Bank narration. Net settled amount matches bank deposit with zero variance.`
      : transaction.status === 'REVIEW_REQUIRED'
      ? `Order ID (${transaction.orderId}) matches across all sources. Bank statement deposit was recorded with a small variance of ₹${transaction.amountDiff.toFixed(2)} (within the locked ±₹1.00 tolerance). Deterministic rule assigned confidence score ${transaction.confidenceScore}/100. CA approval required to confirm final reconciliation.`
      : `Discrepancy detected. Razorpay settlement net amount and bank transaction reference do not match within tolerance. Investigation recommended.`
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-full max-w-2xl bg-background-secondary border-l border-border z-50 shadow-2xl flex flex-col justify-between overflow-y-auto"
          >
            {/* Header */}
            <div>
              <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-background-secondary/95 backdrop-blur z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-foreground-primary">
                      {transaction.orderId}
                    </span>
                    <Badge variant={statusVariant} dot size="sm">
                      {transaction.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-foreground-secondary">
                    3-Way Transaction Reconciliation Audit Record
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-foreground-muted">Confidence Score</div>
                    <div className="text-sm font-mono font-bold text-brand">
                      {transaction.confidenceScore} / 100
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg border border-border hover:bg-white/[0.05] text-foreground-muted hover:text-foreground-primary transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Confidence Progress Bar */}
              <div className="w-full bg-background-primary h-1.5">
                <div 
                  className={`h-full transition-all duration-300 ${
                    transaction.confidenceScore >= 80 ? 'bg-emerald-400' :
                    transaction.confidenceScore >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                  }`}
                  style={{ width: `${transaction.confidenceScore}%` }}
                />
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-6">
                {/* Gemini 2.5 Flash AI Explanation Card */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-brand/5 to-transparent border border-indigo-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Gemini 2.5 Flash Explanation (Read-Only)</span>
                  </div>
                  <p className="text-xs text-foreground-primary leading-relaxed">
                    {defaultExplanation}
                  </p>
                  <div className="pt-2 flex items-center gap-3 text-[10px] text-foreground-muted font-mono">
                    <span>Deterministic rule locked</span>
                    <span>•</span>
                    <span>AI cannot modify financial records</span>
                  </div>
                </div>

                {/* 3-Source Comparison View */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                    Three-Source Lineage Comparison
                  </h4>

                  {/* 1. Invoice Record */}
                  <div className="p-4 rounded-xl bg-background-primary/50 border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-semibold text-foreground-primary">Invoice Record</span>
                      </div>
                      <span className="text-[10px] font-mono text-foreground-muted">{transaction.invoiceId}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-foreground-muted text-[11px]">Customer</span>
                        <div className="font-medium truncate">{transaction.customerName}</div>
                      </div>
                      <div>
                        <span className="text-foreground-muted text-[11px]">Issue Date</span>
                        <div className="font-mono">{formatDate(transaction.invoiceDate)}</div>
                      </div>
                      <div>
                        <span className="text-foreground-muted text-[11px]">Gross Total</span>
                        <div className="font-mono font-semibold text-foreground-primary">
                          {formatCurrency(transaction.invoiceGross)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Razorpay Settlement (Bridge) */}
                  <div className="p-4 rounded-xl bg-brand/5 border border-brand/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-brand" />
                        <span className="text-xs font-semibold text-foreground-primary">Razorpay Settlement (Bridge)</span>
                      </div>
                      <span className="text-[10px] font-mono text-brand font-medium">{transaction.settlementId}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-foreground-muted text-[11px]">Gross Amount</span>
                        <div className="font-mono">{formatCurrency(transaction.settlementGross)}</div>
                      </div>
                      <div>
                        <span className="text-foreground-muted text-[11px]">Fee (MDR)</span>
                        <div className="font-mono text-amber-400">-{formatCurrency(transaction.fee)}</div>
                      </div>
                      <div>
                        <span className="text-foreground-muted text-[11px]">Tax (18% GST)</span>
                        <div className="font-mono text-amber-400">-{formatCurrency(transaction.tax)}</div>
                      </div>
                      <div>
                        <span className="text-foreground-muted text-[11px]">Net Settled</span>
                        <div className="font-mono font-bold text-brand">{formatCurrency(transaction.settlementNet)}</div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Bank Statement Entry */}
                  <div className="p-4 rounded-xl bg-background-primary/50 border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-semibold text-foreground-primary">Bank Statement Entry</span>
                      </div>
                      <span className="text-[10px] font-mono text-foreground-muted">
                        {transaction.bankRef || 'No UTR Reference'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-foreground-muted text-[11px]">Txn Date</span>
                        <div className="font-mono">{formatDate(transaction.bankDate)}</div>
                      </div>
                      <div>
                        <span className="text-foreground-muted text-[11px]">Narration</span>
                        <div className="truncate text-foreground-secondary">{transaction.bankDesc}</div>
                      </div>
                      <div>
                        <span className="text-foreground-muted text-[11px]">Credit Deposit</span>
                        <div className="font-mono font-bold text-emerald-400">
                          {formatCurrency(transaction.bankCredit)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CA Human Approval Footer */}
            <div className="p-6 border-t border-border bg-background-secondary/95 backdrop-blur flex items-center justify-between gap-3">
              <div className="text-[11px] text-foreground-muted">
                Chartered Accountant Decision
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Ban className="w-3.5 h-3.5" />}
                  onClick={() => onReject(transaction.id)}
                >
                  Flag as Exception
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  icon={<Check className="w-3.5 h-3.5" />}
                  onClick={() => onApprove(transaction.id)}
                >
                  Approve Match (CA Verified)
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
