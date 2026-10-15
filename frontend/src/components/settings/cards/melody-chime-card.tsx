'use client';

import React from 'react';
import { NotificationAlertConfig, triggerHaptic } from '@/lib/utils/telegram.util';
import { SoundToneDefinition } from '@/lib/utils/audio.util';
import { Volume2, Zap, Music } from 'lucide-react';

interface MelodyChimeCardProps {
  notifConfig: NotificationAlertConfig;
  currentTonePreset: SoundToneDefinition;
  onUpdateNotifConfig: (partial: Partial<NotificationAlertConfig>) => void;
  onOpenToneModal: () => void;
  onTestCall: () => void;
}

export function MelodyChimeCard({
  notifConfig,
  currentTonePreset,
  onUpdateNotifConfig,
  onOpenToneModal,
  onTestCall,
}: MelodyChimeCardProps) {
  return (
    <div className="artisan-card p-4 sm:p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#A7D1AE]/40 text-[#143503] flex items-center justify-center shrink-0 border border-[#143503]/10">
            <Volume2 size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-[#143503] truncate">Pet Meal Melody Chime</h3>
            <p className="text-xs text-[#4B633E] truncate">Hardware buzzer tones when dispensing food</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onUpdateNotifConfig({ soundChimeEnabled: !notifConfig.soundChimeEnabled })}
          className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
            notifConfig.soundChimeEnabled ? 'bg-[#143503]' : 'bg-[#143503]/20'
          }`}
          title={notifConfig.soundChimeEnabled ? 'Disable pet meal chime' : 'Enable pet meal chime'}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
              notifConfig.soundChimeEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Selected Melody Tone Display & Test / Customize Buttons */}
      {notifConfig.soundChimeEnabled && (
        <div className="pt-2.5 border-t border-[#143503]/10 space-y-2 animate-fadeIn">
          <div className="p-3 rounded-2xl bg-white/90 border border-[#143503]/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-[#143503]">
                  {currentTonePreset.name}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#A7D1AE]/45 text-[#143503] border border-[#143503]/20">
                  {currentTonePreset.badge.split('•')[0].trim()}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFF2E6] text-[#143503] border border-[#143503]/15 flex items-center gap-1">
                  <Zap size={10} className="text-amber-600" />
                  <span>{notifConfig.soundTiming === 'before' ? '⚡ 1.5s Before Drop' : '🥣 After Drop'}</span>
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#BCDBF0]/40 text-[#143503] border border-[#143503]/15">
                  {notifConfig.soundRepeatCount || 2}x Call
                </span>
              </div>
              <p className="text-[11px] text-[#4B633E] font-mono truncate">
                {currentTonePreset.notesSummary} • {currentTonePreset.frequencies}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={onTestCall}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#143503]/20 text-[#143503] text-xs font-bold hover:bg-[#143503]/5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="Test active call melody"
              >
                <Volume2 size={13} />
                <span>Test Call</span>
              </button>
              <button
                type="button"
                onClick={onOpenToneModal}
                className="px-3 py-1.5 rounded-xl bg-[#143503] hover:bg-[#245308] text-[#FFF2E6] text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                title="Customize tone melody, timing, and repeats"
              >
                <Music size={12} />
                <span>Customize Melody</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
