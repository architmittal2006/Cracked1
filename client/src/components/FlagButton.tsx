import React, { useState } from 'react';
import { Flag, Check, AlertTriangle } from 'lucide-react';
import { flagReview } from '../services/api';
import { Button } from './Button';

interface FlagButtonProps {
  reviewId: string;
  onFlagged?: () => void;
}

export const FlagButton: React.FC<FlagButtonProps> = ({ reviewId, onFlagged }) => {
  const [flagging, setFlagging] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleFlag = async () => {
    if (flagged) return;

    setFlagging(true);
    try {
      await flagReview(reviewId);
      setFlagged(true);
      setShowConfirm(false);
      onFlagged?.();
    } catch (err) {
      console.error('Failed to flag review:', err);
    } finally {
      setFlagging(false);
    }
  };

  if (flagged) {
    return (
      <Button
        variant="ghost"
        size="md"
        disabled
        className="w-full text-emerald-400 opacity-100 bg-emerald-500/10 border border-emerald-500/20"
      >
        <Check className="w-4 h-4" /> Flagged
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="md"
        className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-300"
        onClick={() => setShowConfirm(!showConfirm)}
      >
        <Flag className="w-4 h-4" /> Flag as Low-Effort
      </Button>

      {showConfirm && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-4 bg-slate-900 border border-rose-500/30 rounded-lg shadow-xl z-10 animate-scale-in">
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300">
              Flag this review for low-effort? This will be reviewed by community members.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleFlag}
              loading={flagging}
              disabled={flagging}
              className="flex-1"
            >
              {flagging ? 'Flagging...' : 'Confirm Flag'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfirm(false)}
              className="flex-1 text-white hover:bg-slate-600/50"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
