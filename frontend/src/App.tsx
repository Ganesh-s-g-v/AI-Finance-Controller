import React, { useState, useEffect } from 'react';
import { ShieldCheck, Moon, Sun, Activity } from 'lucide-react';

export const App: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-background-primary text-foreground-primary flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <header className="border-b border-border bg-background-secondary/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground-primary tracking-tight">AI Finance Controller</h1>
            <p className="text-xs text-foreground-secondary">Razorpay Buildathon — Track 4 MVP</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-elevated border border-border text-xs text-foreground-secondary">
            <Activity className="w-3.5 h-3.5 text-status-matched animate-pulse" />
            <span>Pipeline Ready</span>
          </div>

          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-lg border border-border bg-surface-elevated hover:border-foreground-muted/40 transition-colors text-foreground-secondary hover:text-foreground-primary"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Hero Welcome / System Status */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-medium mb-6">
          <span>Phase 1 — Project Scaffolding Verified</span>
        </div>

        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground-primary max-w-3xl mb-4 leading-tight">
          Deterministic logic decides.<br />
          <span className="bg-gradient-to-r from-brand to-brand-hover bg-clip-text text-transparent">AI explains. Humans approve.</span>
        </h2>

        <p className="text-foreground-secondary text-base max-w-2xl mb-8 leading-relaxed">
          AI-assisted three-source financial reconciliation copilot for Bank Statements, Razorpay Settlements, and Invoices.
        </p>

        {/* 3-Stage Architecture Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl text-left mt-4">
          <div className="p-6 rounded-xl bg-background-secondary border border-border shadow-card-dark">
            <div className="text-xs font-mono font-medium text-foreground-muted mb-2">STAGE 1</div>
            <h3 className="text-lg font-semibold text-foreground-primary mb-1">Normalize</h3>
            <p className="text-sm text-foreground-secondary">
              Bank Statement + Razorpay Settlement + Invoice CSVs normalized into unified models.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-background-secondary border border-border shadow-card-dark">
            <div className="text-xs font-mono font-medium text-foreground-muted mb-2">STAGE 2</div>
            <h3 className="text-lg font-semibold text-foreground-primary mb-1">Reconciliation</h3>
            <p className="text-sm text-foreground-secondary">
              Three-way matching engine with ±₹1.00 tolerance and deterministic confidence scoring.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-background-secondary border border-border shadow-card-dark">
            <div className="text-xs font-mono font-medium text-foreground-muted mb-2">STAGE 3</div>
            <h3 className="text-lg font-semibold text-foreground-primary mb-1">AI Explanation</h3>
            <p className="text-sm text-foreground-secondary">
              Gemini 2.5 Flash explains ambiguous matches (60–79) and exceptions (&lt;60) for human approval.
            </p>
          </div>
        </div>

        <div className="mt-12 flex items-center gap-3 text-xs text-foreground-muted font-mono">
          <span>FastAPI</span>
          <span>•</span>
          <span>Supabase PostgreSQL</span>
          <span>•</span>
          <span>React 18 + Vite</span>
          <span>•</span>
          <span>Tailwind CSS</span>
          <span>•</span>
          <span>Gemini 2.5 Flash</span>
        </div>
      </main>
    </div>
  );
};

export default App;
