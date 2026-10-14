'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FeederDevice, FeedingEvent, PortionPreset, FeedSource } from '@/types/feeder.types';
import { useFeederFleet } from '@/hooks/useFeederFleet';
import { useDeviceHistory } from '@/hooks/useDeviceHistory';

interface FeederContextType {
  // Fleet & Active Device
  devices: FeederDevice[];
  activeDevice: FeederDevice;
  activeDeviceId: string;
  switchDevice: (id: string) => void;
  addDevice: (data: { name: string; petName: string; petEmoji: string; room: string }) => FeederDevice;
  updateDevicePresets: (deviceId: string, presets: PortionPreset[]) => void;

  // History & Logs
  history: FeedingEvent[];
  allHistory: FeedingEvent[];
  selectedSource: FeedSource | 'all';
  setSelectedSource: (source: FeedSource | 'all') => void;
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  addHistoryEvent: (event: FeedingEvent) => void;
  exportCsv: () => void;

  // Modals
  isAddDeviceOpen: boolean;
  setIsAddDeviceOpen: (open: boolean) => void;
}

const FeederContext = createContext<FeederContextType | null>(null);

export function FeederProvider({ children }: { children: ReactNode }) {
  const fleet = useFeederFleet();
  const historyHook = useDeviceHistory();
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);

  return (
    <FeederContext.Provider
      value={{
        ...fleet,
        ...historyHook,
        isAddDeviceOpen,
        setIsAddDeviceOpen,
      }}
    >
      {children}
    </FeederContext.Provider>
  );
}

export function useFeederContext() {
  const context = useContext(FeederContext);
  if (!context) {
    throw new Error('useFeederContext must be used within a FeederProvider');
  }
  return context;
}
