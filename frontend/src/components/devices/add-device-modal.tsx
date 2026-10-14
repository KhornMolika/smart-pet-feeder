'use client';

import React, { useState } from 'react';
import { triggerHaptic } from '@/lib/utils/telegram.util';
import { Wifi } from 'lucide-react';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDevice: (data: { name: string; petName: string; petEmoji: string; room: string }) => void;
}

export function AddDeviceModal({ isOpen, onClose, onAddDevice }: AddDeviceModalProps) {
  const [name] = useState('Smart Feeder');
  const [petName, setPetName] = useState('');
  const [petEmoji, setPetEmoji] = useState('🐱');
  const [room, setRoom] = useState('Kitchen');

  if (!isOpen) return null;

  const emojiOptions = ['🐱', '🐶', '🐰', '🐾', '🦜', '🐹'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!petName.trim()) return;
    triggerHaptic('medium');
    onAddDevice({
      name,
      petName: petName.trim(),
      petEmoji,
      room,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/35 backdrop-blur-xs z-50 flex items-center justify-center p-3.5 animate-fadeIn">
      <div className="artisan-card w-full max-w-sm p-4 sm:p-5 space-y-3.5 shadow-xl bg-white">
        <div className="flex items-center justify-between border-b border-[#143503]/8 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-lg">📡</span>
            <h4 className="text-xs sm:text-sm font-bold text-[#143503]">Pair New Feeder</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[#4B633E] hover:text-[#143503] font-semibold cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Pairing Hardware Instruction Box */}
        <div className="p-3 rounded-xl bg-[#FFF2E6]/60 border border-[#143503]/8 text-xs text-[#143503] space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <Wifi size={13} className="text-[#143503]" />
            <span>ESP32 Wi-Fi Setup Mode</span>
          </div>
          <p className="text-xs text-[#4B633E]">
            Hold the physical tactile button on your feeder for 5 seconds until the LED pulses rapidly to broadcast Wi-Fi SoftAP.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-[#143503] block mb-1">Pet Name</label>
            <input
              type="text"
              required
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="e.g. Luna, Cooper"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#143503]/12 bg-[#FFF2E6]/40 text-xs sm:text-sm font-medium text-[#143503] outline-none focus:border-[#143503]/30"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#143503] block mb-1">Pet Emoji</label>
            <div className="flex gap-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setPetEmoji(emoji)}
                  className={`w-9 h-9 rounded-xl text-base flex items-center justify-center transition-all cursor-pointer ${
                    petEmoji === emoji
                      ? 'bg-[#143503] text-white shadow-xs'
                      : 'bg-[#FFF2E6]/60 border border-[#143503]/10'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#143503] block mb-1">Room Location</label>
            <input
              type="text"
              required
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g. Kitchen, Patio, Bedroom"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#143503]/12 bg-[#FFF2E6]/40 text-xs sm:text-sm font-medium text-[#143503] outline-none focus:border-[#143503]/30"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#143503] text-[#FFF2E6] text-xs font-bold shadow-xs hover:opacity-95 transition-all cursor-pointer mt-1"
          >
            Connect & Register Feeder
          </button>
        </form>
      </div>
    </div>
  );
}
