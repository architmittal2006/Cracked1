import React from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, className = '' }) => {
  return (
    <div className={`page-container pt-20 pb-12 animate-fade-in ${className}`}>
      {children}
    </div>
  );
};
