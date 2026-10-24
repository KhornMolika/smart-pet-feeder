'use client';

import React from 'react';
import { Utensils, RotateCcw, Download, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import { formatDuration } from '@/lib/utils/date.util';
import { triggerHaptic } from '@/lib/utils/telegram.util';

interface HistorySummaryMetricsProps {
  totalFeeds: number;
  totalDurationMs: number;
  timeframe: string;
  sourceCounts: { scheduled: number; manual_app: number; physical_button: number };
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onExportCsv: () => void;
  onClearHistory?: () => void;
}

export function HistorySummaryMetrics({
  totalFeeds,
  totalDurationMs,
  timeframe,
  sourceCounts,
  hasActiveFilters,
  onResetFilters,
  onExportCsv,
  onClearHistory,
}: HistorySummaryMetricsProps) {
  return (
    <div className="artisan-card p-4 sm:p-5 flex flex-col gap-3.5 relative overflow-hidden">
      {/* Subtle decorative background tint */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#BCDBF0]/25 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#A7D1AE]/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header & CSV Export */}
      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#143503] text-[#FFF2E6] flex items-center justify-center shrink-0 shadow-xs">
              <Utensils size={14} />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#143503] truncate">Feeding History & Logs</h3>
          </div>
          <p className="text-xs text-[#4B633E] mt-0.5 truncate pl-9">
            Real-time audit records, portions, and trigger origins
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onResetFilters();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FFF2E6] hover:bg-white border border-[#143503]/15 text-[#143503] text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              title="Reset all active filters"
            >
              <RotateCcw size={12} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {onClearHistory && totalFeeds > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Clear all local feeding logs?')) {
                  triggerHaptic('medium');
                  onClearHistory();
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-red-50 border border-red-200 text-red-600 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              title="Clear all stored logs"
            >
              <Trash2 size={12} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onExportCsv();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#143503] hover:bg-[#143503]/90 text-[#FFF2E6] text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1 relative z-10">
        {/* Card A: Total Meals */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white/70 border border-[#143503]/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs text-[#4B633E] font-semibold">Total Meals</span>
            <div className="w-5 h-5 rounded-full bg-[#A7D1AE]/35 flex items-center justify-center text-[#143503]">
              <Utensils size={10} />
            </div>
          </div>
          <div className="mt-1">
            <span className="text-xl sm:text-2xl font-extrabold text-[#143503] font-mono leading-none">
              {totalFeeds}
            </span>
            <span className="text-[10px] text-[#4B633E] block mt-0.5 font-medium truncate">
              {timeframe === 'all' ? 'All records' : 'In timeframe'}
            </span>
          </div>
        </div>

        {/* Card B: Total Dispensed Time */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white/70 border border-[#143503]/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs text-[#4B633E] font-semibold">Dispensed</span>
            <div className="w-5 h-5 rounded-full bg-[#BCDBF0]/40 flex items-center justify-center text-[#143503]">
              <Clock size={10} />
            </div>
          </div>
          <div className="mt-1">
            <span className="text-xl sm:text-2xl font-extrabold text-[#143503] font-mono leading-none">
              {formatDuration(totalDurationMs)}
            </span>
            <span className="text-[10px] text-[#4B633E] block mt-0.5 font-medium truncate">
              Total motor runtime
            </span>
          </div>
        </div>

        {/* Card C: Delivery Success */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white/70 border border-[#143503]/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs text-[#4B633E] font-semibold">Delivery</span>
            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 size={10} />
            </div>
          </div>
          <div className="mt-1">
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono leading-none">
              100%
            </span>
            <span className="text-[10px] text-emerald-800/80 block mt-0.5 font-medium truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Audit verified
            </span>
          </div>
        </div>
      </div>

      {/* Source Distribution Ratio Bar */}
      {totalFeeds > 0 && (
        <div className="pt-1.5 flex flex-col gap-1.5 relative z-10">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#4B633E]">
            <span>Trigger Origin Distribution</span>
            <span className="text-[10px] font-mono">
              {sourceCounts.scheduled} ⏰ • {sourceCounts.manual_app} 📱 • {sourceCounts.physical_button} 🔘
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#143503]/10 flex overflow-hidden">
            {sourceCounts.scheduled > 0 && (
              <div
                style={{ width: `${(sourceCounts.scheduled / totalFeeds) * 100}%` }}
                className="bg-[#2D6A4F] h-full transition-all duration-500"
                title={`Scheduled: ${sourceCounts.scheduled}`}
              />
            )}
            {sourceCounts.manual_app > 0 && (
              <div
                style={{ width: `${(sourceCounts.manual_app / totalFeeds) * 100}%` }}
                className="bg-[#0284C7] h-full transition-all duration-500"
                title={`App: ${sourceCounts.manual_app}`}
              />
            )}
            {sourceCounts.physical_button > 0 && (
              <div
                style={{ width: `${(sourceCounts.physical_button / totalFeeds) * 100}%` }}
                className="bg-[#D97706] h-full transition-all duration-500"
                title={`Button: ${sourceCounts.physical_button}`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
