import React, { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface VoteButtonProps {
  upvotes: number;
  downvotes: number;
  onVote?: (direction: 'up' | 'down') => void;
}

export const VoteButton: React.FC<VoteButtonProps> = ({ upvotes, downvotes, onVote }) => {
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const net = upvotes - downvotes;

  const handleVote = (direction: 'up' | 'down') => {
    if (userVote === direction) {
      setUserVote(null); // Remove vote
    } else {
      setUserVote(direction);
    }
    onVote?.(direction);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => handleVote('up')}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
          userVote === 'up'
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
        }`}
      >
        <TrendingUp className="w-4 h-4" />
        <span>{upvotes}</span>
      </button>
      <button
        type="button"
        onClick={() => handleVote('down')}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
          userVote === 'down'
            ? 'bg-red-500/20 text-red-400'
            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
        }`}
      >
        <TrendingDown className="w-4 h-4" />
        <span>{downvotes}</span>
      </button>
    </div>
  );
};
