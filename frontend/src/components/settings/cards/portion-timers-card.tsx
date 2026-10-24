'use client';

import React from 'react';
import { PresetIcon } from '@/components/common/pet-icon';
import { formatDuration } from '@/lib/utils/date.util';
import { Sliders, Save, CheckCircle2 } from 'lucide-react';

interface PortionTimersCardProps {
  petName: string;
  snackMs: number;
  bowlMs: number;
  feastMs: number;
  setSnackMs: (val: number) => void;
  setBowlMs: (val: number) => void;
  setFeastMs: (val: number) => void;
  onSavePresets: () => void;
  presetsSavedToast: boolean;
}

export function PortionTimersCard({
  petName,
  snackMs,
  bowlMs,
  feastMs,
  setSnackMs,
  setBowlMs,
  setFeastMs,
  onSavePresets,
  presetsSavedToast,
}: PortionTimersCardProps) {
  return (
    <div className="artisan-card p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sliders size={16} className="text-[#143503] shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-[#143503] truncate">Portion Timers</h3>
            <p className="text-xs text-[#4B633E] truncate">Presets for {petName}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSavePresets}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#143503] text-[#FFF2E6] text-xs font-semibold shadow-xs hover:opacity-95 transition-all shrink-0 cursor-pointer"
        >
          <Save size={13} />
          <span>Save</span>
        </button>
      </div>

      {presetsSavedToast && (
        <div className="p-3 rounded-xl bg-[#A7D1AE]/40 border border-[#143503]/20 text-[#143503] text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={14} />
          <span>Timers updated for {petName}!</span>
        </div>
      )}

      {/* Timer 1: Light Snack */}
      <div className="p-3.5 rounded-xl bg-[#FFF2E6]/50 border border-[#143503]/8 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-[#143503] flex items-center gap-1.5">
            <PresetIcon icon="snack" size={15} className="text-[#143503]" /> <span>Light Snack</span>
          </span>
          <span className="font-mono font-bold text-[#143503] text-xs" suppressHydrationWarning>
            {formatDuration(snackMs)}{' '}
            <span className="text-xs text-[#4B633E] font-normal" suppressHydrationWarning>
              ({Math.round(snackMs / 1000)}s)
            </span>
          </span>
        </div>
        <input
          type="range"
          min={5000}
          max={180000}
          step={5000}
          value={snackMs}
          onChange={(e) => setSnackMs(parseInt(e.target.value, 10))}
          className="w-full h-2 cursor-pointer"
        />
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[10000, 15000, 20000, 30000].map((ms) => (
              <button
                key={ms}
                type="button"
                onClick={() => setSnackMs(ms)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  snackMs === ms ? 'bg-[#143503] text-[#FFF2E6]' : 'bg-[#143503]/8 text-[#143503] hover:bg-[#143503]/15'
                }`}
              >
                {formatDuration(ms)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#4B633E] shrink-0">
            <span>Set:</span>
            <input
              type="number"
              min={5}
              max={180}
              value={Math.round(snackMs / 1000)}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) setSnackMs(Math.max(5000, Math.min(180000, val * 1000)));
              }}
              className="w-12 px-1 py-0.5 text-center font-mono font-bold text-xs bg-white border border-[#143503]/15 rounded text-[#143503]"
            />
            <span>s</span>
          </div>
        </div>
      </div>

      {/* Timer 2: Regular Bowl */}
      <div className="p-3.5 rounded-xl bg-[#FFF2E6]/50 border border-[#143503]/8 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-[#143503] flex items-center gap-1.5">
            <PresetIcon icon="bowl" size={15} className="text-[#143503]" /> <span>Regular Bowl</span>
          </span>
          <span className="font-mono font-bold text-[#143503] text-xs" suppressHydrationWarning>
            {formatDuration(bowlMs)}{' '}
            <span className="text-xs text-[#4B633E] font-normal" suppressHydrationWarning>
              ({Math.round(bowlMs / 1000)}s)
            </span>
          </span>
        </div>
        <input
          type="range"
          min={10000}
          max={180000}
          step={5000}
          value={bowlMs}
          onChange={(e) => setBowlMs(parseInt(e.target.value, 10))}
          className="w-full h-2 cursor-pointer"
        />
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[20000, 25000, 30000, 45000].map((ms) => (
              <button
                key={ms}
                type="button"
                onClick={() => setBowlMs(ms)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  bowlMs === ms ? 'bg-[#143503] text-[#FFF2E6]' : 'bg-[#143503]/8 text-[#143503] hover:bg-[#143503]/15'
                }`}
              >
                {formatDuration(ms)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#4B633E] shrink-0">
            <span>Set:</span>
            <input
              type="number"
              min={10}
              max={180}
              value={Math.round(bowlMs / 1000)}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) setBowlMs(Math.max(10000, Math.min(180000, val * 1000)));
              }}
              className="w-12 px-1 py-0.5 text-center font-mono font-bold text-xs bg-white border border-[#143503]/15 rounded text-[#143503]"
            />
            <span>s</span>
          </div>
        </div>
      </div>

      {/* Timer 3: Royal Feast */}
      <div className="p-3.5 rounded-xl bg-[#FFF2E6]/50 border border-[#143503]/8 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-[#143503] flex items-center gap-1.5">
            <PresetIcon icon="feast" size={15} className="text-[#143503]" /> <span>Royal Feast</span>
          </span>
          <span className="font-mono font-bold text-[#143503] text-xs" suppressHydrationWarning>
            {formatDuration(feastMs)}{' '}
            <span className="text-xs text-[#4B633E] font-normal" suppressHydrationWarning>
              ({Math.round(feastMs / 1000)}s)
            </span>
          </span>
        </div>
        <input
          type="range"
          min={15000}
          max={180000}
          step={5000}
          value={feastMs}
          onChange={(e) => setFeastMs(parseInt(e.target.value, 10))}
          className="w-full h-2 cursor-pointer"
        />
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[30000, 40000, 45000, 60000].map((ms) => (
              <button
                key={ms}
                type="button"
                onClick={() => setFeastMs(ms)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  feastMs === ms ? 'bg-[#143503] text-[#FFF2E6]' : 'bg-[#143503]/8 text-[#143503] hover:bg-[#143503]/15'
                }`}
              >
                {formatDuration(ms)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#4B633E] shrink-0">
            <span>Set:</span>
            <input
              type="number"
              min={15}
              max={180}
              value={Math.round(feastMs / 1000)}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) setFeastMs(Math.max(15000, Math.min(180000, val * 1000)));
              }}
              className="w-12 px-1 py-0.5 text-center font-mono font-bold text-xs bg-white border border-[#143503]/15 rounded text-[#143503]"
            />
            <span>s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
