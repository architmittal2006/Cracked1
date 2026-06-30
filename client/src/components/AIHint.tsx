import React, { useState } from 'react';
import { Lightbulb, Eye, EyeOff } from 'lucide-react';

interface AIHintProps {
  hint: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export const AIHint: React.FC<AIHintProps> = ({ hint, difficulty = 'medium' }) => {
  const [revealed, setRevealed] = useState(false);

  const difficultyColors = {
    easy: 'text-emerald-400',
    medium: 'text-amber-400',
    hard: 'text-rose-400',
  };

  return (
    <div className="glass-card p-4 border-l-4 border-violet-500">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-violet-400" />
          <span className="font-bold text-white text-sm">AI Hint</span>
          <span className={`text-xs ${difficultyColors[difficulty]}`}>{difficulty}</span>
        </div>
        <button
          type="button"
          onClick={() => setRevealed(!revealed)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
        >
          {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {revealed ? 'Hide' : 'Reveal'}
        </button>
      </div>
      {revealed && (
        <p className="text-sm text-slate-300">{hint}</p>
      )}
      {!revealed && (
        <p className="text-xs text-slate-500">Click reveal to see the AI-generated hint.</p>
      )}
    </div>
  );
};
