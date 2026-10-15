'use client';

import React from 'react';
import { Utensils, CheckCircle2 } from 'lucide-react';

interface DailyGoalCardProps {
  petName: string;
  todayTarget: number;
  onUpdateTarget: (target: number) => void;
  targetSavedToast: boolean;
  toastMessage?: string;
}

export function DailyGoalCard({
  petName,
  todayTarget,
  onUpdateTarget,
  targetSavedToast,
  toastMessage,
}: DailyGoalCardProps) {
  return (
    <div className="artisan-card p-4 sm:p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#143503]/8 text-[#143503] flex items-center justify-center shrink-0">
            <Utensils size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-[#143503] truncate">Daily Meal Goal</h3>
            <p className="text-xs text-[#4B633E] truncate">How many times to feed {petName} per day</p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-[#143503] bg-[#A7D1AE]/35 px-2.5 py-1 rounded-full border border-[#143503]/10 shrink-0">
          {todayTarget} meals/day
        </span>
      </div>

      {targetSavedToast && (
        <div className="p-2.5 rounded-xl bg-[#A7D1AE]/45 border border-[#143503]/20 text-[#143503] text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
          <CheckCircle2 size={13} />
          <span>
            {toastMessage || `Daily goal set to ${todayTarget} meals/day for ${petName}!`}
          </span>
        </div>
      )}

      {/* Target Preset Selector */}
      <div className="grid grid-cols-4 gap-2 pt-0.5">
        {[2, 3, 4, 5].map((count) => {
          const isSelected = todayTarget === count;
          return (
            <button
              key={count}
              type="button"
              onClick={() => onUpdateTarget(count)}
              className={`py-2.5 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#143503] text-[#FFF2E6] border-[#143503] shadow-xs'
                  : 'bg-white text-[#143503] border-[#143503]/12 hover:bg-[#143503]/5 shadow-2xs'
              }`}
            >
              {count}/day
            </button>
          );
        })}
      </div>
    </div>
  );
}
