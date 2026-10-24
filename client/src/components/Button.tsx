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
    'bg-[#10B981] text-white font-medium hover:bg-[#059669] ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/50 focus-visible:ring-offset-2',
  secondary:
    'bg-transparent border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/50 focus-visible:ring-offset-2',
  ghost:
    'bg-transparent text-gray-500 font-medium hover:text-gray-900 hover:bg-gray-100 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/50 focus-visible:ring-offset-2',
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
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button border-0 outline-none transition-all duration-200',
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
