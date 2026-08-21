import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Upload, 
  FileText, 
  CreditCard, 
  Building2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const [bankFile] = useState<string | null>('bank_statement.csv (10 entries)');
  const [razorpayFile] = useState<string | null>('razorpay_settlement.csv (10 entries)');
  const [invoiceFile] = useState<string | null>('invoices.csv (10 entries)');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSimulateReconcile = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
      alert("✅ Reconciliation Batch Processed Successfully!\n• 1,396 Matched\n• 18 Review Required\n• 6 Exceptions");
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="relative w-full max-w-xl bg-background-secondary border border-border rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-foreground-primary">
                  Import Financial Datasets
                </h3>
              </div>
              <p className="text-xs text-foreground-secondary">
                Upload your 3 source CSV files to run deterministic reconciliation.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-border hover:bg-white/[0.05] text-foreground-muted hover:text-foreground-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Dropzones */}
          <div className="p-6 space-y-4">
            {/* 1. Invoices CSV */}
            <div className="p-4 rounded-xl border border-dashed border-border hover:border-brand/50 transition-colors bg-background-primary/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="text-xs font-semibold text-foreground-primary">1. Customer Invoices CSV</span>
                    <p className="text-[10px] text-foreground-muted">Columns: invoice_id, order_id, total_amount, status (PAID)</p>
                  </div>
                </div>
                {invoiceFile && (
                  <Badge variant="matched" size="sm" dot>Loaded</Badge>
                )}
              </div>
              <div className="text-[11px] font-mono text-foreground-secondary flex items-center justify-between bg-surface-elevated/40 px-3 py-1.5 rounded-lg border border-border/60">
                <span>{invoiceFile || 'Drag & drop or click to select'}</span>
                <span className="text-brand text-xs cursor-pointer hover:underline">Replace</span>
              </div>
            </div>

            {/* 2. Razorpay Settlement CSV */}
            <div className="p-4 rounded-xl border border-dashed border-border hover:border-brand/50 transition-colors bg-background-primary/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-brand" />
                  <div>
                    <span className="text-xs font-semibold text-foreground-primary">2. Razorpay Settlement Report CSV</span>
                    <p className="text-[10px] text-foreground-muted">Columns: settlement_id, order_id, gross, fee, tax, net_amount</p>
                  </div>
                </div>
                {razorpayFile && (
                  <Badge variant="matched" size="sm" dot>Loaded</Badge>
                )}
              </div>
              <div className="text-[11px] font-mono text-foreground-secondary flex items-center justify-between bg-surface-elevated/40 px-3 py-1.5 rounded-lg border border-border/60">
                <span>{razorpayFile || 'Drag & drop or click to select'}</span>
                <span className="text-brand text-xs cursor-pointer hover:underline">Replace</span>
              </div>
            </div>

            {/* 3. Bank Statement CSV */}
            <div className="p-4 rounded-xl border border-dashed border-border hover:border-brand/50 transition-colors bg-background-primary/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-xs font-semibold text-foreground-primary">3. Bank Statement CSV</span>
                    <p className="text-[10px] text-foreground-muted">Columns: txn_date, description, reference, debit, credit, balance</p>
                  </div>
                </div>
                {bankFile && (
                  <Badge variant="matched" size="sm" dot>Loaded</Badge>
                )}
              </div>
              <div className="text-[11px] font-mono text-foreground-secondary flex items-center justify-between bg-surface-elevated/40 px-3 py-1.5 rounded-lg border border-border/60">
                <span>{bankFile || 'Drag & drop or click to select'}</span>
                <span className="text-brand text-xs cursor-pointer hover:underline">Replace</span>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="p-6 border-t border-border bg-surface-elevated/30 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Strict ₹0.01 fee & ±₹1.00 tolerance validation</span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={isProcessing}
                onClick={handleSimulateReconcile}
                icon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Run 3-Way Reconciliation
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
