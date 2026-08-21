import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  TrendingUp, 
  ArrowUpRight
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

export const MetricsGrid: React.FC = () => {
  const metrics = [
    {
      label: "Total Volume Reconciled",
      value: "₹1,25,80,450.00",
      subtext: "+18.4% vs previous batch",
      deltaType: "positive",
      icon: <TrendingUp className="w-5 h-5 text-brand" />,
      accentColor: "from-brand/20 to-transparent",
      badge: "3-Way Cleared",
      badgeColor: "bg-brand/10 text-brand border-brand/20"
    },
    {
      label: "Deterministic Match Rate",
      value: "94.8%",
      subtext: "1,396 of 1,420 transactions auto-matched",
      deltaType: "positive",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      accentColor: "from-emerald-500/20 to-transparent",
      badge: "≥ 80 Score",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    },
    {
      label: "Pending CA Review",
      value: "18",
      subtext: "AI explanation generated for ambiguous dates/amounts",
      deltaType: "neutral",
      icon: <HelpCircle className="w-5 h-5 text-amber-400" />,
      accentColor: "from-amber-500/20 to-transparent",
      badge: "60–79 Score",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20"
    },
    {
      label: "Unmatched Exceptions",
      value: "6",
      subtext: "Requires human intervention (fee mismatch / missing UTR)",
      deltaType: "warning",
      icon: <AlertCircle className="w-5 h-5 text-rose-400" />,
      accentColor: "from-rose-500/20 to-transparent",
      badge: "< 60 Score",
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20"
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, idx) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
        >
          <Card hover className="relative overflow-hidden p-5 flex flex-col justify-between h-full group">
            {/* Top Row */}
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-medium text-foreground-secondary tracking-tight">
                {metric.label}
              </span>
              <div className="p-2 rounded-lg bg-surface-elevated border border-border group-hover:border-foreground-muted/30 transition-colors">
                {metric.icon}
              </div>
            </div>

            {/* Metric Value */}
            <div className="space-y-1 mb-3">
              <div className="text-2xl font-bold font-financial tracking-tight text-foreground-primary">
                {metric.value}
              </div>
              <p className="text-[11px] text-foreground-muted leading-tight">
                {metric.subtext}
              </p>
            </div>

            {/* Bottom Status Badge */}
            <div className="pt-2 border-t border-border/50 flex items-center justify-between">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${metric.badgeColor}`}>
                {metric.badge}
              </span>
              <span className="text-[10px] text-foreground-muted flex items-center gap-0.5 group-hover:text-foreground-primary transition-colors">
                Details <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};
