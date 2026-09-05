import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, CreditCard, FileText, CheckCircle2, X, Sparkles, AlertTriangle, Send, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { DrawerTransaction } from './TransactionDrawer';

interface ReconciliationPanelProps {
  transaction: DrawerTransaction | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject?: (id: string) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const ReconciliationPanel: React.FC<ReconciliationPanelProps> = ({
  transaction,
  onClose,
  onApprove,
  onReject,
}) => {
  const [copilotQuestion, setCopilotQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  if (!transaction) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-white dark:bg-[#151a24] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-brand" />
        </div>

        <h4 className="text-base font-bold text-slate-900 dark:text-white">
          Transaction Detail Inspector
        </h4>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          Select any transaction from the list on the left to review its 3-way
          invoice, gateway, and bank reconciliation trail.
        </p>
      </div>
    );
  }

  const isMatched = transaction.status === 'MATCHED';
  const isReview = transaction.status === 'REVIEW_REQUIRED';

  const handleAskCopilot = async (questionText?: string) => {
    const q = questionText || copilotQuestion;
    if (!q.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setIsAsking(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/copilot`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: q,
            transaction,
          }),
        }
      );

      const data = await res.json();

      console.log("Copilot response:", data);

      if (!res.ok) {
        throw new Error(data.detail || "Backend error");
      }

      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `ERROR: ${err.message}`,
        },
      ]);
    } finally {
      setIsAsking(false);
      setCopilotQuestion('');
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transaction.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.2 }}
        className="h-full w-full flex flex-col bg-white dark:bg-[#151a24] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {transaction.invoiceId !== 'N/A'
                  ? transaction.invoiceId
                  : transaction.orderId}
              </h3>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isMatched
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                  : isReview
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
                  }`}
              >
                {transaction.status} • {transaction.confidenceScore}% Score
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {transaction.customerName} • Order {transaction.orderId}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stacked Cards */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 custom-scrollbar">
          {/* Bank Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5" />
                </div>

                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  Bank Statement
                </h4>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Credit Verified
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-[11px] bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Date</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{transaction.bankDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Reference</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 truncate block">{transaction.bankRef || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Narration</span>
                <span className="text-slate-800 dark:text-slate-200 truncate block">{transaction.bankDesc}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Deposit</span>
                <span className="font-bold font-financial text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(transaction.bankCredit)}
                </span>
              </div>
            </div>
          </div>

          {/* Gateway Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  Payment Gateway (Razorpay)
                </h4>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-brand">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Net Settled
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-[11px] bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Date</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{transaction.settlementDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Settlement ID</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 truncate block">{transaction.settlementId}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Fee + Tax</span>
                <span className="font-financial text-rose-500">
                  -{formatCurrency(transaction.fee + transaction.tax)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Net Payout</span>
                <span className="font-bold font-financial text-slate-900 dark:text-white">
                  {formatCurrency(transaction.settlementNet)}
                </span>
              </div>
            </div>
          </div>

          {/* Invoice Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  Invoice (ERP Books)
                </h4>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-blue-500">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Billed
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-[11px] bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Invoice Date</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{transaction.invoiceDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Invoice ID</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 truncate block">{transaction.invoiceId}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Customer</span>
                <span className="text-slate-800 dark:text-slate-200 truncate block">{transaction.customerName}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Gross Amount</span>
                <span className="font-bold font-financial text-slate-900 dark:text-white">
                  {formatCurrency(transaction.invoiceGross)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Copilot & Auditor Action Box */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">

          {/* AI Chat */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 h-56 overflow-y-auto shadow-sm space-y-3">

            {messages.length === 0 && (
              <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 text-xs">
                <div className="flex items-center gap-1 mb-1 text-brand font-semibold uppercase text-[10px]">
                  <Sparkles className="w-3 h-3" />
                  AI Copilot
                </div>
                {transaction.aiExplanation}
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs whitespace-pre-wrap ${msg.role === 'user'
                    ? 'bg-brand text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1 mb-1 text-brand font-semibold uppercase text-[10px]">
                      <Sparkles className="w-3 h-3" />
                      AI Copilot
                    </div>
                  )}
                  {msg.content}
                </div>
              </div>
            ))}

            {isAsking && (
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-pulse" />
                AI is thinking...
              </div>
            )}
          </div>

          {/* Quick AI Prompts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <span className="text-slate-400 font-bold text-[10px] uppercase shrink-0">
              Ask:
            </span>

            {[
              'Explain Discrepancy',
              'Fee Breakdown',
              'Verify Timing Delay',
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleAskCopilot(prompt)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium shrink-0 transition-colors shadow-sm"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Prompt Input & Auditor Decision Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Ask Copilot about fees, timing, or references..."
                value={copilotQuestion}
                onChange={(e) => setCopilotQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskCopilot()}
                className="w-full pl-3 pr-9 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 shadow-sm"
              />

              <button
                onClick={() => handleAskCopilot()}
                disabled={isAsking}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand transition-colors p-1"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
              {!isMatched && (
                <>
                  <button
                    onClick={() => onApprove(transaction.id)}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Match</span>
                  </button>

                  {onReject && (
                    <button
                      onClick={() => onReject(transaction.id)}
                      className="flex-1 sm:flex-none px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Flag</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};