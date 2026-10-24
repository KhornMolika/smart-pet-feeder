'use client';

import React, { useState, useEffect } from 'react';
import { FeederDevice, PortionPreset, FeedingSchedule } from '@/types/feeder.types';
import { useDeviceSchedules } from '@/hooks/useDeviceSchedules';
import { useFeederContext } from '@/context/feeder-context';
import { getNextScheduledIso, getWeeklyMealCounts } from '@/lib/utils/date.util';
import { triggerHaptic } from '@/lib/utils/telegram.util';

// Modular Cards
import { DailyGoalCard } from '@/components/settings/cards/daily-goal-card';
import { PetAwayModeCard } from '@/components/settings/cards/pet-away-mode-card';
import { FeedingSchedulesCard } from '@/components/settings/cards/feeding-schedules-card';
import { PortionTimersCard } from '@/components/settings/cards/portion-timers-card';

// Modular Modals
import { ScheduleFormModal } from '@/components/settings/modals/schedule-form-modal';
import { DeleteScheduleModal } from '@/components/settings/modals/delete-schedule-modal';

import { Calendar, Plus } from 'lucide-react';

interface ScheduleScreenProps {
  activeDevice?: FeederDevice;
  onUpdateDevicePresets?: (deviceId: string, presets: PortionPreset[]) => void;
}

export function ScheduleScreen(props: ScheduleScreenProps = {}) {
  const context = useFeederContext();
  const activeDevice = props.activeDevice || context.activeDevice;

  if (!activeDevice || !context.devices || context.devices.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-6 text-center bg-white/70 backdrop-blur-md rounded-3xl border border-[#143503]/10 shadow-sm mt-4 gap-4 animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-[#143503]/8 text-[#143503] flex items-center justify-center">
          <Calendar size={28} />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#143503]">No Feeder Connected</h2>
          <p className="text-xs text-[#4B633E] mt-1 max-w-xs leading-relaxed">
            Pair your physical ChinChem feeder to schedule automated breakfast, lunch, and dinner alarms.
          </p>
        </div>
        <button
          type="button"
          onClick={() => context.setIsAddDeviceOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-[#143503] text-[#FFF2E6] text-xs font-bold flex items-center gap-2 shadow-sm hover:bg-[#143503]/90 transition-all cursor-pointer active:scale-95"
        >
          <Plus size={14} />
          <span>Pair Feeder</span>
        </button>
      </div>
    );
  }

  return <ScheduleDashboard {...props} activeDevice={activeDevice} />;
}

function ScheduleDashboard({
  activeDevice,
  onUpdateDevicePresets: propUpdatePresets,
}: ScheduleScreenProps & { activeDevice: FeederDevice }) {
  const context = useFeederContext();
  const onUpdateDevicePresets = propUpdatePresets || context.updateDevicePresets;
  const onUpdateDeviceTarget = context.updateDeviceTarget;

  const { schedules, addSchedule, updateSchedule, toggleSchedule, deleteSchedule, syncSchedulesToTarget } =
    useDeviceSchedules(activeDevice.id);

  // Daily Meals Target & Toast state
  const [dailyMealsTarget, setDailyMealsTarget] = useState<number>(activeDevice.todayMealsTarget ?? 3);
  const [targetSavedToast, setTargetSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Modals state
  const [scheduleToDelete, setScheduleToDelete] = useState<FeedingSchedule | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<FeedingSchedule | null>(null);

  // Portion Presets state
  const currentPresets = activeDevice.customPresets || [];
  const [snackMs, setSnackMs] = useState(currentPresets.find((p) => p.id === 'snack')?.durationMs ?? 15000);
  const [bowlMs, setBowlMs] = useState(currentPresets.find((p) => p.id === 'bowl')?.durationMs ?? 30000);
  const [feastMs, setFeastMs] = useState(currentPresets.find((p) => p.id === 'feast')?.durationMs ?? 45000);
  const [presetsSavedToast, setPresetsSavedToast] = useState(false);

  useEffect(() => {
    setDailyMealsTarget(activeDevice.todayMealsTarget ?? 3);
    const s = activeDevice.customPresets?.find((p) => p.id === 'snack')?.durationMs ?? 15000;
    const b = activeDevice.customPresets?.find((p) => p.id === 'bowl')?.durationMs ?? 30000;
    const f = activeDevice.customPresets?.find((p) => p.id === 'feast')?.durationMs ?? 45000;
    setSnackMs(s);
    setBowlMs(b);
    setFeastMs(f);
  }, [activeDevice.id, activeDevice.todayMealsTarget, activeDevice.customPresets]);

  const weeklyCounts = getWeeklyMealCounts(schedules);
  const todayTarget = weeklyCounts[new Date().getDay()] || dailyMealsTarget;

  const handleUpdateTarget = (newTarget: number) => {
    triggerHaptic('medium');
    const clamped = Math.max(1, Math.min(10, newTarget));
    setDailyMealsTarget(clamped);
    onUpdateDeviceTarget(activeDevice.id, clamped);

    const updatedSchedules = syncSchedulesToTarget(clamped);
    if (context.updateDeviceNextScheduledFeedAt) {
      const nextIso = getNextScheduledIso(updatedSchedules);
      context.updateDeviceNextScheduledFeedAt(activeDevice.id, nextIso);
    }

    setToastMessage(`Daily goal set to ${clamped} meals/day • ${updatedSchedules.length} feeding alarms active!`);
    setTargetSavedToast(true);
    setTimeout(() => setTargetSavedToast(false), 3000);
  };

  const handleToggleAwayMode = () => {
    triggerHaptic('medium');
    const nextState = !activeDevice.isAwayMode;
    context.toggleAwayMode(activeDevice.id);
    setToastMessage(
      nextState
        ? `🌴 Pet Away Mode activated • Feeding paused for ${activeDevice.petName}`
        : `🏠 Welcome back! Feeding schedules resumed for ${activeDevice.petName}`
    );
    setTargetSavedToast(true);
    setTimeout(() => setTargetSavedToast(false), 3500);
  };

  const handleSavePresets = () => {
    triggerHaptic('medium');
    const updatedPresets: PortionPreset[] = [
      {
        id: 'snack',
        name: 'Light Snack',
        icon: 'cookie',
        emoji: 'cookie',
        durationMs: snackMs,
        labelSeconds: `${Math.round(snackMs / 1000)}s`,
        description: `${Math.round(snackMs / 1000)}s quick reward treat`,
      },
      {
        id: 'bowl',
        name: 'Regular Bowl',
        icon: 'soup',
        emoji: 'soup',
        durationMs: bowlMs,
        labelSeconds: `${Math.round(bowlMs / 1000)}s`,
        description: `${Math.round(bowlMs / 1000)}s balanced meal`,
      },
      {
        id: 'feast',
        name: 'Royal Feast',
        icon: 'crown',
        emoji: 'crown',
        durationMs: feastMs,
        labelSeconds: `${Math.round(feastMs / 1000)}s`,
        description: `${Math.round(feastMs / 1000)}s hearty feast`,
      },
    ];

    onUpdateDevicePresets(activeDevice.id, updatedPresets);
    setPresetsSavedToast(true);
    setTimeout(() => setPresetsSavedToast(false), 3000);
  };

  const handleToggleSchedule = (scheduleId: string) => {
    triggerHaptic('light');
    const updated = toggleSchedule(scheduleId);
    const enabledCount = updated.filter((s) => s.enabled).length;
    if (enabledCount > 0) {
      setDailyMealsTarget(enabledCount);
      onUpdateDeviceTarget(activeDevice.id, enabledCount);
    }
    if (context.updateDeviceNextScheduledFeedAt) {
      const nextIso = getNextScheduledIso(updated);
      context.updateDeviceNextScheduledFeedAt(activeDevice.id, nextIso);
    }
  };

  const handleConfirmDeleteSchedule = () => {
    if (!scheduleToDelete) return;
    triggerHaptic('heavy');
    const label = scheduleToDelete.label || 'Daily Meal';
    const remaining = deleteSchedule(scheduleToDelete.id);
    const newCount = Math.max(1, remaining.length);
    setDailyMealsTarget(newCount);
    onUpdateDeviceTarget(activeDevice.id, newCount);
    if (context.updateDeviceNextScheduledFeedAt) {
      const nextIso = getNextScheduledIso(remaining);
      context.updateDeviceNextScheduledFeedAt(activeDevice.id, nextIso);
    }
    setToastMessage(`Deleted "${label}" feeding schedule`);
    setScheduleToDelete(null);
    setTargetSavedToast(true);
    setTimeout(() => setTargetSavedToast(false), 3000);
  };

  const handleSaveSchedule = (data: {
    id?: string;
    timeLocal: string;
    daysOfWeek: number[];
    durationMs: number;
    label: string;
  }) => {
    let updatedList: FeedingSchedule[] = [];
    if (data.id) {
      updatedList = updateSchedule(data.id, {
        timeLocal: data.timeLocal,
        daysOfWeek: data.daysOfWeek,
        durationMs: data.durationMs,
        label: data.label,
      });
      setToastMessage(`Updated "${data.label}" schedule!`);
    } else {
      const newSched = addSchedule({
        timeLocal: data.timeLocal,
        daysOfWeek: data.daysOfWeek,
        durationMs: data.durationMs,
        enabled: true,
        label: data.label,
      });
      updatedList = [...schedules, newSched];
      setToastMessage(`Added "${data.label}" schedule!`);
    }

    const todayCount = updatedList.length;
    setDailyMealsTarget(todayCount);
    onUpdateDeviceTarget(activeDevice.id, todayCount);

    if (context.updateDeviceNextScheduledFeedAt) {
      const nextIso = getNextScheduledIso(updatedList);
      context.updateDeviceNextScheduledFeedAt(activeDevice.id, nextIso);
    }

    setTargetSavedToast(true);
    setTimeout(() => setTargetSavedToast(false), 3000);
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fadeIn pb-6">
      {/* 1. Daily Feeding Goal Card */}
      <DailyGoalCard
        petName={activeDevice.petName}
        todayTarget={todayTarget}
        onUpdateTarget={handleUpdateTarget}
        targetSavedToast={targetSavedToast}
        toastMessage={toastMessage}
      />

      {/* 2. Pet Away Mode Toggle Card */}
      <PetAwayModeCard
        isAwayMode={activeDevice.isAwayMode}
        petName={activeDevice.petName}
        onToggleAwayMode={handleToggleAwayMode}
      />

      {/* 3. Feeding Schedules (Alarms) Card */}
      <FeedingSchedulesCard
        schedules={schedules}
        petName={activeDevice.petName}
        isAwayMode={activeDevice.isAwayMode}
        onOpenAddMeal={() => {
          setEditingSchedule(null);
          setShowScheduleModal(true);
        }}
        onOpenEditMeal={(sched) => {
          setEditingSchedule(sched);
          setShowScheduleModal(true);
        }}
        onPromptDelete={(sched) => setScheduleToDelete(sched)}
        onToggleSchedule={handleToggleSchedule}
        onToggleAwayMode={handleToggleAwayMode}
      />

      {/* 4. Portion Timers Calibration Card */}
      <PortionTimersCard
        petName={activeDevice.petName}
        snackMs={snackMs}
        bowlMs={bowlMs}
        feastMs={feastMs}
        setSnackMs={setSnackMs}
        setBowlMs={setBowlMs}
        setFeastMs={setFeastMs}
        onSavePresets={handleSavePresets}
        presetsSavedToast={presetsSavedToast}
      />

      {/* Modals */}
      <ScheduleFormModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        editingSchedule={editingSchedule}
        petName={activeDevice.petName}
        snackMs={snackMs}
        bowlMs={bowlMs}
        feastMs={feastMs}
        onSaveSchedule={handleSaveSchedule}
      />

      <DeleteScheduleModal
        schedule={scheduleToDelete}
        onCancel={() => setScheduleToDelete(null)}
        onConfirm={handleConfirmDeleteSchedule}
      />
    </div>
  );
}
