'use client';

import React, { useState, useEffect } from 'react';
import { FeederDevice, FeedingEvent, PortionPreset } from '@/types/feeder.types';
import { useDeviceFeed } from '@/hooks/useDeviceFeed';
import { DEFAULT_PORTION_PRESETS } from '@/lib/constants/feeder.constants';
import { formatRelativeTime, getCountdownUntil, getNextScheduledIso, getTodayMealsTarget } from '@/lib/utils/date.util';
import { triggerHaptic } from '@/lib/utils/telegram.util';
import { useFeederContext } from '@/context/feeder-context';

// Modular Components
import { PetAwayBanner } from './pet-away-banner';
import { FeedActuatorCard } from './feed-actuator-card';
import { FoodStorageAndGoalsCard } from './food-storage-and-goals-card';
import { MealStatusCards } from './meal-status-cards';

import { OnboardingScreen } from '@/components/onboarding/onboarding-screen';

interface FeedScreenProps {
  activeDevice?: FeederDevice;
  onFeedSuccess?: (event: FeedingEvent) => void;
  onNavigateScreen?: (screen: 'settings' | 'history') => void;
}

export function FeedScreen(props: FeedScreenProps = {}) {
  const context = useFeederContext();
  const activeDevice = props.activeDevice || context.activeDevice;

  if (!activeDevice || !context.devices || context.devices.length === 0) {
    return <OnboardingScreen />;
  }

  return <FeedDashboard {...props} activeDevice={activeDevice} />;
}

function FeedDashboard({
  activeDevice,
  onFeedSuccess,
  onNavigateScreen,
}: FeedScreenProps & { activeDevice: FeederDevice }) {
  const context = useFeederContext();

  const presets = activeDevice.customPresets || DEFAULT_PORTION_PRESETS;
  const [activePresetId, setActivePresetId] = useState<string | null>('bowl');

  const [countdownText, setCountdownText] = useState<string>('');
  const [lastFeedText, setLastFeedText] = useState<string>('');
  const [nextMealTimeDisplay, setNextMealTimeDisplay] = useState<string>('');
  const [scheduledMealsCount, setScheduledMealsCount] = useState<number>(0);
  const [manualMealsCount, setManualMealsCount] = useState<number>(0);
  const [todayMealsServedCount, setTodayMealsServedCount] = useState<number>(activeDevice.todayMealsServed ?? 0);
  const [todayTargetCount, setTodayTargetCount] = useState<number>(activeDevice.todayMealsTarget ?? 3);

  useEffect(() => {
    let nextFeedTargetIso = activeDevice.nextScheduledFeedAt;
    let targetForToday = activeDevice.todayMealsTarget ?? 3;
    try {
      const stored = localStorage.getItem('chinchum_schedules');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const deviceScheds = parsed.filter((s) => s.deviceId === activeDevice.id);
          const computedNext = getNextScheduledIso(deviceScheds);
          if (computedNext) {
            nextFeedTargetIso = computedNext;
          }
          targetForToday = getTodayMealsTarget(deviceScheds, targetForToday);
        }
      }
    } catch {}

    setTodayTargetCount(targetForToday);

    if (nextFeedTargetIso) {
      setCountdownText(getCountdownUntil(nextFeedTargetIso));
      try {
        const d = new Date(nextFeedTargetIso);
        if (!isNaN(d.getTime())) {
          setNextMealTimeDisplay(
            d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
          );
        }
      } catch {
        setNextMealTimeDisplay('');
      }
    } else {
      setCountdownText('');
      setNextMealTimeDisplay('');
    }

    if (activeDevice.lastFeedAt) {
      setLastFeedText(formatRelativeTime(activeDevice.lastFeedAt));
    } else {
      setLastFeedText('');
    }

    const todayStr = new Date().toDateString();
    const historyList = context.allHistory || context.history || [];
    const eventsToday = historyList.filter(
      (e) => e.deviceId === activeDevice.id && new Date(e.startedAt).toDateString() === todayStr
    );
    const scheduled = eventsToday.filter((e) => e.source === 'scheduled').length;
    const manual = eventsToday.filter(
      (e) => e.source === 'manual_app' || e.source === 'physical_button'
    ).length;
    const totalServed = Math.max(activeDevice.todayMealsServed ?? 0, eventsToday.length);

    setScheduledMealsCount(scheduled);
    setManualMealsCount(manual);
    setTodayMealsServedCount(totalServed);
  }, [
    activeDevice.id,
    activeDevice.todayMealsServed,
    activeDevice.todayMealsTarget,
    activeDevice.lastFeedAt,
    activeDevice.nextScheduledFeedAt,
    context.allHistory,
    context.history,
  ]);

  const handleFeedSuccess = (event: FeedingEvent) => {
    if (onFeedSuccess) {
      onFeedSuccess(event);
    } else {
      context.addHistoryEvent(event);
    }
    context.recordDispense(activeDevice.id, event.durationMs);
  };

  const {
    selectedDurationMs,
    setSelectedDurationMs,
    isDispensing,
    actuationRemainingMs,
    cooldownRemaining,
    feedStatus,
    notificationToast,
    triggerDispense,
    stopDispense,
    skipCooldown,
  } = useDeviceFeed(activeDevice, handleFeedSuccess);

  const handleSelectPreset = (preset: PortionPreset) => {
    triggerHaptic('light');
    setActivePresetId(preset.id);
    setSelectedDurationMs(preset.durationMs);
  };

  // Dynamic Today's Meals Metrics
  const todayMealsServed = todayMealsServedCount;
  const todayMealsTarget = todayTargetCount;
  const mealsRemaining = Math.max(0, todayMealsTarget - todayMealsServed);
  const isGoalExceeded = todayMealsServed > todayMealsTarget;
  const isGoalMet = todayMealsServed === todayMealsTarget;
  const extraMeals = Math.max(0, todayMealsServed - todayMealsTarget);
  const totalMealSegments = Math.max(todayMealsTarget, todayMealsServed);

  const mealStatus = isGoalExceeded
    ? { label: `+${extraMeals} Treat${extraMeals > 1 ? 's' : ''}`, badgeCls: 'bg-amber-100 text-amber-900 border-amber-300 font-bold' }
    : isGoalMet
    ? { label: 'Completed', badgeCls: 'bg-[#A7D1AE]/45 text-[#143503] border-[#143503]/20 font-bold' }
    : todayMealsServed > 0
    ? { label: 'On Track', badgeCls: 'bg-[#BCDBF0]/55 text-[#143503] border-[#143503]/15 font-bold' }
    : { label: 'Pending', badgeCls: 'bg-[#FFF2E6] text-[#4B633E] border-[#143503]/15 font-bold' };

  return (
    <div className="w-full flex flex-col gap-4 animate-fadeIn">
      {/* 1. Pet Away Mode Active Banner */}
      <PetAwayBanner
        petName={activeDevice.petName}
        isAwayMode={activeDevice.isAwayMode}
        onResume={() => context.toggleAwayMode(activeDevice.id)}
      />

      {/* 2. Main Feeding Actuator Card */}
      <FeedActuatorCard
        activeDevice={activeDevice}
        presets={presets}
        activePresetId={activePresetId}
        onSelectPreset={handleSelectPreset}
        selectedDurationMs={selectedDurationMs}
        setSelectedDurationMs={setSelectedDurationMs}
        setActivePresetId={setActivePresetId}
        isDispensing={isDispensing}
        actuationRemainingMs={actuationRemainingMs}
        cooldownRemaining={cooldownRemaining}
        feedStatus={feedStatus}
        notificationToast={notificationToast}
        onTriggerDispense={triggerDispense}
        onStopDispense={stopDispense}
        onSkipCooldown={skipCooldown}
      />

      {/* 3. Daily Feeding Goals Card */}
      <FoodStorageAndGoalsCard
        activeDevice={activeDevice}
        todayMealsServed={todayMealsServed}
        todayMealsTarget={todayMealsTarget}
        mealsRemaining={mealsRemaining}
        isGoalExceeded={isGoalExceeded}
        extraMeals={extraMeals}
        totalMealSegments={totalMealSegments}
        mealStatus={mealStatus}
        scheduledMealsCount={scheduledMealsCount}
        manualMealsCount={manualMealsCount}
      />

      {/* 4. Last Feed & Next Feed Cards */}
      <MealStatusCards
        activeDevice={activeDevice}
        lastFeedText={lastFeedText}
        countdownText={countdownText}
        nextMealTimeDisplay={nextMealTimeDisplay}
      />
    </div>
  );
}
