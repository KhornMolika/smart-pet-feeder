'use client';

import { useState } from 'react';
import { FeederDevice, PortionPreset } from '@/types/feeder.types';
import { INITIAL_DEVICES, DEFAULT_PORTION_PRESETS } from '@/lib/constants/feeder.constants';

const STORAGE_KEY_DEVICES = 'chinchum_fleet_devices';
const STORAGE_KEY_ACTIVE_ID = 'chinchum_active_device_id';

export function useFeederFleet() {
  const [devices, setDevices] = useState<FeederDevice[]>(() => {
    if (typeof window === 'undefined') return INITIAL_DEVICES;
    try {
      const storedDevices = localStorage.getItem(STORAGE_KEY_DEVICES);
      if (storedDevices) {
        const parsed = JSON.parse(storedDevices);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_DEVICES;
  });

  const [activeDeviceId, setActiveDeviceId] = useState<string>(() => {
    if (typeof window === 'undefined') return INITIAL_DEVICES[0].id;
    try {
      const storedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      if (storedActiveId) return storedActiveId;
    } catch {}
    return INITIAL_DEVICES[0].id;
  });

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

  const addDevice = (deviceData: { name: string; petName: string; petEmoji: string; room: string }) => {
    const newId = `feeder-esp32-${String(devices.length + 1).padStart(3, '0')}`;
    const newDevice: FeederDevice = {
      id: newId,
      name: deviceData.name,
      petName: deviceData.petName,
      petEmoji: deviceData.petEmoji || '🐾',
      room: deviceData.room,
      isOnline: true,
      rtcValid: true,
      wifiRssi: -60,
      lastSeenAt: new Date().toISOString(),
      hopperPercent: 100,
      todayMealsServed: 0,
      todayMealsTarget: 3,
      customPresets: DEFAULT_PORTION_PRESETS,
    };
    const updated = [...devices, newDevice];
    saveDevices(updated);
    switchDevice(newId);
    return newDevice;
  };

  const updateDevicePresets = (deviceId: string, presets: PortionPreset[]) => {
    const updated = devices.map((d) => (d.id === deviceId ? { ...d, customPresets: presets } : d));
    saveDevices(updated);
  };

  const activeDevice = devices.find((d) => d.id === activeDeviceId) || devices[0];

  return {
    devices,
    activeDevice,
    activeDeviceId,
    switchDevice,
    addDevice,
    updateDevicePresets,
  };
}
