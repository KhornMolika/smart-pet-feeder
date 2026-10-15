'use client';

import React from 'react';
import { Calendar, CalendarDays, RotateCcw } from 'lucide-react';
import { TimeframeFilter } from '@/hooks/useDeviceHistory';
import { triggerHaptic } from '@/lib/utils/telegram.util';
import { formatDateRangeLabel, formatDateOnly, getPastDateOnly } from '@/lib/utils/date.util';

interface HistoryTimeframeRibbonProps {
  timeframe: TimeframeFilter;
  setTimeframe: (val: TimeframeFilter) => void;
  timeframeTabs: { id: TimeframeFilter; label: string; count: number; icon: React.ReactNode }[];
  showDatePicker: boolean;
  setShowDatePicker: (val: boolean | ((prev: boolean) => boolean)) => void;
  customStartDate: string | null;
  customEndDate: string | null;
  setCustomStartDate: (val: string | null) => void;
  setCustomEndDate: (val: string | null) => void;
  setCustomDateRange: (start: string | null, end: string | null) => void;
  historyCount: number;
}

export function HistoryTimeframeRibbon({
  timeframe,
  setTimeframe,
  timeframeTabs,
  showDatePicker,
  setShowDatePicker,
  customStartDate,
  customEndDate,
  setCustomStartDate,
  setCustomEndDate,
  setCustomDateRange,
  historyCount,
}: HistoryTimeframeRibbonProps) {
  return (
    <div className="artisan-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4B633E]">
          <Calendar size={13} className="text-[#143503]" />
          <span>Timeframe & Date Range</span>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setShowDatePicker((prev) => !prev);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            timeframe === 'custom' || showDatePicker
              ? 'bg-[#143503] text-[#FFF2E6] shadow-xs'
              : 'bg-[#FFF2E6]/60 hover:bg-[#FFF2E6] text-[#143503] border border-[#143503]/10'
          }`}
        >
          <CalendarDays size={12} />
          <span>
            {customStartDate || customEndDate
              ? formatDateRangeLabel(customStartDate, customEndDate)
              : 'Date Range'}
          </span>
        </button>
      </div>

      {/* Timeframe Presets */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {timeframeTabs.map((tab) => {
          const isSelected = timeframe === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setTimeframe(tab.id);
                if (tab.id !== 'custom') {
                  setCustomDateRange(null, null);
                  setShowDatePicker(false);
                }
              }}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-[#143503] text-[#FFF2E6] shadow-sm scale-[1.02]'
                  : 'bg-[#FFF2E6]/50 hover:bg-[#FFF2E6] text-[#143503] border border-[#143503]/10'
              }`}
            >
              <div className="flex items-center gap-1 mb-0.5">
                {tab.icon}
                <span className="truncate">{tab.label}</span>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-[#143503]/10 text-[#143503]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Expandable Custom Date Range Picker */}
      {showDatePicker && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white/80 border border-[#143503]/15 flex flex-col gap-3 animate-fadeIn shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CalendarDays size={14} className="text-[#143503]" />
              <span className="text-xs font-bold text-[#143503]">Select Date Range</span>
            </div>
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setCustomDateRange(null, null);
                  setTimeframe('all');
                }}
                className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer flex items-center gap-1"
              >
                <RotateCcw size={10} />
                <span>Clear Range</span>
              </button>
            )}
          </div>

          {/* From Date to To Date Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#4B633E] flex items-center justify-between">
                <span>From Date</span>
                {customStartDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStartDate(null);
                      if (!customEndDate) setTimeframe('all');
                    }}
                    className="text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </label>
              <input
                type="date"
                value={customStartDate || ''}
                onChange={(e) => {
                  triggerHaptic('light');
                  const val = e.target.value || null;
                  setCustomStartDate(val);
                  if (val || customEndDate) {
                    setTimeframe('custom');
                  } else {
                    setTimeframe('all');
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-[#143503]/20 bg-white text-xs font-semibold text-[#143503] outline-none focus:border-[#143503] shadow-xs cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#4B633E] flex items-center justify-between">
                <span>To Date</span>
                {customEndDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomEndDate(null);
                      if (!customStartDate) setTimeframe('all');
                    }}
                    className="text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </label>
              <input
                type="date"
                value={customEndDate || ''}
                onChange={(e) => {
                  triggerHaptic('light');
                  const val = e.target.value || null;
                  setCustomEndDate(val);
                  if (customStartDate || val) {
                    setTimeframe('custom');
                  } else {
                    setTimeframe('all');
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-[#143503]/20 bg-white text-xs font-semibold text-[#143503] outline-none focus:border-[#143503] shadow-xs cursor-pointer"
              />
            </div>
          </div>

          {/* Quick Range Shortcut Chips */}
          <div className="pt-2 border-t border-[#143503]/10 flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold text-[#4B633E] uppercase tracking-wider">
              Quick Shortcuts
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  const todayStr = formatDateOnly(new Date());
                  setCustomDateRange(todayStr, todayStr);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#FFF2E6] hover:bg-[#FFF2E6]/80 border border-[#143503]/15 text-[11px] font-semibold text-[#143503] cursor-pointer"
              >
                ⚡ Today
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  const yesterdayStr = getPastDateOnly(1);
                  setCustomDateRange(yesterdayStr, yesterdayStr);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#FFF2E6] hover:bg-[#FFF2E6]/80 border border-[#143503]/15 text-[11px] font-semibold text-[#143503] cursor-pointer"
              >
                ⏪ Yesterday
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  const startStr = getPastDateOnly(7);
                  const todayStr = formatDateOnly(new Date());
                  setCustomDateRange(startStr, todayStr);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#FFF2E6] hover:bg-[#FFF2E6]/80 border border-[#143503]/15 text-[11px] font-semibold text-[#143503] cursor-pointer"
              >
                🗓️ Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  const startStr = getPastDateOnly(14);
                  const todayStr = formatDateOnly(new Date());
                  setCustomDateRange(startStr, todayStr);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#FFF2E6] hover:bg-[#FFF2E6]/80 border border-[#143503]/15 text-[11px] font-semibold text-[#143503] cursor-pointer"
              >
                📅 Last 14 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  const startStr = getPastDateOnly(30);
                  const todayStr = formatDateOnly(new Date());
                  setCustomDateRange(startStr, todayStr);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#FFF2E6] hover:bg-[#FFF2E6]/80 border border-[#143503]/15 text-[11px] font-semibold text-[#143503] cursor-pointer"
              >
                🌙 Last 30 Days
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Notification Pill */}
      {timeframe !== 'all' && (
        <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-[#BCDBF0]/30 border border-[#143503]/8 text-xs font-medium text-[#143503]">
          <span>
            Showing feeds for{' '}
            <strong className="font-bold">
              {timeframe === 'today'
                ? 'Today'
                : timeframe === 'this_week'
                ? 'This Week'
                : timeframe === 'this_month'
                ? 'This Month'
                : formatDateRangeLabel(customStartDate, customEndDate)}
            </strong>{' '}
            ({historyCount} {historyCount === 1 ? 'record' : 'records'})
          </span>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setTimeframe('all');
              setCustomDateRange(null, null);
            }}
            className="text-xs font-bold text-[#143503] hover:underline cursor-pointer"
          >
            Show All
          </button>
        </div>
      )}
    </div>
  );
}
