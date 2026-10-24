'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DAYS_OF_WEEK } from '@/lib/constants/feeder.constants';
import { formatTime, formatDuration } from '@/lib/utils/date.util';
import { PresetIcon } from '@/components/common/pet-icon';
import { triggerHaptic } from '@/lib/utils/telegram.util';
import { Clock, X, Sparkles } from 'lucide-react';
import { FeedingSchedule } from '@/types/feeder.types';

interface ScheduleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSchedule?: FeedingSchedule | null;
  petName: string;
  snackMs: number;
  bowlMs: number;
  feastMs: number;
  onSaveSchedule: (data: {
    id?: string;
    timeLocal: string;
    daysOfWeek: number[];
    durationMs: number;
    label: string;
  }) => void;
}

export function ScheduleFormModal({
  isOpen,
  onClose,
  editingSchedule,
  petName,
  snackMs,
  bowlMs,
  feastMs,
  onSaveSchedule,
}: ScheduleFormModalProps) {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState('08:00');
  const [label, setLabel] = useState('Morning Meal');
  const [durationMs, setDurationMs] = useState(60000);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (editingSchedule) {
      setTime(editingSchedule.timeLocal);
      setLabel(editingSchedule.label || 'Daily Meal');
      let dur = editingSchedule.durationMs;
      if (dur <= 5000) {
        const lower = (editingSchedule.label || '').toLowerCase();
        if (lower.includes('snack') || lower.includes('treat') || lower.includes('reward')) {
          dur = snackMs;
        } else if (lower.includes('feast') || lower.includes('supper')) {
          dur = feastMs;
        } else {
          dur = bowlMs;
        }
      }
      setDurationMs(dur);
      setSelectedDays(editingSchedule.daysOfWeek);
    } else {
      setTime('08:00');
      setLabel('Morning Breakfast');
      setDurationMs(bowlMs);
      setSelectedDays([1, 2, 3, 4, 5, 6, 0]);
    }
  }, [isOpen, editingSchedule, snackMs, bowlMs, feastMs]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleToggleDay = (dayVal: number) => {
    if (selectedDays.includes(dayVal)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== dayVal));
      }
    } else {
      setSelectedDays([...selectedDays, dayVal].sort());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('heavy');

    // Ensure 2-digit hour padding (e.g. "5:30" -> "05:30")
    let normalizedTime = time.trim();
    if (/^\d:[0-5]\d$/.test(normalizedTime)) {
      normalizedTime = `0${normalizedTime}`;
    }

    onSaveSchedule({
      id: editingSchedule ? editingSchedule.id : undefined,
      timeLocal: normalizedTime,
      daysOfWeek: selectedDays,
      durationMs,
      label,
    });
    onClose();
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4 pb-20 sm:pb-8 overflow-y-auto animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="artisan-card w-full max-w-sm p-4 sm:p-5 space-y-3 shadow-2xl bg-white border border-[#143503]/15 -translate-y-8 sm:-translate-y-12 transition-all"
      >
        <div className="flex items-center justify-between border-b border-[#143503]/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[#143503]" />
            <h4 className="text-sm font-black text-[#143503]">
              {editingSchedule ? 'Edit Feeding Schedule' : 'Add Feeding Schedule'}
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-[#4B633E] hover:text-[#143503] font-bold cursor-pointer"
          >
            <X size={14} />
            <span>Cancel</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-[#143503]">Time</label>
                <span className="text-[10px] font-mono font-bold text-[#143503] bg-[#143503]/8 px-1.5 py-0.5 rounded">
                  {formatTime(time)}
                </span>
              </div>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2 rounded-xl border border-[#143503]/20 bg-[#FFF2E6]/50 text-xs font-mono font-bold text-[#143503] focus:outline-[#143503]"
              />
              <span className="text-[10px] text-[#4B633E] font-medium mt-1 block">
                Alarm: <strong className="text-[#143503]">{formatTime(time)}</strong>
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#143503] block mb-1">Meal Name / Label</label>
              <input
                type="text"
                required
                value={label}
                onChange={(e) => {
                  const val = e.target.value;
                  setLabel(val);
                  const lower = val.toLowerCase();
                  if (lower.includes('snack') || lower.includes('treat') || lower.includes('bite') || lower.includes('reward')) {
                    setDurationMs(snackMs);
                  } else if (lower.includes('feast') || lower.includes('buffet') || lower.includes('heavy')) {
                    setDurationMs(feastMs);
                  } else if (lower.includes('breakfast') || lower.includes('dinner') || lower.includes('lunch') || lower.includes('meal')) {
                    setDurationMs(bowlMs);
                  }
                }}
                placeholder="e.g. Morning Breakfast"
                className="w-full p-2 rounded-xl border border-[#143503]/20 bg-[#FFF2E6]/50 text-xs font-bold text-[#143503] focus:outline-[#143503]"
              />
              {/* Quick Suggest Meal Presets (Names only - preserves user's chosen time) */}
              <div className="flex items-center gap-1 flex-wrap pt-1.5">
                <span className="text-[10px] text-[#4B633E] font-medium">Quick:</span>
                {[
                  { label: 'Morning Breakfast', duration: bowlMs },
                  { label: 'Noon Snack', duration: snackMs },
                  { label: 'Evening Dinner', duration: bowlMs },
                  { label: 'Night Supper', duration: snackMs },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setLabel(preset.label);
                      setDurationMs(preset.duration);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                      label === preset.label
                        ? 'bg-[#143503] text-[#FFF2E6]'
                        : 'bg-[#143503]/8 text-[#143503] hover:bg-[#143503]/15'
                    }`}
                  >
                    {preset.label.split(' ')[1] || preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-[#143503]">Repeat Days</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedDays([1, 2, 3, 4, 5, 6, 0])}
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                    selectedDays.length === 7
                      ? 'bg-[#143503] text-[#FFF2E6]'
                      : 'bg-[#143503]/8 text-[#143503] hover:bg-[#143503]/15'
                  }`}
                >
                  Everyday
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDays([1, 2, 3, 4, 5])}
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                    selectedDays.length === 5 && !selectedDays.includes(0) && !selectedDays.includes(6)
                      ? 'bg-[#143503] text-[#FFF2E6]'
                      : 'bg-[#143503]/8 text-[#143503] hover:bg-[#143503]/15'
                  }`}
                >
                  Weekdays
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDays([6, 0])}
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                    selectedDays.length === 2 && selectedDays.includes(0) && selectedDays.includes(6)
                      ? 'bg-[#143503] text-[#FFF2E6]'
                      : 'bg-[#143503]/8 text-[#143503] hover:bg-[#143503]/15'
                  }`}
                >
                  Weekends
                </button>
              </div>
            </div>

            <div className="flex gap-1 justify-between">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = selectedDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleToggleDay(day.value)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#143503] text-[#FFF2E6] shadow-xs'
                        : 'bg-[#FFF2E6]/80 text-[#4B633E] border border-[#143503]/15 hover:bg-[#FFF2E6]'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Portion Duration / Timer Selection */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-bold text-[#143503]">Portion Duration</label>
                <span className="text-[10px] font-semibold text-[#143503] flex items-center gap-1 bg-[#143503]/8 px-2 py-0.5 rounded-full border border-[#143503]/10">
                  <Sparkles size={10} className="text-[#143503]" />
                  <span>
                    {durationMs === snackMs
                      ? 'Linked to Light Snack'
                      : durationMs === bowlMs
                      ? 'Linked to Regular Bowl'
                      : durationMs === feastMs
                      ? 'Linked to Royal Feast'
                      : 'Custom Duration'}
                  </span>
                </span>
              </div>
              <span className="font-mono font-bold text-xs text-[#143503]">
                {formatDuration(durationMs)}{' '}
                <span className="font-normal text-[#4B633E]">({Math.round(durationMs / 1000)}s)</span>
              </span>
            </div>

            {/* 3 Calibrated Portion Timer Presets */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[
                { id: 'snack', name: 'Light Snack', icon: 'snack', duration: snackMs },
                { id: 'bowl', name: 'Regular Bowl', icon: 'bowl', duration: bowlMs },
                { id: 'feast', name: 'Royal Feast', icon: 'feast', duration: feastMs },
              ].map((preset) => {
                const isSelected = durationMs === preset.duration;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setDurationMs(preset.duration);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[66px] ${
                      isSelected
                        ? 'bg-[#143503] text-[#FFF2E6] border-[#143503] shadow-xs scale-[1.02]'
                        : 'bg-white hover:bg-[#FFF2E6]/60 border-[#143503]/15 text-[#143503]'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <PresetIcon
                        icon={preset.icon}
                        size={13}
                        className={isSelected ? 'text-[#FFF2E6]' : 'text-[#143503]'}
                      />
                      <span className="text-[11px] font-bold truncate">{preset.name}</span>
                    </div>
                    <div className="mt-1">
                      <span
                        className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                          isSelected ? 'bg-white/20 text-[#FFF2E6]' : 'bg-[#143503]/8 text-[#143503]'
                        }`}
                      >
                        {formatDuration(preset.duration)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Fine Adjustment Controls */}
            <div className="p-2.5 rounded-xl bg-[#FFF2E6]/40 border border-[#143503]/10 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-[#4B633E] font-medium">
                <span>Fine adjust duration:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDurationMs((prev) => Math.max(5000, prev - 5000))}
                    className="px-2 py-0.5 rounded bg-white border border-[#143503]/15 text-[#143503] font-mono font-bold hover:bg-[#143503]/5 cursor-pointer shadow-2xs active:scale-95 transition-all"
                  >
                    -5s
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationMs((prev) => Math.min(180000, prev + 5000))}
                    className="px-2 py-0.5 rounded bg-white border border-[#143503]/15 text-[#143503] font-mono font-bold hover:bg-[#143503]/5 cursor-pointer shadow-2xs active:scale-95 transition-all"
                  >
                    +5s
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={5000}
                max={180000}
                step={5000}
                value={durationMs}
                onChange={(e) => setDurationMs(parseInt(e.target.value, 10))}
                className="w-full h-1.5 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] text-[#4B633E]">
                <span>5s</span>
                <span>💡 Matches {petName}&apos;s Portion Timers</span>
                <span>3m</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#143503] text-[#FFF2E6] text-xs font-black shadow-md hover:opacity-95 transition-all cursor-pointer mt-1"
          >
            {editingSchedule ? 'Save Schedule Changes' : `Create Schedule for ${petName}`}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
