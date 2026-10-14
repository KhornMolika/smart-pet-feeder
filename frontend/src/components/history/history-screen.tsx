'use client';

import React from 'react';
import { FeederDevice, FeedSource } from '@/types/feeder.types';
import { formatDateTime } from '@/lib/utils/date.util';
import { triggerHaptic } from '@/lib/utils/telegram.util';
import { CheckCircle2, Download, Search, Smartphone, Clock, Hand, Sparkles } from 'lucide-react';
import { useFeederContext } from '@/context/feeder-context';

interface HistoryScreenProps {
  devices?: FeederDevice[];
}

export function HistoryScreen(props: HistoryScreenProps = {}) {
  const context = useFeederContext();
  const devices = props.devices || context.devices;
  const {
    history,
    selectedSource,
    setSelectedSource,
    selectedDeviceId,
    setSelectedDeviceId,
    searchQuery,
    setSearchQuery,
    exportCsv,
  } = context;

  const totalActuationSeconds = (history.reduce((acc, curr) => acc + curr.durationMs, 0) / 1000).toFixed(1);

  const filterTabs: { id: FeedSource | 'all'; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Feeds', icon: <Sparkles size={11} /> },
    { id: 'manual_app', label: 'App Dispense', icon: <Smartphone size={11} /> },
    { id: 'scheduled', label: 'Scheduled', icon: <Clock size={11} /> },
    { id: 'physical_button', label: 'Button', icon: <Hand size={11} /> },
  ];

  return (
    <div className="w-full flex flex-col gap-4 animate-fadeIn pb-6">
      {/* 1. Header & CSV Export */}
      <div className="artisan-card p-4 sm:p-5 flex flex-col gap-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-[#143503] truncate">Feeding History & Logs</h3>
            <p className="text-xs text-[#4B633E] truncate">Real-time motor actuation records</p>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              exportCsv();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#BCDBF0]/40 hover:bg-[#BCDBF0]/70 border border-[#143503]/10 text-[#143503] text-xs font-semibold transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <Download size={13} />
            <span>Export</span>
          </button>
        </div>

        {/* Quick Summary Metrics */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-1">
          <div className="p-3 rounded-2xl bg-[#FFF2E6]/50 border border-[#143503]/8 text-center min-w-0">
            <span className="text-xs text-[#4B633E] font-medium block truncate">Feeds</span>
            <span className="text-lg sm:text-xl font-bold text-[#143503] font-mono mt-0.5 block">{history.length}</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FFF2E6]/50 border border-[#143503]/8 text-center min-w-0">
            <span className="text-xs text-[#4B633E] font-medium block truncate">Actuation</span>
            <span className="text-lg sm:text-xl font-bold text-[#143503] font-mono mt-0.5 block">{totalActuationSeconds}s</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FFF2E6]/50 border border-[#143503]/8 text-center min-w-0">
            <span className="text-xs text-[#4B633E] font-medium block truncate">Success</span>
            <span className="text-lg sm:text-xl font-bold text-emerald-700 font-mono mt-0.5 block">100%</span>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="artisan-card p-4 sm:p-5 flex flex-col gap-3.5">
        <div className="text-xs font-bold uppercase tracking-wider text-[#4B633E]">
          Filters & Search
        </div>

        {/* Search Input */}
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3.5 text-[#4B633E]/70 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs or notes..."
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#143503]/10 bg-[#FFF2E6]/50 text-xs sm:text-sm text-[#143503] font-medium outline-none focus:border-[#143503]/25 transition-all"
          />
        </div>

        {/* Device Filter Dropdown */}
        <div className="space-y-1">
          <label className="text-xs text-[#4B633E] font-semibold block">Feeder Device</label>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-[#143503]/10 bg-[#FFF2E6]/50 text-xs sm:text-sm font-semibold text-[#143503] outline-none cursor-pointer"
          >
            <option value="all">All Devices</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.petName} ({d.room})
              </option>
            ))}
          </select>
        </div>

        {/* Source Filter Chips */}
        <div className="space-y-1.5">
          <label className="text-xs text-[#4B633E] font-semibold block">Feed Trigger Source</label>
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => {
              const isSelected = selectedSource === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedSource(tab.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-[#143503] text-[#FFF2E6] shadow-xs'
                      : 'bg-[#FFF2E6]/50 text-[#4B633E] hover:bg-[#FFF2E6] border border-[#143503]/8'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Event List (Single Column Stack) */}
      <div className="flex flex-col gap-2.5">
        {history.length === 0 ? (
          <div className="artisan-card p-6 text-center text-xs sm:text-sm text-[#4B633E] font-medium">
            No feeding logs match your current filter.
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className="artisan-card p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-xs hover:border-[#143503]/20 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#A7D1AE]/30 text-[#143503] flex items-center justify-center shrink-0 border border-[#143503]/10">
                  <CheckCircle2 size={16} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-[#143503] truncate">{item.deviceName}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#BCDBF0]/40 text-[#143503] border border-[#143503]/8">
                      {item.source === 'manual_app'
                        ? 'App'
                        : item.source === 'scheduled'
                        ? 'Schedule'
                        : 'Button'}
                    </span>
                  </div>

                  <div className="text-xs text-[#4B633E] font-medium mt-0.5 truncate">
                    {formatDateTime(item.startedAt)}
                  </div>
                  {item.note && (
                    <div className="text-xs text-[#4B633E]/75 font-normal italic truncate mt-0.5">
                      {item.note}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-sm sm:text-base font-bold font-mono text-[#143503]">
                  {(item.durationMs / 1000).toFixed(1)}s
                </div>
                <div className="text-xs font-mono text-[#4B633E]">
                  {item.durationMs}ms open
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
