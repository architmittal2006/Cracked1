import React from 'react';

interface AvatarProps {
  initials?: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  initials = '??',
  imageUrl,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt="User avatar"
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-slate-700 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-white border-2 border-slate-700 ${className}`}
    >
      {initials}
    </div>
  );
};
