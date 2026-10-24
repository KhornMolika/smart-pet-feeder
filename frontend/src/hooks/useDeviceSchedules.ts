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

export function deduplicateSchedules(schedules: FeedingSchedule[]): FeedingSchedule[] {
  const seenIds = new Set<string>();
  const seenTimeLabel = new Set<string>();
  const result: FeedingSchedule[] = [];

  for (const s of schedules) {
    if (!s || !s.timeLocal) continue;
    const timeLabelKey = `${s.timeLocal}_${(s.label || '').trim().toLowerCase()}`;
    if (seenIds.has(s.id) || seenTimeLabel.has(timeLabelKey)) {
      continue;
    }
    seenIds.add(s.id);
    seenTimeLabel.add(timeLabelKey);
    result.push(s);
  }

  return result.sort((a, b) => a.timeLocal.localeCompare(b.timeLocal));
}

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
            return deduplicateSchedules(parsed);
          }
        }
      } catch {}
    }
    return INITIAL_SCHEDULES;
  });

  const saveSchedules = useCallback((schedules: FeedingSchedule[]) => {
    const deduped = deduplicateSchedules(schedules);
    setAllSchedules(deduped);
    try {
      localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(deduped));
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

              // Map backend authoritative schedules
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

              // Preserve ONLY very fresh in-flight local additions (< 15 seconds) that haven't hit backend yet
              const now = Date.now();
              const existingDeviceScheds = prev.filter((s) => isSameDeviceId(s.deviceId, deviceId));
              const freshInFlight = existingDeviceScheds.filter((loc) => {
                if (!loc.id.startsWith('sched-')) return false;
                const parts = loc.id.split('-');
                const ts = Number(parts[1]);
                const isFresh = Number.isFinite(ts) && now - ts < 15000;
                return isFresh && !backendMapped.some((b) => b.timeLocal === loc.timeLocal);
              });

              // Combine backend authoritative schedules with in-flight items, and deduplicate
              const combinedDevice = deduplicateSchedules([...backendMapped, ...freshInFlight]);
              const merged = [...otherDevices, ...combinedDevice];
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
    const updated = deduplicateSchedules([...allSchedules, newSchedule]);
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
              const deduped = deduplicateSchedules(mapped);
              saveSchedules(deduped);
              return deduped;
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
    applyPresetRoutine,
  };
}
