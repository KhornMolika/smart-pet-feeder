'use client';

import { useState } from 'react';
import { FeedingSchedule } from '@/types/feeder.types';
import { INITIAL_SCHEDULES } from '@/lib/constants/feeder.constants';

const STORAGE_KEY_SCHEDULES = 'chinchum_schedules';

export function useDeviceSchedules(deviceId: string) {
  const [allSchedules, setAllSchedules] = useState<FeedingSchedule[]>(() => {
    if (typeof window === 'undefined') return INITIAL_SCHEDULES;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SCHEDULES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_SCHEDULES;
  });

  const saveSchedules = (schedules: FeedingSchedule[]) => {
    setAllSchedules(schedules);
    try {
      localStorage.setItem(STORAGE_KEY_SCHEDULES, JSON.stringify(schedules));
    } catch {}
  };

  // Filter schedules for the current active device
  const deviceSchedules = allSchedules.filter((s) => s.deviceId === deviceId);

  const addSchedule = (scheduleData: Omit<FeedingSchedule, 'id' | 'deviceId'>) => {
    const newSchedule: FeedingSchedule = {
      ...scheduleData,
      id: `sched-${Date.now()}`,
      deviceId,
    };
    const updated = [...allSchedules, newSchedule];
    saveSchedules(updated);
    return newSchedule;
  };

  const toggleSchedule = (scheduleId: string) => {
    const updated = allSchedules.map((s) =>
      s.id === scheduleId ? { ...s, enabled: !s.enabled } : s
    );
    saveSchedules(updated);
  };

  const deleteSchedule = (scheduleId: string) => {
    const updated = allSchedules.filter((s) => s.id !== scheduleId);
    saveSchedules(updated);
  };

  return {
    schedules: deviceSchedules,
    allSchedules,
    addSchedule,
    toggleSchedule,
    deleteSchedule,
  };
}
