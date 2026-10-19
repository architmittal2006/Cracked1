import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useMotionValueEvent, useReducedMotion } from 'framer-motion';

const WORDS = [
  { word: 'aspiring consultants', desc: 'Practice real cases and earn a verified credibility score.' },
  { word: 'students', desc: 'Build a portfolio of scored work before you graduate.' },
  { word: 'practicing consultants', desc: 'Sharpen your thinking against a global peer bench.' },
  { word: 'recruiters', desc: 'Find candidates who\'ve proven their thinking on real cases' },
  { word: 'you', desc: 'Start solving. Your first case is free.' },
];

export const WordSwapSection: React.FC = () => {
  const reduce = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const idx = Math.min(WORDS.length - 1, Math.max(0, Math.floor(p * WORDS.length)));
    setActive(idx);
  });

  if (reduce || isMobile) {
    return (
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap gap-2">
            {WORDS.map((w) => (
              <span key={w.word} className="px-3 py-1 rounded-full bg-white/10 text-slate-200 text-sm">{w.word}</span>
            ))}
          </div>
          <p className="text-slate-400 mt-4 text-base">{WORDS[3].desc}</p>
        </div>
      </section>
    );
  }

  const navH = 64;

  return (
    <section ref={containerRef} style={{ height: '150vh' }} className="relative">
      <div
        className="sticky top-0 h-screen flex items-center"
        style={{ paddingTop: navH }}
      >
        <div className="max-w-5xl mx-auto px-6 w-full">
          <div className="flex flex-col gap-2" style={{ lineHeight: 1.1 }}>
            <span className="text-white font-bold" style={{ fontSize: 'clamp(40px,6vw,80px)' }}>
              Cracked? is for
            </span>
            <div className="relative h-[1.1em] overflow-hidden" aria-hidden="true">
              {WORDS.map((w, i) => {
                const dist = i - active;
                const opacity = dist === 0 ? 1 : 0.35;
                const color = dist === 0 ? '#FF4C25' : '#D1D5DB';
                const y = dist * 100;
                return (
                  <motion.span
                    key={w.word}
                    animate={{ y: `${y}%`, opacity }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    className="absolute left-0 top-0 font-bold whitespace-nowrap"
                    style={{ fontSize: 'clamp(40px,6vw,80px)', color }}
                  >
                    {w.word}
                  </motion.span>
                );
              })}
            </div>
          </div>
          <p className="text-slate-300 mt-6" style={{ fontSize: 16, minHeight: 24 }}>
            {WORDS[active].desc}
          </p>
          {/* visually hidden list for screen readers */}
          <ul className="sr-only">
            {WORDS.map((w) => <li key={w.word}>{w.word}: {w.desc}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
};
