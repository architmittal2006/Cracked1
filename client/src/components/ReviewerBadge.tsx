import React from 'react';
import { Shield, Crown, User } from 'lucide-react';
import type { ReviewerTier } from '../data/mockData';

interface ReviewerBadgeProps {
  tier: ReviewerTier;
}

export const ReviewerBadge: React.FC<ReviewerBadgeProps> = ({ tier }) => {
  const details = {
    Verified: { icon: <Shield className="w-3 h-3 mr-1" />, className: 'tier-verified', label: 'Verified Reviewer' },
    Arbiter: { icon: <Crown className="w-3 h-3 mr-1" />, className: 'tier-arbiter', label: 'Arbiter' },
    General: { icon: <User className="w-3 h-3 mr-1" />, className: 'tier-general', label: 'General Reviewer' },
  }[tier];

  return (
    <span className={`tier-badge ${details.className}`}>
      {details.icon}
      {details.label}
    </span>
  );
};
