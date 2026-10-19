// TODO: Replace this SVG placeholder with the final cracked-"?" brand asset
// (glossy cracked "?" or cracked-glass object). Keep fixed dimensions and
// swap point so there is no layout shift.
import React from 'react';

export const CrackedQuestionMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width={240}
    height={240}
    viewBox="0 0 240 240"
    role="img"
    aria-label="Cracked? brand mark"
    className={className}
    style={{ width: 240, height: 240 }}
  >
    <defs>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FF4C25" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#FF4C25" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="120" cy="120" r="118" fill="url(#glow)" />
    <text
      x="120"
      y="175"
      textAnchor="middle"
      fontFamily="Montserrat, system-ui, sans-serif"
      fontWeight="800"
      fontSize="180"
      fill="#E5E7EB"
    >
      ?
    </text>
    {/* cracks */}
    <path d="M95 60 L110 95 L100 130" stroke="#FF4C25" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M140 70 L125 105 L135 140" stroke="#FF4C25" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M105 150 L120 170" stroke="#FF4C25" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  </svg>
);
