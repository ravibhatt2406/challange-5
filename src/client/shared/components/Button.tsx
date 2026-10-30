import type { ButtonHTMLAttributes, ReactNode } from 'react';

/** Shared button contract for consistent states, sizing, and keyboard behavior. */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

// These classes define the product's action hierarchy without duplicating styles.
const variants = {
  primary:
    'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20 hover:shadow-brand-500/30',
  secondary:
    'bg-white/10 hover:bg-white/15 text-surface-200 border border-white/10',
  danger:
    'bg-red-600/80 hover:bg-red-500 text-white',
  ghost:
    'bg-transparent hover:bg-white/5 text-surface-400 hover:text-surface-200',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" role="status">
          <span className="sr-only">Loading...</span>
        </span>
      )}
      {children}
    </button>
  );
}
