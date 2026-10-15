'use client';

import React from 'react';
import Link from 'next/link';
import { History, CheckCircle2, ArrowRight, Calendar, Palmtree, Clock, Sparkles } from 'lucide-react';
import { formatDuration } from '@/lib/utils/date.util';
import { FeederDevice } from '@/types/feeder.types';

interface MealStatusCardsProps {
  activeDevice: FeederDevice;
  lastFeedText: string;
  countdownText: string;
  nextMealTimeDisplay: string;
}

export function MealStatusCards({
  activeDevice,
  lastFeedText,
  countdownText,
  nextMealTimeDisplay,
}: MealStatusCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
      {/* Left Card: Last Meal */}
      <div className="group relative p-3.5 sm:p-4 rounded-2xl bg-white/85 hover:bg-white border border-[#143503]/10 hover:border-[#143503]/25 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-3 min-h-[148px] overflow-hidden">
        {/* Subtle Ambient Accent Glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#A7D1AE]/20 rounded-full blur-xl pointer-events-none -mr-8 -mt-8 group-hover:scale-125 transition-transform duration-500" />

        {/* Header Row */}
        <div className="flex items-center justify-between text-xs gap-1 relative z-10">
          <div className="flex items-center gap-1.5 font-bold text-[#143503] shrink-0">
            <div className="w-5.5 h-5.5 rounded-md bg-[#A7D1AE]/35 text-[#143503] flex items-center justify-center border border-[#143503]/10 shadow-2xs shrink-0">
              <History size={12} className="text-[#143503]" />
            </div>
            <span className="whitespace-nowrap">Last Meal</span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#A7D1AE]/45 text-[#143503] border border-[#143503]/15 shrink-0 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-pulse" />
            <span>Served</span>
          </span>
        </div>

        {/* Middle Body */}
        <div className="flex flex-col gap-1 relative z-10">
          <div className="text-xl sm:text-2xl font-black text-[#143503] font-mono tracking-tight leading-none">
            {activeDevice.lastFeedAt ? lastFeedText : '2h ago'}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#4B633E] font-medium truncate mt-0.5">
            <CheckCircle2 size={12} className="text-emerald-700 shrink-0" />
            <span className="truncate">
              Regular meal ({formatDuration(activeDevice.customPresets?.[1]?.durationMs ?? 60000)})
            </span>
          </div>
        </div>

        {/* Footer Action */}
        <Link
          href="/history"
          className="pt-2 border-t border-[#143503]/8 text-xs font-bold text-[#143503] hover:text-[#245308] flex items-center justify-between cursor-pointer group/link relative z-10 transition-colors"
        >
          <span>View Log</span>
          <div className="w-5 h-5 rounded-full bg-[#143503]/6 group-hover/link:bg-[#143503]/12 flex items-center justify-center transition-colors">
            <ArrowRight size={11} className="text-[#143503] transition-transform duration-200 group-hover/link:translate-x-0.5" />
          </div>
        </Link>
      </div>

      {/* Right Card: Next Meal */}
      <div className="group relative p-3.5 sm:p-4 rounded-2xl bg-white/85 hover:bg-white border border-[#143503]/10 hover:border-[#143503]/25 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-3 min-h-[148px] overflow-hidden">
        {/* Subtle Ambient Accent Glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#BCDBF0]/25 rounded-full blur-xl pointer-events-none -mr-8 -mt-8 group-hover:scale-125 transition-transform duration-500" />

        {/* Header Row */}
        <div className="flex items-center justify-between text-xs gap-1 relative z-10">
          <div className="flex items-center gap-1.5 font-bold text-[#143503] shrink-0">
            <div className="w-5.5 h-5.5 rounded-md bg-[#BCDBF0]/50 text-[#143503] flex items-center justify-center border border-[#143503]/10 shadow-2xs shrink-0">
              <Calendar size={12} className="text-[#143503]" />
            </div>
            <span className="whitespace-nowrap">Next Meal</span>
          </div>
          {activeDevice.isAwayMode ? (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 shrink-0 flex items-center gap-1">
              <Palmtree size={9} className="text-amber-700 shrink-0" />
              <span className="whitespace-nowrap">Away Paused</span>
            </span>
          ) : (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#BCDBF0]/55 text-[#143503] border border-[#143503]/15 shrink-0 flex items-center gap-1">
              <Clock size={9} className="text-[#143503]/70 shrink-0" />
              <span className="whitespace-nowrap">{activeDevice.nextScheduledFeedAt ? countdownText : 'in 4h 15m'}</span>
            </span>
          )}
        </div>

        {/* Middle Body */}
        <div className="flex flex-col gap-1 relative z-10">
          <div
            className={`text-xl sm:text-2xl font-black font-mono tracking-tight leading-none ${
              activeDevice.isAwayMode ? 'text-amber-800' : 'text-[#143503]'
            }`}
          >
            {activeDevice.isAwayMode ? 'Paused' : nextMealTimeDisplay}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#4B633E] font-medium truncate mt-0.5">
            {activeDevice.isAwayMode ? (
              <>
                <Palmtree size={12} className="text-amber-700 shrink-0" />
                <span className="truncate text-amber-800 font-medium">Resumes when pet returns</span>
              </>
            ) : (
              <>
                <Sparkles size={12} className="text-amber-600 shrink-0" />
                <span className="truncate">Auto scheduled dispense</span>
              </>
            )}
          </div>
        </div>

        {/* Footer Action */}
        <Link
          href="/schedule"
          className="pt-2 border-t border-[#143503]/8 text-xs font-bold text-[#143503] hover:text-[#245308] flex items-center justify-between cursor-pointer group/link relative z-10 transition-colors"
        >
          <span>Set Schedule</span>
          <div className="w-5 h-5 rounded-full bg-[#143503]/6 group-hover/link:bg-[#143503]/12 flex items-center justify-center transition-colors">
            <ArrowRight size={11} className="text-[#143503] transition-transform duration-200 group-hover/link:translate-x-0.5" />
          </div>
        </Link>
      </div>
    </div>
  );
}
