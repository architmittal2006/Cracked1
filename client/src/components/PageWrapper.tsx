import React from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, className = '' }) => {
  return (
    <div className={`page-container py-12 animate-fade-in ${className}`}>
      {children}
    </div>
  );
};
