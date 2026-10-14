'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FeederDevice, FeedingEvent } from '@/types/feeder.types';
import { playPetFeedingChime } from '@/lib/utils/audio.util';
import { triggerHaptic, triggerNotificationHaptic } from '@/lib/utils/telegram.util';

export function useDeviceFeed(
  activeDevice: FeederDevice,
  onFeedSuccess?: (event: FeedingEvent) => void
) {
  const [selectedDurationMs, setSelectedDurationMs] = useState<number>(1800);
  const [isDispensing, setIsDispensing] = useState<boolean>(false);
  const [actuationRemainingMs, setActuationRemainingMs] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [feedStatus, setFeedStatus] = useState<'idle' | 'actuating' | 'success' | 'error'>('idle');
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  const startCooldown = useCallback((seconds: number) => {
    setCooldownRemaining(seconds);
    cooldownIntervalRef.current = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
          setFeedStatus('idle');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const finishDispense = useCallback((duration: number) => {
    setIsDispensing(false);
    setFeedStatus('success');
    setActuationRemainingMs(0);
    triggerNotificationHaptic('success');

    // 1. Play pet alert sound chime
    playPetFeedingChime();

    // 2. User notification toast
    const toastMsg = `🎉 ${activeDevice.petName} received food (${(duration / 1000).toFixed(1)}s actuation)`;
    setNotificationToast(toastMsg);

    // 3. Create feeding event record
    const now = Date.now();
    const event: FeedingEvent = {
      id: `feed-${now}`,
      deviceId: activeDevice.id,
      deviceName: `${activeDevice.petName} (${activeDevice.room})`,
      source: 'manual_app',
      status: 'completed',
      startedAt: new Date(now - duration).toISOString(),
      completedAt: new Date(now).toISOString(),
      durationMs: duration,
      note: `Dispensed via Telegram Mini App`,
    };
    onFeedSuccess?.(event);

    // 5. Start cooldown
    startCooldown(3);

    // Clear toast message after 4s
    setTimeout(() => {
      setNotificationToast(null);
    }, 4500);
  }, [activeDevice, onFeedSuccess, startCooldown]);

  const triggerDispense = useCallback(async (durationOverride?: number) => {
    if (isDispensing || cooldownRemaining > 0) return;

    const duration = durationOverride || selectedDurationMs;
    triggerHaptic('medium');
    setIsDispensing(true);
    setFeedStatus('actuating');
    setActuationRemainingMs(duration);
    setNotificationToast(null);

    const startTime = Date.now();
    const intervalStep = 50;

    // Countdown loop for servo gate actuation
    countdownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setActuationRemainingMs(remaining);

      if (remaining <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        finishDispense(duration);
      }
    }, intervalStep);
  }, [cooldownRemaining, finishDispense, isDispensing, selectedDurationMs]);

  const skipCooldown = useCallback(() => {
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    setCooldownRemaining(0);
    setFeedStatus('idle');
    triggerHaptic('light');
  }, []);

  return {
    selectedDurationMs,
    setSelectedDurationMs,
    isDispensing,
    actuationRemainingMs,
    cooldownRemaining,
    feedStatus,
    notificationToast,
    triggerDispense,
    skipCooldown,
  };
}
