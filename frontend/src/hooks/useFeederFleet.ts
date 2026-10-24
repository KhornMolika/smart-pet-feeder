'use client';

import { useState, useEffect, useCallback } from 'react';
import { FeederDevice, PortionPreset } from '@/types/feeder.types';
import { INITIAL_DEVICES, DEMO_DEVICES, DEFAULT_PORTION_PRESETS } from '@/lib/constants/feeder.constants';

import { getBackendApiUrl } from '@/lib/api-config';
import { getTelegramAuthHeaders } from '@/lib/utils/telegram.util';
import { isSameDeviceId } from '@/lib/utils/device.util';

const STORAGE_KEY_DEVICES = 'chinchum_fleet_devices';
const STORAGE_KEY_ACTIVE_ID = 'chinchum_active_device_id';

export function useFeederFleet() {
  const [devices, setDevices] = useState<FeederDevice[]>(INITIAL_DEVICES);
  const [activeDeviceId, setActiveDeviceId] = useState<string>('');

  // Sync saved fleet data from localStorage after client hydration to prevent SSR mismatch
  useEffect(() => {
    try {
      const storedDevices = localStorage.getItem(STORAGE_KEY_DEVICES);
      if (storedDevices) {
        const parsed = JSON.parse(storedDevices);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Deduplicate fleet: Keep only 1 unique device per claimToken or normalized ID/petName
          const seenKeys = new Set<string>();
          const deduped: FeederDevice[] = [];

          for (const d of parsed) {
            // Priority 1: Hardware Claim Token
            const tokenKey = d.claimToken
              ? d.claimToken.replace(/^claim_/, '').toLowerCase()
              : null;
            // Priority 2: Device ID
            const idKey = d.id ? d.id.toLowerCase() : null;
            // Priority 3: Fallback combination of Pet Name + Room
            const fallbackKey = `${(d.petName || 'mochi').toLowerCase().trim()}_${(d.room || 'living room').toLowerCase().trim()}`;

            const primaryKey = tokenKey || idKey || fallbackKey;

            if (seenKeys.has(primaryKey)) {
              continue; // Prune redundant duplicate
            }
            seenKeys.add(primaryKey);
            deduped.push(d);
          }

          const finalDevices = deduped.length > 0 ? deduped : parsed;
          setDevices(finalDevices);

          // If duplicates were pruned, update localStorage immediately to keep storage clean
          if (finalDevices.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(finalDevices));
          }

          const storedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
          if (storedActiveId && finalDevices.some((d: FeederDevice) => d.id === storedActiveId)) {
            setActiveDeviceId(storedActiveId);
          } else {
            setActiveDeviceId(finalDevices[0].id);
          }
          return;
        }
      }
    } catch {}
  }, []);

  // Synchronize user device fleet from backend via Telegram User authentication
  useEffect(() => {
    let isSubscribed = true;
    async function syncBackendDevices() {
      try {
        const backendUrl = getBackendApiUrl();
        const headers = getTelegramAuthHeaders();
        const res = await fetch(`${backendUrl}/api/v1/devices`, { headers });
        if (res.ok) {
          const backendList = await res.json();
          if (Array.isArray(backendList) && backendList.length > 0 && isSubscribed) {
            setDevices((currentLocalDevices) => {
              // Convert backend records into FeederDevice
              const mappedBackend: FeederDevice[] = backendList.map((d: any) => ({
                id: d.id,
                name: d.name || `${d.petName || 'Mochi'}'s Feeder`,
                petName: d.petName || 'Mochi',
                petEmoji: d.petEmoji || 'cat',
                petIcon: d.petEmoji || 'cat',
                room: d.room || 'Living Room',
                isOnline: d.isOnline ?? true,
                rtcValid: true,
                wifiRssi: -60,
                lastSeenAt: d.lastSeenAt || new Date().toISOString(),
                claimToken: d.claimToken,
                telegramGroupId: d.telegramGroupId,
                telegramGroupName: d.telegramGroupName,
                groupFeedEnabled: d.groupFeedEnabled,
                groupGuestFeedAllowed: d.groupGuestFeedAllowed,
                todayMealsServed: 0,
                customPresets: DEFAULT_PORTION_PRESETS,
              }));

              // Merge: backend is authoritative for device list and pet properties
              const mergedMap = new Map<string, FeederDevice>();

              for (const bd of mappedBackend) {
                const existing = currentLocalDevices.find((ld) => isSameDeviceId(ld.id, bd.id));
                if (existing) {
                  mergedMap.set(bd.id, {
                    ...existing,
                    ...bd,
                    customPresets: existing.customPresets || bd.customPresets,
                    isAwayMode: existing.isAwayMode,
                  });
                } else {
                  mergedMap.set(bd.id, bd);
                }
              }

              // Preserve any active local claimed devices if not returned yet
              for (const ld of currentLocalDevices) {
                if (!Array.from(mergedMap.keys()).some((k) => isSameDeviceId(k, ld.id))) {
                  if (ld.claimToken) {
                    mergedMap.set(ld.id, ld);
                  }
                }
              }

              const mergedList = Array.from(mergedMap.values());
              try {
                localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(mergedList));
              } catch {}

              setActiveDeviceId((prevActive) => {
                if (!prevActive || !mergedList.some((d) => isSameDeviceId(d.id, prevActive))) {
                  const newActive = mergedList[0]?.id || '';
                  try {
                    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, newActive);
                  } catch {}
                  return newActive;
                }
                return prevActive;
              });

              return mergedList;
            });
          }
        }
      } catch {
        // Fallback gracefully to offline cache
      }
    }

    syncBackendDevices();
    const interval = setInterval(() => {
      if (isSubscribed) syncBackendDevices();
    }, 4000);

    const handleFocus = () => {
      if (isSubscribed) syncBackendDevices();
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  // Save changes to localStorage
  const saveDevices = useCallback((newDevices: FeederDevice[]) => {
    setDevices(newDevices);
    try {
      localStorage.setItem(STORAGE_KEY_DEVICES, JSON.stringify(newDevices));
    } catch {}
  }, []);

  const switchDevice = useCallback((id: string) => {
    setActiveDeviceId(id);
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
    } catch {}
  }, []);

  const loadDemoData = () => {
    saveDevices(DEMO_DEVICES);
    if (DEMO_DEVICES.length > 0) {
      switchDevice(DEMO_DEVICES[0].id);
    }
  };

  const resetFleet = () => {
    setDevices([]);
    setActiveDeviceId('');
    try {
      localStorage.removeItem(STORAGE_KEY_DEVICES);
      localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
      localStorage.removeItem('chinchum_schedules');
      localStorage.removeItem('chinchum_history');
    } catch {}
  };

  const addDevice = (deviceData: {
    name: string;
    petName: string;
    petEmoji: string;
    room: string;
    claimToken?: string;
  }) => {
    // Generate deterministic canonical ID based on hardware/claim token
    const rawToken = deviceData.claimToken?.replace(/^claim_/, '').trim() || '';
    const cleanTokenSuffix = rawToken
      ? rawToken.replace(/^feeder[-_]/, '').toLowerCase()
      : '';
    const newId = cleanTokenSuffix
      ? `feeder-esp32-${cleanTokenSuffix}`
      : `feeder-esp32-${String(devices.length + 1).padStart(3, '0')}`;

    // Normalize matching keys to detect if this device is already in fleet
    const normalizedClaimToken = deviceData.claimToken
      ? deviceData.claimToken.replace(/^claim_/, '').toLowerCase()
      : null;

    // Check if this physical ESP32 or claim token is ALREADY in the user's fleet
    const existingIndex = devices.findIndex((d) => {
      // 1. Direct ID match
      if (d.id === newId) return true;

      // 2. Claim token match
      if (normalizedClaimToken && d.claimToken) {
        const dToken = d.claimToken.replace(/^claim_/, '').toLowerCase();
        if (dToken === normalizedClaimToken) return true;
      }

      // 3. ID matches claim token or vice-versa
      if (normalizedClaimToken && d.id.toLowerCase().includes(normalizedClaimToken)) {
        return true;
      }

      // 4. Fallback: Same pet name and same room
      if (
        deviceData.petName &&
        d.petName.toLowerCase().trim() === deviceData.petName.toLowerCase().trim() &&
        d.room.toLowerCase().trim() === (deviceData.room || 'Living Room').toLowerCase().trim()
      ) {
        return true;
      }

      return false;
    });

    if (existingIndex >= 0) {
      // Feeder already exists in fleet! Update existing device without adding redundant duplicate
      const existing = devices[existingIndex];
      const updatedDevice: FeederDevice = {
        ...existing,
        name: deviceData.name || existing.name,
        petName: deviceData.petName || existing.petName,
        petEmoji: deviceData.petEmoji || existing.petEmoji,
        petIcon: deviceData.petEmoji || existing.petIcon,
        room: deviceData.room || existing.room,
        isOnline: true,
        lastSeenAt: new Date().toISOString(),
        claimToken: deviceData.claimToken || existing.claimToken,
      };

      const updated = [...devices];
      updated[existingIndex] = updatedDevice;
      saveDevices(updated);
      switchDevice(existing.id);

      // Call backend claim endpoint to ensure backend ownership sync
      if (deviceData.claimToken) {
        fetch(`${getBackendApiUrl()}/api/v1/devices/claim`, {
          method: 'POST',
          headers: getTelegramAuthHeaders(),
          body: JSON.stringify({
            claimToken: deviceData.claimToken,
            petName: deviceData.petName,
            petEmoji: deviceData.petEmoji,
            room: deviceData.room,
          }),
        }).catch(() => {});
      }

      return updatedDevice;
    }

    // New unique hardware device
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
      fetch(`${getBackendApiUrl()}/api/v1/devices/claim`, {
        method: 'POST',
        headers: getTelegramAuthHeaders(),
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
    const remaining = devices.filter((d) => d.id !== deviceId);
    saveDevices(remaining);

    // If currently active device was removed, switch to the first remaining device or empty
    if (activeDeviceId === deviceId) {
      if (remaining.length > 0) {
        switchDevice(remaining[0].id);
      } else {
        setActiveDeviceId('');
        try {
          localStorage.removeItem(STORAGE_KEY_ACTIVE_ID);
        } catch {}
      }
    }

    // Clean up associated schedules from localStorage
    try {
      const storedSchedules = localStorage.getItem('chinchum_schedules');
      if (storedSchedules) {
        const parsed = JSON.parse(storedSchedules);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((s: { deviceId: string }) => !isSameDeviceId(s.deviceId, deviceId));
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
    fetch(`${getBackendApiUrl()}/api/v1/devices/${deviceId}/group-settings`, {
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

  const activeDevice = devices.find((d) => d.id === activeDeviceId) || devices[0] || null;

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
    loadDemoData,
    resetFleet,
  };
}
