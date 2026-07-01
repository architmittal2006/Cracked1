import { useEffect, type PropsWithChildren } from 'react';
import Lenis from 'lenis';

/**
 * Wraps the app in a buttery inertia-scroll experience (the "cool site" feel).
 * Uses the Lenis library — same approach used by most award-winning agency sites.
 */
export const SmoothScroll: React.FC<PropsWithChildren> = ({ children }) => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
};
