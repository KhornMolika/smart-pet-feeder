'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { triggerHaptic } from '@/lib/utils/telegram.util';
import {
  Wifi,
  X,
  Smartphone,
  Radio,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  RotateCcw,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface WifiSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId?: string;
}

export function WifiSetupModal({ isOpen, onClose, deviceId = 'feeder_esp32_01' }: WifiSetupModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copiedIp, setCopiedIp] = useState(false);

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

  if (!isOpen || !mounted) return null;

  const handleCopyIp = async () => {
    triggerHaptic('light');
    try {
      await navigator.clipboard.writeText('192.168.4.1');
      setCopiedIp(true);
      setTimeout(() => setCopiedIp(false), 2000);
    } catch {
      // ignore
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn overflow-hidden"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-[#FFF2E6] border border-[#143503]/15 shadow-2xl p-4 flex flex-col gap-3 animate-scaleUp relative overflow-hidden max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glows */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#A7D1AE]/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-[#BCDBF0]/30 rounded-full blur-2xl pointer-events-none" />

        {/* 1. Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#143503]/10 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#143503] text-[#A7D1AE] flex items-center justify-center shadow-xs">
              <Wifi size={16} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#143503] leading-tight">
                Wi-Fi Connection Setup
              </h3>
              <p className="text-[10px] text-[#4B633E] font-medium">
                Connect your Feeder to 2.4GHz Wi-Fi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-[#143503]/5 hover:bg-[#143503]/10 text-[#143503] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* 2. Captive Portal AP Badge */}
        <div className="px-3 py-2 rounded-2xl bg-white/80 border border-[#143503]/10 shadow-xs flex items-center justify-between gap-2 relative z-10">
          <div className="flex flex-col min-w-0">
            <span className="text-[9.5px] uppercase font-bold text-[#4B633E] tracking-wider">
              Feeder Setup Hotspot
            </span>
            <span className="text-xs font-mono font-bold text-[#143503] truncate">
              ChinChem-Setup-{deviceId}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyIp}
            className="px-2 py-1 rounded-lg bg-[#EAF3EC] hover:bg-[#dbeee0] text-[#143503] border border-[#143503]/15 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
            title="Copy Portal IP"
          >
            {copiedIp ? <Check size={11} className="text-emerald-700" /> : <Copy size={11} />}
            <span>{copiedIp ? 'Copied' : '192.168.4.1'}</span>
          </button>
        </div>

        {/* 3. Step-by-Step Interactive Guide */}
        <div className="flex flex-col gap-2 relative z-10">
          {/* Step 1 */}
          <div className="p-2.5 rounded-2xl bg-white/70 border border-[#143503]/8 flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-lg bg-[#143503] text-[#FFF2E6] flex items-center justify-center text-[11px] font-black shrink-0">
              1
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-[#143503]">Turn on Feeder & Check LCD</span>
              <p className="text-[10px] text-[#4B633E] leading-relaxed mt-0.5">
                If not connected, the feeder will display <strong className="font-mono text-[#143503]">Setup: {deviceId}</strong> and <strong className="font-mono text-[#143503]">192.168.4.1</strong>.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-2.5 rounded-2xl bg-white/70 border border-[#143503]/8 flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-lg bg-[#143503] text-[#FFF2E6] flex items-center justify-center text-[11px] font-black shrink-0">
              2
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-[#143503]">Connect Phone to Feeder Wi-Fi</span>
              <p className="text-[10px] text-[#4B633E] leading-relaxed mt-0.5">
                Open phone Wi-Fi settings and connect to <strong className="font-mono text-[#143503]">ChinChem-Setup-{deviceId}</strong>. No password needed.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-2.5 rounded-2xl bg-white/70 border border-[#143503]/8 flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-lg bg-[#143503] text-[#FFF2E6] flex items-center justify-center text-[11px] font-black shrink-0">
              3
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-[#143503]">Select Home Wi-Fi & Save</span>
              <p className="text-[10px] text-[#4B633E] leading-relaxed mt-0.5">
                The setup page opens automatically (or visit <strong className="font-mono text-[#143503]">192.168.4.1</strong>). Pick your 2.4GHz Wi-Fi, enter your password, and click <strong className="text-[#143503]">Save & Connect</strong>.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-2.5 rounded-2xl bg-white/70 border border-[#143503]/8 flex gap-2.5 items-start">
            <div className="w-6 h-6 rounded-lg bg-[#255e09] text-[#FFF2E6] flex items-center justify-center text-[11px] font-black shrink-0">
              4
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-[#143503]">Connected & Ready!</span>
              <p className="text-[10px] text-[#4B633E] leading-relaxed mt-0.5">
                The LCD screen displays <strong className="text-emerald-700">WiFi Connected!</strong> with its IP address. The feeder is now online and syncing with your cloud app.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Hardware Button Reset Tip */}
        <div className="p-2.5 rounded-2xl bg-[#FFF8EB] border border-amber-500/20 flex items-start gap-2 text-[10px] text-amber-950 relative z-10">
          <RotateCcw size={13} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-amber-900">Moving to a new Wi-Fi?</span> Hold the physical green button on the feeder for <strong>5 seconds</strong> to reset Wi-Fi and restart setup mode anytime.
          </div>
        </div>

        {/* 5. Close Button */}
        <div className="pt-1 relative z-10">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-full py-2.5 rounded-2xl bg-[#143503] hover:bg-[#1b4704] text-[#FFF2E6] font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#143503]/20 cursor-pointer active:scale-98 transition-all"
          >
            <CheckCircle2 size={13} className="text-[#A7D1AE]" />
            <span>Got it, ready to connect!</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
