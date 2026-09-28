import React from 'react';

interface LunoraLogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const LunoraLogo: React.FC<LunoraLogoProps> = ({
  className = '',
  showTagline = true,
  size = 'md',
}) => {
  // Moon icon mark: 28px on mobile for 'md' (w-7 h-7 = 28px), 32px on tablet/desktop (md:w-8 md:h-8)
  const iconSize =
    size === 'sm'
      ? 'w-6 h-6'
      : size === 'lg'
      ? 'w-10 h-10'
      : 'w-7 h-7 md:w-8 md:h-8';

  // Wordmark: 15-16px on mobile (text-[15px] sm:text-[16px]), 24px on tablet/desktop (md:text-2xl)
  const textClass =
    size === 'sm'
      ? 'text-lg'
      : size === 'lg'
      ? 'text-2xl sm:text-3xl'
      : 'text-[15px] sm:text-[16px] md:text-2xl';

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 md:gap-3 group select-none min-w-0 ${className}`}>
      {/* Refined Gold Crescent Moon Icon */}
      <div className="relative flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
        <svg
          className={`${iconSize} text-[#e6ca85] transition-colors`}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle outer halo */}
          <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray="3 3" />
          {/* Crescent Moon */}
          <path
            d="M62 24 C44 26 32 40 32 58 C32 74 44 86 60 88 C38 86 22 68 22 48 C22 28 38 14 58 12 C60 12 61 13 62 24 Z"
            fill="url(#goldMoonGrad)"
          />
          {/* Tiny accent star/sparkle */}
          <circle cx="70" cy="34" r="2.5" fill="#f7ecc8" />
          <circle cx="78" cy="48" r="1.5" fill="#e6ca85" />
          <defs>
            <linearGradient id="goldMoonGrad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f7ecc8" />
              <stop offset="0.5" stopColor="#e6ca85" />
              <stop offset="1" stopColor="#c8aa62" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Elegant Serif Wordmark */}
      <div className="flex flex-col text-left min-w-0">
        <div className={`font-serif tracking-wider font-semibold text-[#edebe6] dark:text-[#edebe6] transition-colors ${textClass} whitespace-nowrap`}>
          <span>LUNORA</span>
          <span className="text-[#e6ca85] ml-1 sm:ml-1.5 font-light">PICKS</span>
        </div>
        {/* On mobile (< 768px), hide the tagline under the logo; visible on tablet/desktop */}
        {showTagline && (
          <span className="hidden md:block text-[10px] tracking-[0.25em] text-[#a09c91] uppercase font-sans -mt-0.5">
            Curated Discovery
          </span>
        )}
      </div>
    </div>
  );
};
