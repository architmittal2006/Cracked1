import React from 'react';

type TrackType = 'open_arena' | 'community_question' | 'curated_case';

interface TrackBadgeProps {
  track: TrackType;
  size?: 'sm' | 'md' | 'lg';
}

const TRACK_CONFIG = {
  open_arena: {
    label: 'Arena',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  community_question: {
    label: 'Questions',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  curated_case: {
    label: 'Curated',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
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
