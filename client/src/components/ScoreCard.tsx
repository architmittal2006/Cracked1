import React from 'react';

interface ScoreCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  accentColor?: 'emerald' | 'cyan' | 'violet' | 'gold';
  progressPercent?: number;
  large?: boolean;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ 
  label, 
  value, 
  subtitle, 
  accentColor = 'emerald', 
  progressPercent, 
  large = false 
}) => {
  const getAccentClass = () => {
    switch (accentColor) {
      case 'emerald': return 'text-emerald-400';
      case 'cyan': return 'text-cyan-400';
      case 'violet': return 'text-violet-400';
      case 'gold': return 'text-amber-400';
      default: return 'text-emerald-400';
    }
  };

  const getGradient = () => {
    switch (accentColor) {
      case 'emerald': return 'from-emerald-400 to-emerald-600';
      case 'cyan': return 'from-cyan-400 to-cyan-600';
      case 'violet': return 'from-violet-400 to-violet-600';
      case 'gold': return 'from-amber-400 to-amber-600';
      default: return 'from-emerald-400 to-cyan-400';
    }
  };

  return (
    <div className="glass-card p-6 flex flex-col justify-between h-full">
      <div>
        <h3 className="section-label mb-2">{label}</h3>
        <div className={`font-mono font-black ${large ? 'text-4xl' : 'text-3xl'} ${getAccentClass()}`}>
          {value}
        </div>
      </div>
      
      {(subtitle || progressPercent !== undefined) && (
        <div className="mt-4">
          {progressPercent !== undefined && (
            <div className="progress-bar mb-2">
              <div 
                className={`h-full rounded-sm bg-gradient-to-r ${getGradient()}`} 
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>
          )}
          {subtitle && <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">{subtitle}</p>}
        </div>
      )}
    </div>
  );
};
