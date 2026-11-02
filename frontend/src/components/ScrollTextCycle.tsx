import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const WORDS = ["learners", "students", "everyone", "you"];

export const ScrollTextCycle: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const staticTextRef = useRef<HTMLHeadingElement>(null);
  const wordRefs = useRef<(HTMLParagraphElement | HTMLSpanElement)[]>([]);

  useEffect(() => {
    let isLocked = false;
    let animationProgress = 0;
    let scrollYBeforeLock = 0;

    const lockScroll = () => {
      document.body.style.overflow = 'hidden';
      isLocked = true;
    };

    const unlockScroll = () => {
      document.body.style.overflow = '';
      isLocked = false;
    };

    const handleScroll = () => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();

      // Lock scroll when component reaches top of viewport (sticky position)
      if (containerRect.top <= 0 && !isLocked) {
        scrollYBeforeLock = window.scrollY;
        lockScroll();
        animationProgress = 0;
      }

      // Unlock scroll when animation completes
      if (animationProgress >= 0.95 && isLocked) {
        unlockScroll();
        return;
      }

      // If locked, use animation progress instead of actual scroll
      const effectiveProgress = isLocked ? animationProgress : 0;

      // Update static text opacity
      if (staticTextRef.current) {
        const staticOpacity = 1 - (effectiveProgress * 0.14);
        staticTextRef.current.style.opacity = staticOpacity.toString();
      }

      // Update each word's opacity and translateY
      const wordProgress = [
        [0, 0.15, 0.25, 0.35],
        [0.2, 0.35, 0.45, 0.55],
        [0.4, 0.55, 0.65, 0.75],
        [0.6, 0.75, 0.85]
      ];

      wordRefs.current.forEach((word, index) => {
        if (!word) return;

        const [start, mid1, mid2, end] = wordProgress[index];
        let opacity = 0;
        let y = 30;

        if (effectiveProgress >= start && effectiveProgress < mid1) {
          opacity = (effectiveProgress - start) / (mid1 - start);
          y = 30 - (opacity * 30);
        } else if (effectiveProgress >= mid1 && effectiveProgress < mid2) {
          opacity = 1;
          y = 0;
        } else if (effectiveProgress >= mid2 && effectiveProgress < end) {
          opacity = 1 - ((effectiveProgress - mid2) / (end - mid2));
          y = -opacity * 30;
        } else if (effectiveProgress >= end && index === 3) {
          opacity = 1;
          y = 0;
        }

        word.style.opacity = opacity.toString();
        word.style.transform = `translateY(${y}px)`;

        // Scale effect for "you"
        if (index === 3 && effectiveProgress >= 0.85) {
          const scaleProgress = (effectiveProgress - 0.85) / 0.1;
          const scale = 1 + scaleProgress * 4;
          word.style.transform = `translateY(${y}px) scale(${scale})`;
        }
      });

      // If locked, advance animation progress on scroll
      if (isLocked) {
        const scrollDelta = window.scrollY - scrollYBeforeLock;
        animationProgress = Math.min(0.95, Math.max(0, animationProgress + scrollDelta * 0.002));
        window.scrollTo(0, scrollYBeforeLock); // Keep scroll position fixed
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unlockScroll(); // Clean up
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-[550vh]">
      <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">
        <div className="flex items-start gap-8">
          <h2
            ref={staticTextRef}
            className="flex-shrink-0 text-[clamp(3.5rem,10vw,8rem)] leading-[1.16] font-medium text-[#F3F4F6]"
          >
            Cracked is for
          </h2>
          <div className="relative flex-1">
            <div className="relative">
              <p
                ref={(el) => { if (el) wordRefs.current[0] = el; }}
                className="absolute left-0 top-0 text-[clamp(3.9rem,12vw,9.5rem)] leading-[1.16] font-medium bg-gradient-to-r from-pink-400 via-pink-500 to-orange-500 bg-clip-text text-transparent"
              >
                {WORDS[0]}
              </p>
              <p
                ref={(el) => { if (el) wordRefs.current[1] = el; }}
                className="absolute left-0 top-0 text-[clamp(3.9rem,12vw,9.5rem)] leading-[1.16] font-medium bg-gradient-to-r from-pink-400 via-pink-500 to-orange-500 bg-clip-text text-transparent"
              >
                {WORDS[1]}
              </p>
              <p
                ref={(el) => { if (el) wordRefs.current[2] = el; }}
                className="absolute left-0 top-0 text-[clamp(3.9rem,12vw,9.5rem)] leading-[1.16] font-medium bg-gradient-to-r from-pink-400 via-pink-500 to-orange-500 bg-clip-text text-transparent"
              >
                {WORDS[2]}
              </p>
              <span
                ref={(el) => { if (el) wordRefs.current[3] = el; }}
                className="absolute left-0 top-0 text-[clamp(3.9rem,12vw,9.5rem)] leading-[1.16] font-medium text-[#F3F4F6] inline-block"
              >
                <span className="inline-block">y</span>
                <span className="inline-block relative">
                  o
                  <div className="absolute inset-0 bg-black rounded-full" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Link
                      to="/register"
                      className="text-2xl md:text-4xl font-bold text-white hover:text-[#FF4C25] transition-colors"
                    >
                      Register
                    </Link>
                  </div>
                </span>
                <span className="inline-block">u</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
