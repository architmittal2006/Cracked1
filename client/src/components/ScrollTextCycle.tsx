import { useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from 'framer-motion';

const WORDS = ["first-time investors", "f&o explorers", "hustlers", "dreamers", "you"];

export const ScrollTextCycle: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { scrollYProgress } = useScroll();

  // Map scroll progress (0 to 1) to word indices (0 to 4)
  const wordIndex = useTransform(scrollYProgress, [0, 1], [0, WORDS.length - 1]);

  // Update local state when the mapped index changes
  useMotionValueEvent(wordIndex, "change", (latest) => {
    setActiveIndex(Math.round(latest));
  });

  return (
    <div className="min-h-[300vh]">
      <div className="sticky top-0 h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-zinc-500 tracking-tight">
            Trackk is for{' '}
            <span className="inline-block">
              <AnimatePresence mode="wait">
                <motion.span
                  key={activeIndex}
                  initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -30, filter: "blur(4px)" }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="text-white"
                >
                  {WORDS[activeIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
        </div>
      </div>
    </div>
  );
};
