import React, { useState } from 'react';
import { Flag } from 'lucide-react';
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
        className="btn-ghost w-full flex items-center justify-center gap-2 text-rose-400 opacity-50 cursor-not-allowed"
        disabled
      >
        <Flag className="w-4 h-4" /> Flagged
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="btn-ghost w-full flex items-center justify-center gap-2 text-rose-400 hover:text-rose-300"
        onClick={() => setShowConfirm(!showConfirm)}
      >
        <Flag className="w-4 h-4" /> Flag as Low-Effort
      </button>

      {showConfirm && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-10">
          <p className="text-xs text-slate-300 mb-3">
            Flag this review for low-effort? This will be reviewed by community members.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 px-3 py-1.5 bg-rose-500 text-white text-xs rounded hover:bg-rose-600 disabled:opacity-50"
              onClick={handleFlag}
              disabled={flagging}
            >
              {flagging ? 'Flagging...' : 'Confirm Flag'}
            </button>
            <button
              type="button"
              className="flex-1 px-3 py-1.5 bg-slate-700 text-white text-xs rounded hover:bg-slate-600"
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
