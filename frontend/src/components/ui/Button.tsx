import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  loading = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 select-none rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5 h-8",
    md: "px-4 py-2 text-sm gap-2 h-9",
    lg: "px-5 py-2.5 text-base gap-2.5 h-11",
  };

  const variantStyles = {
    primary: "bg-brand text-white shadow-glow-indigo hover:bg-brand-hover active:bg-brand-dark border border-brand/40",
    secondary: "bg-surface-elevated text-foreground-primary hover:bg-white/[0.06] border border-border active:bg-surface",
    outline: "bg-transparent text-foreground-primary border border-border hover:border-foreground-muted/40 hover:bg-white/[0.03]",
    ghost: "bg-transparent text-foreground-secondary hover:text-foreground-primary hover:bg-white/[0.04]",
    danger: "bg-status-exception/10 text-status-exception border border-status-exception/30 hover:bg-status-exception/20",
    success: "bg-status-matched/10 text-status-matched border border-status-matched/30 hover:bg-status-matched/20",
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
};
