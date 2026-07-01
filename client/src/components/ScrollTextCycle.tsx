import { useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const WORDS = ["learners", "students", "everyone", "you"];

export const ScrollTextCycle: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { scrollYProgress } = useScroll();

  // Map scroll progress (0 to 1) to word indices (0 to 3)
  const wordIndex = useTransform(scrollYProgress, [0, 0.75], [0, WORDS.length - 1]);

  // Scale effect for "you" - from 0.75 to 1.0 scroll progress
  const youScale = useTransform(scrollYProgress, [0.75, 1], [1, 5]);
  const youOpacity = useTransform(scrollYProgress, [0.85, 0.95], [1, 0]);
  const portalOpen = useTransform(scrollYProgress, [0.9, 1], [0, 1]);

  // Update local state when the mapped index changes
  useMotionValueEvent(wordIndex, "change", (latest) => {
    setActiveIndex(Math.round(latest));
  });

  return (
    <div className="min-h-[300vh]">
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <div className="text-center relative">
          <h1 className="text-5xl md:text-7xl font-bold text-zinc-500 tracking-tight">
            Cracked is for{' '}
            <span className="inline-block">
              <AnimatePresence mode="wait">
                {activeIndex === 3 ? (
                  // Special handling for "you" with scaling and portal effect
                  <motion.span
                    key="you"
                    style={{ scale: youScale, opacity: youOpacity }}
                    className="text-white inline-block"
                  >
                    <span className="inline-block">y</span>
                    <motion.span 
                      className="inline-block relative"
                      style={{ scale: portalOpen }}
                    >
                      o
                      <motion.div
                        className="absolute inset-0 bg-black rounded-full"
                        style={{ 
                          scale: useTransform(portalOpen, [0, 0.5, 1], [0, 0, 10]),
                          opacity: useTransform(portalOpen, [0.5, 0.8], [0, 1])
                        }}
                      />
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ opacity: useTransform(portalOpen, [0.7, 1], [0, 1]) }}
                      >
                        <Link 
                          to="/register"
                          className="text-2xl md:text-4xl font-bold text-white hover:text-[#FF4C25] transition-colors"
                        >
                          Register
                        </Link>
                      </motion.div>
                    </motion.span>
                    <span className="inline-block">u</span>
                  </motion.span>
                ) : (
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
                )}
              </AnimatePresence>
            </span>
          </h1>
        </div>
      </div>
    </div>
  );
};
