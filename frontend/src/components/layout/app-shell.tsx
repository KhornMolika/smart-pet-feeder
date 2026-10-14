'use client';

import React, { useEffect } from 'react';
import { useFeederContext } from '@/context/feeder-context';
import { Header } from '@/components/common/header';
import { BottomNav } from '@/components/common/bottom-nav';
import { AddDeviceModal } from '@/components/devices/add-device-modal';
import { getTelegramWebApp } from '@/lib/utils/telegram.util';

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    devices,
    activeDevice,
    switchDevice,
    addDevice,
    isAddDeviceOpen,
    setIsAddDeviceOpen,
  } = useFeederContext();

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

  return (
    <div className="w-full min-h-screen min-h-[100dvh] flex flex-col items-center bg-[#FFF2E6] text-[#143503] selection:bg-[#A7D1AE] selection:text-[#143503]">
      <div className="w-full max-w-md flex flex-col flex-1 px-4 pt-3 pb-28 relative">
        {/* Header with App Logo ចិញ្ចឹម and Device Fleet Switcher */}
        <Header
          devices={devices}
          activeDevice={activeDevice}
          onSelectDevice={switchDevice}
          onOpenAddDevice={() => setIsAddDeviceOpen(true)}
        />

        {/* Main Screen Content rendered by Next.js App Router */}
        <main className="flex-1 w-full flex flex-col mt-3">{children}</main>

        {/* Floating Bottom Navigation with Next.js App Router Link & usePathname */}
        <BottomNav />

        {/* Modal to Pair / Add New Device */}
        <AddDeviceModal
          isOpen={isAddDeviceOpen}
          onClose={() => setIsAddDeviceOpen(false)}
          onAddDevice={(data) => addDevice(data)}
        />
      </div>
    </div>
  );
}
