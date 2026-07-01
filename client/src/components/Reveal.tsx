import { useEffect, useRef, useState, type PropsWithChildren } from 'react';

interface RevealProps extends PropsWithChildren {
  /** Stagger delay in ms — pass index * 80 for a cascading list effect */
  delay?: number;
  /** 'up' | 'fade' | 'scale' */
  variant?: 'up' | 'fade' | 'scale';
  className?: string;
}

/**
 * Reveals its children with a smooth animation the first time they scroll
 * into view. Mirrors the IntersectionObserver pattern already used in
 * AnimatedCounter, so it's consistent with the rest of the codebase.
 */
export const Reveal: React.FC<RevealProps> = ({ children, delay = 0, variant = 'up', className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal reveal-${variant} ${visible ? 'reveal-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};
