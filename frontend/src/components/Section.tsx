import React from 'react';
import { Container } from './Container';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  noContainer?: boolean;
  id?: string;
}

export const Section: React.FC<SectionProps> = ({ children, className = '', noContainer = false, id }) => {
  return (
    <section id={id} className={`py-16 md:py-24 section-padding ${className}`}>
      {noContainer ? children : <Container>{children}</Container>}
    </section>
  );
};

export default Section;