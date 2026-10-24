'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FeederDevice, FeedingEvent } from '@/types/feeder.types';
import { playToneSound } from '@/lib/utils/audio.util';
import { triggerHaptic, triggerNotificationHaptic, getStoredNotificationConfig } from '@/lib/utils/telegram.util';
import { formatDuration } from '@/lib/utils/date.util';
import { getBackendApiUrl } from '@/lib/api-config';

export function useDeviceFeed(
  activeDevice: FeederDevice,
  onFeedSuccess?: (event: FeedingEvent) => void
) {
  const [selectedDurationMs, setSelectedDurationMs] = useState<number>(60000);
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

    const notifConfig = getStoredNotificationConfig();

    // 1. Play pet alert sound tone if enabled in settings and set to play 'after' food drops
    if (notifConfig.soundChimeEnabled && notifConfig.soundTiming === 'after') {
      playToneSound(notifConfig.soundToneId || 'gentle_chime', notifConfig.soundRepeatCount || 2);
    }

    // 2. User notification toast if meal alert is enabled
    if (notifConfig.mealServedAlert) {
      const toastMsg = `${activeDevice.petName} received food (${formatDuration(duration)})`;
      setNotificationToast(toastMsg);
    }

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

    // Guard against React Synthetic MouseEvents passed to onClick handlers
    const duration =
      typeof durationOverride === 'number' && !isNaN(durationOverride) && durationOverride > 0
        ? durationOverride
        : typeof selectedDurationMs === 'number' && !isNaN(selectedDurationMs) && selectedDurationMs > 0
        ? selectedDurationMs
        : 60000;

    triggerHaptic('medium');
    setIsDispensing(true);
    setFeedStatus('actuating');
    setActuationRemainingMs(duration);
    setNotificationToast(null);

    // Publish MQTT feed command to ESP32 hardware via backend BFF
    const hardwareDeviceId = activeDevice.claimToken
      ? activeDevice.claimToken.replace(/^claim_/, '')
      : activeDevice.id.replace(/^feeder-/, 'feeder_').replace(/-([a-zA-Z0-9]+)$/, '_$1');

    console.log(`[Feed Now] Sending feed command: device=${hardwareDeviceId}, duration=${duration}ms`);

    fetch(`${getBackendApiUrl()}/api/v1/devices/${hardwareDeviceId}/feed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bff-source': 'NextJS-AppRouter',
      },
      body: JSON.stringify({
        durationMs: duration,
        source: 'manual_app',
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.error('[Feed Now] Backend feed dispatch failed:', res.status, body);
        } else {
          console.log(`[Feed Now] ✅ Successfully dispatched feed command to ESP32 (${duration}ms)`);
        }
      })
      .catch((err) => {
        console.error('[Feed Now] Network error triggering feed:', err);
      });

    const notifConfig = getStoredNotificationConfig();

    // Play pet alert melody immediately if set to play 'before' food drops (classical Pavlovian call)
    if (notifConfig.soundChimeEnabled && (notifConfig.soundTiming === 'before' || !notifConfig.soundTiming)) {
      playToneSound(notifConfig.soundToneId || 'gentle_chime', notifConfig.soundRepeatCount || 2);
    }

    const startTime = Date.now();
    const intervalStep = 50;

    // Countdown loop for food dispensing
    countdownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setActuationRemainingMs(remaining);

      if (remaining <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        finishDispense(duration);
      }
    }, intervalStep);
  }, [activeDevice.claimToken, activeDevice.id, cooldownRemaining, finishDispense, isDispensing, selectedDurationMs]);

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
