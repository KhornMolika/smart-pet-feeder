'use client';

import React from 'react';
import { FeedingEvent, FeederDevice } from '@/types/feeder.types';
import { PetIcon } from '@/components/common/pet-icon';
import { triggerHaptic } from '@/lib/utils/telegram.util';
import { formatDuration, formatTimeOnly, formatRelativeTime } from '@/lib/utils/date.util';
import { Utensils, RotateCcw, Clock, Smartphone, Hand, ChevronRight } from 'lucide-react';

export interface DateGroup {
  dateKey: string;
  dateLabel: string;
  events: FeedingEvent[];
  totalDurationMs: number;
}

interface HistoryTimelineProps {
  dateGroups: DateGroup[];
  devices: FeederDevice[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onSelectEvent: (event: FeedingEvent) => void;
}

export function HistoryTimeline({
  dateGroups,
  devices,
  hasActiveFilters,
  onClearFilters,
  onSelectEvent,
}: HistoryTimelineProps) {
  const getDeviceForEvent = (deviceId: string) => {
    return devices.find((d) => d.id === deviceId);
  };

  if (dateGroups.length === 0) {
    return (
      <div className="artisan-card p-8 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF2E6] border border-[#143503]/15 flex items-center justify-center text-[#4B633E]">
          <Utensils size={22} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#143503]">No Feeding Logs Found</h4>
          <p className="text-xs text-[#4B633E] max-w-xs mt-0.5">
            No feeding events match your current timeframe or search criteria.
          </p>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClearFilters();
            }}
            className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#143503] text-[#FFF2E6] text-xs font-semibold shadow-xs cursor-pointer active:scale-95"
          >
            <RotateCcw size={12} />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {dateGroups.map((group) => (
        <div key={group.dateKey} className="flex flex-col gap-2">
          {/* Date Header Ribbon */}
          <div className="flex items-center justify-between px-2 pt-1 pb-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#143503]" />
              <span className="text-xs font-bold text-[#143503] tracking-wide">
                {group.dateLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#4B633E] bg-[#FFF2E6]/60 px-2.5 py-0.5 rounded-full border border-[#143503]/8">
              <span>{group.events.length} {group.events.length === 1 ? 'feed' : 'feeds'}</span>
              <span>•</span>
              <span>{formatDuration(group.totalDurationMs)} runtime</span>
            </div>
          </div>

          {/* Day's Event Stack */}
          <div className="flex flex-col gap-2">
            {group.events.map((item) => {
              const device = getDeviceForEvent(item.deviceId);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    triggerHaptic('light');
                    onSelectEvent(item);
                  }}
                  className="artisan-card p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-xs hover:border-[#143503]/25 transition-all cursor-pointer group active:scale-[0.99] bg-white/80"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Pet Icon Avatar */}
                    <div className="w-10 h-10 rounded-2xl bg-[#A7D1AE]/30 text-[#143503] flex items-center justify-center shrink-0 border border-[#143503]/10 group-hover:scale-105 transition-transform">
                      <PetIcon icon={device?.petIcon || device?.petEmoji || 'cat'} size={18} />
                    </div>

                    {/* Event Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-[#143503] truncate">
                          {item.deviceName}
                        </span>

                        {/* Trigger Source Badge */}
                        {item.source === 'scheduled' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#2D6A4F]/10 text-[#2D6A4F] border border-[#2D6A4F]/20">
                            <Clock size={9} />
                            <span>Scheduled</span>
                          </span>
                        ) : item.source === 'manual_app' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0284C7]/10 text-[#0284C7] border border-[#0284C7]/20">
                            <Smartphone size={9} />
                            <span>App Dispense</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20">
                            <Hand size={9} />
                            <span>Feeder Button</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-[#4B633E] font-medium mt-0.5">
                        <span className="font-semibold text-[#143503] font-mono">
                          {formatTimeOnly(item.startedAt)}
                        </span>
                        <span>•</span>
                        <span>{formatRelativeTime(item.startedAt)}</span>
                      </div>

                      {item.note && (
                        <div className="text-[11px] text-[#4B633E]/80 italic truncate mt-0.5">
                          {item.note}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Duration & Status */}
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div className="text-sm sm:text-base font-extrabold font-mono text-[#143503]">
                        {formatDuration(item.durationMs)}
                      </div>
                      <div className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-200/60 inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        <span>Completed</span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-[#143503]/30 group-hover:text-[#143503] transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
