import React from 'react';
import {
  Coffee,
  Film,
  CupSoda,
  Palette,
  Landmark,
  ShoppingBag,
  Sparkles,
  Compass
} from 'lucide-react';

/**
 * GPU-Optimized Background Layer
 * Completely static, zero-blur, zero-repaint layer.
 * Hidden on mobile viewports (< 640px) to maximize frame rates and responsiveness on low-end phones.
 */
export const FloatingBackgroundIcons: React.FC = React.memo(() => {
  return (
    <div
      className="hidden sm:block fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Lightweight subtle static background accents (zero blur, zero animations) */}
      <div className="absolute top-[8%] left-[6%] text-slate-700/25">
        <Coffee className="w-8 h-8 sm:w-9 sm:h-9" />
      </div>

      <div className="absolute top-[14%] right-[8%] text-slate-700/25">
        <Film className="w-8 h-8 sm:w-10 sm:h-10" />
      </div>

      <div className="absolute top-[26%] left-[12%] text-slate-700/25">
        <CupSoda className="w-7 h-7 sm:w-8 sm:h-8" />
      </div>

      <div className="absolute top-[38%] right-[7%] text-slate-700/25">
        <Palette className="w-8 h-8 sm:w-9 sm:h-9" />
      </div>

      <div className="absolute top-[52%] left-[10%] text-slate-700/25">
        <Landmark className="w-8 h-8 sm:w-9 sm:h-9" />
      </div>

      <div className="absolute top-[65%] right-[12%] text-slate-700/25">
        <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8" />
      </div>

      <div className="absolute top-[78%] left-[7%] text-slate-700/25">
        <Sparkles className="w-8 h-8 sm:w-9 sm:h-9" />
      </div>

      <div className="absolute top-[88%] right-[8%] text-slate-700/25">
        <Compass className="w-8 h-8 sm:w-9 sm:h-9" />
      </div>
    </div>
  );
});

FloatingBackgroundIcons.displayName = 'FloatingBackgroundIcons';
