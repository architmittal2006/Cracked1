import React, { useState, useEffect } from 'react';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  verified?: boolean;
}

const testimonials: Testimonial[] = [
  {
    name: 'Sarah Chen',
    role: 'Strategy Consultant',
    company: 'McKinsey & Company',
    content: 'Cracked? gave me the structured practice I needed. The peer review system is brutal but fair - it forced me to think through every recommendation.',
    verified: true,
  },
  {
    name: 'James Rodriguez',
    role: 'Senior Associate',
    company: 'BCG',
    content: 'The credibility tier system actually works. My profile with Cracked? helped me stand out in interviews because hiring managers could see my actual work.',
    verified: true,
  },
  {
    name: 'Priya Sharma',
    role: 'Consulting Analyst',
    company: 'Bain & Company',
    content: 'What sets this apart is the transparency. You can see exactly why you scored well or poorly on each dimension. It\'s like having a mentor 24/7.',
    verified: true,
  },
  {
    name: 'Michael Park',
    role: 'MBA Candidate',
    company: 'Wharton',
    content: 'Used this throughout my case prep. The variety of cases and the quality of peer feedback prepared me better than any traditional prep service.',
    verified: true,
  },
  {
    name: 'Emma Wilson',
    role: 'Strategy Director',
    company: 'Deloitte',
    content: 'The merge bonus feature is genius - it incentivizes high-quality submissions. I\'ve seen incredible solutions come through this platform.',
    verified: true,
  },
];

export const TestimonialsCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const nextTestimonial = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevTestimonial = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      nextTestimonial();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const testimonial = testimonials[currentIndex];

  return (
    <div className="relative">
      <div className="glass-card p-8 md:p-12">
        <Quote className="w-12 h-12 text-emerald-400/50 mb-6" />

        <div
          className={`text-lg md:text-xl text-slate-300 leading-relaxed mb-8 transition-all duration-500 ${
            isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          "{testimonial.content}"
        </div>

        <div
          className={`flex items-start gap-4 transition-all duration-500 ${
            isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
            {testimonial.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-white">{testimonial.name}</h4>
              {testimonial.verified && (
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-sm text-slate-400">{testimonial.role}</p>
            <p className="text-sm text-emerald-400">{testimonial.company}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          type="button"
          onClick={prevTestimonial}
          className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all duration-300 disabled:opacity-50"
          disabled={isAnimating}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                if (isAnimating) return;
                setIsAnimating(true);
                setCurrentIndex(index);
                setTimeout(() => setIsAnimating(false), 500);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-emerald-500 w-6' : 'bg-slate-700 hover:bg-slate-600'
              }`}
              disabled={isAnimating}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={nextTestimonial}
          className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all duration-300 disabled:opacity-50"
          disabled={isAnimating}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
