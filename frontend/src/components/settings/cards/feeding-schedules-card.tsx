'use client';

import React from 'react';
import { FeedingSchedule } from '@/types/feeder.types';
import { formatTime, formatDuration, formatDaysOfWeek } from '@/lib/utils/date.util';
import { Clock, Plus, Palmtree, Pencil, Trash2 } from 'lucide-react';

interface FeedingSchedulesCardProps {
  schedules: FeedingSchedule[];
  petName: string;
  isAwayMode?: boolean;
  onOpenAddMeal: () => void;
  onOpenEditMeal: (schedule: FeedingSchedule) => void;
  onPromptDelete: (schedule: FeedingSchedule) => void;
  onToggleSchedule: (scheduleId: string) => void;
  onToggleAwayMode: () => void;
}

export function FeedingSchedulesCard({
  schedules,
  petName,
  isAwayMode,
  onOpenAddMeal,
  onOpenEditMeal,
  onPromptDelete,
  onToggleSchedule,
  onToggleAwayMode,
}: FeedingSchedulesCardProps) {
  return (
    <div className="artisan-card p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#143503]/8 text-[#143503] flex items-center justify-center shrink-0">
            <Clock size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-[#143503] truncate">Feeding Schedules</h3>
            <p className="text-xs text-[#4B633E] truncate">Daily timed feeding alarms for {petName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono font-bold text-[#143503] bg-[#A7D1AE]/35 px-2 py-0.5 rounded-full border border-[#143503]/10 hidden sm:inline-block">
            {schedules.length} {schedules.length === 1 ? 'alarm' : 'alarms'}
          </span>
          <button
            type="button"
            onClick={onOpenAddMeal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#143503] text-[#FFF2E6] text-xs font-semibold shadow-xs hover:opacity-95 transition-all cursor-pointer"
          >
            <Plus size={13} />
            <span>Add Alarm</span>
          </button>
        </div>
      </div>

      {/* Away Mode Notice in Schedules Card */}
      {isAwayMode && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <Palmtree size={15} className="text-amber-700 shrink-0" />
            <span className="font-medium truncate">
              Alarms are <strong>paused</strong>. Feeder will not dispense while Away Mode is on.
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleAwayMode}
            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 transition-colors cursor-pointer"
          >
            Resume
          </button>
        </div>
      )}

      {/* Schedule Alarm List */}
      <div className="space-y-2.5">
        {schedules.length === 0 ? (
          <div className="text-center py-7 px-4 text-xs sm:text-sm text-[#4B633E] font-medium bg-[#FFF2E6]/40 rounded-2xl border border-dashed border-[#143503]/15 flex flex-col items-center gap-2">
            <Clock size={24} className="opacity-40 text-[#143503]" />
            <p>No feeding alarms configured for {petName} yet.</p>
            <button
              type="button"
              onClick={onOpenAddMeal}
              className="mt-1 px-3 py-1.5 rounded-xl bg-[#143503] text-[#FFF2E6] text-xs font-bold"
            >
              + Set First Alarm
            </button>
          </div>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              onClick={() => onOpenEditMeal(schedule)}
              className={`group relative p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                schedule.enabled
                  ? 'bg-white border-[#143503]/12 shadow-xs hover:border-[#143503]/30 hover:shadow-sm'
                  : 'bg-[#FFF2E6]/35 border-[#143503]/8 opacity-60 hover:opacity-80'
              }`}
            >
              {/* Alarm Time & Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg sm:text-xl font-black font-mono text-[#143503] tracking-tight">
                    {formatTime(schedule.timeLocal)}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4B633E] bg-[#143503]/6 px-2 py-0.5 rounded-md border border-[#143503]/10">
                    {formatDaysOfWeek(schedule.daysOfWeek)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#4B633E] font-medium mt-1 truncate">
                  <span className="font-semibold text-[#143503]">{schedule.label || 'Daily Meal'}</span>
                  <span>•</span>
                  <span>{formatDuration(schedule.durationMs)}</span>
                  <span className="hidden sm:inline-block text-[11px] text-[#4B633E]/70 group-hover:text-[#143503] transition-colors">
                    (Tap to edit)
                  </span>
                </div>
              </div>

              {/* Alarm Actions & Toggle */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenEditMeal(schedule);
                  }}
                  className="p-1.5 sm:p-2 rounded-xl text-[#4B633E] hover:text-[#143503] hover:bg-[#143503]/8 transition-colors cursor-pointer"
                  title="Edit schedule details"
                >
                  <Pencil size={15} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPromptDelete(schedule);
                  }}
                  className="p-1.5 sm:p-2 rounded-xl text-[#4B633E] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete schedule"
                >
                  <Trash2 size={15} />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSchedule(schedule.id);
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ml-1 ${
                    schedule.enabled ? 'bg-[#143503]' : 'bg-[#143503]/20'
                  }`}
                  title={schedule.enabled ? 'Alarm is ON' : 'Alarm is OFF'}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      schedule.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
