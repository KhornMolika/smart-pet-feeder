'use client';

import { useState, useEffect, useCallback } from 'react';
import { DeviceMember } from '@/types/feeder.types';
import { getBackendApiUrl } from '@/lib/api-config';
import { getTelegramUser, getTelegramAuthHeaders } from '@/lib/utils/telegram.util';

const STORAGE_KEY_MEMBERS_PREFIX = 'chinchum_device_members_';

export function useDeviceMembers(deviceId: string) {
  const [members, setMembers] = useState<DeviceMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load members from backend or localStorage cache
  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    const tgUser = getTelegramUser();
    const currentOwnerName = tgUser?.displayName ? `${tgUser.displayName} (You)` : 'Owner (You)';

    try {
      const res = await fetch(`${getBackendApiUrl()}/api/v1/devices/${deviceId}/members`, {
        headers: getTelegramAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Normalize owner display name to the authenticated Telegram user
          const normalized = data.map((m: DeviceMember) =>
            m.role === 'owner' ? { ...m, userName: currentOwnerName } : m
          );
          setMembers(normalized);
          try {
            localStorage.setItem(`${STORAGE_KEY_MEMBERS_PREFIX}${deviceId}`, JSON.stringify(normalized));
          } catch {}
          setIsLoading(false);
          return;
        }
      }
    } catch {}

    // Fallback to localStorage or real Telegram user default
    try {
      const cached = localStorage.getItem(`${STORAGE_KEY_MEMBERS_PREFIX}${deviceId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Replace legacy hardcoded 'Alex (You)' with real Telegram user
          const normalized = parsed
            .filter((m: DeviceMember) => m.id !== 'member_family_sarah')
            .map((m: DeviceMember) =>
              m.role === 'owner' ? { ...m, userName: currentOwnerName } : m
            );
          setMembers(normalized);
          setIsLoading(false);
          return;
        }
      }
    } catch {}

    // Clean initial state: Authenticated user is the primary owner
    const defaultOwner: DeviceMember = {
      id: `member_owner_${tgUser?.id || 'primary'}`,
      deviceId,
      userId: tgUser?.id ? `tg_${tgUser.id}` : 'owner_user',
      userName: currentOwnerName,
      role: 'owner',
      avatarEmoji: '👑',
      createdAt: new Date().toISOString(),
    };

    setMembers([defaultOwner]);
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
