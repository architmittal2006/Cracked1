import React from 'react';
import { Container } from './Container';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
}

export const Section: React.FC<SectionProps> = ({ children, className = '' }) => {
  return (
    <section className={`py-20 md:py-28 ${className}`}>
      <Container>{children}</Container>
    </section>
  );
};

export default Section;