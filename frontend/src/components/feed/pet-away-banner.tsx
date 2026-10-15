'use client';

import React from 'react';
import { Palmtree } from 'lucide-react';
import { triggerHaptic } from '@/lib/utils/telegram.util';

interface PetAwayBannerProps {
  petName: string;
  isAwayMode?: boolean;
  onResume: () => void;
}

export function PetAwayBanner({ petName, isAwayMode, onResume }: PetAwayBannerProps) {
  if (!isAwayMode) return null;

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 flex items-center justify-between gap-3 shadow-xs animate-fadeIn">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300">
          <Palmtree size={18} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-bold text-amber-950 truncate">
              {petName} is Away
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300/80 shrink-0">
              Alarms Paused
            </span>
          </div>
          <p className="text-[11px] text-amber-800 truncate mt-0.5">
            Automated feeding is suspended. Food will not dispense until resumed.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          triggerHaptic('medium');
          onResume();
        }}
        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 shadow-2xs transition-colors cursor-pointer"
      >
        Resume
      </button>
    </div>
  );
}
