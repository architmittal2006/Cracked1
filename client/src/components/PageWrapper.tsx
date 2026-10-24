import React from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, className = '' }) => {
  return (
    <div className={`page-container pt-24 pb-8 animate-fade-in ${className}`}>
      {children}
    </div>
  );
};
