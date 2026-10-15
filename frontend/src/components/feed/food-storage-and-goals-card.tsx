'use client';

import React from 'react';
import Link from 'next/link';
import { Package, MapPin, Check, Wheat, RotateCcw, UtensilsCrossed, Sliders } from 'lucide-react';
import { FeederDevice } from '@/types/feeder.types';

interface FoodStorageAndGoalsCardProps {
  activeDevice: FeederDevice;
  refillToast: boolean;
  onRefillTank: () => void;
  hopperPercent: number;
  daysRemaining: number;
  hopperStatus: { label: string; badgeCls: string; barCls: string };
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
  refillToast,
  onRefillTank,
  hopperPercent,
  daysRemaining,
  hopperStatus,
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
            <Package size={16} className="text-[#143503]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#143503] tracking-tight truncate">
              Food Storage & Daily Meals
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

      {/* Refill Success Toast */}
      {refillToast && (
        <div className="p-2.5 rounded-xl bg-[#A7D1AE]/45 border border-[#143503]/20 text-[#143503] text-xs font-semibold flex items-center justify-between gap-2 animate-fadeIn">
          <span className="flex items-center gap-1.5">
            <Check size={14} className="text-[#143503]" />
            <span>{activeDevice.petName}&apos;s food tank refilled to 100%! 🌾</span>
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
        {/* Card A: Food Storage */}
        <div className="group relative p-4 rounded-2xl bg-white/85 hover:bg-white border border-[#143503]/10 hover:border-[#143503]/25 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-3.5 min-h-[145px]">
          {/* Top row */}
          <div className="flex items-center justify-between text-xs gap-1">
            <div className="flex items-center gap-1.5 font-bold text-[#143503] shrink-0">
              <Wheat size={13} className="text-[#143503]/70 shrink-0" />
              <span className="whitespace-nowrap">Food Storage</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 transition-colors ${hopperStatus.badgeCls}`}
            >
              {hopperStatus.label}
            </span>
          </div>

          {/* Middle: Percentage & Refill Button */}
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#143503] font-mono leading-none tracking-tight">
                {hopperPercent}%
              </span>
              <button
                type="button"
                onClick={onRefillTank}
                className="flex items-center gap-1 text-[10px] font-bold text-[#143503] bg-[#143503]/6 hover:bg-[#143503]/12 border border-[#143503]/10 px-2 py-0.5 rounded-lg transition-all active:scale-95 cursor-pointer select-none"
                title="Refill food storage to 100%"
              >
                <RotateCcw size={10} className="text-[#143503]" />
                <span>Refill</span>
              </button>
            </div>

            {/* Level Bar */}
            <div className="w-full h-2.5 rounded-full bg-[#143503]/10 p-0.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${hopperStatus.barCls}`}
                style={{ width: `${Math.min(100, Math.max(0, hopperPercent))}%` }}
              />
            </div>
          </div>

          {/* Bottom info */}
          <div className="flex items-center justify-between text-[11px] text-[#4B633E] font-medium pt-1 border-t border-[#143503]/6">
            <span className="truncate">
              {hopperPercent > 0 ? `~${daysRemaining} days remaining` : 'Empty! Please refill'}
            </span>
            <span className="text-[10px] font-mono font-semibold text-[#143503]/70">
              {Math.round((hopperPercent / 100) * 1.5 * 10) / 10}kg
            </span>
          </div>
        </div>

        {/* Card B: Today's Meals */}
        <div className="group relative p-3.5 sm:p-4 rounded-2xl bg-white/85 hover:bg-white border border-[#143503]/10 hover:border-[#143503]/25 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-3 min-h-[145px]">
          {/* Top row */}
          <div className="flex items-center justify-between text-xs gap-1">
            <div className="flex items-center gap-1.5 font-bold text-[#143503] shrink-0">
              <UtensilsCrossed size={13} className="text-[#143503]/70 shrink-0" />
              <span className="whitespace-nowrap">Today&apos;s Meals</span>
            </div>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 transition-colors ${mealStatus.badgeCls}`}
            >
              {mealStatus.label}
            </span>
          </div>

          {/* Middle: Ratio & Segments */}
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#143503] font-mono leading-none tracking-tight">
                  {todayMealsServed}
                </span>
                <span className="text-sm font-bold text-[#4B633E] font-mono">
                  /{todayMealsTarget}
                </span>
              </div>
              <span
                className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md border transition-colors ${
                  isGoalExceeded
                    ? 'bg-amber-50 text-amber-900 border-amber-200 font-bold'
                    : 'bg-[#143503]/6 text-[#4B633E] border-transparent'
                }`}
              >
                {isGoalExceeded
                  ? `100% (+${extraMeals})`
                  : `${Math.round((todayMealsServed / todayMealsTarget) * 100)}%`}
              </span>
            </div>

            {/* Dynamic Meal Segments */}
            <div className="flex gap-1.5 h-2.5 items-center w-full">
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
                    className={`flex-1 h-2 rounded-full transition-all duration-300 ${
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
          <div className="flex items-center justify-between text-[11px] text-[#4B633E] font-medium pt-1 border-t border-[#143503]/6 gap-1">
            <span className="truncate">
              {isGoalExceeded
                ? `Goal met + ${extraMeals} manual treat${extraMeals > 1 ? 's' : ''}! 🍖`
                : mealsRemaining === 0
                ? `All ${todayMealsTarget} meals completed! 🎉`
                : `${mealsRemaining} meal${mealsRemaining > 1 ? 's' : ''} left (${scheduledMealsCount} auto • ${manualMealsCount} manual)`}
            </span>
            <Link
              href="/schedule"
              className="text-[10px] font-mono font-bold text-[#143503] hover:text-[#245308] hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
              title="Change daily meal goal in schedule"
            >
              <span>Goal: {todayMealsTarget}/d</span>
              <Sliders size={10} className="text-[#143503]/70" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
