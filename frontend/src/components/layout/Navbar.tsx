import React from 'react';
import { 
  ShieldCheck, 
  Moon, 
  Sun, 
  Upload, 
  Search, 
  Bell, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface NavbarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenUpload: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isDark,
  onToggleTheme,
  onOpenUpload,
}) => {
  return (
    <header className="h-16 border-b border-border bg-background-secondary/70 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Organization Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center text-brand shadow-glow-indigo">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground-primary tracking-tight">AI Finance Controller</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-brand/15 text-brand font-semibold border border-brand/20">
                COPILOT
              </span>
            </div>
            <p className="text-[11px] text-foreground-secondary hidden sm:block">Automated 3-Source Reconciliation</p>
          </div>
        </div>

        <div className="h-4 w-px bg-border mx-2 hidden md:block" />

        {/* Client Workspace Dropdown */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-elevated/60 border border-border text-xs text-foreground-secondary hover:text-foreground-primary cursor-pointer transition-colors">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-medium text-foreground-primary">Apex Advisory LLP</span>
          <span className="text-foreground-muted">| FY 2026-27</span>
          <ChevronDown className="w-3.5 h-3.5 text-foreground-muted ml-1" />
        </div>
      </div>

      {/* Global Search & Actions */}
      <div className="flex items-center gap-3">
        {/* Command Search Bar */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated/70 border border-border text-xs text-foreground-muted w-64 hover:border-foreground-muted/40 transition-colors cursor-pointer">
          <Search className="w-3.5 h-3.5" />
          <span>Search Order, UTR, Invoice...</span>
          <kbd className="ml-auto font-mono text-[10px] bg-background-primary px-1.5 py-0.5 rounded border border-border">
            ⌘K
          </kbd>
        </div>

        {/* Gemini Engine Status Pill */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>Gemini 2.5 Flash Explainer Active</span>
        </div>

        {/* Upload Action Button */}
        <Button
          variant="primary"
          size="sm"
          icon={<Upload className="w-3.5 h-3.5" />}
          onClick={onOpenUpload}
          className="font-medium shadow-glow-indigo"
        >
          <span>Import CSVs</span>
        </Button>

        {/* Notification Bell */}
        <button 
          className="p-2 rounded-lg border border-border bg-surface-elevated hover:bg-white/[0.05] transition-colors text-foreground-secondary hover:text-foreground-primary relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-background-secondary" />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg border border-border bg-surface-elevated hover:bg-white/[0.05] transition-colors text-foreground-secondary hover:text-foreground-primary"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
