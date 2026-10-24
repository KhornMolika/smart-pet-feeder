'use client';

import React from 'react';
import { FeedingEvent, FeederDevice } from '@/types/feeder.types';
import { PetIcon } from '@/components/common/pet-icon';
import { triggerHaptic } from '@/lib/utils/telegram.util';
import { formatDuration, formatTimeOnly, formatRelativeTime } from '@/lib/utils/date.util';
import { Utensils, RotateCcw, Clock, Smartphone, Hand, ChevronRight, ChevronDown, CheckCircle2 } from 'lucide-react';

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
  visibleLimit?: number;
  onLoadMore?: () => void;
  onShowAll?: () => void;
  totalEventsCount?: number;
}

export function HistoryTimeline({
  dateGroups,
  devices,
  hasActiveFilters,
  onClearFilters,
  onSelectEvent,
  visibleLimit = 10,
  onLoadMore,
  onShowAll,
  totalEventsCount = 0,
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

  // Budget-based event slicing to prevent overwhelming the UI
  let remainingBudget = visibleLimit;
  const slicedGroups: {
    dateKey: string;
    dateLabel: string;
    events: FeedingEvent[];
    totalDurationMs: number;
  }[] = [];

  let renderedCount = 0;

  for (const group of dateGroups) {
    if (remainingBudget <= 0) break;

    const sliceSize = Math.min(group.events.length, remainingBudget);
    const visibleEvents = group.events.slice(0, sliceSize);
    remainingBudget -= sliceSize;
    renderedCount += visibleEvents.length;

    slicedGroups.push({
      dateKey: group.dateKey,
      dateLabel: group.dateLabel,
      events: visibleEvents,
      totalDurationMs: visibleEvents.reduce((acc, curr) => acc + curr.durationMs, 0),
    });
  }

  const hasMore = totalEventsCount > renderedCount;

  return (
    <div className="flex flex-col gap-4">
      {slicedGroups.map((group) => (
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
              <span>{formatDuration(group.totalDurationMs)}</span>
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
                  className="artisan-card p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-xs hover:border-[#143503]/25 hover:shadow-sm transition-all cursor-pointer group active:scale-[0.99] bg-white/85"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Pet Icon Avatar */}
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#A7D1AE]/30 text-[#143503] flex items-center justify-center shrink-0 border border-[#143503]/10 group-hover:scale-105 transition-transform">
                      <PetIcon icon={device?.petIcon || device?.petEmoji || 'cat'} size={17} />
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
                            <span>Schedule</span>
                          </span>
                        ) : item.source === 'manual_app' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0284C7]/10 text-[#0284C7] border border-[#0284C7]/20">
                            <Smartphone size={9} />
                            <span>App</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20">
                            <Hand size={9} />
                            <span>Button</span>
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
                    </div>
                  </div>

                  {/* Right Duration & Status */}
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div className="text-xs sm:text-sm font-extrabold font-mono text-[#143503]">
                        {formatDuration(item.durationMs)}
                      </div>
                      <div className="text-[9px] sm:text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60 inline-flex items-center gap-1">
                        <CheckCircle2 size={10} className="text-emerald-600" />
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

      {/* Pagination & Limiter Footer */}
      {hasMore && (
        <div className="p-4 rounded-2xl bg-white/70 border border-[#143503]/10 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="text-xs text-[#4B633E] font-medium">
            Showing <span className="font-bold font-mono text-[#143503]">{renderedCount}</span> of{' '}
            <span className="font-bold font-mono text-[#143503]">{totalEventsCount}</span> feeds
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onLoadMore && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onLoadMore();
                }}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#143503] text-[#FFF2E6] text-xs font-bold shadow-xs hover:bg-[#143503]/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <ChevronDown size={14} />
                <span>Load More (+10)</span>
              </button>
            )}

            {onShowAll && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onShowAll();
                }}
                className="px-3 py-2 rounded-xl bg-white hover:bg-[#FFF2E6] border border-[#143503]/15 text-[#143503] text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <span>Show All ({totalEventsCount})</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
