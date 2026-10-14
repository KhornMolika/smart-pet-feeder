'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { FeederDevice } from '@/types/feeder.types';
import { ChevronDown, Check, Plus, Clock } from 'lucide-react';
import { triggerHaptic } from '@/lib/utils/telegram.util';

interface HeaderProps {
  devices: FeederDevice[];
  activeDevice: FeederDevice;
  onSelectDevice: (deviceId: string) => void;
  onOpenAddDevice: () => void;
}

export function Header({ devices, activeDevice, onSelectDevice, onOpenAddDevice }: HeaderProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleDeviceClick = (id: string) => {
    triggerHaptic('medium');
    onSelectDevice(id);
    setShowPicker(false);
  };

  return (
    <header className="w-full flex items-center justify-between gap-2.5 py-3 relative z-30 select-none">
      {/* Brand: ចិញ្ចឹម (ChinChem) */}
      <div className="flex items-center gap-2 shrink-0 min-w-0 mb-4">
        <Image
          src="/images/logo.png"
          alt="ចិញ្ចឹម (ChinChem)"
          width={60}
          height={24}
          priority
          style={{ width: 'auto', height: 'auto' }}
          className="h-6 sm:h-9 w-auto object-contain shrink-0"
        />
        <span className="text-xs font-black tracking-wider text-[#143503]/70 uppercase hidden xs:inline">
          ChinChem
        </span>
      </div>

      {/* Right controls: Device Switcher + Minimalist Status */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Device Switcher Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setShowPicker(!showPicker);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#143503]/12 shadow-sm hover:border-[#143503]/30 transition-all cursor-pointer text-left"
          >
            <span className="text-sm leading-none">{activeDevice.petEmoji}</span>
            <span className="text-xs font-bold text-[#143503] max-w-[80px] sm:max-w-[120px] truncate">
              {activeDevice.petName}
            </span>
            <ChevronDown
              size={12}
              className={`text-[#143503]/60 transition-transform duration-200 ${
                showPicker ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Device Picker Dropdown */}
          {showPicker && (
            <div className="absolute top-11 right-0 w-64 max-w-[calc(100vw-32px)] rounded-2xl bg-white/95 backdrop-blur-xl border border-[#143503]/10 shadow-xl p-2.5 z-50 animate-fadeIn">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#4B633E] px-2 py-1 mb-1">
                Your Pet Feeders
              </div>

              <div className="space-y-1">
                {devices.map((dev) => {
                  const isSelected = dev.id === activeDevice.id;
                  return (
                    <button
                      key={dev.id}
                      type="button"
                      onClick={() => handleDeviceClick(dev.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#143503] text-[#FFF2E6]'
                          : 'hover:bg-[#143503]/5 text-[#143503]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg shrink-0">{dev.petEmoji}</span>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold truncate">{dev.petName}</div>
                          <div className={`text-xs truncate ${isSelected ? 'text-[#FFF2E6]/75' : 'text-[#4B633E]'}`}>
                            {dev.room}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check size={14} className="shrink-0 text-[#FFF2E6]" />}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setShowPicker(false);
                  onOpenAddDevice();
                }}
                className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#BCDBF0]/40 hover:bg-[#BCDBF0]/70 border border-[#BCDBF0] text-[#143503] text-xs font-bold transition-all cursor-pointer"
              >
                <Plus size={13} />
                <span>Pair New Feeder</span>
              </button>
            </div>
          )}
        </div>

        {/* Minimalist Status Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-[#143503]/10 text-xs font-semibold text-[#143503]">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span className="hidden sm:inline">Online</span>
          <span className="text-[#143503]/30 hidden sm:inline">•</span>
          <Clock size={12} className="text-[#143503]/70" />
        </div>
      </div>
    </header>
  );
}
