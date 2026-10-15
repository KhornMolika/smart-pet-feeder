'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BuzzerToneType, SOUND_TONE_PRESETS, getToneDuration, playToneSound } from '@/lib/utils/audio.util';
import { triggerHaptic } from '@/lib/utils/telegram.util';
import { Music, X, Check, Volume2 } from 'lucide-react';

interface MelodyPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  petName: string;
  initialToneId: BuzzerToneType;
  initialTiming: 'before' | 'after';
  initialRepeats: 1 | 2 | 3;
  onApply: (config: {
    toneId: BuzzerToneType;
    timing: 'before' | 'after';
    repeats: 1 | 2 | 3;
  }) => void;
}

export function MelodyPickerModal({
  isOpen,
  onClose,
  petName,
  initialToneId,
  initialTiming,
  initialRepeats,
  onApply,
}: MelodyPickerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedTone, setSelectedTone] = useState<BuzzerToneType>(initialToneId);
  const [selectedTiming, setSelectedTiming] = useState<'before' | 'after'>(initialTiming);
  const [selectedRepeats, setSelectedRepeats] = useState<1 | 2 | 3>(initialRepeats);
  const [isPlayingFullTest, setIsPlayingFullTest] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedTone(initialToneId);
      setSelectedTiming(initialTiming);
      setSelectedRepeats(initialRepeats);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialToneId, initialTiming, initialRepeats]);

  if (!isOpen || !mounted) return null;

  const handleSave = () => {
    triggerHaptic('heavy');
    onApply({
      toneId: selectedTone,
      timing: selectedTiming,
      repeats: selectedRepeats,
    });
    onClose();
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4 pb-20 sm:pb-8 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="artisan-card w-full max-w-sm p-5 space-y-3.5 shadow-2xl bg-white border border-[#143503]/15 -translate-y-8 sm:-translate-y-12 transition-all"
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#A7D1AE]/40 text-[#143503] border border-[#143503]/15 flex items-center justify-center shrink-0">
            <Music size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm sm:text-base font-bold text-[#143503]">Pick Pet Melody Tone</h4>
            <p className="text-xs text-[#4B633E] mt-0.5 truncate">
              Mealtime alert tone for <span className="font-bold text-[#143503]">{petName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-[#143503]/15 flex items-center justify-center text-[#4B633E] hover:text-[#143503] hover:bg-[#143503]/5 transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
            title="Close modal"
          >
            <X size={14} />
          </button>
        </div>

        {/* 1. Melody Presets (2x2 Compact Cards) */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-[#143503] uppercase tracking-wider block">
            Select Melody
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {SOUND_TONE_PRESETS.map((preset) => {
              const isSelected = selectedTone === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedTone(preset.id);
                  }}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                    isSelected
                      ? 'bg-[#143503] text-[#FFF2E6] border-[#143503] shadow-xs ring-1 ring-[#143503]/20'
                      : 'bg-[#FFF2E6]/50 hover:bg-[#FFF2E6]/80 border-[#143503]/12 text-[#143503]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-bold truncate">{preset.name}</span>
                    {isSelected && <Check size={11} strokeWidth={3} className="text-[#A7D1AE] shrink-0" />}
                  </div>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className={`font-mono truncate ${isSelected ? 'text-[#A7D1AE]' : 'text-[#4B633E]'}`}>
                      {preset.notesSummary.split('(')[0].trim()}
                    </span>
                    <span className={`px-1 py-0.2 rounded-full font-bold shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-black/5 text-[#4B633E]'
                    }`}>
                      {preset.targetPet === 'cat' ? '🐱 Cat' : preset.targetPet === 'dog' ? '🐶 Dog' : preset.targetPet === 'puppy' ? '🐾 Young' : '🔔 All'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Tone Test Bar (Compact) */}
        <div className="p-2 rounded-xl bg-[#FFF2E6]/60 border border-[#143503]/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isPlayingFullTest ? 'bg-[#143503] animate-ping' : 'bg-[#143503]/30'}`} />
            <span className="text-[11px] font-bold text-[#143503] truncate">
              {SOUND_TONE_PRESETS.find(t => t.id === selectedTone)?.name}
            </span>
            <span className="text-[10px] font-mono text-[#4B633E] shrink-0">
              (~{(getToneDuration(selectedTone, selectedRepeats) / 1000).toFixed(1)}s)
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              setIsPlayingFullTest(true);
              playToneSound(selectedTone, selectedRepeats);
              const dur = getToneDuration(selectedTone, selectedRepeats);
              setTimeout(() => setIsPlayingFullTest(false), dur + 100);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer ${
              isPlayingFullTest
                ? 'bg-[#143503] text-[#FFF2E6] scale-105 animate-pulse'
                : 'bg-white border border-[#143503]/20 hover:bg-[#143503]/5 text-[#143503]'
            }`}
            title="Test sound call"
          >
            <Volume2 size={12} className={isPlayingFullTest ? 'animate-bounce' : ''} />
            <span>{isPlayingFullTest ? 'Playing...' : 'Test Sound'}</span>
          </button>
        </div>

        {/* 2. Chime Timing (2 Segmented Options) */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-bold text-[#143503]">Chime Timing</span>
            <span className="text-[10px] text-[#4B633E]">{selectedTiming === 'before' ? '⚡ Pavlovian Cue' : '🥣 Meal Ready'}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setSelectedTiming('before');
              }}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                selectedTiming === 'before'
                  ? 'bg-[#143503] text-[#FFF2E6] border-[#143503] shadow-xs'
                  : 'bg-[#FFF2E6]/40 hover:bg-[#FFF2E6]/80 border-[#143503]/12 text-[#143503]'
              }`}
            >
              <span className="text-[11px] font-bold block">⚡ 1.5s Before Drop</span>
              <span className={`text-[9px] block mt-0.5 ${selectedTiming === 'before' ? 'text-[#A7D1AE]' : 'text-emerald-800'}`}>
                ★ Recommended
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setSelectedTiming('after');
              }}
              className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                selectedTiming === 'after'
                  ? 'bg-[#143503] text-[#FFF2E6] border-[#143503] shadow-xs'
                  : 'bg-[#FFF2E6]/40 hover:bg-[#FFF2E6]/80 border-[#143503]/12 text-[#143503]'
              }`}
            >
              <span className="text-[11px] font-bold block">🥣 After Food Drops</span>
              <span className={`text-[9px] block mt-0.5 ${selectedTiming === 'after' ? 'text-[#BCDBF0]' : 'text-[#4B633E]'}`}>
                Celebration
              </span>
            </button>
          </div>
        </div>

        {/* 3. Call Repeats (3 Segmented Pills) */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[11px]">
            <span className="font-bold text-[#143503]">Chime Repeats</span>
            <span className="text-[10px] text-[#4B633E] font-mono">
              Total: ~{(getToneDuration(selectedTone, selectedRepeats) / 1000).toFixed(1)}s
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { count: 1 as const, title: '1x Single', sub: 'Calm' },
              { count: 2 as const, title: '2x Call', sub: '★ Rec' },
              { count: 3 as const, title: '3x Persistent', sub: 'Sleepers' },
            ].map((item) => {
              const isSelected = selectedRepeats === item.count;
              return (
                <button
                  key={item.count}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedRepeats(item.count);
                  }}
                  className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#143503] text-[#FFF2E6] border-[#143503] shadow-xs'
                      : 'bg-[#FFF2E6]/40 hover:bg-[#FFF2E6]/80 border-[#143503]/12 text-[#143503]'
                  }`}
                >
                  <span className="text-[11px] font-bold block">{item.title}</span>
                  <span className={`text-[9px] block font-mono ${isSelected ? 'text-[#A7D1AE]' : 'text-[#4B633E]'}`}>
                    {item.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#143503]/20 bg-white hover:bg-[#143503]/5 text-[#143503] text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-[#143503] hover:bg-[#245308] text-[#FFF2E6] text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check size={13} strokeWidth={3} />
            <span>Save Melody</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
