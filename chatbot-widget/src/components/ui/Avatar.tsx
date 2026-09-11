// components/ui/Avatar.tsx
import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  emoji?: string;
  color?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  emoji,
  color = '#a855f7',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };
  
  if (emoji) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium shadow-md`}
        style={{ backgroundColor: color }}
      >
        <span>{emoji}</span>
      </div>
    );
  }
  
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-md`}
      />
    );
  }
  
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-semibold shadow-md`}
      style={{ backgroundColor: color }}
    >
      {alt.charAt(0).toUpperCase()}
    </div>
  );
};
