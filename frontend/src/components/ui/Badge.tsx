import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  variant?: 'matched' | 'review' | 'exception' | 'info' | 'neutral';
  children: React.ReactNode;
  icon?: React.ReactNode;
  dot?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  icon,
  dot = false,
  className,
  size = 'md',
}) => {
  const variantStyles = {
    matched: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    review: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    exception: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    neutral: "bg-white/[0.04] text-foreground-secondary border-white/[0.08]",
  };

  const dotColors = {
    matched: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
    review: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
    exception: "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]",
    info: "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]",
    neutral: "bg-foreground-muted",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] gap-1.5",
    md: "px-2.5 py-1 text-xs gap-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border select-none tracking-wide",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dotColors[variant])} />}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
