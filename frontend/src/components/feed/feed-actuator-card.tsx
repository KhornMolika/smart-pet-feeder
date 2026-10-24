'use client';

import React from 'react';
import Link from 'next/link';
import { FeederDevice, PortionPreset } from '@/types/feeder.types';
import { PetIcon, PresetIcon } from '@/components/common/pet-icon';
import { formatDuration } from '@/lib/utils/date.util';
import { triggerHaptic } from '@/lib/utils/telegram.util';
import { Sparkles, Clock, Cog, CheckCircle2, PawPrint, Zap, Bell, Square } from 'lucide-react';

interface FeedActuatorCardProps {
  activeDevice: FeederDevice;
  presets: PortionPreset[];
  activePresetId: string | null;
  onSelectPreset: (preset: PortionPreset) => void;
  selectedDurationMs: number;
  setSelectedDurationMs: (duration: number) => void;
  setActivePresetId: (id: string | null) => void;
  isDispensing: boolean;
  actuationRemainingMs: number;
  cooldownRemaining: number;
  feedStatus: 'idle' | 'actuating' | 'success' | 'error';
  notificationToast: string | null;
  onTriggerDispense: () => void;
  onStopDispense?: () => void;
  onSkipCooldown: () => void;
}

export function FeedActuatorCard({
  activeDevice,
  presets,
  activePresetId,
  onSelectPreset,
  selectedDurationMs,
  setSelectedDurationMs,
  setActivePresetId,
  isDispensing,
  actuationRemainingMs,
  cooldownRemaining,
  feedStatus,
  notificationToast,
  onTriggerDispense,
  onStopDispense,
  onSkipCooldown,
}: FeedActuatorCardProps) {
  const isCooldown = cooldownRemaining > 0;

  return (
    <div className="artisan-card p-5 sm:p-6 flex flex-col gap-5">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#143503]/8 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#A7D1AE]/30 text-[#143503] flex items-center justify-center shadow-xs border border-[#143503]/10 shrink-0">
            <PetIcon icon={activeDevice.petIcon || activeDevice.petEmoji} size={18} className="text-[#143503]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-[#143503] tracking-tight truncate flex items-center gap-1.5">
              <span>Feed {activeDevice.petName}</span>
              <Sparkles size={14} className="text-[#143503]/70 shrink-0" />
            </h2>
            <p className="text-xs text-[#4B633E] font-medium truncate">Ready to feed your pet</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#143503] bg-[#FFF2E6] border border-[#143503]/10 px-2.5 py-1 rounded-full shrink-0 shadow-xs">
          <Clock size={12} className="text-[#143503]" />
          <span>{formatDuration(selectedDurationMs)}</span>
        </div>
      </div>

      {/* Portion Presets */}
      <div className="w-full flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs px-0.5">
          <span className="font-bold text-[#143503] text-xs">Portion Presets</span>
          <Link
            href="/schedule"
            className="text-xs font-semibold text-[#4B633E] hover:text-[#143503] transition-colors cursor-pointer"
          >
            Edit in Schedule →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {presets.map((preset) => {
            const isSelected = activePresetId === preset.id;
            const accentBg =
              preset.id === 'snack'
                ? 'bg-[#FFF2E6] text-[#143503]'
                : preset.id === 'bowl'
                ? 'bg-[#A7D1AE]/35 text-[#143503]'
                : 'bg-[#BCDBF0]/45 text-[#143503]';

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`group relative w-full p-2.5 sm:p-3 rounded-2xl text-center transition-all duration-300 border cursor-pointer select-none flex flex-col items-center justify-between min-h-[118px] ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#183F04] to-[#0E2502] text-[#FFF2E6] border-[#143503] shadow-[0_8px_20px_-4px_rgba(20,53,3,0.35)] -translate-y-0.5 scale-[1.02]'
                    : 'bg-white/90 hover:bg-white border-[#143503]/10 hover:border-[#143503]/25 text-[#143503] hover:-translate-y-0.5 hover:shadow-md'
                }`}
              >
                {/* Top Bar: Duration Pill & Indicator Dot */}
                <div className="w-full flex items-center justify-between">
                  <span
                    className={`font-mono text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${
                      isSelected
                        ? 'bg-white/20 text-[#FFF2E6] border border-white/15'
                        : 'bg-[#143503]/6 text-[#4B633E] group-hover:bg-[#143503]/10'
                    }`}
                  >
                    {preset.labelSeconds}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      isSelected
                        ? 'bg-[#A7D1AE] shadow-[0_0_8px_#A7D1AE] ring-2 ring-[#FFF2E6]/30 scale-125'
                        : 'border border-[#143503]/25 group-hover:border-[#143503]/50'
                    }`}
                  />
                </div>

                {/* Elevated Icon Bubble */}
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center my-1.5 transition-all duration-300 ${
                    isSelected
                      ? 'bg-white/15 text-[#FFF2E6] shadow-inner scale-105'
                      : `${accentBg} border border-[#143503]/8 shadow-xs group-hover:scale-105`
                  }`}
                >
                  <PresetIcon
                    icon={preset.icon || preset.emoji}
                    size={22}
                    className={isSelected ? 'text-[#FFF2E6]' : 'text-[#143503]'}
                  />
                </div>

                {/* Preset Label */}
                <div className="w-full">
                  <span
                    className={`block font-bold text-xs tracking-tight truncate w-full ${
                      isSelected ? 'text-[#FFF2E6]' : 'text-[#143503]'
                    }`}
                  >
                    {preset.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Duration Adjuster */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/70 border border-[#143503]/10 text-xs shadow-2xs">
          <div className="flex items-center gap-2 text-[#143503] font-medium min-w-0">
            <Clock size={13} className="text-[#143503] shrink-0" />
            <span className="text-[#4B633E]">Feeding time:</span>
            <span className="font-mono font-bold text-[#143503] bg-[#143503]/8 px-2 py-0.5 rounded-md border border-[#143503]/10 shrink-0">
              {formatDuration(selectedDurationMs)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                const next = Math.max(15000, selectedDurationMs - 15000);
                setSelectedDurationMs(next);
                const match = presets.find((p) => p.durationMs === next);
                setActivePresetId(match ? match.id : null);
              }}
              disabled={selectedDurationMs <= 15000}
              className="px-2.5 py-1 rounded-lg bg-white border border-[#143503]/15 hover:bg-[#FFF2E6] disabled:opacity-35 text-[#143503] font-mono font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer select-none"
              title="Decrease 15 seconds"
            >
              -15s
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                const next = Math.min(180000, selectedDurationMs + 15000);
                setSelectedDurationMs(next);
                const match = presets.find((p) => p.durationMs === next);
                setActivePresetId(match ? match.id : null);
              }}
              disabled={selectedDurationMs >= 180000}
              className="px-2.5 py-1 rounded-lg bg-white border border-[#143503]/15 hover:bg-[#FFF2E6] disabled:opacity-35 text-[#143503] font-mono font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer select-none"
              title="Increase 15 seconds"
            >
              +15s
            </button>
          </div>
        </div>
      </div>

      {/* Big Tactile Dispense Food Button */}
      <div className="w-full flex flex-col items-center justify-center gap-3.5 pt-2.5">
        {/* Feeder Status Pill */}
        <div className="flex items-center justify-center">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              isDispensing
                ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                : 'bg-[#FFF2E6]/70 text-[#4B633E] border-[#143503]/10'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isDispensing ? 'bg-rose-600 animate-ping' : 'bg-emerald-600'}`} />
            <span className="tracking-wide">
              {isDispensing
                ? `Dispensing Food (${formatDuration(selectedDurationMs)})`
                : 'Feeder Ready'}
            </span>
          </div>
        </div>

        {/* Centerpiece Tactile Button */}
        <div className="relative p-2 rounded-full bg-gradient-to-b from-[#143503]/10 to-transparent border border-[#143503]/10 shadow-lg">
          <button
            id="dispense-food-btn"
            type="button"
            onClick={() => {
              if (isDispensing) {
                onStopDispense?.();
              } else {
                onTriggerDispense();
              }
            }}
            disabled={isCooldown}
            className={`relative w-32 h-32 rounded-full flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-200 active:scale-95 text-[#FFF2E6] ${
              isDispensing
                ? 'bg-rose-600 shadow-[0_0_35px_rgba(225,29,72,0.45)] hover:bg-rose-700 animate-pulse'
                : isCooldown
                ? 'bg-[#4B633E] text-[#FFF2E6]/70'
                : 'bg-[#143503] shadow-[0_8px_25px_rgba(20,53,3,0.3)] hover:shadow-[0_12px_30px_rgba(20,53,3,0.4)] hover:scale-[1.02]'
            }`}
            title={isDispensing ? 'Click to Stop Dispense immediately' : 'Click to Dispense Food'}
          >
            {isDispensing ? (
              <>
                <Square size={26} className="fill-[#FFF2E6] text-[#FFF2E6] mb-1 animate-pulse" />
                <span className="text-xs font-bold tracking-wider uppercase text-[#FFF2E6]">
                  Stop Feed
                </span>
                <span className="text-xs text-rose-200 font-mono mt-0.5">
                  {formatDuration(actuationRemainingMs)} left
                </span>
              </>
            ) : feedStatus === 'success' ? (
              <>
                <CheckCircle2 size={26} className="mb-1 text-[#A7D1AE] animate-bounce" />
                <span className="text-xs font-bold tracking-wider uppercase text-[#FFF2E6]">
                  Food Served!
                </span>
                <span className="text-xs text-[#A7D1AE] font-mono mt-0.5">
                  {formatDuration(selectedDurationMs)} meal
                </span>
              </>
            ) : isCooldown ? (
              <>
                <Clock size={24} className="mb-1 text-[#FFF2E6]/80" />
                <span className="text-base font-bold text-[#FFF2E6] font-mono">
                  {cooldownRemaining}s
                </span>
                <span className="text-xs text-[#A7D1AE] uppercase tracking-wider font-semibold mt-0.5">
                  Ready in {cooldownRemaining}s
                </span>
              </>
            ) : (
              <>
                <PawPrint size={32} className="text-[#FFF2E6] mb-1" />
                <span className="text-sm font-bold tracking-wider uppercase text-[#FFF2E6]">
                  Feed Now
                </span>
                <span className="text-xs text-[#A7D1AE] font-mono font-semibold mt-0.5">
                  {formatDuration(selectedDurationMs)}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Food Dispensing Progress Bar & Stop Feed Action */}
        {isDispensing && (
          <div className="flex flex-col items-center gap-2 mt-1 animate-fadeIn">
            <div className="w-52 h-2 rounded-full bg-[#143503]/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-rose-600 transition-all duration-75"
                style={{
                  width: `${Math.min(100, (actuationRemainingMs / selectedDurationMs) * 100)}%`,
                }}
              />
            </div>
            <button
              id="stop-dispense-action-btn"
              type="button"
              onClick={() => onStopDispense?.()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer mt-1"
            >
              <Square size={12} className="fill-white" />
              <span>Stop Feeding Now</span>
            </button>
          </div>
        )}

        {/* Skip Cooldown */}
        {isCooldown && !isDispensing && (
          <button
            type="button"
            onClick={onSkipCooldown}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#143503]/8 hover:bg-[#143503]/15 text-[#143503] font-bold text-xs border border-[#143503]/12 transition-all active:scale-95 cursor-pointer"
          >
            <Zap size={12} className="text-[#143503]" />
            <span>Skip Cooldown</span>
          </button>
        )}

        {/* Toast Alert */}
        {notificationToast && (
          <div className="w-full p-3 rounded-xl bg-[#A7D1AE]/35 border border-[#143503]/20 text-[#143503] text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <Bell size={16} className="text-[#143503] shrink-0" />
            <span>{notificationToast}</span>
          </div>
        )}
      </div>
    </div>
  );
}
