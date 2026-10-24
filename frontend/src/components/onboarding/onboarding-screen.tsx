'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  QrCode,
  Keyboard,
  Sparkles,
  Clock,
  Soup,
  Bell,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useFeederContext } from '@/context/feeder-context';
import {
  openTelegramQrScanner,
  parseFeederClaimToken,
  triggerHaptic,
  triggerNotificationHaptic,
} from '@/lib/utils/telegram.util';

export function OnboardingScreen() {
  const { setIsAddDeviceOpen, loadDemoData } = useFeederContext();
  const [showManualQrFallback, setShowManualQrFallback] = useState(false);
  const [fallbackTokenInput, setFallbackTokenInput] = useState('');

  const handleScanClick = () => {
    triggerHaptic('medium');

    // Try Telegram native full-screen camera QR scanner
    const opened = openTelegramQrScanner('Point camera at the QR code on your ChinChem feeder', (scannedText) => {
      const token = parseFeederClaimToken(scannedText);
      if (token) {
        triggerNotificationHaptic('success');
        // Dispatch to parent or simulate claim deep link
        window.location.search = `?startapp=${encodeURIComponent(token)}`;
        return true;
      }
      return false;
    });

    // Fallback if not inside Telegram or native scanner unavailable
    if (!opened) {
      setShowManualQrFallback(true);
    }
  };

  const handleManualPairClick = () => {
    triggerHaptic('light');
    setIsAddDeviceOpen(true);
  };

  const handleFallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fallbackTokenInput.trim()) return;

    const token = parseFeederClaimToken(fallbackTokenInput.trim());
    if (token) {
      triggerNotificationHaptic('success');
      setShowManualQrFallback(false);
      window.location.search = `?startapp=${encodeURIComponent(token)}`;
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 py-2 animate-fadeIn relative">
      {/* 1. Hero Artwork Card */}
      <div className="w-full rounded-3xl bg-white/85 backdrop-blur-md border border-[#143503]/12 p-6 flex flex-col items-center text-center shadow-sm relative overflow-hidden">
        {/* Soft decorative gradient orbs */}
        <div className="absolute -top-14 -right-14 w-36 h-36 bg-[#A7D1AE]/25 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#BCDBF0]/30 rounded-full blur-2xl pointer-events-none" />

        {/* Logo / Mascot Avatar */}
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#143503] to-[#255e09] flex items-center justify-center shadow-lg shadow-[#143503]/20 ring-4 ring-white">
            <Image
              src="/images/logo.png"
              alt="ChinChem"
              width={48}
              height={48}
              priority
              className="object-contain filter drop-shadow-[0_2px_4px_rgba(255,255,255,0.4)]"
            />
          </div>
          <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#FFF2E6] border border-[#143503]/20 text-[10px] font-black text-[#143503] shadow-xs">
            v1.0
          </span>
        </div>

        {/* Titles */}
        <span className="text-[11px] font-black tracking-widest uppercase text-[#4B633E] bg-[#EAF3EC] px-2.5 py-0.5 rounded-full border border-[#143503]/10 mb-1.5">
          ចិញ្ចឹម • Smart Pet Feeder
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-[#143503] tracking-tight">
          Welcome to ChinChem
        </h1>
        <p className="text-xs text-[#4B633E] mt-1.5 max-w-xs leading-relaxed">
          Automate your pet&apos;s meals, control portion sizes, and dispense fresh food directly through Telegram.
        </p>

        {/* 2. Feature Highlights (3 compact micro-cards) */}
        <div className="w-full grid grid-cols-3 gap-2 mt-5 text-left">
          <div className="p-2.5 rounded-2xl bg-[#F8FAF8] border border-[#143503]/8 flex flex-col gap-1">
            <div className="w-6 h-6 rounded-lg bg-[#EAF3EC] text-[#143503] flex items-center justify-center">
              <Clock size={13} />
            </div>
            <span className="text-[11px] font-bold text-[#143503] leading-tight">Smart Alarms</span>
            <span className="text-[9.5px] text-[#6B7280] leading-tight">Auto schedules</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#F8FAF8] border border-[#143503]/8 flex flex-col gap-1">
            <div className="w-6 h-6 rounded-lg bg-[#FFF2E6] text-[#143503] flex items-center justify-center">
              <Soup size={13} />
            </div>
            <span className="text-[11px] font-bold text-[#143503] leading-tight">Exact Portions</span>
            <span className="text-[9.5px] text-[#6B7280] leading-tight">30s, 1m, or 3m</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-[#F8FAF8] border border-[#143503]/8 flex flex-col gap-1">
            <div className="w-6 h-6 rounded-lg bg-[#EBF4FA] text-[#143503] flex items-center justify-center">
              <Bell size={13} />
            </div>
            <span className="text-[11px] font-bold text-[#143503] leading-tight">Bot Alerts</span>
            <span className="text-[9.5px] text-[#6B7280] leading-tight">Live food logs</span>
          </div>
        </div>
      </div>

      {/* 3. Action Group: Scan QR & Manual Pair */}
      <div className="w-full flex flex-col gap-2.5">
        {/* Primary Action: Scan Hardware QR Code */}
        <button
          type="button"
          onClick={handleScanClick}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#143503] hover:bg-[#1b4704] text-[#FFF2E6] font-bold text-sm flex items-center justify-center gap-2.5 shadow-md shadow-[#143503]/20 transition-all cursor-pointer active:scale-98"
        >
          <QrCode size={18} className="text-[#A7D1AE]" />
          <span>Scan Feeder QR Code</span>
          <ArrowRight size={15} className="ml-auto opacity-70" />
        </button>

        {/* Secondary Action: Manual Pair */}
        <button
          type="button"
          onClick={handleManualPairClick}
          className="w-full py-3 px-4 rounded-2xl bg-white/90 hover:bg-white text-[#143503] border border-[#143503]/15 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
        >
          <Keyboard size={15} className="text-[#4B633E]" />
          <span>Enter Feeder ID Manually</span>
        </button>
      </div>

      {/* 4. Hardware Pairing Instructions Tip */}
      <div className="w-full px-4 py-3 rounded-2xl bg-[#FFF2E6] border border-[#143503]/10 flex items-start gap-2.5 text-[11px] text-[#4B633E]">
        <ShieldCheck size={16} className="text-[#143503] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#143503]">Where is the QR code?</span>
          <p className="mt-0.5 leading-relaxed text-[#4B633E]/90">
            Check the physical pairing sticker printed on your ChinChem feeder body. You can also scan it directly with your phone camera.
          </p>
        </div>
      </div>

      {/* 5. Demo / Developer Exploration Mode */}
      <div className="mt-2 flex flex-col items-center">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            loadDemoData();
          }}
          className="text-[11px] font-semibold text-[#4B633E]/75 hover:text-[#143503] underline underline-offset-4 flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-3 rounded-full hover:bg-white/50"
        >
          <Sparkles size={12} className="text-amber-600" />
          <span>Want to preview without hardware? Load Demo Feeder</span>
        </button>
      </div>

      {/* In-Browser Fallback Scanner / Code Input Modal */}
      {showManualQrFallback && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowManualQrFallback(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[#FFF2E6] border border-[#143503]/15 shadow-2xl p-4 flex flex-col gap-3 animate-scaleUp relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#143503]/10 pb-2">
              <div className="flex items-center gap-2">
                <QrCode size={16} className="text-[#143503]" />
                <h3 className="text-xs font-bold text-[#143503]">Feeder QR / Claim Link</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManualQrFallback(false)}
                className="w-6 h-6 rounded-full bg-[#143503]/5 hover:bg-[#143503]/10 text-[#143503] flex items-center justify-center cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>

            <p className="text-[11px] text-[#4B633E] leading-relaxed">
              If running in a web browser without camera permissions, paste your feeder claim link or code below:
            </p>

            <form onSubmit={handleFallbackSubmit} className="flex flex-col gap-2">
              <input
                type="text"
                autoFocus
                value={fallbackTokenInput}
                onChange={(e) => setFallbackTokenInput(e.target.value)}
                placeholder="e.g. claim_feeder_esp32_01"
                className="w-full px-3 py-2 rounded-xl border border-[#143503]/15 bg-white text-xs font-mono font-bold text-[#143503] outline-none focus:border-[#143503] shadow-xs"
              />

              {/* Quick sample chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-[#6B7280]">Quick fill:</span>
                <button
                  type="button"
                  onClick={() => setFallbackTokenInput('claim_feeder_esp32_01')}
                  className="px-2 py-0.5 rounded-md bg-white border border-[#143503]/15 text-[10px] font-mono text-[#143503] hover:bg-[#EAF3EC] transition-colors"
                >
                  claim_feeder_esp32_01
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowManualQrFallback(false)}
                  className="py-2 rounded-xl bg-white border border-[#143503]/15 text-xs font-bold text-[#4B633E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!fallbackTokenInput.trim()}
                  className="py-2 rounded-xl bg-[#143503] text-[#FFF2E6] text-xs font-bold disabled:opacity-50"
                >
                  Pair Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
