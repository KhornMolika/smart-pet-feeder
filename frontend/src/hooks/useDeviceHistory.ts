'use client';

import { useState } from 'react';
import { FeedingEvent, FeedSource } from '@/types/feeder.types';
import { INITIAL_HISTORY } from '@/lib/constants/feeder.constants';

const STORAGE_KEY_HISTORY = 'chinchum_history';

export function useDeviceHistory() {
  const [history, setHistory] = useState<FeedingEvent[]>(() => {
    if (typeof window === 'undefined') return INITIAL_HISTORY;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_HISTORY;
  });
  const [selectedSource, setSelectedSource] = useState<FeedSource | 'all'>('all');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const saveHistory = (items: FeedingEvent[]) => {
    setHistory(items);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(items));
    } catch {}
  };

  const addHistoryEvent = (event: FeedingEvent) => {
    const updated = [event, ...history];
    saveHistory(updated);
  };

  // Filtered list
  const filteredHistory = history.filter((event) => {
    if (selectedSource !== 'all' && event.source !== selectedSource) return false;
    if (selectedDeviceId !== 'all' && event.deviceId !== selectedDeviceId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchDevice = event.deviceName.toLowerCase().includes(q);
      const matchNote = event.note?.toLowerCase().includes(q) || false;
      return matchDevice || matchNote;
    }
    return true;
  });

  const exportCsv = () => {
    if (typeof window === 'undefined') return;

    const headers = ['Timestamp', 'Device', 'Source', 'Status', 'Duration (ms)', 'Duration (s)', 'Note'];
    const rows = filteredHistory.map((item) => [
      `"${new Date(item.startedAt).toLocaleString()}"`,
      `"${item.deviceName}"`,
      `"${item.source}"`,
      `"${item.status}"`,
      item.durationMs,
      (item.durationMs / 1000).toFixed(1),
      `"${item.note || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `chinchem_feed_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    history: filteredHistory,
    allHistory: history,
    selectedSource,
    setSelectedSource,
    selectedDeviceId,
    setSelectedDeviceId,
    searchQuery,
    setSearchQuery,
    addHistoryEvent,
    exportCsv,
  };
}
