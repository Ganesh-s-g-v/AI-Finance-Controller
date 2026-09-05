import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, FolderUp, CheckCircle, FileText } from 'lucide-react';

export type NavTab = 'dashboard' | 'workspace' | 'results' | 'review';

interface PillNavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

const navItems: { id: NavTab; label: string; icon: React.FC<any> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'workspace', label: 'Workspace', icon: FolderUp },
  { id: 'results', label: 'Results', icon: CheckCircle },
  { id: 'review', label: 'Review', icon: FileText },
];

export const PillNavigation: React.FC<PillNavigationProps> = ({ activeTab, onSelectTab }) => {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center bg-surface border border-border rounded-full p-1 shadow-sm">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;
        
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-full flex items-center gap-2 ${
              isActive ? 'text-foreground-primary' : 'text-foreground-secondary hover:text-foreground-primary'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="pill-active-bg"
                className="absolute inset-0 bg-surface-elevated rounded-full border border-border"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon className="w-4 h-4" />
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
