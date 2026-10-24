import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'p-5' | 'p-6' | 'p-8';
}

export const Card: React.FC<CardProps> = ({ children, className = '', padding = 'p-6' }) => {
  return (
    <div className={`rounded-lg border border-white/8 bg-[#141414] shadow-sm ${padding} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
