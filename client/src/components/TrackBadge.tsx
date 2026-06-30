import React from 'react';

type TrackType = 'open_arena' | 'community_question' | 'curated_case';

interface TrackBadgeProps {
  track: TrackType;
  size?: 'sm' | 'md' | 'lg';
}

const TRACK_CONFIG = {
  open_arena: {
    label: 'Arena',
    color: '#1D9E75',
    bgColor: '#E1F5EE',
    borderColor: '#0F6E56',
  },
  community_question: {
    label: 'Questions',
    color: '#D4537E',
    bgColor: '#FBEAF0',
    borderColor: '#993556',
  },
  curated_case: {
    label: 'Curated',
    color: '#7F77DD',
    bgColor: '#EEEDFE',
    borderColor: '#534AB7',
  },
};

export const TrackBadge: React.FC<TrackBadgeProps> = ({ track, size = 'md' }) => {
  const config = TRACK_CONFIG[track];
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses[size]}`}
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
      }}
    >
      {config.label}
    </span>
  );
};
