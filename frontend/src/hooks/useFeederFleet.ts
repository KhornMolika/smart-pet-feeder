'use client';

import { useState, useEffect } from 'react';
import { FeederDevice, PortionPreset } from '@/types/feeder.types';
import { INITIAL_DEVICES, DEFAULT_PORTION_PRESETS } from '@/lib/constants/feeder.constants';

const STORAGE_KEY_DEVICES = 'chinchum_fleet_devices';
const STORAGE_KEY_ACTIVE_ID = 'chinchum_active_device_id';

export function useFeederFleet() {
  const [devices, setDevices] = useState<FeederDevice[]>(INITIAL_DEVICES);
  const [activeDeviceId, setActiveDeviceId] = useState<string>(INITIAL_DEVICES[0].id);

  // Sync saved fleet data from localStorage after client hydration to prevent SSR mismatch
  useEffect(() => {
    try {
      const storedDevices = localStorage.getItem(STORAGE_KEY_DEVICES);
      if (storedDevices) {
        const parsed = JSON.parse(storedDevices);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDevices(parsed);
        }
      }
      const storedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (storedActiveId) {
        setActiveDeviceId(storedActiveId);
      }
    } catch {}
  }, []);

  // Save changes to localStorage
  const saveDevices = (newDevices: FeederDevice[]) => {
    setDevices(newDevices);
    try {
      localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(newDevices));
    } catch {}
  };

  const switchDevice = (id: string) => {
    setActiveDeviceId(id);
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
    } catch {}
  };

  const addDevice = (deviceData: {
    name: string;
    petName: string;
    petEmoji: string;
    room: string;
    claimToken?: string;
  }) => {
    const suffix = deviceData.claimToken
      ? deviceData.claimToken.replace(/^claim_/, '').slice(0, 6)
      : String(devices.length + 1).padStart(3, '0');
    const newId = `feeder-esp32-${suffix}`;

    const newDevice: FeederDevice = {
      id: newId,
      name: deviceData.name,
      petName: deviceData.petName,
      petEmoji: deviceData.petEmoji || 'paw',
      petIcon: deviceData.petEmoji || 'paw',
      room: deviceData.room,
      isOnline: true,
      rtcValid: true,
      wifiRssi: -60,
      lastSeenAt: new Date().toISOString(),
      todayMealsServed: 0,
      todayMealsTarget: 3,
      customPresets: DEFAULT_PORTION_PRESETS,
      claimToken: deviceData.claimToken,
    };
    const updated = [...devices, newDevice];
    saveDevices(updated);
    switchDevice(newId);

    // Call backend claim endpoint if claimToken provided
    if (deviceData.claimToken) {
      fetch('http://localhost:3001/api/v1/devices/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bff-source': 'NextJS-AppRouter',
        },
        body: JSON.stringify({
          claimToken: deviceData.claimToken,
          petName: deviceData.petName,
          petEmoji: deviceData.petEmoji,
          room: deviceData.room,
        }),
      }).catch(() => {
        // Fallback gracefully in client cache
      });
    }

    return newDevice;
  };

  const updateDevicePresets = (deviceId: string, presets: PortionPreset[]) => {
    const updated = devices.map((d) => (d.id === deviceId ? { ...d, customPresets: presets } : d));
    saveDevices(updated);
  };

  const updateDeviceTarget = (deviceId: string, target: number) => {
    const updated = devices.map((d) =>
      d.id === deviceId ? { ...d, todayMealsTarget: Math.max(1, Math.min(10, target)) } : d
    );
    saveDevices(updated);
  };

  const updateDeviceNextScheduledFeedAt = (deviceId: string, isoString: string | null) => {
    const updated = devices.map((d) => (d.id === deviceId ? { ...d, nextScheduledFeedAt: isoString } : d));
    saveDevices(updated);
  };

  const recordDispense = (deviceId: string, _durationMs: number = 60000) => {
    const nowIso = new Date().toISOString();
    const updated = devices.map((d) => {
      if (d.id !== deviceId) return d;
      const currentMeals = d.todayMealsServed ?? 0;
      return {
        ...d,
        todayMealsServed: currentMeals + 1,
        lastFeedAt: nowIso,
      };
    });
    saveDevices(updated);
  };

  const removeDevice = (deviceId: string): boolean => {
    if (devices.length <= 1) {
      return false; // Guard: Cannot delete the only remaining device
    }
    const remaining = devices.filter((d) => d.id !== deviceId);
    saveDevices(remaining);

    // If currently active device was removed, switch to the first remaining device
    if (activeDeviceId === deviceId) {
      switchDevice(remaining[0].id);
    }

    // Clean up associated schedules from localStorage
    try {
      const storedSchedules = localStorage.getItem('chinchum_schedules');
      if (storedSchedules) {
        const parsed = JSON.parse(storedSchedules);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((s: { deviceId: string }) => s.deviceId !== deviceId);
          localStorage.setItem('chinchum_schedules', JSON.stringify(filtered));
        }
      }
    } catch {}

    return true;
  };

  const toggleAwayMode = (deviceId: string) => {
    const updated = devices.map((d) => {
      if (d.id !== deviceId) return d;
      const nextAway = !d.isAwayMode;
      return {
        ...d,
        isAwayMode: nextAway,
      };
    });
    saveDevices(updated);
  };

  const updateGroupSettings = (
    deviceId: string,
    settings: {
      telegramGroupId?: string | null;
      telegramGroupName?: string | null;
      groupFeedEnabled?: boolean;
      groupGuestFeedAllowed?: boolean;
    },
  ) => {
    const updated = devices.map((d) => (d.id === deviceId ? { ...d, ...settings } : d));
    saveDevices(updated);

    // Persist to backend BFF
    fetch(`http://localhost:3001/api/v1/devices/${deviceId}/group-settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-bff-source': 'NextJS-AppRouter',
      },
      body: JSON.stringify(settings),
    }).catch(() => {
      // Graceful fallback to local cache
    });
  };

  const activeDevice = devices.find((d) => d.id === activeDeviceId) || devices[0];

  return {
    devices,
    activeDevice,
    activeDeviceId,
    switchDevice,
    addDevice,
    removeDevice,
    toggleAwayMode,
    updateDevicePresets,
    updateDeviceTarget,
    updateDeviceNextScheduledFeedAt,
    recordDispense,
    updateGroupSettings,
  };
}
