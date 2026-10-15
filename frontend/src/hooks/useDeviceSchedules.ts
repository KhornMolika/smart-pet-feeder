'use client';

import { useState, useEffect, useCallback } from 'react';
import { FeedingSchedule } from '@/types/feeder.types';
import { INITIAL_SCHEDULES } from '@/lib/constants/feeder.constants';

const STORAGE_KEY_SCHEDULES = 'chinchum_schedules';

export interface DefaultMealSlot {
  timeLocal: string;
  label: string;
  durationMs: number;
  daysOfWeek: number[];
  priority: number;
}

export const DEFAULT_MEAL_PRESETS: DefaultMealSlot[] = [
  { timeLocal: '07:30', label: 'Morning Breakfast', durationMs: 60000, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], priority: 1 },
  { timeLocal: '18:30', label: 'Evening Dinner', durationMs: 60000, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], priority: 2 },
  { timeLocal: '12:30', label: 'Noon Snack', durationMs: 30000, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], priority: 3 },
  { timeLocal: '21:30', label: 'Night Supper', durationMs: 30000, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], priority: 4 },
  { timeLocal: '15:30', label: 'Afternoon Treat', durationMs: 30000, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], priority: 5 },
  { timeLocal: '10:30', label: 'Mid-Morning Bite', durationMs: 30000, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], priority: 6 },
  { timeLocal: '17:00', label: 'Pre-Dinner Nibble', durationMs: 30000, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], priority: 7 },
  { timeLocal: '23:00', label: 'Bedtime Snack', durationMs: 30000, daysOfWeek: [1, 2, 3, 4, 5, 6, 0], priority: 8 },
];

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export function useDeviceSchedules(deviceId: string) {
  const [allSchedules, setAllSchedules] = useState<FeedingSchedule[]>(INITIAL_SCHEDULES);

  // 1. Initial load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SCHEDULES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAllSchedules(parsed);
        }
      }
    } catch {}
  }, []);

  const saveSchedules = useCallback((schedules: FeedingSchedule[]) => {
    setAllSchedules(schedules);
    try {
      localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(schedules));
    } catch {}
  }, []);

  // 2. Fetch authoritative schedules from NestJS backend API (which automatically syncs with MQTT)
  useEffect(() => {
    let isSubscribed = true;
    async function loadBackendSchedules() {
      try {
        const res = await fetch(`${backendUrl}/api/v1/devices/${deviceId}/schedules`, {
          headers: { 'x-bff-source': 'NextJS-AppRouter' },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && isSubscribed) {
            setAllSchedules((prev) => {
              const otherDevices = prev.filter((s) => s.deviceId !== deviceId);
              const mapped: FeedingSchedule[] = data.map((item: any) => ({
                id: item.id || `sched-${Date.now()}`,
                deviceId: item.deviceId || deviceId,
                label: item.label,
                timeLocal: item.timeLocal,
                durationMs: item.durationMs,
                daysOfWeek: item.daysOfWeek || [1, 2, 3, 4, 5, 6, 0],
                enabled: item.enabled ?? true,
                priority: item.priority || 1,
              }));
              const merged = [...otherDevices, ...mapped];
              saveSchedules(merged);
              return merged;
            });
          }
        }
      } catch {
        // Fallback gracefully to localStorage
      }
    }
    loadBackendSchedules();
    return () => {
      isSubscribed = false;
    };
  }, [deviceId, saveSchedules]);

  // Filter schedules for the current active device, sorted chronologically
  const deviceSchedules = allSchedules
    .filter((s) => s.deviceId === deviceId)
    .sort((a, b) => a.timeLocal.localeCompare(b.timeLocal));

  const addSchedule = (scheduleData: Omit<FeedingSchedule, 'id' | 'deviceId'>) => {
    const newSchedule: FeedingSchedule = {
      ...scheduleData,
      id: `sched-${Date.now()}`,
      deviceId,
    };
    const updated = [...allSchedules, newSchedule];
    saveSchedules(updated);

    // Sync to backend (which automatically syncs to MQTT on ESP32)
    fetch(`${backendUrl}/api/v1/devices/${deviceId}/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bff-source': 'NextJS-AppRouter',
      },
      body: JSON.stringify({
        label: scheduleData.label,
        timeLocal: scheduleData.timeLocal,
        durationMs: scheduleData.durationMs,
        daysOfWeek: scheduleData.daysOfWeek,
        enabled: scheduleData.enabled ?? true,
      }),
    }).catch(() => {});

    return newSchedule;
  };

  const toggleSchedule = (scheduleId: string) => {
    const target = allSchedules.find((s) => s.id === scheduleId);
    const newEnabled = target ? !target.enabled : true;

    const updated = allSchedules.map((s) =>
      s.id === scheduleId ? { ...s, enabled: newEnabled } : s
    );
    saveSchedules(updated);

    // Sync state change to backend
    fetch(`${backendUrl}/api/v1/devices/${deviceId}/schedules/${scheduleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-bff-source': 'NextJS-AppRouter',
      },
      body: JSON.stringify({ enabled: newEnabled }),
    }).catch(() => {});

    return updated.filter((s) => s.deviceId === deviceId);
  };

  const deleteSchedule = (scheduleId: string) => {
    const updated = allSchedules.filter((s) => s.id !== scheduleId);
    saveSchedules(updated);

    // Delete on backend
    fetch(`${backendUrl}/api/v1/devices/${deviceId}/schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: { 'x-bff-source': 'NextJS-AppRouter' },
    }).catch(() => {});

    return updated.filter((s) => s.deviceId === deviceId);
  };

  const updateSchedule = (scheduleId: string, updatedData: Partial<FeedingSchedule>) => {
    const updated = allSchedules.map((s) =>
      s.id === scheduleId ? { ...s, ...updatedData } : s
    );
    saveSchedules(updated);

    // Update on backend
    fetch(`${backendUrl}/api/v1/devices/${deviceId}/schedules/${scheduleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-bff-source': 'NextJS-AppRouter',
      },
      body: JSON.stringify(updatedData),
    }).catch(() => {});

    return updated.filter((s) => s.deviceId === deviceId);
  };

  /**
   * Automatically adds or removes schedules to exactly match the target meals count.
   * Preserves customized meals when possible, keeping breakfast and dinner as anchors.
   */
  const syncSchedulesToTarget = useCallback(
    (targetCount: number): FeedingSchedule[] => {
      const clamped = Math.max(1, Math.min(10, targetCount));
      const currentDeviceSchedules = allSchedules.filter((s) => s.deviceId === deviceId);
      const otherDeviceSchedules = allSchedules.filter((s) => s.deviceId !== deviceId);

      let updatedDeviceSchedules: FeedingSchedule[] = [];

      if (currentDeviceSchedules.length === clamped) {
        // Count already matches; ensure all are enabled
        updatedDeviceSchedules = currentDeviceSchedules.map((s) => ({ ...s, enabled: true }));
      } else if (currentDeviceSchedules.length > clamped) {
        // Need to remove excess schedules down to clamped count.
        // Priority order to KEEP:
        // Priority 1: Morning (06:00 - 09:30)
        // Priority 2: Evening (17:30 - 20:30)
        // Priority 3: Noon (11:30 - 13:30)
        // Priority 4: Night (21:00 - 23:30)
        // Priority 5: Afternoon (14:00 - 16:30)
        // Priority 6: Mid-Morning (09:30 - 11:30)
        // Priority 7: Others
        const getPriorityScore = (s: FeedingSchedule) => {
          const [h] = s.timeLocal.split(':').map((v) => parseInt(v, 10));
          if (h >= 6 && h <= 9) return 1; // Breakfast
          if (h >= 17 && h <= 20) return 2; // Dinner
          if (h >= 11 && h <= 13) return 3; // Lunch / Noon snack
          if (h >= 21 && h <= 23) return 4; // Supper
          if (h >= 14 && h <= 16) return 5; // Afternoon treat
          if (h > 9 && h < 11) return 6; // Mid-morning
          return 7;
        };

        const ranked = [...currentDeviceSchedules].sort(
          (a, b) => getPriorityScore(a) - getPriorityScore(b)
        );
        const retained = ranked.slice(0, clamped).map((s) => ({ ...s, enabled: true }));
        updatedDeviceSchedules = retained.sort((a, b) => a.timeLocal.localeCompare(b.timeLocal));
      } else {
        // Need to add new schedules to reach clamped count.
        const existing = currentDeviceSchedules.map((s) => ({ ...s, enabled: true }));
        const needed = clamped - existing.length;

        const existingTimes = new Set(existing.map((s) => s.timeLocal));
        const added: FeedingSchedule[] = [];

        for (const preset of DEFAULT_MEAL_PRESETS) {
          if (added.length >= needed) break;
          const [ph, pm] = preset.timeLocal.split(':').map((v) => parseInt(v, 10));
          const presetMinutes = ph * 60 + pm;

          const hasCloseTime = existing.some((s) => {
            const [sh, sm] = s.timeLocal.split(':').map((v) => parseInt(v, 10));
            const smMinutes = sh * 60 + sm;
            return Math.abs(presetMinutes - smMinutes) < 45;
          });

          if (!existingTimes.has(preset.timeLocal) && !hasCloseTime) {
            added.push({
              id: `sched-${Date.now()}-${added.length}`,
              deviceId,
              timeLocal: preset.timeLocal,
              daysOfWeek: preset.daysOfWeek,
              durationMs: preset.durationMs,
              enabled: true,
              label: preset.label,
            });
            existingTimes.add(preset.timeLocal);
          }
        }

        // Fallback generator if needed > available presets
        let fallbackHour = 9;
        while (added.length < needed) {
          const hourStr = String(fallbackHour).padStart(2, '0');
          const timeStr = `${hourStr}:00`;
          if (!existingTimes.has(timeStr)) {
            added.push({
              id: `sched-${Date.now()}-${added.length}`,
              deviceId,
              timeLocal: timeStr,
              daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
              durationMs: 30000,
              enabled: true,
              label: `Meal ${existing.length + added.length + 1}`,
            });
            existingTimes.add(timeStr);
          }
          fallbackHour = (fallbackHour + 2) % 24;
        }

        updatedDeviceSchedules = [...existing, ...added].sort((a, b) =>
          a.timeLocal.localeCompare(b.timeLocal)
        );
      }

      const newAllSchedules = [...otherDeviceSchedules, ...updatedDeviceSchedules];
      saveSchedules(newAllSchedules);
      return updatedDeviceSchedules;
    },
    [allSchedules, deviceId]
  );

  /**
   * Applies popular routine presets (e.g. 2 everyday, 3 everyday, or 2 on weekdays and 3 on weekends)
   */
  const applyPresetRoutine = useCallback(
    (routineType: '2_everyday' | '3_everyday' | '4_everyday' | 'weekday_2_weekend_3'): FeedingSchedule[] => {
      const otherDeviceSchedules = allSchedules.filter((s) => s.deviceId !== deviceId);
      let newSchedules: FeedingSchedule[] = [];

      if (routineType === '2_everyday') {
        newSchedules = [
          { id: `sched-${Date.now()}-1`, deviceId, timeLocal: '07:30', label: 'Morning Breakfast', durationMs: 60000, enabled: true, daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
          { id: `sched-${Date.now()}-2`, deviceId, timeLocal: '18:30', label: 'Evening Dinner', durationMs: 60000, enabled: true, daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
        ];
      } else if (routineType === '3_everyday') {
        newSchedules = [
          { id: `sched-${Date.now()}-1`, deviceId, timeLocal: '07:30', label: 'Morning Breakfast', durationMs: 60000, enabled: true, daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
          { id: `sched-${Date.now()}-2`, deviceId, timeLocal: '12:30', label: 'Noon Snack', durationMs: 30000, enabled: true, daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
          { id: `sched-${Date.now()}-3`, deviceId, timeLocal: '18:30', label: 'Evening Dinner', durationMs: 60000, enabled: true, daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
        ];
      } else if (routineType === '4_everyday') {
        newSchedules = [
          { id: `sched-${Date.now()}-1`, deviceId, timeLocal: '07:30', label: 'Morning Breakfast', durationMs: 60000, enabled: true, daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
          { id: `sched-${Date.now()}-2`, deviceId, timeLocal: '12:30', label: 'Noon Snack', durationMs: 30000, enabled: true, daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
          { id: `sched-${Date.now()}-3`, deviceId, timeLocal: '18:30', label: 'Evening Dinner', durationMs: 60000, enabled: true, daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
          { id: `sched-${Date.now()}-4`, deviceId, timeLocal: '21:30', label: 'Night Supper', durationMs: 30000, enabled: true, daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
        ];
      } else if (routineType === 'weekday_2_weekend_3') {
        newSchedules = [
          { id: `sched-${Date.now()}-1`, deviceId, timeLocal: '07:30', label: 'Morning Breakfast', durationMs: 60000, enabled: true, daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
          { id: `sched-${Date.now()}-2`, deviceId, timeLocal: '12:30', label: 'Weekend Lunch Treat', durationMs: 30000, enabled: true, daysOfWeek: [6, 0] },
          { id: `sched-${Date.now()}-3`, deviceId, timeLocal: '18:30', label: 'Evening Dinner', durationMs: 60000, enabled: true, daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
        ];
      }

      const combined = [...otherDeviceSchedules, ...newSchedules];
      saveSchedules(combined);
      return newSchedules;
    },
    [allSchedules, deviceId]
  );

  return {
    schedules: deviceSchedules,
    allSchedules,
    addSchedule,
    updateSchedule,
    toggleSchedule,
    deleteSchedule,
    syncSchedulesToTarget,
    applyPresetRoutine,
  };
}
