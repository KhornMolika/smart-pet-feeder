'use client';

import React from 'react';
import Link from 'next/link';
import { UtensilsCrossed, MapPin, Calendar, Clock, Smartphone, ChevronRight } from 'lucide-react';
import { FeederDevice } from '@/types/feeder.types';

interface FoodStorageAndGoalsCardProps {
  activeDevice: FeederDevice;
  todayMealsServed: number;
  scheduledMealsCount: number;
  manualMealsCount: number;
  activeSchedulesCount?: number;
}

export function FoodStorageAndGoalsCard({
  activeDevice,
  todayMealsServed,
  scheduledMealsCount,
  manualMealsCount,
  activeSchedulesCount = 0,
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
              Today&apos;s Feeding Activity
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

      {/* Main Today's Summary Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/85 hover:bg-white border border-[#143503]/10 hover:border-[#143503]/25 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col gap-4">
        {/* Top row */}
        <div className="flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2 font-bold text-[#143503]">
            <UtensilsCrossed size={14} className="text-[#143503]/70 shrink-0" />
            <span className="text-sm">Total Feeds Served Today</span>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border shrink-0 bg-[#A7D1AE]/45 text-[#143503] border-[#143503]/20">
            {todayMealsServed > 0 ? 'Active Today' : 'Awaiting Feeds'}
          </span>
        </div>

        {/* Big Counter */}
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#143503] font-mono leading-none tracking-tight">
              {todayMealsServed}
            </span>
            <span className="text-sm sm:text-base font-bold text-[#4B633E]">
              {todayMealsServed === 1 ? 'feed completed' : 'feeds completed'}
            </span>
          </div>

          <Link
            href="/history"
            className="text-xs font-semibold text-[#143503] hover:underline flex items-center gap-1 bg-[#143503]/5 px-2.5 py-1 rounded-lg border border-[#143503]/10"
          >
            <span>View Logs</span>
            <ChevronRight size={12} />
          </Link>
        </div>

        {/* Breakdown Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-[#143503]/8">
          {/* Automated Feeds */}
          <div className="p-2.5 rounded-xl bg-[#143503]/4 border border-[#143503]/8 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#4B633E]">
              <Clock size={12} className="text-[#2D6A4F]" />
              <span>Schedules</span>
            </div>
            <span className="text-base font-bold text-[#143503] font-mono mt-1">
              {scheduledMealsCount} <span className="text-[10px] font-normal text-[#4B633E]">served</span>
            </span>
          </div>

          {/* Manual Treats */}
          <div className="p-2.5 rounded-xl bg-[#143503]/4 border border-[#143503]/8 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#4B633E]">
              <Smartphone size={12} className="text-[#0284C7]" />
              <span>Manual Feeds</span>
            </div>
            <span className="text-base font-bold text-[#143503] font-mono mt-1">
              {manualMealsCount} <span className="text-[10px] font-normal text-[#4B633E]">dispenses</span>
            </span>
          </div>

          {/* Active Alarms Link */}
          <Link
            href="/schedule"
            className="p-2.5 rounded-xl bg-[#143503]/4 hover:bg-[#143503]/8 border border-[#143503]/8 hover:border-[#143503]/20 flex flex-col justify-between transition-colors col-span-2 sm:col-span-1 group"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#4B633E]">
              <div className="flex items-center gap-1.5">
                <Calendar size={12} className="text-[#143503]" />
                <span>Active Alarms</span>
              </div>
              <ChevronRight size={12} className="text-[#143503]/50 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <span className="text-base font-bold text-[#143503] font-mono mt-1">
              {activeSchedulesCount} <span className="text-[10px] font-normal text-[#4B633E]">configured</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
