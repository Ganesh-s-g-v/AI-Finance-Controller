import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, ArrowRight } from 'lucide-react';
import { createCompanyApi } from '@/lib/api';
import { CompanyData } from '@/types';

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanyCreated: (company: CompanyData) => void;
}

export const AddCompanyModal: React.FC<AddCompanyModalProps> = ({
  isOpen,
  onClose,
  onCompanyCreated,
}) => {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('Enterprise Technology & SaaS');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setIsLoading(true);
    try {
      const created = await createCompanyApi(name.trim(), industry);
      onCompanyCreated(created);
      setName('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create company.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-surface-primary/95 dark:bg-[#12161f]/95 border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/40 backdrop-blur-xl overflow-hidden z-10 p-6"
        >
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand/15 text-brand flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-foreground-primary">Add Client Company</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-foreground-secondary hover:text-foreground-primary hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="mt-3 p-2.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-foreground-secondary mb-1">
                Company Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Hyperion Global Ltd"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/5 dark:bg-white/5 border border-border-subtle rounded-xl text-xs text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand/40 placeholder:text-foreground-tertiary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground-secondary mb-1">
                Industry / Domain
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2.5 bg-black/5 dark:bg-[#1a2130] border border-border-subtle rounded-xl text-xs text-foreground-primary focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                <option value="Enterprise Technology & SaaS">Enterprise Technology & SaaS</option>
                <option value="E-Commerce & Digital Retail">E-Commerce & Digital Retail</option>
                <option value="Fintech & Digital Payments">Fintech & Digital Payments</option>
                <option value="Supply Chain & Logistics">Supply Chain & Logistics</option>
                <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                <option value="Financial Services & Commerce">Financial Services & Commerce</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl shadow-md shadow-brand/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {isLoading ? 'Creating...' : 'Create Company Workspace'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
