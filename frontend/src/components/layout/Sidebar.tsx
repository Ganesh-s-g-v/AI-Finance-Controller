import React from 'react';
import { 
  LayoutDashboard, 
  GitCompare, 
  AlertTriangle, 
  FileText, 
  History, 
  Database,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type NavTab = 'dashboard' | 'reconcile' | 'exceptions' | 'reports' | 'audit' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  exceptionCount?: number;
  reviewCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  exceptionCount = 6,
  reviewCount = 18,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Executive Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'reconcile' as NavTab,
      label: '3-Way Reconciliation',
      icon: <GitCompare className="w-4 h-4" />,
      badge: reviewCount > 0 ? `${reviewCount} Review` : undefined,
      badgeVariant: 'review' as const,
    },
    {
      id: 'exceptions' as NavTab,
      label: 'Exception Queue',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: exceptionCount > 0 ? `${exceptionCount} Items` : undefined,
      badgeVariant: 'exception' as const,
    },
    {
      id: 'reports' as NavTab,
      label: 'Audit & Reports',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'audit' as NavTab,
      label: 'Verification Logs',
      icon: <History className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-64 border-r border-border bg-background-secondary/50 flex flex-col justify-between py-5 px-3 min-h-[calc(100vh-4rem)] flex-shrink-0">
      {/* Primary Navigation */}
      <div className="space-y-6">
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">
            Reconciliation Engine
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group text-left",
                    isActive
                      ? "bg-brand/10 text-brand border border-brand/20 shadow-sm"
                      : "text-foreground-secondary hover:text-foreground-primary hover:bg-white/[0.04]"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cn(
                      "transition-colors",
                      isActive ? "text-brand" : "text-foreground-muted group-hover:text-foreground-primary"
                    )}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={cn(
                      "text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold",
                      item.badgeVariant === 'exception'
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Source Feed Status Section */}
        <div className="pt-2">
          <div className="px-3 mb-2 text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">
            Source Connectors
          </div>
          <div className="space-y-1.5 px-3 py-2.5 rounded-xl bg-surface-elevated/40 border border-border text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="text-foreground-secondary">Invoices (Gross)</span>
              <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                1,420 rows
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-t border-border/50">
              <span className="text-foreground-secondary">Razorpay Settlement</span>
              <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                1,418 rows
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-t border-border/50">
              <span className="text-foreground-secondary">Bank Statement (Net)</span>
              <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                1,412 rows
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer System Status & Rules Card */}
      <div className="space-y-3 pt-4 border-t border-border/80">
        <div className="p-3 rounded-xl bg-surface-elevated/40 border border-border text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-foreground-primary font-medium">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-brand" />
              Tolerance Check
            </span>
            <span className="text-emerald-400 font-mono font-semibold">±₹1.00 Fixed</span>
          </div>
          <p className="text-foreground-muted leading-tight text-[10px]">
            Strict deterministic business logic active. AI explanations strictly non-mutating.
          </p>
        </div>

        <div className="flex items-center justify-between px-2 text-[11px] text-foreground-muted">
          <span className="flex items-center gap-1">
            <Database className="w-3 h-3 text-emerald-400" />
            Supabase DB Sync
          </span>
          <span className="font-mono text-[10px]">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
