import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, Clock, Play, RefreshCw, Search } from 'lucide-react';
import { getUserHistoryApi, resumeSessionApi } from '@/lib/api';
import { UserSessionHistoryItem } from '@/types';

interface SessionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResumeSession: (sessionId: string, companyName: string) => void;
}

export const SessionHistoryModal: React.FC<SessionHistoryModalProps> = ({
  isOpen,
  onClose,
  onResumeSession,
}) => {
  const [history, setHistory] = useState<UserSessionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [resumingId, setResumingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getUserHistoryApi();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) =>
    item.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.session_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleResume = async (item: UserSessionHistoryItem) => {
    setResumingId(item.session_id);
    try {
      await resumeSessionApi(item.session_id);
      onResumeSession(item.session_id, item.company_name);
      onClose();
    } catch (err) {
      console.error('Failed to resume session:', err);
    } finally {
      setResumingId(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Soft clean backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#151a24] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#151a24] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Audit &amp; Session History</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Resume past reconciliation batches or inspect forensic audit records
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={fetchHistory}
                disabled={isLoading}
                title="Refresh history"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter history by entity name or session ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand/40 placeholder:text-slate-400 shadow-sm"
              />
            </div>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand" />
                Loading your audit session history...
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="py-12 text-center">
                <History className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">No Past Sessions Yet</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Run a 3-way reconciliation on the Workspace tab to create your first persistent audit session.
                </p>
              </div>
            ) : (
              filteredHistory.map((item) => {
                const dateStr = new Date(item.created_at).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={item.session_id}
                    className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-brand/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.company_name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.match_rate >= 90
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400'
                          }`}
                        >
                          {item.match_rate}% Matched
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.processing_time_ms}ms
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {dateStr}
                        </span>
                        <span>•</span>
                        <span>{item.total_records} records total</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-semibold">{item.matched} matched</span>
                        <span>•</span>
                        <span className="text-amber-600 font-semibold">{item.review_required} review</span>
                        <span>•</span>
                        <span className="text-rose-600 font-semibold">{item.exceptions} exceptions</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleResume(item)}
                      disabled={resumingId === item.session_id}
                      className="px-3.5 py-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50"
                    >
                      {resumingId === item.session_id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Restoring...
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          Resume Session
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
