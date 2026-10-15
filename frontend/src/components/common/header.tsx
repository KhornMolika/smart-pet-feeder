'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FeederDevice } from '@/types/feeder.types';
import { ChevronDown, Check, Plus, Clock, MapPin, Radio, ChevronRight } from 'lucide-react';
import { triggerHaptic } from '@/lib/utils/telegram.util';
import { PetIcon } from '@/components/common/pet-icon';

interface HeaderProps {
  devices: FeederDevice[];
  activeDevice: FeederDevice;
  onSelectDevice: (deviceId: string) => void;
  onOpenAddDevice: () => void;
}

export function Header({ devices, activeDevice, onSelectDevice, onOpenAddDevice }: HeaderProps) {
  const [showPicker, setShowPicker] = useState(false);

  // Close picker on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPicker(false);
    };
    if (showPicker) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showPicker]);

  const handleDeviceClick = (id: string) => {
    triggerHaptic('medium');
    onSelectDevice(id);
    setShowPicker(false);
  };

  return (
    <header className="w-full flex items-center justify-between gap-2.5 py-2.5 relative z-30 select-none">
      {/* Brand: ចិញ្ចឹម (ChinChem) */}
      <div className="flex items-center gap-2 shrink-0 min-w-0">
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
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border transition-all cursor-pointer text-left ${
              showPicker
                ? 'border-[#143503] shadow-md ring-2 ring-[#143503]/15'
                : 'border-[#143503]/15 shadow-xs hover:border-[#143503]/30 hover:shadow-sm'
            }`}
          >
            {/* Pet Icon Avatar */}
            <div className="w-5 h-5 rounded-full bg-[#143503]/8 flex items-center justify-center shrink-0">
              <PetIcon
                icon={activeDevice.petIcon || activeDevice.petEmoji}
                size={12}
                className="text-[#143503]"
              />
            </div>

            <span className="text-xs font-bold text-[#143503] max-w-[80px] sm:max-w-[120px] truncate leading-none">
              {activeDevice.petName}
            </span>

            {/* Active Device Live Beacon */}
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                activeDevice.isOnline
                  ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)] animate-pulse'
                  : 'bg-amber-400'
              }`}
            />

            <ChevronDown
              size={12}
              className={`text-[#143503]/60 transition-transform duration-200 shrink-0 ${
                showPicker ? 'rotate-180 text-[#143503]' : ''
              }`}
            />
          </button>

          {/* Transparent click-outside overlay to dismiss cleanly */}
          {showPicker && (
            <div
              className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px] animate-fadeIn"
              onClick={() => setShowPicker(false)}
            />
          )}

          {/* Device Picker Dropdown (Scales gracefully for 1 to 20 devices) */}
          {showPicker && (
            <div className="absolute top-11 right-0 w-80 max-w-[calc(100vw-24px)] rounded-2xl bg-[#FFFDFB]/98 backdrop-blur-2xl border border-[#143503]/12 shadow-[0_16px_45px_-8px_rgba(20,53,3,0.22)] p-2.5 z-50 animate-scaleUp overflow-hidden">
              {/* Subtle ambient luxury backdrop */}
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#BCDBF0]/25 rounded-full blur-xl pointer-events-none" />
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-[#A7D1AE]/20 rounded-full blur-xl pointer-events-none" />

              {/* Dropdown Header */}
              <div className="flex items-center justify-between px-2.5 py-1.5 mb-1.5 border-b border-[#143503]/8 relative z-10">
                <div className="flex items-center gap-1.5">
                  <Radio size={12} className="text-[#143503] animate-pulse" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#143503]">
                    Feeder Fleet
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[#143503] bg-[#A7D1AE]/35 px-2 py-0.5 rounded-full border border-[#143503]/12 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>
                      {devices.length} {devices.length === 1 ? 'Device' : 'Devices'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Scrollable Device Fleet List */}
              <div className="max-h-60 overflow-y-auto pr-0.5 space-y-1.5 scrollbar-thin relative z-10">
                {devices.map((dev) => {
                  const isSelected = dev.id === activeDevice.id;
                  return (
                    <button
                      key={dev.id}
                      type="button"
                      onClick={() => handleDeviceClick(dev.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'bg-[#143503] text-[#FFF2E6] shadow-sm ring-1 ring-[#143503]'
                          : 'bg-white/70 hover:bg-white text-[#143503] border border-[#143503]/8 hover:border-[#143503]/20 hover:shadow-2xs active:scale-[0.99]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Pet Species Avatar */}
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${
                            isSelected
                              ? 'bg-white/15 text-[#FFF2E6] border-white/15 shadow-2xs'
                              : 'bg-[#A7D1AE]/30 text-[#143503] border-[#143503]/10'
                          }`}
                        >
                          <PetIcon
                            icon={dev.petIcon || dev.petEmoji}
                            size={16}
                            className={isSelected ? 'text-[#FFF2E6]' : 'text-[#143503]'}
                          />
                        </div>

                        {/* Pet & Room Metadata */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold truncate leading-tight">
                              {dev.petName}
                            </span>
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                dev.isOnline
                                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]'
                                  : 'bg-amber-400'
                              }`}
                              title={dev.isOnline ? 'Online' : 'Offline'}
                            />
                          </div>
                          <div
                            className={`text-[10px] font-medium flex items-center gap-1.5 truncate mt-0.5 ${
                              isSelected ? 'text-[#FFF2E6]/75' : 'text-[#4B633E]'
                            }`}
                          >
                            <span className="flex items-center gap-0.5">
                              <MapPin size={9} className="shrink-0 opacity-70" />
                              <span>{dev.room}</span>
                            </span>
                            <span>•</span>
                            <span>{dev.isOnline ? 'ESP32 Live' : 'Offline'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Selection Checkmark / Action */}
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#A7D1AE] text-[#143503] flex items-center justify-center shrink-0 shadow-xs ml-2">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      ) : (
                        <div className="text-[10px] font-semibold text-[#4B633E]/50 group-hover:text-[#143503] group-hover:translate-x-0.5 transition-all pr-1 ml-2">
                          Switch
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action Footer: Pair New Feeder */}
              <div className="pt-2 mt-1.5 border-t border-[#143503]/8 relative z-10">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setShowPicker(false);
                    onOpenAddDevice();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-white via-[#BCDBF0]/25 to-[#A7D1AE]/20 hover:from-white hover:to-[#BCDBF0]/40 border border-[#143503]/12 shadow-2xs hover:shadow-xs text-[#143503] transition-all cursor-pointer group active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#143503] text-[#FFF2E6] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      <Plus size={12} strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-[#143503] leading-none">
                        Pair New Feeder
                      </div>
                      <div className="text-[9px] text-[#4B633E] mt-0.5">
                        Add ESP32 device to fleet
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    size={13}
                    className="text-[#4B633E] group-hover:translate-x-0.5 group-hover:text-[#143503] transition-all shrink-0"
                  />
                </button>
              </div>
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
