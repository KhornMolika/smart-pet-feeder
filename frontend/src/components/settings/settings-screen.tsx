'use client';

import React, { useState } from 'react';
import { FeederDevice, PortionPreset } from '@/types/feeder.types';
import { useDeviceSchedules } from '@/hooks/useDeviceSchedules';
import { DAYS_OF_WEEK } from '@/lib/constants/feeder.constants';
import { formatTime } from '@/lib/utils/date.util';
import { triggerHaptic } from '@/lib/utils/telegram.util';
import { Plus, Trash2, Clock, Bell, Save, CheckCircle2, Sliders } from 'lucide-react';
import { useFeederContext } from '@/context/feeder-context';

interface SettingsScreenProps {
  devices?: FeederDevice[];
  activeDevice?: FeederDevice;
  onSelectDevice?: (deviceId: string) => void;
  onUpdateDevicePresets?: (deviceId: string, presets: PortionPreset[]) => void;
}

export function SettingsScreen(props: SettingsScreenProps = {}) {
  const context = useFeederContext();
  const devices = props.devices || context.devices;
  const activeDevice = props.activeDevice || context.activeDevice;
  const onSelectDevice = props.onSelectDevice || context.switchDevice;
  const onUpdateDevicePresets = props.onUpdateDevicePresets || context.updateDevicePresets;
  const { schedules, addSchedule, toggleSchedule, deleteSchedule } = useDeviceSchedules(activeDevice.id);

  // Portion Presets state for active device
  const currentPresets = activeDevice.customPresets || [];
  const [snackMs, setSnackMs] = useState(currentPresets.find((p) => p.id === 'snack')?.durationMs ?? 800);
  const [bowlMs, setBowlMs] = useState(currentPresets.find((p) => p.id === 'bowl')?.durationMs ?? 1800);
  const [feastMs, setFeastMs] = useState(currentPresets.find((p) => p.id === 'feast')?.durationMs ?? 3200);
  const [presetsSavedToast, setPresetsSavedToast] = useState(false);

  // New Schedule Form Modal state
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [newTime, setNewTime] = useState('08:00');
  const [newLabel, setNewLabel] = useState('Morning Meal');
  const [newDurationMs, setNewDurationMs] = useState(1800);
  const [newSelectedDays, setNewSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);

  // Notification Toggles
  const [telegramAlerts, setTelegramAlerts] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);

  const handleSavePresets = () => {
    triggerHaptic('medium');
    const updatedPresets: PortionPreset[] = [
      {
        id: 'snack',
        name: 'Light Snack',
        emoji: '🐟',
        durationMs: snackMs,
        labelSeconds: `${(snackMs / 1000).toFixed(1)}s`,
        description: `${(snackMs / 1000).toFixed(1)}s snack portion`,
      },
      {
        id: 'bowl',
        name: 'Regular Bowl',
        emoji: '🍖',
        durationMs: bowlMs,
        labelSeconds: `${(bowlMs / 1000).toFixed(1)}s`,
        description: `${(bowlMs / 1000).toFixed(1)}s balanced meal`,
      },
      {
        id: 'feast',
        name: 'Royal Feast',
        emoji: '👑',
        durationMs: feastMs,
        labelSeconds: `${(feastMs / 1000).toFixed(1)}s`,
        description: `${(feastMs / 1000).toFixed(1)}s hearty feast`,
      },
    ];

    onUpdateDevicePresets(activeDevice.id, updatedPresets);
    setPresetsSavedToast(true);
    setTimeout(() => setPresetsSavedToast(false), 3000);
  };

  const handleToggleDay = (dayVal: number) => {
    if (newSelectedDays.includes(dayVal)) {
      if (newSelectedDays.length > 1) {
        setNewSelectedDays(newSelectedDays.filter((d) => d !== dayVal));
      }
    } else {
      setNewSelectedDays([...newSelectedDays, dayVal].sort());
    }
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('heavy');
    addSchedule({
      timeLocal: newTime,
      daysOfWeek: newSelectedDays,
      durationMs: newDurationMs,
      enabled: true,
      label: newLabel,
    });
    setShowAddScheduleModal(false);
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fadeIn pb-6">
      {/* 1. Device Fleet Selector Banner */}
      <div className="artisan-card p-4 sm:p-5 flex flex-col gap-2">
        <div className="text-xs font-bold uppercase tracking-wider text-[#4B633E]">
          Configuring Device
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
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
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[#143503] text-[#FFF2E6] border-[#143503] shadow-xs'
                    : 'bg-[#FFF2E6]/50 border-[#143503]/10 text-[#143503] hover:bg-[#FFF2E6]'
                }`}
              >
                <span>{dev.petEmoji}</span>
                <span>{dev.petName}</span>
                <span className="text-xs opacity-75 font-normal">({dev.room})</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-[#4B633E] font-medium">
          💡 Schedules and portion timers are configured individually for each device.
        </p>
      </div>

      {/* 2. Feeding Schedules Card */}
      <div className="artisan-card p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Clock size={16} className="text-[#143503] shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-[#143503] truncate">Feeding Schedules</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setShowAddScheduleModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#143503] text-[#FFF2E6] text-xs font-semibold shadow-xs hover:opacity-95 transition-all shrink-0 cursor-pointer"
          >
            <Plus size={13} />
            <span>Add Meal</span>
          </button>
        </div>

        {/* Schedule List */}
        <div className="space-y-2 mt-0.5">
          {schedules.length === 0 ? (
            <div className="text-center py-6 text-xs sm:text-sm text-[#4B633E] font-medium bg-[#FFF2E6]/40 rounded-xl border border-dashed border-[#143503]/15">
              No schedules created for {activeDevice.petName} yet. Click &quot;Add Meal&quot; above!
            </div>
          ) : (
            schedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                  schedule.enabled
                    ? 'bg-[#FFFFFF] border-[#143503]/10 shadow-xs'
                    : 'bg-[#FFF2E6]/30 border-transparent opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Toggle Checkbox */}
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      toggleSchedule(schedule.id);
                    }}
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
                      schedule.enabled
                        ? 'bg-[#143503] border-[#143503] text-[#FFF2E6]'
                        : 'border-[#143503]/25 bg-white'
                    }`}
                  >
                    {schedule.enabled && <CheckCircle2 size={13} />}
                  </button>

                  <div className="min-w-0">
                    <div className="text-sm font-bold font-mono text-[#143503] tracking-tight">
                      {formatTime(schedule.timeLocal)}
                    </div>
                    <div className="text-xs text-[#4B633E] font-medium truncate mt-0.5">
                      {schedule.label || 'Daily Meal'} • {(schedule.durationMs / 1000).toFixed(1)}s (
                      {schedule.daysOfWeek.length === 7 ? 'Everyday' : `${schedule.daysOfWeek.length} days/wk`})
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('medium');
                    deleteSchedule(schedule.id);
                  }}
                  className="p-1.5 text-[#4B633E] hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                  title="Delete schedule"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Portion Timers Calibration Card */}
      <div className="artisan-card p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Sliders size={16} className="text-[#143503] shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-[#143503] truncate">Portion Timers</h3>
              <p className="text-xs text-[#4B633E] truncate">Presets for {activeDevice.petName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSavePresets}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#143503] text-[#FFF2E6] text-xs font-semibold shadow-xs hover:opacity-95 transition-all shrink-0 cursor-pointer"
          >
            <Save size={13} />
            <span>Save</span>
          </button>
        </div>

        {presetsSavedToast && (
          <div className="p-3 rounded-xl bg-[#A7D1AE]/40 border border-[#143503]/20 text-[#143503] text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={14} />
            <span>Timers updated for {activeDevice.petName}!</span>
          </div>
        )}

        {/* Timer 1: Light Snack */}
        <div className="p-3.5 rounded-xl bg-[#FFF2E6]/50 border border-[#143503]/8 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-[#143503] flex items-center gap-1.5">
              <span>🐟</span> Light Snack
            </span>
            <span className="font-mono font-bold text-[#143503] text-xs">
              {(snackMs / 1000).toFixed(1)}s <span className="text-xs text-[#4B633E] font-normal">({snackMs}ms)</span>
            </span>
          </div>
          <input
            type="range"
            min={300}
            max={2000}
            step={50}
            value={snackMs}
            onChange={(e) => setSnackMs(parseInt(e.target.value, 10))}
            className="w-full h-2 cursor-pointer"
          />
        </div>

        {/* Timer 2: Regular Bowl */}
        <div className="p-3.5 rounded-xl bg-[#FFF2E6]/50 border border-[#143503]/8 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-[#143503] flex items-center gap-1.5">
              <span>🍖</span> Regular Bowl
            </span>
            <span className="font-mono font-bold text-[#143503] text-xs">
              {(bowlMs / 1000).toFixed(1)}s <span className="text-xs text-[#4B633E] font-normal">({bowlMs}ms)</span>
            </span>
          </div>
          <input
            type="range"
            min={1000}
            max={3500}
            step={50}
            value={bowlMs}
            onChange={(e) => setBowlMs(parseInt(e.target.value, 10))}
            className="w-full h-2 cursor-pointer"
          />
        </div>

        {/* Timer 3: Royal Feast */}
        <div className="p-3.5 rounded-xl bg-[#FFF2E6]/50 border border-[#143503]/8 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-[#143503] flex items-center gap-1.5">
              <span>👑</span> Royal Feast
            </span>
            <span className="font-mono font-bold text-[#143503] text-xs">
              {(feastMs / 1000).toFixed(1)}s <span className="text-xs text-[#4B633E] font-normal">({feastMs}ms)</span>
            </span>
          </div>
          <input
            type="range"
            min={2000}
            max={5000}
            step={100}
            value={feastMs}
            onChange={(e) => setFeastMs(parseInt(e.target.value, 10))}
            className="w-full h-2 cursor-pointer"
          />
        </div>
      </div>

      {/* 4. Notification & Sound Settings */}
      <div className="artisan-card p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-[#143503]" />
          <h3 className="text-sm sm:text-base font-bold text-[#143503]">Notifications & Alerts</h3>
        </div>

        <div className="space-y-3 mt-0.5">
          {/* Telegram Notification Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFF2E6]/50 border border-[#143503]/8 gap-3">
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-semibold text-[#143503]">Telegram Bot Alerts</div>
              <div className="text-xs text-[#4B633E] truncate mt-0.5">Notify when food drops or hopper is low</div>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setTelegramAlerts(!telegramAlerts);
              }}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                telegramAlerts ? 'bg-[#143503]' : 'bg-[#143503]/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  telegramAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sound Alert Chime on Phone Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFF2E6]/50 border border-[#143503]/8 gap-3">
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-semibold text-[#143503]">Pet Meal Melody Chime</div>
              <div className="text-xs text-[#4B633E] truncate mt-0.5">Plays chime sound to call pet</div>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setSoundAlerts(!soundAlerts);
              }}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                soundAlerts ? 'bg-[#143503]' : 'bg-[#143503]/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  soundAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="artisan-card w-full max-w-sm p-5 space-y-4 shadow-2xl bg-white">
            <div className="flex items-center justify-between border-b border-[#143503]/10 pb-3">
              <h4 className="text-sm font-black text-[#143503]">Add Feeding Schedule</h4>
              <button
                type="button"
                onClick={() => setShowAddScheduleModal(false)}
                className="text-xs text-[#4B633E] hover:text-[#143503] font-bold cursor-pointer"
              >
                ✕ Cancel
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#143503] block mb-1">Time (Local 24h)</label>
                <input
                  type="time"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#143503]/20 bg-[#FFF2E6]/50 text-sm font-mono font-bold text-[#143503]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#143503] block mb-1">Meal Name / Label</label>
                <input
                  type="text"
                  required
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Afternoon Lunch"
                  className="w-full p-2.5 rounded-xl border border-[#143503]/20 bg-[#FFF2E6]/50 text-xs font-bold text-[#143503]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#143503] block mb-1.5">Days of the Week</label>
                <div className="flex gap-1 justify-between">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = newSelectedDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleToggleDay(day.value)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#143503] text-[#FFF2E6]'
                            : 'bg-[#FFF2E6]/80 text-[#4B633E] border border-[#143503]/15'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#143503] block mb-1">
                  Portion Duration: {(newDurationMs / 1000).toFixed(1)}s ({newDurationMs}ms)
                </label>
                <input
                  type="range"
                  min={500}
                  max={4000}
                  step={100}
                  value={newDurationMs}
                  onChange={(e) => setNewDurationMs(parseInt(e.target.value, 10))}
                  className="w-full h-2 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#143503] text-[#FFF2E6] text-xs font-black shadow-md hover:opacity-95 transition-all cursor-pointer mt-2"
              >
                Create Schedule for {activeDevice.petName}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
