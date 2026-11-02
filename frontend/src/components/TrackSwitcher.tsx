import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, HelpCircle, Shield } from 'lucide-react';

const TRACKS = [
  {
    id: 'arena',
    label: 'Arena',
    icon: Trophy,
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    path: '/arena',
  },
  {
    id: 'questions',
    label: 'Questions',
    icon: HelpCircle,
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    path: '/questions',
  },
  {
    id: 'cases',
    label: 'Curated',
    icon: Shield,
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    path: '/cases',
  },
];

export const TrackSwitcher: React.FC = () => {
  const location = useLocation();
  const currentTrack = TRACKS.find(track => location.pathname.startsWith(track.path));

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-900/50 rounded-lg border border-slate-800">
      {TRACKS.map((track) => {
        const Icon = track.icon;
        const isActive = currentTrack?.id === track.id;

        return (
          <Link
            key={track.id}
            to={track.path}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              isActive
                ? 'text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
            style={
              isActive
                ? {
                    backgroundColor: track.bgColor,
                    color: track.color,
                  }
                : undefined
            }
          >
            <Icon className="w-4 h-4" />
            <span>{track.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
