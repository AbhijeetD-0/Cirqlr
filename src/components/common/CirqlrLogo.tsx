import React, { useState } from 'react';

interface CirqlrLogoProps {
  className?: string;
  size?: number | string;
  alt?: string;
}

/**
 * Official Cirqlr Brand Logo
 * Displays the high-resolution 3D gradient vector badge (vibrant blue-purple-orange
 * gradient 'C' enclosing two stylized figures) with guaranteed fast delivery
 * and zero broken-box artifacts.
 */
export const CirqlrLogo: React.FC<CirqlrLogoProps> = ({
  className = 'w-10 h-10 rounded-xl shrink-0',
  size,
  alt = 'Cirqlr Logo',
}) => {
  const [imgError, setImgError] = useState(false);

  // High-resolution local image asset
  if (!imgError) {
    return (
      <img
        src="/assets/aistudio/IMG_20261016_180442_c637878a.png"
        alt={alt}
        className={`${className} object-contain select-none`}
        style={size ? { width: size, height: size } : undefined}
        onError={() => setImgError(true)}
      />
    );
  }

  // Resilient inline SVG fallback
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} object-contain select-none`}
      style={size ? { width: size, height: size } : undefined}
      role="img"
      aria-label={alt}
    >
      <defs>
        <linearGradient id="cirqlrCGradient" x1="14" y1="12" x2="86" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="45%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="sheenGradient" x1="20" y1="15" x2="80" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#A855F7" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="companionLeft" x1="33" y1="33" x2="49" y2="65" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="companionRight" x1="51" y1="33" x2="67" y2="65" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDBA74" />
          <stop offset="45%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>
      </defs>
      {/* Crisp White Badge Container */}
      <rect width="100" height="100" rx="22" fill="#FFFFFF" />
      {/* Cirqlr "C" Outer Ribbon */}
      <path
        d="M 73 22 C 58 13.5 34 16 23 27 C 11 39 11 61 23 73 C 34 84 58 86.5 73 78 C 76.5 76 78 72 76 68 C 74 64.5 69.5 63 66 65 C 55.5 70.5 39 70 30.5 61.5 C 22.5 53.5 22.5 46.5 30.5 38.5 C 39 30 55.5 29.5 66 35 C 69.5 37 74 35.5 76 32 C 78 28 76.5 24 73 22 Z"
        fill="url(#cirqlrCGradient)"
      />
      {/* Top Sheen */}
      <path
        d="M 73 22 C 58 13.5 34 16 23 27 C 18 32.5 15 39 14 46 C 17 38 23 30 30.5 38.5 C 39 30 55.5 29.5 66 35 C 69.5 37 74 35.5 76 32 C 78 28 76.5 24 73 22 Z"
        fill="url(#sheenGradient)"
        opacity="0.6"
      />
      {/* Companion 1 (Left - Cyan/Blue) */}
      <circle cx="42" cy="41" r="5.6" fill="url(#companionLeft)" />
      <path
        d="M 34 60 C 34 50.5 50 50.5 50 60"
        stroke="url(#companionLeft)"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      {/* Companion 2 (Right - Warm Orange/Magenta) */}
      <circle cx="58" cy="41" r="5.6" fill="url(#companionRight)" />
      <path
        d="M 50 60 C 50 50.5 66 50.5 66 60"
        stroke="url(#companionRight)"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      {/* Center Platonic Bond Spark */}
      <circle cx="50" cy="50.5" r="2.2" fill="#F59E0B" />
    </svg>
  );
};
