'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { FeedingEvent, FeedSource, ActuationStatus } from '@/types/feeder.types';
import { INITIAL_HISTORY } from '@/lib/constants/feeder.constants';
import { isSameDay, formatDateOnly } from '@/lib/utils/date.util';
import { getBackendApiUrl } from '@/lib/api-config';

const STORAGE_KEY_HISTORY = 'chinchum_history';

export type TimeframeFilter = 'all' | 'today' | 'this_week' | 'this_month' | 'custom';

export function useDeviceHistory() {
  const [history, setHistory] = useState<FeedingEvent[]>(INITIAL_HISTORY);
  const [selectedSource, setSelectedSource] = useState<FeedSource | 'all'>('all');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('all');
  const [customStartDate, setCustomStartDate] = useState<string | null>(null);
  const [customEndDate, setCustomEndDate] = useState<string | null>(null);
  const [clientNow, setClientNow] = useState<Date | null>(null);

  useEffect(() => {
    setClientNow(new Date());
    try {
      const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed);
        }
      }
    } catch {}
  }, []);

  const saveHistory = useCallback((items: FeedingEvent[]) => {
    setHistory(items);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(items));
    } catch {}
  }, []);

  // Fetch real feeding events from backend API (populated by ESP32 events & manual feeds)
  useEffect(() => {
    let isSubscribed = true;
    async function loadBackendHistory() {
      try {
        const backendUrl = getBackendApiUrl();
        const res = await fetch(`${backendUrl}/api/v1/devices/feeder_esp32_01/events?limit=50`, {
          headers: { 'x-bff-source': 'NextJS-AppRouter' },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && isSubscribed) {
            setHistory((prev) => {
              const mapped: FeedingEvent[] = data.map((evt: any) => {
                const dateObj = new Date(evt.startedAt || evt.completedAt || Date.now());
                const startedAtStr = evt.startedAt || dateObj.toISOString();
                let source: FeedSource = 'manual_app';
                if (evt.source === 'button' || evt.source === 'physical_button') {
                  source = 'physical_button';
                } else if (evt.source === 'schedule' || evt.source === 'scheduled') {
                  source = 'scheduled';
                }
                const status: ActuationStatus =
                  evt.status === 'completed' || evt.actuationCompleted ? 'completed' : 'failed';
                return {
                  id: evt.id || `evt-${evt.commandId || Date.now()}`,
                  deviceId: evt.deviceId || 'feeder_esp32_01',
                  deviceName: evt.deviceName || 'Feeder Device',
                  source,
                  status,
                  startedAt: startedAtStr,
                  completedAt: evt.completedAt,
                  durationMs: evt.durationMs || 1500,
                  note: evt.note || (source === 'physical_button' ? 'Physical button pressed on feeder' : 'Dispensed'),
                };
              });

              // Merge and deduplicate by id
              const existingIds = new Set(mapped.map((m) => m.id));
              const nonDuplicatedPrev = prev.filter((p) => !existingIds.has(p.id));
              const merged = [...mapped, ...nonDuplicatedPrev];
              saveHistory(merged);
              return merged;
            });
          }
        }
      } catch {
        // Fallback gracefully
      }
    }
    loadBackendHistory();
    return () => {
      isSubscribed = false;
    };
  }, [saveHistory]);

  const addHistoryEvent = useCallback((event: FeedingEvent) => {
    setHistory((prev) => {
      const updated = [event, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const setCustomDateRange = useCallback((start: string | null, end: string | null) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    if (start || end) {
      setTimeframe('custom');
    } else {
      setTimeframe('all');
    }
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedSource('all');
    setSelectedDeviceId('all');
    setSearchQuery('');
    setTimeframe('all');
    setCustomStartDate(null);
    setCustomEndDate(null);
  }, []);

  // Filtered list
  const filteredHistory = useMemo(() => {
    // If not yet hydrated on client (SSR / Next.js static prerender), avoid evaluating new Date()
    if (!clientNow) {
      return history.filter((event) => {
        if (selectedSource !== 'all' && event.source !== selectedSource) return false;
        if (selectedDeviceId !== 'all' && event.deviceId !== selectedDeviceId) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase().trim();
          const matchDevice = event.deviceName.toLowerCase().includes(q);
          const matchNote = event.note?.toLowerCase().includes(q) || false;
          const matchSource = event.source.toLowerCase().includes(q);
          if (!matchDevice && !matchNote && !matchSource) return false;
        }
        return true;
      });
    }

    const startOfToday = new Date(clientNow.getFullYear(), clientNow.getMonth(), clientNow.getDate());
    const endOfToday = new Date(clientNow.getFullYear(), clientNow.getMonth(), clientNow.getDate(), 23, 59, 59, 999);

    // Monday as start of this week
    const dayOfWeek = clientNow.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const startOfThisWeek = new Date(startOfToday);
    startOfThisWeek.setDate(startOfToday.getDate() - diffToMonday);

    // 1st of current calendar month
    const startOfThisMonth = new Date(clientNow.getFullYear(), clientNow.getMonth(), 1);

    return history.filter((event) => {
      // 1. Source filter
      if (selectedSource !== 'all' && event.source !== selectedSource) return false;

      // 2. Device filter
      if (selectedDeviceId !== 'all' && event.deviceId !== selectedDeviceId) return false;

      // 3. Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchDevice = event.deviceName.toLowerCase().includes(q);
        const matchNote = event.note?.toLowerCase().includes(q) || false;
        const matchSource = event.source.toLowerCase().includes(q);
        if (!matchDevice && !matchNote && !matchSource) return false;
      }

      // 4. Timeframe filter
      if (timeframe !== 'all') {
        const eventDate = new Date(event.startedAt);
        if (isNaN(eventDate.getTime())) return false;

        if (timeframe === 'today') {
          if (!isSameDay(eventDate, clientNow)) return false;
        } else if (timeframe === 'this_week') {
          if (eventDate < startOfThisWeek || eventDate > endOfToday) return false;
        } else if (timeframe === 'this_month') {
          if (eventDate < startOfThisMonth || eventDate > endOfToday) return false;
        } else if (timeframe === 'custom') {
          const eventDateStr = formatDateOnly(eventDate);
          if (customStartDate && customEndDate) {
            const minDate = customStartDate <= customEndDate ? customStartDate : customEndDate;
            const maxDate = customStartDate <= customEndDate ? customEndDate : customStartDate;
            if (eventDateStr < minDate || eventDateStr > maxDate) return false;
          } else if (customStartDate) {
            if (eventDateStr < customStartDate) return false;
          } else if (customEndDate) {
            if (eventDateStr > customEndDate) return false;
          }
        }
      }

      return true;
    });
  }, [history, selectedSource, selectedDeviceId, searchQuery, timeframe, customStartDate, customEndDate, clientNow]);

  // Dynamic counts for timeframe pills (conditioned on current device & source selection)
  const timeframeCounts = useMemo(() => {
    if (!clientNow) {
      return {
        all: history.length,
        today: 0,
        this_week: 0,
        this_month: 0,
      };
    }

    const startOfToday = new Date(clientNow.getFullYear(), clientNow.getMonth(), clientNow.getDate());
    const endOfToday = new Date(clientNow.getFullYear(), clientNow.getMonth(), clientNow.getDate(), 23, 59, 59, 999);
    const dayOfWeek = clientNow.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const startOfThisWeek = new Date(startOfToday);
    startOfThisWeek.setDate(startOfToday.getDate() - diffToMonday);
    const startOfThisMonth = new Date(clientNow.getFullYear(), clientNow.getMonth(), 1);

    const baseEvents = history.filter((event) => {
      if (selectedSource !== 'all' && event.source !== selectedSource) return false;
      if (selectedDeviceId !== 'all' && event.deviceId !== selectedDeviceId) return false;
      return true;
    });

    let todayCount = 0;
    let thisWeekCount = 0;
    let thisMonthCount = 0;

    for (const ev of baseEvents) {
      const d = new Date(ev.startedAt);
      if (isNaN(d.getTime())) continue;
      if (isSameDay(d, clientNow)) todayCount++;
      if (d >= startOfThisWeek && d <= endOfToday) thisWeekCount++;
      if (d >= startOfThisMonth && d <= endOfToday) thisMonthCount++;
    }

    return {
      all: baseEvents.length,
      today: todayCount,
      this_week: thisWeekCount,
      this_month: thisMonthCount,
    };
  }, [history, selectedSource, selectedDeviceId, clientNow]);

  const exportCsv = useCallback(() => {
    if (typeof window === 'undefined') return;

    const headers = ['Timestamp', 'Date', 'Time', 'Device', 'Source', 'Status', 'Duration (ms)', 'Duration (s)', 'Note'];
    const rows = filteredHistory.map((item) => {
      const d = new Date(item.startedAt);
      const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString('en-US') : '';
      const timeStr = !isNaN(d.getTime()) ? d.toLocaleTimeString('en-US') : '';
      return [
        `"${!isNaN(d.getTime()) ? d.toISOString() : item.startedAt}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${item.deviceName}"`,
        `"${item.source}"`,
        `"${item.status}"`,
        item.durationMs,
        (item.durationMs / 1000).toFixed(1),
        `"${item.note || ''}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const suffix =
      timeframe === 'custom'
        ? `${customStartDate || 'start'}_to_${customEndDate || 'end'}`
        : timeframe;
    link.setAttribute('download', `chinchem_feed_history_${suffix}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredHistory, timeframe, customStartDate, customEndDate]);

  const clearHistory = useCallback(() => {
    saveHistory([]);
  }, [saveHistory]);

  return {
    history: filteredHistory,
    allHistory: history,
    selectedSource,
    setSelectedSource,
    selectedDeviceId,
    setSelectedDeviceId,
    searchQuery,
    setSearchQuery,
    timeframe,
    setTimeframe,
    customStartDate,
    customEndDate,
    setCustomStartDate,
    setCustomEndDate,
    setCustomDateRange,
    customDate: customStartDate,
    setCustomDate: (date: string | null) => setCustomDateRange(date, date),
    clientNow,
    timeframeCounts,
    clearFilters,
    clearHistory,
    addHistoryEvent,
    exportCsv,
  };
}

