'use client';

import React from 'react';
import Link from 'next/link';
import { UtensilsCrossed, MapPin, Sliders } from 'lucide-react';
import { FeederDevice } from '@/types/feeder.types';

interface FoodStorageAndGoalsCardProps {
  activeDevice: FeederDevice;
  todayMealsServed: number;
  todayMealsTarget: number;
  mealsRemaining: number;
  isGoalExceeded: boolean;
  extraMeals: number;
  totalMealSegments: number;
  mealStatus: { label: string; badgeCls: string };
  scheduledMealsCount: number;
  manualMealsCount: number;
}

export function FoodStorageAndGoalsCard({
  activeDevice,
  todayMealsServed,
  todayMealsTarget,
  mealsRemaining,
  isGoalExceeded,
  extraMeals,
  totalMealSegments,
  mealStatus,
  scheduledMealsCount,
  manualMealsCount,
}: FoodStorageAndGoalsCardProps) {
  return (
    <div className="artisan-card p-5 sm:p-6 flex flex-col gap-4">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#143503]/8 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#143503]/8 text-[#143503] flex items-center justify-center shrink-0 border border-[#143503]/10">
            <UtensilsCrossed size={16} className="text-[#143503]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#143503] tracking-tight truncate">
              Daily Feeding & Nutrition Goals
            </h3>
            <p className="text-[11px] text-[#4B633E] font-medium truncate flex items-center gap-1.5 mt-0.5">
              <span>{activeDevice.petName}</span>
              <span className="opacity-40">•</span>
              <span className="flex items-center gap-0.5 text-[#143503]/80">
                <MapPin size={10} className="shrink-0 opacity-70" />
                <span>{activeDevice.room}</span>
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-semibold text-[#143503] bg-[#A7D1AE]/35 px-2.5 py-1 rounded-full border border-[#143503]/10 max-w-[130px] truncate">
            {activeDevice.name}
          </span>
        </div>
      </div>

      {/* Main Today's Meals Goal Card (Full Width) */}
      <div className="group relative p-4 sm:p-5 rounded-2xl bg-white/85 hover:bg-white border border-[#143503]/10 hover:border-[#143503]/25 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col gap-4">
        {/* Top row */}
        <div className="flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2 font-bold text-[#143503]">
            <UtensilsCrossed size={14} className="text-[#143503]/70 shrink-0" />
            <span className="text-sm">Today&apos;s Feeding Progress</span>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shrink-0 transition-colors ${mealStatus.badgeCls}`}
          >
            {mealStatus.label}
          </span>
        </div>

        {/* Middle: Ratio & Segments */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-extrabold text-[#143503] font-mono leading-none tracking-tight">
                {todayMealsServed}
              </span>
              <span className="text-base sm:text-lg font-bold text-[#4B633E] font-mono">
                /{todayMealsTarget} meals
              </span>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                isGoalExceeded
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-[#143503]/6 text-[#4B633E] border-transparent'
              }`}
            >
              {isGoalExceeded
                ? `100% (+${extraMeals} treats)`
                : `${Math.round((todayMealsServed / todayMealsTarget) * 100)}%`}
            </span>
          </div>

          {/* Dynamic Meal Segments */}
          <div className="flex gap-2 h-3 items-center w-full">
            {Array.from({ length: totalMealSegments }).map((_, idx) => {
              const isExtra = idx >= todayMealsTarget;
              const isServed = idx < todayMealsServed;
              return (
                <div
                  key={idx}
                  title={
                    isExtra
                      ? `Bonus Treat #${idx - todayMealsTarget + 1}`
                      : `Scheduled Meal #${idx + 1}`
                  }
                  className={`flex-1 h-2.5 rounded-full transition-all duration-300 ${
                    isExtra
                      ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 shadow-2xs ring-1 ring-amber-300/60'
                      : isServed
                      ? 'bg-gradient-to-r from-[#143503] to-[#4B633E] shadow-2xs'
                      : 'bg-[#143503]/12 border border-[#143503]/10'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Bottom info */}
        <div className="flex items-center justify-between text-xs text-[#4B633E] font-medium pt-2 border-t border-[#143503]/6 gap-2">
          <span className="truncate">
            {isGoalExceeded
              ? `Daily target met + ${extraMeals} bonus treat${extraMeals > 1 ? 's' : ''}! 🍖`
              : mealsRemaining === 0
              ? `All ${todayMealsTarget} scheduled meals completed! 🎉`
              : `${mealsRemaining} meal${mealsRemaining > 1 ? 's' : ''} left (${scheduledMealsCount} auto • ${manualMealsCount} manual)`}
          </span>
          <Link
            href="/schedule"
            className="text-xs font-mono font-bold text-[#143503] hover:text-[#245308] hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
            title="Change daily meal goal in schedule"
          >
            <span>Goal: {todayMealsTarget}/d</span>
            <Sliders size={12} className="text-[#143503]/70" />
          </Link>
        </div>
      </div>
    </div>
  );
}
