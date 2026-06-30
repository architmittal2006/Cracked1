import React from 'react';

export type StatusType = 'Draft' | 'Pending_Review' | 'In_Dispute' | 'Completed' | 'Merged' | 'Open' | 'In_Review';

interface StatusPillProps {
  status: StatusType;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const getStatusDetails = () => {
    switch (status) {
      case 'Draft': return { className: 'status-draft', label: 'Draft' };
      case 'Pending_Review': return { className: 'status-pending', label: 'Pending Review' };
      case 'In_Dispute': return { className: 'status-dispute', label: 'In Dispute' };
      case 'Completed': return { className: 'status-completed', label: 'Completed' };
      case 'Merged': return { className: 'status-merged', label: 'Merged' };
      case 'Open': return { className: 'status-open', label: 'Open' };
      case 'In_Review': return { className: 'status-pending', label: 'In Review' };
      default: return { className: 'status-draft', label: status };
    }
  };

  const { className, label } = getStatusDetails();

  return (
    <span className={`status-pill ${className}`}>
      {label}
    </span>
  );
};
