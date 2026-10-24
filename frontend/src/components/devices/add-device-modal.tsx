'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { triggerHaptic } from '@/lib/utils/telegram.util';
import { Radio, X, Sparkles, CheckCircle2, MapPin, QrCode } from 'lucide-react';
import { PetIcon } from '@/components/common/pet-icon';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDevice: (data: {
    name: string;
    petName: string;
    petEmoji: string;
    room: string;
    claimToken?: string;
  }) => void;
  claimToken?: string | null;
}

const SPECIES_OPTIONS: { id: string; label: string; icon: string }[] = [
  { id: 'cat', label: 'Cat', icon: 'cat' },
  { id: 'dog', label: 'Dog', icon: 'dog' },
  { id: 'rabbit', label: 'Rabbit', icon: 'rabbit' },
  { id: 'bird', label: 'Bird', icon: 'bird' },
  { id: 'fish', label: 'Fish', icon: 'fish' },
  { id: 'paw', label: 'Other', icon: 'paw' },
];

const ROOM_PRESETS = ['Living Room', 'Kitchen', 'Balcony', 'Bedroom'];

export function AddDeviceModal({ isOpen, onClose, onAddDevice, claimToken }: AddDeviceModalProps) {
  const [mounted, setMounted] = useState(false);
  const [petName, setPetName] = useState('');
  const [petEmoji, setPetEmoji] = useState('cat');
  const [room, setRoom] = useState('Living Room');
  const [hardwareId, setHardwareId] = useState('feeder_esp32_01');
  const [isPairingSuccess, setIsPairingSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Reset and pre-fill form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPetName('Mochi');
      setPetEmoji('cat');
      setRoom('Living Room');
      setHardwareId(claimToken ? claimToken.replace(/^claim_/, '') : 'feeder_esp32_01');
      setIsPairingSuccess(false);
    }
  }, [isOpen, claimToken]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPetName = petName.trim() || 'Mochi';

    triggerHaptic('medium');
    setIsPairingSuccess(true);

    const finalToken =
      claimToken ||
      (hardwareId.trim()
        ? hardwareId.trim().startsWith('claim_')
          ? hardwareId.trim()
          : `claim_${hardwareId.trim()}`
        : undefined);

    setTimeout(() => {
      onAddDevice({
        name: `${finalPetName}'s Feeder Pro`,
        petName: finalPetName,
        petEmoji,
        room: room.trim() || 'Living Room',
        claimToken: finalToken,
      });
      onClose();
    }, 450);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs animate-fadeIn overflow-hidden"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-[#FFF2E6] border border-[#143503]/15 shadow-2xl p-3.5 flex flex-col gap-2 animate-scaleUp relative overflow-hidden max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Decorative Glows */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#BCDBF0]/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-[#A7D1AE]/25 rounded-full blur-2xl pointer-events-none" />

        {/* 1. Header with Embedded Hardware Status */}
        <div className="flex items-center justify-between pb-2 border-b border-[#143503]/10 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#143503] text-[#FFF2E6] flex items-center justify-center shadow-xs">
              <Radio size={13} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#143503] leading-none">
                {claimToken ? 'Claim QR Feeder' : 'Pair New Feeder'}
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>ESP32 Ready • 2.4GHz Wi-Fi</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-6 h-6 rounded-full bg-[#143503]/5 hover:bg-[#143503]/10 text-[#143503] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        {/* QR Claim Banner if opened via Telegram Deep Link or QR Code */}
        {claimToken && (
          <div className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500/10 via-[#A7D1AE]/20 to-[#BCDBF0]/25 border border-emerald-600/20 flex items-center justify-between text-[10px] relative z-10">
            <div className="flex items-center gap-1.5 text-emerald-950 font-bold truncate">
              <QrCode size={12} className="text-emerald-700 shrink-0 animate-pulse" />
              <span>QR Discovered:</span>
              <span className="font-mono text-emerald-800 bg-white/70 px-1 py-0.2 rounded border border-emerald-200 text-[9px] truncate">
                {claimToken}
              </span>
            </div>
            <span className="text-[8.5px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded-full border border-emerald-300 shrink-0">
              Verified
            </span>
          </div>
        )}

        {/* 2. Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 relative z-10">
          {/* A. Pet Name Input */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#143503]">Pet Name</label>
              {/* Quick Pet Name Chips */}
              <div className="flex items-center gap-1">
                {['Mochi', 'Luna', 'Max', 'Coco'].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setPetName(name);
                    }}
                    className={`px-1.5 py-0.2 rounded text-[8.5px] font-semibold transition-all cursor-pointer ${
                      petName === name
                        ? 'bg-[#143503] text-[#FFF2E6]'
                        : 'bg-white/70 hover:bg-white text-[#4B633E] border border-[#143503]/10'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="e.g. Mochi, Luna, Bella, Max..."
              autoFocus
              className="w-full px-2.5 py-1.5 rounded-xl border border-[#143503]/15 bg-white text-xs font-semibold text-[#143503] outline-none focus:border-[#143503] focus:ring-1 focus:ring-[#143503]/10 transition-all placeholder:text-[#4B633E]/40 shadow-xs"
            />
          </div>

          {/* B. Pet Species & Avatar Selector (Compact 1-row grid) */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-bold text-[#143503]">Pet Species</label>
            <div className="grid grid-cols-6 gap-1">
              {SPECIES_OPTIONS.map((species) => {
                const isSelected = petEmoji === species.id;
                return (
                  <button
                    key={species.id}
                    type="button"
                    title={species.label}
                    onClick={() => {
                      triggerHaptic('selection');
                      setPetEmoji(species.id);
                    }}
                    className={`h-8 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#143503] text-[#FFF2E6] shadow-xs ring-1 ring-[#143503]'
                        : 'bg-white/70 hover:bg-white text-[#4B633E] border border-[#143503]/10'
                    }`}
                  >
                    <PetIcon icon={species.icon} size={14} />
                    <span className="text-[8.5px] font-semibold mt-0.5 leading-none">{species.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* C. Room Location with Quick Presets */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-[#143503] flex items-center gap-1">
                <MapPin size={11} className="text-[#143503]" />
                <span>Room Location</span>
              </label>

              {/* Quick Preset Chips */}
              <div className="flex items-center gap-1">
                {ROOM_PRESETS.map((preset) => {
                  const isSelected = room === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setRoom(preset);
                      }}
                      className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#143503] text-[#FFF2E6]'
                          : 'bg-white/60 hover:bg-white text-[#4B633E] border border-[#143503]/8'
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            <input
              type="text"
              required
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g. Kitchen, Balcony, Patio..."
              className="w-full px-2.5 py-1.5 rounded-xl border border-[#143503]/15 bg-white text-xs font-semibold text-[#143503] outline-none focus:border-[#143503] shadow-xs transition-all"
            />
          </div>

          {/* D. Hardware Device ID (for manual pairing) */}
          {!claimToken && (
            <div className="flex flex-col gap-0.5">
              <label className="text-[11px] font-bold text-[#143503] flex items-center justify-between">
                <span>Hardware Feeder ID</span>
                <span className="text-[9px] text-[#4B633E]/70 font-mono">feeder_esp32_01</span>
              </label>
              <input
                type="text"
                value={hardwareId}
                onChange={(e) => setHardwareId(e.target.value)}
                placeholder="e.g. feeder_esp32_01"
                className="w-full px-2.5 py-1.5 rounded-xl border border-[#143503]/15 bg-white text-xs font-mono font-bold text-[#143503] outline-none focus:border-[#143503] shadow-xs transition-all placeholder:text-[#4B633E]/35"
              />
            </div>
          )}

          {/* D. Live Feeder Preview Card */}
          <div className="px-2.5 py-1 rounded-xl bg-white/65 border border-[#143503]/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-md bg-[#A7D1AE]/35 text-[#143503] flex items-center justify-center shrink-0 border border-[#143503]/10">
                <PetIcon icon={petEmoji} size={12} />
              </div>
              <div className="min-w-0 truncate text-[10.5px] font-bold text-[#143503]">
                {petName.trim() ? `${petName.trim()}'s Feeder` : 'New Pet Feeder'}
                <span className="text-[9px] text-[#4B633E] font-normal ml-1">
                  • 📍 {room.trim() || 'Living Room'}
                </span>
              </div>
            </div>

            <span className="text-[8.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
              ● Ready
            </span>
          </div>

          {/* E. Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="w-full py-1.5 rounded-xl bg-white/70 hover:bg-white border border-[#143503]/15 text-xs font-semibold text-[#4B633E] transition-all cursor-pointer active:scale-95"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPairingSuccess}
              className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95 ${
                !isPairingSuccess
                  ? 'bg-[#143503] hover:bg-[#143503]/90 text-[#FFF2E6] shadow-emerald-950/20 ring-1 ring-[#143503]/20'
                  : 'bg-[#143503]/50 text-[#FFF2E6]/80 cursor-wait'
              }`}
            >
              {isPairingSuccess ? (
                <>
                  <CheckCircle2 size={13} className="text-emerald-400 animate-pulse" />
                  <span>{claimToken ? 'Claimed!' : 'Paired!'}</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} className="text-amber-300" />
                  <span>{claimToken ? '✨ Claim Feeder' : '✨ Pair Feeder'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
