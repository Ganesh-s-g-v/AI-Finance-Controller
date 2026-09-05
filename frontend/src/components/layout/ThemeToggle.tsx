import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  side?: 'left' | 'right';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, onToggle, side = 'right' }) => {
  return (
    <button
      onClick={onToggle}
      className={`fixed top-6 ${side === 'left' ? 'left-8' : 'right-8'} z-50 p-2.5 rounded-full bg-surface border border-border text-foreground-secondary hover:text-foreground-primary transition-colors shadow-sm`}
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 180 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </motion.div>
    </button>
  );
};
