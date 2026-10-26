import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'p-5' | 'p-6' | 'p-8';
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', padding = 'p-6', bordered = true }) => {
  return (
    <div className={`rounded-xl ${bordered ? 'border border-[var(--border-subtle)]' : ''} bg-[var(--bg-card)] shadow-[var(--shadow-card)] ${padding} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
