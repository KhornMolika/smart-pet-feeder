'use client';

import React from 'react';
import { Palmtree } from 'lucide-react';

interface PetAwayModeCardProps {
  isAwayMode?: boolean;
  petName: string;
  onToggleAwayMode: () => void;
}

export function PetAwayModeCard({
  isAwayMode,
  petName,
  onToggleAwayMode,
}: PetAwayModeCardProps) {
  return (
    <div
      className={`artisan-card p-4 sm:p-5 flex items-center justify-between gap-4 transition-all duration-300 border ${
        isAwayMode
          ? 'bg-amber-50/75 border-amber-300/80 shadow-xs ring-1 ring-amber-300/50'
          : 'border-[#143503]/10'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
            isAwayMode
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-[#143503]/8 text-[#143503] border-[#143503]/10'
          }`}
        >
          <Palmtree size={20} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-[#143503] truncate">
              Pet Away Mode
            </h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors shrink-0 ${
                isAwayMode
                  ? 'bg-amber-200/80 text-amber-900 border-amber-300 animate-pulse'
                  : 'bg-[#A7D1AE]/35 text-[#143503] border-[#143503]/10'
              }`}
            >
              {isAwayMode ? 'Paused (Away)' : 'Active (Home)'}
            </span>
          </div>
          <p className="text-xs text-[#4B633E] truncate mt-0.5">
            {isAwayMode
              ? `All alarms paused while ${petName} is away`
              : `1-tap pause when ${petName} is at the vet, boarding, or traveling`}
          </p>
        </div>
      </div>

      {/* Tactile Toggle Switch */}
      <button
        type="button"
        onClick={onToggleAwayMode}
        aria-pressed={isAwayMode}
        className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
          isAwayMode ? 'bg-amber-600' : 'bg-[#143503]/20 hover:bg-[#143503]/30'
        }`}
        title={isAwayMode ? 'Resume feeding schedules' : 'Pause feeding schedules'}
      >
        <span
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[11px] ${
            isAwayMode ? 'translate-x-6 text-amber-700' : 'translate-x-0 text-slate-400'
          }`}
        >
          {isAwayMode ? '🌴' : '🏠'}
        </span>
      </button>
    </div>
  );
}
