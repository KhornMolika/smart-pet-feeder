'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FeederDevice, FeedingEvent, PortionPreset } from '@/types/feeder.types';
import { useDeviceFeed } from '@/hooks/useDeviceFeed';
import { DEFAULT_PORTION_PRESETS } from '@/lib/constants/feeder.constants';
import { formatTime, formatRelativeTime, getCountdownUntil } from '@/lib/utils/date.util';
import { Clock, Calendar, CheckCircle2, Sparkles, Zap, Package } from 'lucide-react';
import { triggerHaptic } from '@/lib/utils/telegram.util';
import { useFeederContext } from '@/context/feeder-context';

interface FeedScreenProps {
  activeDevice?: FeederDevice;
  onFeedSuccess?: (event: FeedingEvent) => void;
  onNavigateScreen?: (screen: 'settings' | 'history') => void;
}

export function FeedScreen(props: FeedScreenProps = {}) {
  const context = useFeederContext();
  const activeDevice = props.activeDevice || context.activeDevice;
  const onFeedSuccess = props.onFeedSuccess || context.addHistoryEvent;

  const presets = activeDevice.customPresets || DEFAULT_PORTION_PRESETS;
  const [activePresetId, setActivePresetId] = useState<'snack' | 'bowl' | 'feast' | 'custom'>('bowl');
  const [showCustomSlider, setShowCustomSlider] = useState(false);

  const [countdownText, setCountdownText] = useState<string>('in 2h 15m');
  const [lastFeedText, setLastFeedText] = useState<string>('45m ago');

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (activeDevice.nextScheduledFeedAt) {
        setCountdownText(getCountdownUntil(activeDevice.nextScheduledFeedAt));
      }
      if (activeDevice.lastFeedAt) {
        setLastFeedText(formatRelativeTime(activeDevice.lastFeedAt));
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [activeDevice.lastFeedAt, activeDevice.nextScheduledFeedAt]);

  const {
    selectedDurationMs,
    setSelectedDurationMs,
    isDispensing,
    actuationRemainingMs,
    cooldownRemaining,
    feedStatus,
    notificationToast,
    triggerDispense,
    skipCooldown,
  } = useDeviceFeed(activeDevice, onFeedSuccess);

  const handleSelectPreset = (preset: PortionPreset) => {
    triggerHaptic('light');
    setActivePresetId(preset.id);
    setSelectedDurationMs(preset.durationMs);
    setShowCustomSlider(false);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSelectedDurationMs(val);
    setActivePresetId('custom');
  };

  const selectedSeconds = (selectedDurationMs / 1000).toFixed(1);
  const isCooldown = cooldownRemaining > 0;

  return (
    <div className="w-full flex flex-col gap-4 animate-fadeIn">
      {/* 1. Main Feeding Actuator Card */}
      <div className="artisan-card p-4 sm:p-5 flex flex-col gap-4">
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#143503]/8 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#A7D1AE]/30 text-[#143503] flex items-center justify-center text-base shadow-xs border border-[#143503]/10 shrink-0">
              🍖
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-[#143503] tracking-tight truncate flex items-center gap-1.5">
                <span>Feed {activeDevice.petName}</span>
                <span className="text-xs">✨</span>
              </h2>
              <p className="text-xs text-[#4B633E] font-medium truncate">Precision servo food portioning</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#143503] bg-[#FFF2E6] border border-[#143503]/10 px-2.5 py-1 rounded-full shrink-0 shadow-xs">
            <Clock size={12} className="text-[#143503]" />
            <span>{selectedSeconds}s</span>
          </div>
        </div>

        {/* Portion Presets */}
        <div className="w-full flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs px-0.5">
            <span className="font-bold text-[#143503] text-xs">Portion Presets</span>
            <Link
              href="/settings"
              className="text-xs font-semibold text-[#4B633E] hover:text-[#143503] transition-colors cursor-pointer"
            >
              Edit in Setting →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {presets.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`w-full py-3 px-2 rounded-2xl text-center transition-all duration-200 border cursor-pointer select-none ${
                    isSelected
                      ? 'bg-[#143503] text-[#FFF2E6] border-[#143503] shadow-sm scale-[1.01]'
                      : 'bg-[#FFF2E6]/50 hover:bg-[#FFF2E6] border-[#143503]/10 text-[#143503] hover:border-[#143503]/25'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-1 min-w-0">
                    <span className="text-2xl mb-0.5">{preset.emoji}</span>
                    <span className="font-bold text-xs tracking-tight truncate w-full">{preset.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono text-xs font-semibold ${
                        isSelected ? 'bg-[#FFF2E6]/25 text-[#FFF2E6]' : 'bg-[#143503]/8 text-[#143503]'
                      }`}
                    >
                      {preset.labelSeconds}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Duration Slider Trigger */}
          <div className="w-full mt-1">
            <button
              type="button"
              onClick={() => {
                setShowCustomSlider(!showCustomSlider);
                if (!showCustomSlider) setActivePresetId('custom');
              }}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#FFF2E6]/50 hover:bg-[#FFF2E6] border border-[#143503]/10 transition-all text-xs font-semibold text-[#143503] cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles size={13} className="text-[#143503] shrink-0" />
                <span className="truncate">
                  {showCustomSlider ? 'Hide calibration slider' : 'Custom duration slider (0.3s – 5.0s)'}
                </span>
              </div>
              <span className="text-xs font-mono font-bold bg-[#143503]/8 px-2 py-0.5 rounded text-[#143503] shrink-0">
                {selectedDurationMs}ms
              </span>
            </button>

            {showCustomSlider && (
              <div className="bg-[#FFF2E6]/70 border border-[#143503]/10 rounded-2xl p-4 space-y-3 mt-2 animate-fadeIn">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#4B633E] font-medium">Servo Open Duration:</span>
                  <span className="text-[#143503] font-bold text-sm">
                    {(selectedDurationMs / 1000).toFixed(1)}s{' '}
                    <span className="text-xs text-[#4B633E] font-normal">({selectedDurationMs}ms)</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={300}
                  max={5000}
                  step={100}
                  value={selectedDurationMs}
                  onChange={handleSliderChange}
                  className="w-full cursor-pointer h-2"
                />
                <div className="flex justify-between text-xs text-[#4B633E] font-mono px-0.5">
                  <span>0.3s (Snack)</span>
                  <span>1.8s (Bowl)</span>
                  <span>3.2s (Feast)</span>
                  <span>5.0s (Max)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Big Tactile Dispense Food Button */}
        <div className="w-full flex flex-col items-center justify-center gap-3 pt-2">
          {/* Servo Flap Status Pill */}
          <div className="flex items-center justify-center">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                isDispensing
                  ? 'bg-[#A7D1AE] text-[#143503] border-[#143503]/30 animate-pulse'
                  : 'bg-[#FFF2E6]/70 text-[#4B633E] border-[#143503]/10'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isDispensing ? 'bg-[#143503] animate-ping' : 'bg-[#4B633E]/60'}`} />
              <span className="tracking-wide">
                {isDispensing
                  ? `SERVO FLAP 85° OPEN (${selectedSeconds}s)`
                  : 'SERVO FLAP 0° CLOSED'}
              </span>
            </div>
          </div>

          {/* Centerpiece Tactile Button */}
          <div className="relative p-2 rounded-full bg-gradient-to-b from-[#143503]/10 to-transparent border border-[#143503]/10 shadow-lg">
            <button
              id="dispense-food-btn"
              type="button"
              onClick={() => triggerDispense()}
              disabled={isDispensing}
              className={`relative w-32 h-32 rounded-full flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-200 active:scale-95 text-[#FFF2E6] ${
                isDispensing
                  ? 'bg-[#143503] shadow-[0_0_30px_rgba(20,53,3,0.4)] animate-pulse'
                  : isCooldown
                  ? 'bg-[#4B633E] text-[#FFF2E6]/70'
                  : 'bg-[#143503] shadow-[0_8px_25px_rgba(20,53,3,0.3)] hover:shadow-[0_12px_30px_rgba(20,53,3,0.4)] hover:scale-[1.02]'
              }`}
            >
              {isDispensing ? (
                <>
                  <div className="animate-spin text-2xl mb-1">⚙️</div>
                  <span className="text-xs font-bold tracking-wider uppercase text-[#FFF2E6]">
                    {actuationRemainingMs > 0 ? `OPEN ${(actuationRemainingMs / 1000).toFixed(1)}s` : 'Dispensing'}
                  </span>
                  <span className="text-xs text-[#A7D1AE] font-mono mt-0.5">
                    {actuationRemainingMs}ms left
                  </span>
                </>
              ) : feedStatus === 'success' ? (
                <>
                  <CheckCircle2 size={26} className="mb-1 text-[#A7D1AE] animate-bounce" />
                  <span className="text-xs font-bold tracking-wider uppercase text-[#FFF2E6]">
                    Dispensed!
                  </span>
                  <span className="text-xs text-[#A7D1AE] font-mono mt-0.5">
                    {selectedSeconds}s treat ✨
                  </span>
                </>
              ) : isCooldown ? (
                <>
                  <Clock size={24} className="mb-1 text-[#FFF2E6]/80" />
                  <span className="text-base font-bold text-[#FFF2E6] font-mono">
                    {cooldownRemaining}s
                  </span>
                  <span className="text-xs text-[#A7D1AE] uppercase tracking-wider font-semibold mt-0.5">
                    Cooldown
                  </span>
                </>
              ) : (
                <>
                  <div className="text-3xl mb-1">🐾</div>
                  <span className="text-sm font-bold tracking-wider uppercase text-[#FFF2E6]">
                    Dispense
                  </span>
                  <span className="text-xs text-[#A7D1AE] font-mono font-semibold mt-0.5">
                    {selectedSeconds}s
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Actuation Progress Bar during dispensing */}
          {isDispensing && (
            <div className="w-52 mt-1 animate-fadeIn">
              <div className="w-full h-2 rounded-full bg-[#143503]/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#143503] transition-all duration-75"
                  style={{
                    width: `${Math.min(100, (actuationRemainingMs / selectedDurationMs) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Skip Cooldown */}
          {isCooldown && !isDispensing && (
            <button
              type="button"
              onClick={skipCooldown}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#143503]/8 hover:bg-[#143503]/15 text-[#143503] font-bold text-xs border border-[#143503]/12 transition-all active:scale-95 cursor-pointer"
            >
              <Zap size={12} className="text-[#143503]" />
              <span>Skip Cooldown</span>
            </button>
          )}

          {/* Toast Alert */}
          {notificationToast && (
            <div className="w-full p-3 rounded-xl bg-[#A7D1AE]/35 border border-[#143503]/20 text-[#143503] text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <span className="text-base">🔔</span>
              <span>{notificationToast}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Hopper & Daily Nutrition Telemetry Card */}
      <div className="artisan-card p-4 sm:p-5 flex flex-col gap-3.5">
        <div className="text-xs font-bold text-[#143503] flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 min-w-0">
            <Package size={15} className="text-[#143503] shrink-0" />
            <span className="text-sm font-bold truncate">Hopper & Daily Feeding</span>
          </span>
          <span className="text-xs font-semibold text-[#143503] bg-[#A7D1AE]/35 px-2.5 py-1 rounded-full border border-[#143503]/10 shrink-0 max-w-[130px] truncate">
            {activeDevice.name}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Hopper Level */}
          <div className="p-3.5 rounded-2xl bg-[#FFF2E6]/50 border border-[#143503]/8 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-medium text-[#4B633E]">
              <span>Food Hopper</span>
              <span className="text-emerald-700 font-semibold text-xs">Good</span>
            </div>
            <div className="mt-2">
              <span className="text-xl font-bold text-[#143503] font-mono">
                {activeDevice.hopperPercent ?? 82}%
              </span>
              <div className="w-full h-2 rounded-full bg-[#143503]/10 mt-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#143503]"
                  style={{ width: `${activeDevice.hopperPercent ?? 82}%` }}
                />
              </div>
              <span className="text-xs text-[#4B633E] font-medium block mt-1.5">~5 days remaining</span>
            </div>
          </div>

          {/* Daily Meals Progress */}
          <div className="p-3.5 rounded-2xl bg-[#FFF2E6]/50 border border-[#143503]/8 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-medium text-[#4B633E]">
              <span>Today&apos;s Meals</span>
              <span className="text-emerald-700 font-semibold text-xs">
                On Track
              </span>
            </div>
            <div className="mt-2">
              <span className="text-xl font-bold text-[#143503] font-mono">
                {activeDevice.todayMealsServed ?? 3}/{activeDevice.todayMealsTarget ?? 4}
              </span>
              <div className="flex gap-1 mt-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full ${
                      i <= (activeDevice.todayMealsServed ?? 3) ? 'bg-[#143503]' : 'bg-[#143503]/12'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-[#4B633E] font-medium block mt-1.5">1 meal remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Next Feed & Last Feed Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Next Meal */}
        <div className="artisan-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#143503] mb-1">
              <Calendar size={13} className="text-[#143503]" />
              <span>Next Meal</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-[#143503] font-mono tracking-tight mt-1">
              {activeDevice.nextScheduledFeedAt ? formatTime('18:30') : 'No schedule'}
            </div>
            <span className="text-xs text-[#4B633E] font-medium block mt-1">
              {activeDevice.nextScheduledFeedAt ? countdownText : 'Set schedule'}
            </span>
          </div>

          <Link
            href="/settings"
            className="mt-3 text-xs font-semibold text-[#143503] hover:underline pt-2 border-t border-[#143503]/8 text-left cursor-pointer inline-block"
          >
            Set Schedule →
          </Link>
        </div>

        {/* Last Meal */}
        <div className="artisan-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#143503] mb-1">
              <Clock size={13} className="text-[#143503]" />
              <span>Last Meal</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-[#143503] font-mono tracking-tight mt-1">
              {activeDevice.lastFeedAt ? lastFeedText : 'None yet'}
            </div>
            <span className="text-xs text-[#4B633E] font-medium block mt-1">
              Standard portion
            </span>
          </div>

          <Link
            href="/history"
            className="mt-3 text-xs font-semibold text-[#143503] hover:underline pt-2 border-t border-[#143503]/8 text-left cursor-pointer inline-block"
          >
            View Log →
          </Link>
        </div>
      </div>
    </div>
  );
}
