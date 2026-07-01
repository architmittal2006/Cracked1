import { useRef, type MouseEvent } from 'react';

/**
 * Subtle "magnetic" hover effect — the element gently pulls toward the
 * cursor. Common on award-winning agency sites for hero CTAs.
 * Usage: const magnetic = useMagnetic<HTMLAnchorElement>(); <a {...magnetic}>
 */
export function useMagnetic<T extends HTMLElement = HTMLElement>(strength = 0.35) {
  const ref = useRef<T | null>(null);

  const onMouseMove = (e: MouseEvent<HTMLElement>) => {
    const el = ref.current ?? (e.currentTarget as HTMLElement);
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };

  const onMouseLeave = (e: MouseEvent<HTMLElement>) => {
    const el = ref.current ?? (e.currentTarget as HTMLElement);
    el.style.transform = 'translate(0px, 0px)';
  };

  return {
    ref,
    onMouseMove,
    onMouseLeave,
  };
}
