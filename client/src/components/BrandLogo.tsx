import React from 'react';

interface BrandLogoProps {
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = 'h-8 w-auto' }) => (
  <>
    <img
      src="/cracked-wordmark-dark.png"
      alt="Cracked?"
      className={`brand-wordmark brand-wordmark--dark ${className}`}
    />
    <img
      src="/cracked-wordmark-light.png"
      alt=""
      aria-hidden="true"
      className={`brand-wordmark brand-wordmark--light ${className}`}
    />
  </>
);
