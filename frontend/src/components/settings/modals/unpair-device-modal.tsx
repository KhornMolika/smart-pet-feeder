'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FeederDevice } from '@/types/feeder.types';
import { PetIcon } from '@/components/common/pet-icon';
import { AlertTriangle, Trash2, MapPin } from 'lucide-react';

interface UnpairDeviceModalProps {
  device: FeederDevice | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function UnpairDeviceModal({
  device,
  onCancel,
  onConfirm,
}: UnpairDeviceModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (device) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [device]);

  if (!device || !mounted) return null;

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
            <AlertTriangle size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm sm:text-base font-bold text-[#143503]">Unpair Feeder Device?</h4>
            <p className="text-xs text-[#4B633E] mt-1 leading-relaxed">
              Are you sure you want to unpair and disconnect{' '}
              <span className="font-bold text-[#143503]">{device.name}</span>?
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#FFF2E6]/60 border border-[#143503]/10 text-xs text-[#4B633E] space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Assigned Pet:</span>
            <span className="font-bold text-[#143503] flex items-center gap-1">
              <PetIcon icon={device.petIcon || device.petEmoji} size={14} />
              <span>{device.petName}</span>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Room Location:</span>
            <span className="font-bold text-[#143503] flex items-center gap-1">
              <MapPin size={12} className="opacity-70" />
              <span>{device.room}</span>
            </span>
          </div>
          <div className="pt-1.5 border-t border-[#143503]/10 text-[11px] text-[#4B633E] leading-normal flex items-start gap-1.5">
            <span className="text-rose-600 font-bold shrink-0">⚠️</span>
            <span>
              Associated feeding schedules for this feeder will be removed. You can re-pair this feeder anytime via Bluetooth or Wi-Fi.
            </span>
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
            <span>Unpair Feeder</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
