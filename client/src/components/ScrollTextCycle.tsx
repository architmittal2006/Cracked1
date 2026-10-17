import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const WORDS = ["learners", "students", "everyone", "you"];

export const ScrollTextCycle: React.FC = () => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    const container = document.getElementById('scroll-cycle-container');
    if (container) observer.observe(container);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % WORDS.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <div id="scroll-cycle-container" className="py-24 flex items-center justify-center">
      <div className="flex items-center gap-4 md:gap-8">
        <h2 className="text-2xl md:text-5xl lg:text-6xl font-bold text-white">
          Cracked is for
        </h2>
        <div className="relative w-48 md:w-72 lg:w-96 h-16 md:h-24">
          {WORDS.map((word, index) => (
            <p
              key={word}
              className={`absolute left-0 top-0 text-2xl md:text-5xl lg:text-6xl font-bold transition-all duration-500 ease-in-out ${
                index === currentWordIndex
                  ? 'opacity-100 translate-y-0 text-orange-400'
                  : index === (currentWordIndex - 1 + WORDS.length) % WORDS.length
                  ? 'opacity-0 translate-y-4'
                  : 'opacity-0 -translate-y-4'
              }`}
            >
              {word}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};
