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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-3xl max-h-full bg-surface border border-border shadow-2xl rounded-[24px] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between sticky top-0 bg-surface/90 backdrop-blur z-10">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground-primary leading-tight">
                    Transaction Audit
                  </h3>
                  <p className="text-sm font-mono text-foreground-secondary mt-0.5">
                    {transaction.orderId}
                  </p>
                </div>
                <div className="h-8 w-px bg-border mx-2" />
                <Badge variant={statusVariant} dot size="sm">
                  {transaction.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-elevated border border-border/50">
                  <span className="text-xs text-foreground-muted">Confidence</span>
                  <span className={`text-sm font-bold ${
                    transaction.confidenceScore >= 80 ? 'text-emerald-500' :
                    transaction.confidenceScore >= 60 ? 'text-amber-500' : 'text-rose-500'
                  }`}>
                    {transaction.confidenceScore}%
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-surface-elevated text-foreground-muted hover:text-foreground-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body Content */}
            <div className="overflow-y-auto flex-1 p-6 space-y-8">
              {/* AI Explanation Card */}
              <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex gap-4">
                <div className="mt-0.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground-primary mb-1">AI Analysis</h4>
                  <p className="text-sm text-foreground-secondary leading-relaxed">
                    {defaultExplanation}
                  </p>
                </div>
              </div>

              {/* Data Sources */}
              <div>
                <h4 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-4 px-1">
                  Reconciliation Sources
                </h4>
                
                <div className="space-y-3">
                  {/* Source 1: Invoice */}
                  <div className="p-4 rounded-2xl bg-surface-elevated/30 hover:bg-surface-elevated/50 transition-colors border border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground-primary">Invoice</p>
                          <span className="text-[10px] font-mono text-foreground-muted bg-surface-elevated px-1.5 py-0.5 rounded">{transaction.invoiceId}</span>
                        </div>
                        <p className="text-xs text-foreground-secondary mt-0.5">{transaction.customerName} &bull; {formatDate(transaction.invoiceDate)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-foreground-muted mb-0.5">Gross Total</p>
                      <p className="text-sm font-semibold font-mono text-foreground-primary">{formatCurrency(transaction.invoiceGross)}</p>
                    </div>
                  </div>

                  {/* Source 2: Razorpay */}
                  <div className="p-4 rounded-2xl bg-surface-elevated/30 hover:bg-surface-elevated/50 transition-colors border border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                        <CreditCard className="w-5 h-5 text-brand" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground-primary">Razorpay Settlement</p>
                          <span className="text-[10px] font-mono text-brand/70 bg-brand/5 px-1.5 py-0.5 rounded">{transaction.settlementId}</span>
                        </div>
                        <p className="text-xs text-foreground-secondary mt-0.5">Gross: {formatCurrency(transaction.settlementGross)} &bull; Fee/Tax: -{formatCurrency(transaction.fee + transaction.tax)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-foreground-muted mb-0.5">Net Settled</p>
                      <p className="text-sm font-semibold font-mono text-brand">{formatCurrency(transaction.settlementNet)}</p>
                    </div>
                  </div>

                  {/* Source 3: Bank */}
                  <div className="p-4 rounded-2xl bg-surface-elevated/30 hover:bg-surface-elevated/50 transition-colors border border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground-primary">Bank Statement</p>
                          <span className="text-[10px] font-mono text-foreground-muted bg-surface-elevated px-1.5 py-0.5 rounded">{transaction.bankRef || 'No UTR'}</span>
                        </div>
                        <p className="text-xs text-foreground-secondary mt-0.5 truncate max-w-[200px]">{transaction.bankDesc}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-foreground-muted mb-0.5">Credit Deposit</p>
                      <p className="text-sm font-semibold font-mono text-emerald-500">{formatCurrency(transaction.bankCredit)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-border/50 bg-surface-elevated/30 flex items-center justify-between">
              <p className="text-xs text-foreground-muted font-medium">CA Verification Required</p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => onReject(transaction.id)}
                  className="!text-error !border-error/20 hover:!bg-error/10"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Flag Exception
                </Button>
                <Button
                  variant="primary"
                  onClick={() => onApprove(transaction.id)}
                  className="shadow-sm"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve Match
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
