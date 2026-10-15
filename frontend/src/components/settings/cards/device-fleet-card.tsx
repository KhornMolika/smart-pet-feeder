'use client';

import React from 'react';
import { FeederDevice } from '@/types/feeder.types';
import { PetIcon } from '@/components/common/pet-icon';
import { triggerHaptic } from '@/lib/utils/telegram.util';
import { Plus, Trash2, MapPin, Check, QrCode } from 'lucide-react';

interface DeviceFleetCardProps {
  devices: FeederDevice[];
  activeDevice: FeederDevice;
  onSelectDevice: (deviceId: string) => void;
  onOpenPairModal: () => void;
  onPromptUnpair: (device: FeederDevice) => void;
  onOpenQrSticker: () => void;
}

export function DeviceFleetCard({
  devices,
  activeDevice,
  onSelectDevice,
  onOpenPairModal,
  onPromptUnpair,
  onOpenQrSticker,
}: DeviceFleetCardProps) {
  return (
    <div className="artisan-card p-4 sm:p-5 flex flex-col gap-3">
      {/* Clean Header: Only category title & Pair Feeder */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4B633E]">
            Select Feeder
          </span>
          <span className="text-[10px] font-mono font-bold text-[#143503] bg-[#A7D1AE]/35 px-2 py-0.5 rounded-full border border-[#143503]/10 shrink-0">
            {devices.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onOpenPairModal();
          }}
          className="flex items-center gap-1 text-xs font-bold text-[#143503] hover:text-[#245308] hover:underline cursor-pointer transition-colors shrink-0"
          title="Pair an additional pet feeder"
        >
          <Plus size={13} />
          <span>Pair Feeder</span>
        </button>
      </div>

      {/* Scrollable / Scalable Feeder Chips */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
        {devices.map((dev) => {
          const isSelected = dev.id === activeDevice.id;
          return (
            <button
              key={dev.id}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onSelectDevice(dev.id);
              }}
              className={`group relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border transition-all duration-200 cursor-pointer shrink-0 text-left ${
                isSelected
                  ? 'bg-[#143503] text-[#FFF2E6] border-[#143503] shadow-md shadow-[#143503]/15 ring-2 ring-[#143503]/20'
                  : 'bg-white/85 hover:bg-white border-[#143503]/12 text-[#143503] hover:border-[#143503]/25 shadow-2xs'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                  isSelected
                    ? 'bg-white/15 border-white/20 text-[#FFF2E6]'
                    : 'bg-[#A7D1AE]/30 border-[#143503]/10 text-[#143503]'
                }`}
              >
                <PetIcon
                  icon={dev.petIcon || dev.petEmoji}
                  size={16}
                  className={isSelected ? 'text-[#FFF2E6]' : 'text-[#143503]'}
                />
              </div>

              <div className="min-w-0 pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold tracking-tight truncate">{dev.petName}</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      dev.isOnline ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                    title={dev.isOnline ? 'Online' : 'Offline'}
                  />
                </div>
                <div
                  className={`text-[10px] font-medium flex items-center gap-1 truncate mt-0.5 ${
                    isSelected ? 'text-[#FFF2E6]/80' : 'text-[#4B633E]'
                  }`}
                >
                  <MapPin size={10} className="shrink-0 opacity-70" />
                  <span>{dev.room}</span>
                </div>
              </div>

              {isSelected && (
                <div className="w-4 h-4 rounded-full bg-[#A7D1AE] text-[#143503] flex items-center justify-center shrink-0 ml-1">
                  <Check size={10} strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Dedicated active feeder action row (Clean & uncluttered) */}
      <div className="flex items-center justify-between pt-2 border-t border-[#143503]/8 text-xs">
        <div className="flex items-center gap-1.5 min-w-0 text-[11px] text-[#4B633E]">
          <span className="font-bold text-[#143503] truncate">{activeDevice.petName}&apos;s Feeder</span>
          <span className="opacity-40">•</span>
          <span className="truncate">{activeDevice.room}</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onOpenQrSticker();
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-[#143503] hover:text-[#245308] hover:underline cursor-pointer transition-colors"
            title="View & Print Feeder QR Code Sticker"
          >
            <QrCode size={11} />
            <span>QR Sticker</span>
          </button>

          {devices.length > 1 && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onPromptUnpair(activeDevice);
              }}
              className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer transition-colors"
              title={`Unpair ${activeDevice.petName}'s feeder`}
            >
              <Trash2 size={11} />
              <span>Unpair</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
