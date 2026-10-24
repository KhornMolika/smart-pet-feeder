'use client';

import { useState, useEffect, useCallback } from 'react';
import { FeedingSchedule } from '@/types/feeder.types';
import { INITIAL_SCHEDULES } from '@/lib/constants/feeder.constants';
import { toHardwareDeviceId, isSameDeviceId } from '@/lib/utils/device.util';
import { getTelegramAuthHeaders } from '@/lib/utils/telegram.util';
import { getBackendApiUrl } from '@/lib/api-config';

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

export function useDeviceSchedules(deviceId: string) {
  const backendUrl = getBackendApiUrl();

  // 1. Initial lazy load from localStorage to guarantee immediate hydration without flash
  const [allSchedules, setAllSchedules] = useState<FeedingSchedule[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_SCHEDULES);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }
    return INITIAL_SCHEDULES;
  });

  const saveSchedules = useCallback((schedules: FeedingSchedule[]) => {
    setAllSchedules(schedules);
    try {
      localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(schedules));
    } catch {}
  }, []);

  const targetDeviceId = toHardwareDeviceId(deviceId);

  // 2. Fetch authoritative schedules from NestJS backend API (which automatically syncs with MQTT)
  useEffect(() => {
    let isSubscribed = true;
    async function loadBackendSchedules() {
      try {
        const res = await fetch(`${backendUrl}/api/v1/devices/${targetDeviceId}/schedules`, {
          headers: getTelegramAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && isSubscribed) {
            setAllSchedules((prev) => {
              // Retain schedules belonging to other devices
              const otherDevices = prev.filter((s) => !isSameDeviceId(s.deviceId, deviceId));

              // Map backend schedules, explicitly associating them with the active deviceId
              const backendMapped: FeedingSchedule[] = data.map((item: any) => ({
                id: item.id || `sched-${Date.now()}`,
                deviceId: deviceId,
                label: item.label,
                timeLocal: item.timeLocal,
                durationMs: item.durationMs,
                daysOfWeek: item.daysOfWeek || [1, 2, 3, 4, 5, 6, 0],
                enabled: item.enabled ?? true,
                priority: item.priority || 1,
              }));

              // Preserve any locally-created schedules that have temporary IDs and haven't synced yet
              const existingDeviceScheds = prev.filter((s) => isSameDeviceId(s.deviceId, deviceId));
              const pendingLocal = existingDeviceScheds.filter(
                (loc) => loc.id.startsWith('sched-') && !backendMapped.some((b) => b.timeLocal === loc.timeLocal)
              );

              const mergedDeviceScheds = [...backendMapped, ...pendingLocal].sort((a, b) =>
                a.timeLocal.localeCompare(b.timeLocal)
              );

              // If backend returned nothing or empty, but we already have local schedules, keep local
              const finalForDevice = mergedDeviceScheds.length > 0 ? mergedDeviceScheds : existingDeviceScheds;
              const merged = [...otherDevices, ...finalForDevice];
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
  }, [backendUrl, deviceId, saveSchedules, targetDeviceId]);

  // Filter schedules for the current active device using normalized ID comparison
  const deviceSchedules = allSchedules
    .filter((s) => isSameDeviceId(s.deviceId, deviceId))
    .sort((a, b) => a.timeLocal.localeCompare(b.timeLocal));

  const addSchedule = (scheduleData: Omit<FeedingSchedule, 'id' | 'deviceId'>) => {
    const tempId = `sched-${Date.now()}`;
    const newSchedule: FeedingSchedule = {
      ...scheduleData,
      id: tempId,
      deviceId,
    };
    const updated = [...allSchedules, newSchedule];
    saveSchedules(updated);

    // Sync to backend (which automatically syncs to MQTT on ESP32)
    fetch(`${backendUrl}/api/v1/devices/${targetDeviceId}/schedules`, {
      method: 'POST',
      headers: getTelegramAuthHeaders(),
      body: JSON.stringify({
        label: scheduleData.label,
        timeLocal: scheduleData.timeLocal,
        durationMs: scheduleData.durationMs,
        daysOfWeek: scheduleData.daysOfWeek,
        enabled: scheduleData.enabled ?? true,
      }),
    })
      .then(async (res) => {
        if (res.ok) {
          const saved = await res.json();
          if (saved && saved.id) {
            setAllSchedules((prev) => {
              const mapped = prev.map((s) => (s.id === tempId ? { ...s, id: saved.id } : s));
              saveSchedules(mapped);
              return mapped;
            });
          }
        } else {
          console.error('[Schedule] Failed to save schedule to backend:', res.status);
        }
      })
      .catch((err) => {
        console.error('[Schedule] Error syncing schedule to backend:', err);
      });

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
    fetch(`${backendUrl}/api/v1/devices/${targetDeviceId}/schedules/${scheduleId}`, {
      method: 'PUT',
      headers: getTelegramAuthHeaders(),
      body: JSON.stringify({ enabled: newEnabled }),
    }).catch(() => {});

    return updated.filter((s) => isSameDeviceId(s.deviceId, deviceId));
  };

  const deleteSchedule = (scheduleId: string) => {
    const updated = allSchedules.filter((s) => s.id !== scheduleId);
    saveSchedules(updated);

    // Delete on backend
    fetch(`${backendUrl}/api/v1/devices/${targetDeviceId}/schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: getTelegramAuthHeaders(),
    }).catch(() => {});

    return updated.filter((s) => isSameDeviceId(s.deviceId, deviceId));
  };

  const updateSchedule = (scheduleId: string, updatedData: Partial<FeedingSchedule>) => {
    const updated = allSchedules.map((s) =>
      s.id === scheduleId ? { ...s, ...updatedData } : s
    );
    saveSchedules(updated);

    // Update on backend
    fetch(`${backendUrl}/api/v1/devices/${targetDeviceId}/schedules/${scheduleId}`, {
      method: 'PUT',
      headers: getTelegramAuthHeaders(),
      body: JSON.stringify(updatedData),
    }).catch(() => {});

    return updated.filter((s) => isSameDeviceId(s.deviceId, deviceId));
  };

  /**
   * Automatically adds or removes schedules to exactly match the target meals count.
   * Preserves customized meals when possible, keeping breakfast and dinner as anchors.
   */
  const syncSchedulesToTarget = useCallback(
    (targetCount: number): FeedingSchedule[] => {
      const clamped = Math.max(1, Math.min(10, targetCount));
      const currentDeviceSchedules = allSchedules.filter((s) => isSameDeviceId(s.deviceId, deviceId));
      const otherDeviceSchedules = allSchedules.filter((s) => !isSameDeviceId(s.deviceId, deviceId));

      let updatedDeviceSchedules: FeedingSchedule[] = [];

      if (currentDeviceSchedules.length === clamped) {
        // Count already matches; ensure all are enabled
        updatedDeviceSchedules = currentDeviceSchedules.map((s) => ({ ...s, enabled: true }));
      } else if (currentDeviceSchedules.length > clamped) {
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
    [allSchedules, deviceId, saveSchedules]
  );

  /**
   * Applies popular routine presets (e.g. 2 everyday, 3 everyday, or 2 on weekdays and 3 on weekends)
   */
  const applyPresetRoutine = useCallback(
    (routineType: '2_everyday' | '3_everyday' | '4_everyday' | 'weekday_2_weekend_3'): FeedingSchedule[] => {
      const otherDeviceSchedules = allSchedules.filter((s) => !isSameDeviceId(s.deviceId, deviceId));
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
    [allSchedules, deviceId, saveSchedules]
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
