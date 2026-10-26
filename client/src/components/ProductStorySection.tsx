import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useReducedMotion } from 'framer-motion';
import { SolutionsScreen } from './mockups/SolutionsScreen';
import { SubmitScreen } from './mockups/SubmitScreen';
import { ProfileScreen } from './mockups/ScoreScreen';
import { PROBLEM_TYPES } from '../data/mockData';

const STEPS = [
  { n: 1, title: 'Choose a case', desc: 'Pick a structured business problem to work through.' },
  { n: 2, title: 'Submit your solution', desc: 'Explain your approach in a clear, structured response.' },
  { n: 3, title: 'Compare approaches', desc: 'Read other solutions after you have submitted yours.' },
  { n: 4, title: 'Build a record', desc: 'Keep your work together on a shareable profile.' },
];

const CasePickerScreen: React.FC = () => (
  <div className="space-y-3 p-4 text-sm">
    <div className="font-semibold text-white">Case library</div>
    {PROBLEM_TYPES.slice(0, 3).map((type) => (
      <div key={type} className="glass-card flex items-center justify-between p-3">
        <span className="text-slate-300">{type}</span>
        <span className="text-xs text-slate-500">Open case</span>
      </div>
    ))}
  </div>
);

const SCREENS = [CasePickerScreen, SubmitScreen, SolutionsScreen, ProfileScreen];

export const ProductStorySection: React.FC = () => {
  const reduce = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const u = () => setIsMobile(mq.matches);
    u(); mq.addEventListener('change', u);
    return () => mq.removeEventListener('change', u);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const idx = Math.min(3, Math.max(0, Math.floor(p * 4)));
    setActive(idx);
  });

  const Screen = SCREENS[active];

  if (reduce || isMobile) {
    return (
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          {STEPS.map((s, i) => {
            const Sc = SCREENS[i];
            return (
              <div key={s.n} className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <div className="text-orange-400 font-mono text-sm">Step {s.n}</div>
                  <h3 className="text-white text-xl font-semibold">{s.title}</h3>
                  <p className="text-slate-400 text-sm mt-1">{s.desc}</p>
                </div>
                <div className="glass-card overflow-hidden">
                  <Sc />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section ref={containerRef} style={{ height: '180vh' }} className="relative">
      <div className="sticky top-0 h-screen flex items-center">
        <div className="max-w-6xl mx-auto px-6 w-full grid grid-cols-2 gap-12">
          <div className="space-y-4">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className="glass-card p-5 transition-opacity duration-300"
                style={{ opacity: i === active ? 1 : 0.5 }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === active ? 'bg-orange-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                    {s.n}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-base">{s.title}</div>
                    <div className="text-slate-400 text-sm">{s.desc}</div>
                  </div>
                </div>
                {i === active && (
                  <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-orange-500" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 0.4 }} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="glass-card overflow-hidden" style={{ minHeight: 360 }}>
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="ml-2 text-xs text-slate-500">cracked.app</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
              >
                <Screen />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
