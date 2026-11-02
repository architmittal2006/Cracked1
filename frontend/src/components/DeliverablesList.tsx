import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface DeliverablesListProps {
  deliverables: string[];
}

export const DeliverablesList: React.FC<DeliverablesListProps> = ({ deliverables }) => (
  <ul className="space-y-3">
    {deliverables.map((item, idx) => (
      <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);
