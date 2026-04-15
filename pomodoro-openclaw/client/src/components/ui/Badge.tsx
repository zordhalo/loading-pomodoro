import { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type BadgeVariant = 'manual' | 'openclaw' | 'focus' | 'break' | 'longBreak' | 'muted';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  manual: 'bg-[var(--manual-badge)] text-[var(--text-muted)]',
  openclaw: 'bg-[var(--openclaw-badge)] text-[var(--openclaw-badge-text)]',
  focus: 'bg-[var(--primary)]/15 text-[var(--primary)]',
  break: 'bg-[var(--break-color)]/15 text-[var(--break-color)]',
  longBreak: 'bg-[var(--long-break-color)]/15 text-[var(--long-break-color)]',
  muted: 'bg-[var(--surface-3)] text-[var(--text-muted)]',
};

export function Badge({ variant = 'muted', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium leading-none tracking-wide uppercase',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
