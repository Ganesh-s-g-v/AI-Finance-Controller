import React from 'react';
import { 
  FileText, 
  CreditCard, 
  Building2, 
  CheckCircle2, 
  Sparkles,
  Zap
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const ReconciliationFlowVisualizer: React.FC = () => {
  return (
    <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-background-secondary via-background-secondary to-surface-elevated/40 border border-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground-primary tracking-tight">
              Deterministic 3-Source Reconciliation Pipeline
            </h3>
            <Badge variant="matched" dot size="sm">Pipeline Healthy</Badge>
          </div>
          <p className="text-xs text-foreground-secondary mt-0.5">
            Razorpay acts as the bridge connecting Gross Invoice Billings to Net Bank Deposits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-elevated border border-border text-[11px] font-mono text-foreground-secondary">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Tolerance: ±₹1.00</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-elevated border border-border text-[11px] font-mono text-foreground-secondary">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span>Gemini AI Explanations Ready</span>
          </div>
        </div>
      </div>

      {/* 3-Stage Pipeline Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative">
        {/* Source 1: Invoices */}
        <div className="p-4 rounded-xl bg-background-primary/60 border border-border/80 relative flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground-primary">1. Customer Invoices</span>
                <p className="text-[10px] text-foreground-muted">Gross Billing Value</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated border border-border text-foreground-secondary">
              PAID Status
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] py-2">
            <div className="flex justify-between text-foreground-secondary">
              <span>Records Ingested:</span>
              <span className="font-mono font-medium text-foreground-primary">1,420</span>
            </div>
            <div className="flex justify-between text-foreground-secondary">
              <span>Total Gross (with 18% GST):</span>
              <span className="font-mono font-medium text-foreground-primary">₹1,28,45,200.00</span>
            </div>
            <div className="flex justify-between text-foreground-secondary">
              <span>Key Matching Anchor:</span>
              <span className="font-mono text-brand">order_id</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-border/50 text-[10px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>100% Schema Validation Passed</span>
          </div>
        </div>

        {/* Source 2: Razorpay Settlement (Bridge) */}
        <div className="p-4 rounded-xl bg-brand/5 border border-brand/30 relative flex flex-col justify-between shadow-glow-indigo">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-brand/20 border border-brand/30 text-brand">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground-primary">2. Razorpay Payouts</span>
                <p className="text-[10px] text-brand">Settlement Bridge & Fees</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand/20 border border-brand/40 text-brand font-semibold">
              BRIDGE
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] py-2">
            <div className="flex justify-between text-foreground-secondary">
              <span>Settlement Batches:</span>
              <span className="font-mono font-medium text-foreground-primary">1,418</span>
            </div>
            <div className="flex justify-between text-foreground-secondary">
              <span>Gateway Fees + GST:</span>
              <span className="font-mono font-medium text-amber-400">-₹2,64,750.00</span>
            </div>
            <div className="flex justify-between text-foreground-secondary">
              <span>Net Payout Value:</span>
              <span className="font-mono font-medium text-foreground-primary">₹1,25,80,450.00</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-brand/20 text-[10px] text-brand flex items-center justify-between">
            <span className="flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Fee Formula Validated
            </span>
            <span className="font-mono text-[9px] text-foreground-muted">|gross-fee-tax-net| &lt; 0.01</span>
          </div>
        </div>

        {/* Source 3: Bank Statement */}
        <div className="p-4 rounded-xl bg-background-primary/60 border border-border/80 relative flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground-primary">3. Bank Statement</span>
                <p className="text-[10px] text-foreground-muted">Verified Bank Credits</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated border border-border text-foreground-secondary">
              Net Credits
            </span>
          </div>

          <div className="space-y-1.5 text-[11px] py-2">
            <div className="flex justify-between text-foreground-secondary">
              <span>Bank Credits Count:</span>
              <span className="font-mono font-medium text-foreground-primary">1,412</span>
            </div>
            <div className="flex justify-between text-foreground-secondary">
              <span>Total Deposited Amount:</span>
              <span className="font-mono font-medium text-emerald-400">₹1,25,80,450.00</span>
            </div>
            <div className="flex justify-between text-foreground-secondary">
              <span>Order ID Extraction:</span>
              <span className="font-mono text-emerald-400">Ref + Description</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-border/50 text-[10px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>1,396 Matched Directly (≥80 Score)</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
