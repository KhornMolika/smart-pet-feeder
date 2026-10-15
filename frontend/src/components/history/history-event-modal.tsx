'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FeedingEvent } from '@/types/feeder.types';
import { formatDateTime, formatDuration } from '@/lib/utils/date.util';
import { CheckCircle2, X } from 'lucide-react';

interface HistoryEventModalProps {
  event: FeedingEvent | null;
  onClose: () => void;
}

export function HistoryEventModal({
  event,
  onClose,
}: HistoryEventModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (event) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [event]);

  if (!event || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-sm rounded-3xl bg-[#FFF2E6] border border-[#143503]/15 shadow-2xl p-5 flex flex-col gap-4 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#143503]/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#143503] text-[#FFF2E6] flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#143503]">Feeding Audit Record</h3>
              <p className="text-[11px] text-[#4B633E]">Hardware actuation verified</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#143503]/5 hover:bg-[#143503]/10 flex items-center justify-center text-[#143503] cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Data rows */}
        <div className="flex flex-col gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-white/70 border border-[#143503]/8 flex justify-between items-center">
            <span className="text-[#4B633E] font-medium">Device & Pet</span>
            <span className="font-bold text-[#143503]">{event.deviceName}</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 border border-[#143503]/8 flex justify-between items-center">
            <span className="text-[#4B633E] font-medium">Trigger Source</span>
            <span className="font-bold text-[#143503]">
              {event.source === 'scheduled'
                ? '⏰ Automated Schedule'
                : event.source === 'manual_app'
                ? '📱 Telegram Mini App'
                : '🔘 Physical Push Button'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 border border-[#143503]/8 flex justify-between items-center">
            <span className="text-[#4B633E] font-medium">Dispense Duration</span>
            <div className="text-right">
              <span className="font-bold font-mono text-[#143503]">
                {formatDuration(event.durationMs)}
              </span>
              <span className="text-[10px] text-[#4B633E] block font-mono">
                {(event.durationMs / 1000).toFixed(1)}s motor runtime
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 border border-[#143503]/8 flex justify-between items-center">
            <span className="text-[#4B633E] font-medium">Started At</span>
            <span className="font-mono text-[11px] font-semibold text-[#143503]">
              {formatDateTime(event.startedAt)}
            </span>
          </div>

          {event.note && (
            <div className="p-3 rounded-2xl bg-white/70 border border-[#143503]/8 flex flex-col gap-1">
              <span className="text-[#4B633E] font-medium">Audit Note</span>
              <span className="font-semibold text-[#143503] italic">
                {event.note}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#143503] hover:bg-[#143503]/90 text-[#FFF2E6] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
