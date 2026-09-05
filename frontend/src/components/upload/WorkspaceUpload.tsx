import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle2, FileText, CreditCard, Building2, Play, AlertCircle, Loader2, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProcessingCard } from './ProcessingCard';
import { uploadCSV, triggerReconciliation } from '@/lib/api';
import { SourceType } from '@/types';

interface WorkspaceUploadProps {
  onRunReconciliation: (sessionId?: string, companyName?: string) => void;
  currentCompanyName: string;
  onCompanyNameChange: (name: string) => void;
}

type FileType = 'invoice' | 'razorpay' | 'bank';

interface UploadState {
  file: File | null;
  sessionId: string | null;
  recordCount: number;
  isUploading: boolean;
  error: string | null;
}

export const WorkspaceUpload: React.FC<WorkspaceUploadProps> = ({
  onRunReconciliation,
  currentCompanyName,
  onCompanyNameChange,
}) => {
  const [uploads, setUploads] = useState<Record<FileType, UploadState>>({
    invoice: { file: null, sessionId: null, recordCount: 0, isUploading: false, error: null },
    razorpay: { file: null, sessionId: null, recordCount: 0, isUploading: false, error: null },
    bank: { file: null, sessionId: null, recordCount: 0, isUploading: false, error: null },
  });

  const [companyName, setCompanyName] = useState<string>(currentCompanyName || 'Apex Technologies Pvt Ltd');
  const [isProcessing, setIsProcessing] = useState(false);
  const [reconSessionId, setReconSessionId] = useState<string | null>(null);

  const handleNameChange = (val: string) => {
    setCompanyName(val);
    onCompanyNameChange(val);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: FileType) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    setUploads((prev) => ({
      ...prev,
      [type]: { file, sessionId: null, recordCount: 0, isUploading: true, error: null },
    }));

    try {
      const data = await uploadCSV(file, type as SourceType);
      setUploads((prev) => ({
        ...prev,
        [type]: {
          file,
          sessionId: data.session_id,
          recordCount: data.record_count,
          isUploading: false,
          error: null,
        },
      }));
    } catch (err: any) {
      setUploads((prev) => ({
        ...prev,
        [type]: {
          file,
          sessionId: null,
          recordCount: 0,
          isUploading: false,
          error: err.message || 'Upload failed',
        },
      }));
    }
  };

  const allUploaded =
    uploads.invoice.sessionId &&
    uploads.razorpay.sessionId &&
    uploads.bank.sessionId;

  const handleRunReconciliation = async () => {
    if (!allUploaded) return;
    setIsProcessing(true);

    try {
      const targetEntity = companyName.trim() || 'Apex Technologies Pvt Ltd';
      const summary = await triggerReconciliation(
        uploads.bank.sessionId!,
        uploads.razorpay.sessionId!,
        uploads.invoice.sessionId!,
        targetEntity
      );
      setReconSessionId(summary.session_id);
    } catch (err: any) {
      console.error('Reconciliation error:', err);
    }
  };

  if (isProcessing) {
    return (
      <ProcessingCard
        onComplete={() => onRunReconciliation(reconSessionId ?? undefined, companyName.trim() || 'Apex Technologies Pvt Ltd')}
      />
    );
  }

  const renderUploadCard = (type: FileType, title: string, subtitle: string, icon: React.ReactNode) => {
    const item = uploads[type];

    return (
      <div
        className={`relative overflow-hidden bg-white dark:bg-[#151a24] border ${
          item.sessionId
            ? 'border-emerald-500/50 dark:border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10'
            : 'border-slate-200 dark:border-slate-800'
        } rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center text-center transition-all duration-200 hover:border-brand/40 group`}
      >
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 transition-colors ${
            item.sessionId
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
              : item.isUploading
              ? 'bg-brand/10 text-brand'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-brand/10 group-hover:text-brand'
          }`}
        >
          {item.isUploading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : item.sessionId ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : (
            icon
          )}
        </div>

        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{title}</h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">{subtitle}</p>

        {item.file ? (
          <div className="flex flex-col items-center gap-1 mt-1 w-full">
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 truncate max-w-full">
              {item.file.name}
            </span>
            {item.isUploading ? (
              <span className="text-[11px] text-brand font-semibold">Validating rows...</span>
            ) : item.error ? (
              <span className="text-[11px] text-rose-600 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3 h-3" /> {item.error}
              </span>
            ) : (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ {item.recordCount} records loaded
              </span>
            )}
            <label className="text-[11px] font-semibold text-brand cursor-pointer hover:underline mt-0.5 transition-colors">
              Replace File
              <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFileChange(e, type)} />
            </label>
          </div>
        ) : (
          <div className="mt-1 w-full">
            <label className="inline-flex items-center justify-center w-full h-9 px-3 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition-all shadow-sm group-hover:border-brand/30">
              <Upload className="w-3.5 h-3.5 mr-1.5 text-slate-500 group-hover:text-brand" />
              Upload CSV
              <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFileChange(e, type)} />
            </label>
          </div>
        )}
      </div>
    );
  };

  const renderRecentUploads = () => {
    const uploadedFiles = Object.entries(uploads).filter(([_, state]) => state.file !== null);

    return (
      <div className="bg-white dark:bg-[#151a24] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm h-full flex flex-col">
        <h3 className="text-xs font-bold tracking-wide text-slate-500 dark:text-slate-400 uppercase mb-4">
          Session Staging Queue
        </h3>
        <div className="flex flex-col gap-2.5 flex-1">
          {uploadedFiles.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-8">
              <FileUp className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs font-medium">No files staged yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Upload Bank, Gateway &amp; Invoices</p>
            </div>
          ) : (
            uploadedFiles.map(([type, state]) => (
              <div
                key={type}
                className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3.5 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {state.file?.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {state.recordCount} rows • {type.toUpperCase()}
                    </span>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full pt-2 pb-24 w-full max-w-7xl mx-auto">
      {/* Left Column: Drag & Drop Zone */}
      <div className="flex-1 flex flex-col space-y-4">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
            Workspace Reconciliation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Stage and run deterministic 3-way verification across 50+ records batch.
          </p>
        </div>

        {/* Target Entity / Company Input Bar */}
        <div className="bg-white dark:bg-[#151a24] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Target Company / Client Workspace
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Data will be reconciled and registered under this entity name
              </span>
            </div>
          </div>

          <div className="sm:w-80">
            <input
              type="text"
              required
              placeholder="e.g. Apex Technologies Pvt Ltd"
              value={companyName}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 shadow-sm"
            />
          </div>
        </div>

        {/* Upload Drop Zone Card */}
        <div className="bg-white dark:bg-[#151a24] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col relative">
          <div className="text-center py-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Select or Drop 3-Source Financial CSVs
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Reconciliation requires all 3 complementary feeds (Bank Statements, Payment Gateway settlements, and Invoices)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
            {renderUploadCard('bank', 'Bank Statement', 'CSV with debits, credits, references', <Building2 className="w-6 h-6" />)}
            {renderUploadCard('razorpay', 'Gateway Settlements', 'CSV with gross, fees, tax, net', <CreditCard className="w-6 h-6" />)}
            {renderUploadCard('invoice', 'Invoices / Billing', 'CSV with amounts, GST, order IDs', <FileText className="w-6 h-6" />)}
          </div>

          <AnimatePresence>
            {allUploaded && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>All 3 data feeds validated and ready for matching.</span>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  className="px-6 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold shadow-md shadow-brand/20 flex items-center gap-2"
                  icon={<Play className="w-4 h-4 fill-current" />}
                  onClick={handleRunReconciliation}
                >
                  Run 3-Way Reconciliation
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Column: Recent Uploads */}
      <div className="w-full md:w-[360px] flex flex-col pt-0 md:pt-12">
        {renderRecentUploads()}
      </div>
    </div>
  );
};
