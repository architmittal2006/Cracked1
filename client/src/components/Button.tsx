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
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'border border-transparent bg-[#FF4C25] text-[#101114] font-medium hover:bg-[#E64324] ' +
    'focus-visible:ring-2 focus-visible:ring-[#FF4C25]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-deep)]',
  secondary:
    'border border-[var(--border-medium)] bg-[var(--bg-card)] text-slate-200 font-medium hover:bg-white/[0.06] hover:border-white/25 ' +
    'focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-deep)]',
  ghost:
    'border border-transparent bg-transparent text-slate-300 font-medium hover:text-white hover:bg-white/[0.05] ' +
    'focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-deep)]',
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
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg outline-none transition-colors duration-150',
    `cracked-button-${variant}`,
    sizeStyles[size],
    variantStyles[variant],
    disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
    className,
  ].filter(Boolean).join(' ');

  if (isLink) {
    const isLinkDisabled = disabled || loading;
    return (
      <a
        href={isLinkDisabled ? undefined : href}
        className={classes}
        aria-busy={loading || undefined}
        aria-disabled={isLinkDisabled || undefined}
        tabIndex={isLinkDisabled ? -1 : undefined}
        onClick={isLinkDisabled ? (e) => e.preventDefault() : (rest as React.AnchorHTMLAttributes<HTMLAnchorElement>).onClick}
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
