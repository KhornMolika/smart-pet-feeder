'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { FeederDevice, FeedingEvent, FeedSource } from '@/types/feeder.types';
import { PetIcon } from '@/components/common/pet-icon';
import { triggerHaptic } from '@/lib/utils/telegram.util';

interface HistorySearchFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  devices: FeederDevice[];
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  allHistory: FeedingEvent[];
  history: FeedingEvent[];
  selectedSource: FeedSource | 'all';
  setSelectedSource: (source: FeedSource | 'all') => void;
  sourceTabs: { id: FeedSource | 'all'; label: string; icon: React.ReactNode }[];
  sourceCounts: { scheduled: number; manual_app: number; physical_button: number };
  hasActiveFilters: boolean;
}

export function HistorySearchFilters({
  searchQuery,
  setSearchQuery,
  devices,
  selectedDeviceId,
  setSelectedDeviceId,
  allHistory,
  history,
  selectedSource,
  setSelectedSource,
  sourceTabs,
  sourceCounts,
  hasActiveFilters,
}: HistorySearchFiltersProps) {
  return (
    <div className="artisan-card p-4 sm:p-5 flex flex-col gap-3.5">
      <div className="text-xs font-bold uppercase tracking-wider text-[#4B633E] flex items-center justify-between">
        <span>Search & Filters</span>
        {hasActiveFilters && (
          <span className="text-[11px] font-normal text-[#143503] lowercase">
            filtering {history.length} of {allHistory.length}
          </span>
        )}
      </div>

      {/* Search Input with Instant Clear */}
      <div className="relative flex items-center">
        <Search size={14} className="absolute left-3.5 text-[#4B633E]/70 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by pet name, room, note, or trigger..."
          className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#143503]/10 bg-white/70 text-xs sm:text-sm text-[#143503] font-medium outline-none focus:border-[#143503]/30 transition-all placeholder:text-[#4B633E]/50 shadow-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 w-5 h-5 rounded-full bg-[#143503]/10 hover:bg-[#143503]/20 text-[#143503] flex items-center justify-center cursor-pointer"
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* Pet Device Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs text-[#4B633E] font-semibold flex items-center gap-1.5">
            <span>Pet & Feeder</span>
            <span className="text-[10px] text-[#4B633E]/70 font-normal">
              ({devices.length} {devices.length === 1 ? 'device' : 'devices'})
            </span>
          </label>
          {devices.length > 3 && (
            <span className="text-[10px] text-[#4B633E]/70 italic sm:hidden">
              Swipe horizontally →
            </span>
          )}
        </div>

        <div className="relative">
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none snap-x -mx-1 px-1">
            {/* All Pets chip */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setSelectedDeviceId('all');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 snap-start active:scale-95 ${
                selectedDeviceId === 'all'
                  ? 'bg-[#143503] text-[#FFF2E6] shadow-xs'
                  : 'bg-white/75 hover:bg-white text-[#4B633E] border border-[#143503]/10'
              }`}
            >
              <span>🐾 All Pets</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  selectedDeviceId === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#143503]/8 text-[#143503]'
                }`}
              >
                {allHistory.length}
              </span>
            </button>

            {/* Individual Device Chips */}
            {devices.map((device) => {
              const isSelected = selectedDeviceId === device.id;
              const petEventCount = allHistory.filter((e) => e.deviceId === device.id).length;

              return (
                <button
                  key={device.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedDeviceId(device.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 snap-start active:scale-95 ${
                    isSelected
                      ? 'bg-[#143503] text-[#FFF2E6] shadow-xs'
                      : 'bg-white/75 hover:bg-white text-[#4B633E] border border-[#143503]/10'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#A7D1AE]/30 text-[#143503]'
                    }`}
                  >
                    <PetIcon icon={device.petIcon || device.petEmoji} size={11} />
                  </div>
                  <span>{device.petName}</span>
                  <span
                    className={`text-[10px] opacity-70 hidden sm:inline ${
                      isSelected ? 'text-white/80' : 'text-[#4B633E]'
                    }`}
                  >
                    ({device.room})
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#143503]/8 text-[#143503]'
                    }`}
                  >
                    {petEventCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Segmented Trigger Source Control */}
      <div className="space-y-1.5">
        <label className="text-xs text-[#4B633E] font-semibold block">Trigger Source</label>
        <div className="p-1 rounded-2xl bg-[#FFF2E6]/80 border border-[#143503]/10 grid grid-cols-4 gap-1 shadow-inner">
          {sourceTabs.map((tab) => {
            const isSelected = selectedSource === tab.id;
            const count =
              tab.id === 'all'
                ? history.length
                : sourceCounts[tab.id as keyof typeof sourceCounts] || 0;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedSource(tab.id);
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-1.5 sm:py-2 px-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#143503] text-[#FFF2E6] shadow-xs scale-[1.01]'
                    : 'text-[#4B633E] hover:text-[#143503] hover:bg-white/50'
                }`}
              >
                <div className="flex items-center gap-1">
                  {tab.icon}
                  <span className="truncate">{tab.label}</span>
                </div>
                <span
                  className={`text-[9px] sm:text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-[#143503]/8 text-[#143503]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
