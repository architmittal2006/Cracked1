import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, HelpCircle, Shield } from 'lucide-react';

const TRACKS = [
  {
    id: 'arena',
    label: 'Arena',
    icon: Trophy,
    color: '#1D9E75',
    bgColor: '#E1F5EE',
    borderColor: '#0F6E56',
    path: '/arena',
  },
  {
    id: 'questions',
    label: 'Questions',
    icon: HelpCircle,
    color: '#D4537E',
    bgColor: '#FBEAF0',
    borderColor: '#993556',
    path: '/questions',
  },
  {
    id: 'cases',
    label: 'Curated',
    icon: Shield,
    color: '#7F77DD',
    bgColor: '#EEEDFE',
    borderColor: '#534AB7',
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
