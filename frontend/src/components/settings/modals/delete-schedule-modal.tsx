'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FeedingSchedule } from '@/types/feeder.types';
import { formatTime, formatDuration, formatDaysOfWeek } from '@/lib/utils/date.util';
import { Trash2 } from 'lucide-react';

interface DeleteScheduleModalProps {
  schedule: FeedingSchedule | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteScheduleModal({
  schedule,
  onCancel,
  onConfirm,
}: DeleteScheduleModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (schedule) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [schedule]);

  if (!schedule || !mounted) return null;

  return createPortal(
    <div
      onClick={onCancel}
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4 pb-20 sm:pb-8 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="artisan-card w-full max-w-sm p-5 space-y-4 shadow-2xl bg-white border border-[#143503]/15 -translate-y-8 sm:-translate-y-12 transition-all"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center shrink-0">
            <Trash2 size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm sm:text-base font-bold text-[#143503]">Delete Feeding Schedule?</h4>
            <p className="text-xs text-[#4B633E] mt-1 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-[#143503]">{schedule.label || 'Daily Meal'}</span>?
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#FFF2E6]/60 border border-[#143503]/10 text-xs text-[#4B633E] space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="font-medium">Scheduled Time:</span>
            <span className="font-mono font-bold text-[#143503]">{formatTime(schedule.timeLocal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Portion Duration:</span>
            <span className="font-bold text-[#143503]">{formatDuration(schedule.durationMs)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Repeat Days:</span>
            <span className="font-bold text-[#143503]">{formatDaysOfWeek(schedule.daysOfWeek)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-[#143503]/20 bg-white hover:bg-[#143503]/5 text-[#143503] text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Trash2 size={13} />
            <span>Delete Alarm</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
