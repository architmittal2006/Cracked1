import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const WORDS = ["learners", "students", "everyone", "you"];

export const ScrollTextCycle: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showPortal, setShowPortal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        if (prev < WORDS.length - 1) {
          return prev + 1;
        }
        // When we reach "you", trigger portal effect after a delay
        setTimeout(() => setShowPortal(true), 1000);
        return prev;
      });
    }, 2000); // Change word every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center">
      <h1 className="text-5xl md:text-7xl font-bold text-zinc-500 tracking-tight">
        Cracked is for{' '}
        <span className="inline-block">
          <AnimatePresence mode="wait">
            {activeIndex === 3 ? (
              // Special handling for "you" with scaling and portal effect
              <motion.span
                key="you"
                initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
                animate={{ 
                  opacity: showPortal ? 0 : 1, 
                  y: 0, 
                  filter: "blur(0px)",
                  scale: showPortal ? 5 : 1
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="text-white inline-block"
              >
                <span className="inline-block">y</span>
                <motion.span 
                  className="inline-block relative"
                  animate={{ scale: showPortal ? 10 : 1 }}
                  transition={{ duration: 0.5 }}
                >
                  o
                  <motion.div
                    className="absolute inset-0 bg-black rounded-full"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: showPortal ? 10 : 0, opacity: showPortal ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                  />
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: showPortal ? 1 : 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
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
  );
};
