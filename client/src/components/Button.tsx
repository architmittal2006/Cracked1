import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  as?: 'button' | 'a';
  href?: string;
  className?: string;
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-brand-inverse shadow-[0_0_20px_rgba(255,76,37,0.35)] ' +
    'hover:bg-brand-hover hover:shadow-[0_8px_24px_rgba(255,76,37,0.45)] hover:-translate-y-[1px] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
  secondary:
    'bg-transparent border border-white/25 text-white ' +
    'hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2',
  ghost:
    'bg-transparent text-text-secondary font-semibold ' +
    'hover:text-brand hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  as = 'button',
  href,
  className,
  children,
  ...rest
}) => {
  const isLink = as === 'a' && !!href;

  const classes = [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button font-semibold border-0 outline-none transition-all duration-200',
    sizeStyles[size],
    variantStyles[variant],
    disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
    className,
  ].filter(Boolean).join(' ');

  if (isLink) {
    return (
      <a
        href={href}
        className={classes}
        aria-busy={loading || undefined}
        aria-disabled={disabled || loading || undefined}
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-disabled={disabled || loading || undefined}
      className={classes}
      {...rest}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
};

Button.displayName = 'Button';

export default Button;