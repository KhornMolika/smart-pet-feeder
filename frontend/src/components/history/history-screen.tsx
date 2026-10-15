'use client';

import React, { useState, useMemo } from 'react';
import { FeederDevice, FeedingEvent, FeedSource } from '@/types/feeder.types';
import { formatDateHeader, formatDateOnly } from '@/lib/utils/date.util';
import { Sparkles, Clock, Calendar, CalendarDays, Smartphone, Hand } from 'lucide-react';
import { useFeederContext } from '@/context/feeder-context';
import { TimeframeFilter } from '@/hooks/useDeviceHistory';

// Modular Components
import { HistorySummaryMetrics } from './history-summary-metrics';
import { HistoryTimeframeRibbon } from './history-timeframe-ribbon';
import { HistorySearchFilters } from './history-search-filters';
import { HistoryTimeline, DateGroup } from './history-timeline';
import { HistoryEventModal } from './history-event-modal';

interface HistoryScreenProps {
  devices?: FeederDevice[];
}

export function HistoryScreen(props: HistoryScreenProps = {}) {
  const context = useFeederContext();
  const devices = props.devices || context.devices;
  const {
    history,
    allHistory,
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
    clientNow,
    timeframeCounts,
    clearFilters,
    exportCsv,
  } = context;

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<FeedingEvent | null>(null);

  // Summary Metrics calculations
  const totalDurationMs = useMemo(() => {
    return history.reduce((acc, curr) => acc + curr.durationMs, 0);
  }, [history]);

  const sourceCounts = useMemo(() => {
    const counts = { scheduled: 0, manual_app: 0, physical_button: 0 };
    for (const item of history) {
      if (item.source in counts) {
        counts[item.source as keyof typeof counts]++;
      }
    }
    return counts;
  }, [history]);

  // Group events chronologically by calendar date
  const dateGroups: DateGroup[] = useMemo(() => {
    const groupMap = new Map<string, FeedingEvent[]>();

    for (const event of history) {
      const key = formatDateOnly(event.startedAt) || 'unknown';
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(event);
    }

    const sortedKeys = Array.from(groupMap.keys()).sort((a, b) => b.localeCompare(a));

    return sortedKeys.map((key) => {
      const events = groupMap.get(key)!;
      events.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

      const groupDuration = events.reduce((acc, curr) => acc + curr.durationMs, 0);
      const dateLabel = formatDateHeader(events[0]?.startedAt || key, clientNow);

      return {
        dateKey: key,
        dateLabel,
        events,
        totalDurationMs: groupDuration,
      };
    });
  }, [history, clientNow]);

  const hasActiveFilters =
    selectedSource !== 'all' ||
    selectedDeviceId !== 'all' ||
    searchQuery.trim() !== '' ||
    timeframe !== 'all' ||
    customStartDate !== null ||
    customEndDate !== null;

  const timeframeTabs: { id: TimeframeFilter; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Time', count: timeframeCounts.all, icon: <Sparkles size={12} /> },
    { id: 'today', label: 'Today', count: timeframeCounts.today, icon: <Clock size={12} /> },
    { id: 'this_week', label: 'This Week', count: timeframeCounts.this_week, icon: <CalendarDays size={12} /> },
    { id: 'this_month', label: 'This Month', count: timeframeCounts.this_month, icon: <Calendar size={12} /> },
  ];

  const sourceTabs: { id: FeedSource | 'all'; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <Sparkles size={11} /> },
    { id: 'scheduled', label: 'Schedule', icon: <Clock size={11} /> },
    { id: 'manual_app', label: 'App', icon: <Smartphone size={11} /> },
    { id: 'physical_button', label: 'Button', icon: <Hand size={11} /> },
  ];

  return (
    <div className="w-full flex flex-col gap-4 animate-fadeIn pb-8">
      {/* 1. Summary Metrics & Live Stats Card */}
      <HistorySummaryMetrics
        totalFeeds={history.length}
        totalDurationMs={totalDurationMs}
        timeframe={timeframe}
        sourceCounts={sourceCounts}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={() => {
          clearFilters();
          setShowDatePicker(false);
        }}
        onExportCsv={exportCsv}
      />

      {/* 2. Modern Timeframe & Date Filter Ribbon */}
      <HistoryTimeframeRibbon
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        timeframeTabs={timeframeTabs}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        setCustomStartDate={setCustomStartDate}
        setCustomEndDate={setCustomEndDate}
        setCustomDateRange={setCustomDateRange}
        historyCount={history.length}
      />

      {/* 3. Filters & Search Section */}
      <HistorySearchFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        setSelectedDeviceId={setSelectedDeviceId}
        allHistory={allHistory}
        history={history}
        selectedSource={selectedSource}
        setSelectedSource={setSelectedSource}
        sourceTabs={sourceTabs}
        sourceCounts={sourceCounts}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 4. Date-Grouped Feeding Activity Timeline */}
      <HistoryTimeline
        dateGroups={dateGroups}
        devices={devices}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={() => {
          clearFilters();
          setShowDatePicker(false);
        }}
        onSelectEvent={(event) => setSelectedEventForDetail(event)}
      />

      {/* 5. Event Detail Audit Modal */}
      <HistoryEventModal
        event={selectedEventForDetail}
        onClose={() => setSelectedEventForDetail(null)}
      />
    </div>
  );
}
