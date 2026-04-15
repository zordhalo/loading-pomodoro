import { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white border border-transparent',
  ghost:
    'bg-transparent hover:bg-[var(--surface-3)] text-[var(--text-muted)] border border-[var(--border)]',
  danger:
    'bg-transparent hover:bg-[var(--error)]/10 text-[var(--error)] border border-[var(--error)]/40',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-2.5 py-1 text-xs rounded-md gap-1',
  md: 'px-4 py-2 text-sm rounded-lg gap-1.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/50',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
