'use client';

import { useState, useEffect, useCallback } from 'react';
import { DeviceMember } from '@/types/feeder.types';
import { getBackendApiUrl } from '@/lib/api-config';

const STORAGE_KEY_MEMBERS_PREFIX = 'chinchum_device_members_';

const DEFAULT_MEMBERS: DeviceMember[] = [
  {
    id: 'member_owner_alex',
    deviceId: 'feeder_esp32_01',
    userId: 'owner_bff_user',
    userName: 'Alex (You)',
    role: 'owner',
    avatarEmoji: '👑',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'member_family_sarah',
    deviceId: 'feeder_esp32_01',
    userId: 'family_sarah',
    userName: 'Sarah',
    role: 'family',
    avatarEmoji: '👤',
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
];

export function useDeviceMembers(deviceId: string) {
  const [members, setMembers] = useState<DeviceMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load members from backend or localStorage cache
  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${getBackendApiUrl()}/api/v1/devices/${deviceId}/members`, {
        headers: { 'x-bff-source': 'NextJS-AppRouter' },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setMembers(data);
          try {
            localStorage.setItem(`${STORAGE_KEY_MEMBERS_PREFIX}${deviceId}`, JSON.stringify(data));
          } catch {}
          setIsLoading(false);
          return;
        }
      }
    } catch {}

    // Fallback to localStorage or default seed
    try {
      const cached = localStorage.getItem(`${STORAGE_KEY_MEMBERS_PREFIX}${deviceId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMembers(parsed);
          setIsLoading(false);
          return;
        }
      }
    } catch {}

    const seeded = DEFAULT_MEMBERS.map((m) => ({ ...m, deviceId }));
    setMembers(seeded);
    setIsLoading(false);
  }, [deviceId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Create an invitation link & token
  const createInvite = async (role: 'family' | 'guest') => {
    try {
      const res = await fetch(`${getBackendApiUrl()}/api/v1/devices/${deviceId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bff-source': 'NextJS-AppRouter',
        },
        body: JSON.stringify({ role }),
      });

      if (res.ok) {
        return await res.json();
      }
    } catch {}

    // Fallback if offline
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const inviteToken = `join_${deviceId}_${role}_${randomSuffix}`;
    return {
      success: true,
      deviceId,
      role,
      inviteToken,
      inviteUrl: `https://t.me/ChinChemBot/app?startapp=${inviteToken}`,
      expiresIn: '7 days',
    };
  };

  // Remove member from device
  const removeMember = async (memberId: string) => {
    const updated = members.filter((m) => m.id !== memberId);
    setMembers(updated);
    try {
      localStorage.setItem(`${STORAGE_KEY_MEMBERS_PREFIX}${deviceId}`, JSON.stringify(updated));
    } catch {}

    try {
      await fetch(`${getBackendApiUrl()}/api/v1/devices/${deviceId}/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'x-bff-source': 'NextJS-AppRouter' },
      });
    } catch {}
  };

  return {
    members,
    isLoading,
    createInvite,
    removeMember,
    refreshMembers: loadMembers,
  };
}
