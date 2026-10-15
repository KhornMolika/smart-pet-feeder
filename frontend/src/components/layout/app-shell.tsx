'use client';

import React, { useState, useEffect } from 'react';
import { useFeederContext } from '@/context/feeder-context';
import { Header } from '@/components/common/header';
import { BottomNav } from '@/components/common/bottom-nav';
import { AddDeviceModal } from '@/components/devices/add-device-modal';
import { getTelegramWebApp, getTelegramStartParam, triggerNotificationHaptic } from '@/lib/utils/telegram.util';

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    devices,
    activeDevice,
    switchDevice,
    addDevice,
    isAddDeviceOpen,
    setIsAddDeviceOpen,
  } = useFeederContext();

  const [claimToken, setClaimToken] = useState<string | null>(null);

  // Expand Telegram WebApp to full height on mount if inside Telegram
  useEffect(() => {
    const tg = getTelegramWebApp();
    if (tg) {
      try {
        tg.ready?.();
        tg.expand?.();
      } catch {
        // Fallback gracefully outside Telegram
      }
    }
  }, []);

  // Detect Telegram Deep Link (QR Claim or Family Member Join)
  useEffect(() => {
    const startParam = getTelegramStartParam();
    if (!startParam) return;

    if (startParam.startsWith('claim_')) {
      setClaimToken(startParam);
      setIsAddDeviceOpen(true);
      triggerNotificationHaptic('success');
    } else if (startParam.startsWith('join_')) {
      // Auto-join shared feeder via invitation token
      fetch('http://localhost:3001/api/v1/devices/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bff-source': 'NextJS-AppRouter',
        },
        body: JSON.stringify({ inviteToken: startParam }),
      })
        .then((r) => r.json())
        .then((member) => {
          if (member?.deviceId) {
            switchDevice(member.deviceId);
            triggerNotificationHaptic('success');
          }
        })
        .catch(() => {});
    }
  }, [setIsAddDeviceOpen, switchDevice]);

  return (
    <div className="w-full min-h-screen min-h-[100dvh] flex flex-col items-center bg-[#FFF2E6] text-[#143503] selection:bg-[#A7D1AE] selection:text-[#143503]">
      <div className="w-full max-w-md flex flex-col flex-1 px-4 sm:px-5 pt-3 pb-28 gap-3.5 relative">
        {/* Header with App Logo ចិញ្ចឹម and Device Fleet Switcher */}
        <Header
          devices={devices}
          activeDevice={activeDevice}
          onSelectDevice={switchDevice}
          onOpenAddDevice={() => {
            setClaimToken(null);
            setIsAddDeviceOpen(true);
          }}
        />

        {/* Main Screen Content rendered by Next.js App Router */}
        <main className="flex-1 w-full flex flex-col">{children}</main>

        {/* Scroll clearance spacer so fixed bottom navigation never obscures content */}
        <div className="w-full h-12 shrink-0 pointer-events-none" aria-hidden="true" />

        {/* Floating Bottom Navigation with Next.js App Router Link & usePathname */}
        <BottomNav />

        {/* Modal to Pair / Claim New Device */}
        <AddDeviceModal
          isOpen={isAddDeviceOpen}
          onClose={() => {
            setIsAddDeviceOpen(false);
            setClaimToken(null);
          }}
          claimToken={claimToken}
          onAddDevice={(data) => addDevice(data)}
        />
      </div>
    </div>
  );
}
