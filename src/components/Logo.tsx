'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  variant?: 'light' | 'dark'; // 'dark' = navy text #1b2333, 'light' = white text
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'dark', size = 'md', showIcon = true }) => {
  const isLight = variant === 'light';

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
  };

  const textSizes = {
    sm: { main: 'text-lg', sub: 'text-[9px]' },
    md: { main: 'text-2xl', sub: 'text-[10px]' },
    lg: { main: 'text-3xl', sub: 'text-[12px]' },
  };

  return (
    <Link href="/" className="inline-flex items-center gap-2.5 group">
      {showIcon && (
        <div className={`relative ${iconSizes[size]} rounded-full overflow-hidden border-2 ${isLight ? 'border-white/80' : 'border-[#d88193]'} shadow-sm bg-white p-0.5 shrink-0 transition-transform group-hover:scale-105`}>
          <Image
            src="/images/ush-logo.jpg"
            alt="USH BY USHUAIA"
            fill
            priority
            unoptimized
            className="object-contain rounded-full"
          />
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <span className={`${textSizes[size].main} font-black ${isLight ? 'text-white' : 'text-[#1b2333]'} lowercase tracking-tight`}>
          ush
        </span>
        <span className={`${textSizes[size].sub} font-extrabold ${isLight ? 'text-white/90' : 'text-[#1b2333]'} uppercase tracking-wider opacity-85 mt-1`}>
          by USHUAIA
        </span>
      </div>
    </Link>
  );
};
