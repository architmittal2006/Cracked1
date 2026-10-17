import React, { useState } from 'react';
import { Flag, Check, AlertTriangle } from 'lucide-react';
import { flagReview } from '../services/api';

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
      <button
        type="button"
        className="btn-ghost w-full flex items-center justify-center gap-2 text-emerald-400 opacity-50 cursor-not-allowed bg-emerald-500/10 border border-emerald-500/20"
        disabled
      >
        <Check className="w-4 h-4" /> Flagged
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="btn-ghost w-full flex items-center justify-center gap-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-300"
        onClick={() => setShowConfirm(!showConfirm)}
      >
        <Flag className="w-4 h-4" /> Flag as Low-Effort
      </button>

      {showConfirm && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-4 bg-slate-900 border border-rose-500/30 rounded-lg shadow-xl z-10 animate-scale-in">
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300">
              Flag this review for low-effort? This will be reviewed by community members.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 px-3 py-2 bg-rose-500 text-white text-xs rounded hover:bg-rose-600 disabled:opacity-50 transition-colors duration-200 flex items-center justify-center gap-1"
              onClick={handleFlag}
              disabled={flagging}
            >
              {flagging ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Flagging...
                </>
              ) : (
                'Confirm Flag'
              )}
            </button>
            <button
              type="button"
              className="flex-1 px-3 py-2 bg-slate-700 text-white text-xs rounded hover:bg-slate-600 transition-colors duration-200"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
