'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FeederDevice } from '@/types/feeder.types';
import { PetIcon } from '@/components/common/pet-icon';
import { triggerHaptic } from '@/lib/utils/telegram.util';
import { generateModernQrBadgeBlob } from '@/lib/utils/qr-badge-generator.util';
import {
  QrCode,
  X,
  Copy,
  Check,
  Printer,
  Download,
  Sparkles,
  Wifi,
  Loader2,
  Globe,
  Send,
} from 'lucide-react';

interface DeviceQrStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: FeederDevice;
}

export function DeviceQrStickerModal({
  isOpen,
  onClose,
  device,
}: DeviceQrStickerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Link Destination: 'telegram' (Telegram Mini App) or 'browser' (Direct Browser URL)
  const [linkTarget, setLinkTarget] = useState<'telegram' | 'browser'>('browser');
  const [botUsername, setBotUsername] = useState<string>('ChinChemBot');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const claimToken = device.claimToken || `claim_${device.id}_auto`;
  const cleanBot = botUsername.trim().replace(/^@/, '') || 'ChinChemBot';

  // Direct Web link uses current host or origin so local network devices (like phone) can open it
  const webOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const directWebUrl = `${webOrigin}/?startapp=claim_${claimToken}`;
  const telegramAppUrl = `https://t.me/${cleanBot}/app?startapp=claim_${claimToken}`;

  const claimUrl = linkTarget === 'telegram' ? telegramAppUrl : directWebUrl;

  // High-error-correction (ecc=H) forest green QR code with brand Palm Leaf color (#143503 -> RGB 20-53-3)
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=8&ecc=H&color=20-53-3&bgcolor=ffffff&data=${encodeURIComponent(
    claimUrl
  )}`;

  const handleCopy = async () => {
    triggerHaptic('light');
    try {
      await navigator.clipboard.writeText(claimUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {}
  };

  const handleDownloadQr = async () => {
    triggerHaptic('medium');
    setDownloading(true);
    try {
      // Generate ultra-crisp, high-res presentation badge on canvas
      const badgeBlob = await generateModernQrBadgeBlob({
        qrImageUrl,
        deviceId: device.id,
        deviceName: device.name,
        petName: device.petName,
        petIcon: device.petIcon || device.petEmoji,
        claimToken,
        botUsername: cleanBot,
        isWebLink: linkTarget === 'browser',
      });

      const url = window.URL.createObjectURL(badgeBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chinchem-${device.petName.toLowerCase().replace(/\s+/g, '-')}-pairing-badge.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate high-res badge:', err);
      // Fallback direct QR download
      try {
        const response = await fetch(qrImageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${device.id}-pairing-qr.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch {
        window.open(qrImageUrl, '_blank');
      }
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  const handlePrint = () => {
    triggerHaptic('medium');
    window.print();
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn overflow-y-auto print:bg-white print:p-0 print:static print:overflow-visible"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-[#FFF2E6] border border-[#143503]/20 shadow-2xl p-4 sm:p-5 flex flex-col gap-2.5 animate-scaleUp relative overflow-hidden print:border-none print:shadow-none print:bg-white print:p-0 print:max-w-none"
      >
        {/* Subtle Decorative Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#A7D1AE]/30 rounded-full blur-2xl pointer-events-none print:hidden" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#BCDBF0]/30 rounded-full blur-2xl pointer-events-none print:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#143503]/10 relative z-10 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#143503] text-[#FFF2E6] flex items-center justify-center shadow-xs">
              <QrCode size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#143503] leading-none">
                Device Pairing Badge
              </h3>
              <p className="text-[10px] text-[#4B633E] mt-0.5">
                Physical label for chassis & presentation slides
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/70 hover:bg-white text-[#4B633E] hover:text-[#143503] flex items-center justify-center border border-[#143503]/10 transition-colors cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>

        {/* Link Destination Mode Selector: Direct Web Link vs Telegram App */}
        <div className="flex flex-col gap-1.5 relative z-10 print:hidden">
          <div className="flex items-center p-0.5 rounded-xl bg-white/80 border border-[#143503]/10 text-xs">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setLinkTarget('browser');
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                linkTarget === 'browser'
                  ? 'bg-[#143503] text-[#FFF2E6] shadow-xs'
                  : 'text-[#4B633E] hover:text-[#143503]'
              }`}
            >
              <Globe size={11} />
              <span className="text-[11px]">Direct Web Link</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setLinkTarget('telegram');
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                linkTarget === 'telegram'
                  ? 'bg-[#143503] text-[#FFF2E6] shadow-xs'
                  : 'text-[#4B633E] hover:text-[#143503]'
              }`}
            >
              <Send size={11} />
              <span className="text-[11px]">Telegram App</span>
            </button>
          </div>

          {/* Conditional Input / Status for Selected Link Mode */}
          {linkTarget === 'telegram' ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#143503]/15 shadow-2xs">
              <span className="text-[10px] font-mono font-bold text-[#4B633E]">Bot: @</span>
              <input
                type="text"
                value={botUsername}
                onChange={(e) => setBotUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="YourBotUsername"
                className="flex-1 bg-transparent border-none outline-none font-mono font-bold text-xs text-[#143503] placeholder-[#4B633E]/40"
              />
              <span className="text-[8.5px] font-mono text-[#4B633E] bg-[#FFF2E6] px-1.5 py-0.5 rounded border border-[#143503]/10 shrink-0">
                @BotFather
              </span>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-900 font-mono flex items-center justify-between">
              <span className="truncate max-w-[200px]" title={claimUrl}>
                {claimUrl}
              </span>
              <span className="text-[9px] font-bold text-emerald-800 bg-white px-1.5 py-0.2 rounded border border-emerald-300 shrink-0 ml-1">
                Opens in Browser
              </span>
            </div>
          )}
        </div>

        {/* Realistic Physical Sticker Card - High-Tech Modern Aesthetic */}
        <div className="p-3.5 rounded-2xl bg-white border-2 border-dashed border-[#143503]/25 shadow-sm flex flex-col items-center gap-2 relative z-10 print:border-solid print:border-2 print:border-black print:w-[320px] print:mx-auto print:p-4 print:rounded-xl">
          {/* Sticker Header: Logo & Model */}
          <div className="w-full flex items-center justify-between border-b border-[#143503]/10 pb-1.5 print:border-black/20">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-[#143503] text-[#FFF2E6] flex items-center justify-center font-black text-[10px] print:bg-black">
                CC
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#143503] block leading-none print:text-black">
                  ChinChem Feeder
                </span>
                <span className="text-[8px] font-mono text-[#4B633E] block mt-0.5 print:text-gray-600">
                  ESP32-WROOM-32 • Dispenser V1.0
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 print:border-black/30 print:text-black print:bg-gray-100">
              <Wifi size={9} />
              <span>Wi-Fi+BLE</span>
            </div>
          </div>

          {/* Scannable Modern QR Code with Viewfinder & Center Emblem */}
          <div className="relative p-2.5 bg-[#FAFBF9] rounded-2xl border border-[#143503]/10 shadow-inner flex flex-col items-center group">
            {/* High-Tech Viewfinder Corner Markers */}
            <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-[#143503] rounded-tl-sm pointer-events-none" />
            <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-[#143503] rounded-tr-sm pointer-events-none" />
            <div className="absolute bottom-6 left-1.5 w-3 h-3 border-b-2 border-l-2 border-[#143503] rounded-bl-sm pointer-events-none" />
            <div className="absolute bottom-6 right-1.5 w-3 h-3 border-b-2 border-r-2 border-[#143503] rounded-br-sm pointer-events-none" />

            {/* QR Code Container with Center Paw Emblem */}
            <div className="relative flex items-center justify-center bg-white p-1 rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrImageUrl}
                alt="Device Pairing QR Code"
                width={150}
                height={150}
                className="rounded-lg object-contain w-34 h-34 sm:w-38 sm:h-38"
              />

              {/* Stylish Center Paw Emblem */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-7 h-7 rounded-lg bg-white border-2 border-[#143503] shadow-xs flex items-center justify-center text-xs">
                  🐾
                </div>
              </div>
            </div>

            <span className="text-[8px] font-mono font-bold text-[#143503] tracking-widest uppercase mt-1 print:text-black">
              {linkTarget === 'telegram' ? 'SCAN TO PAIR WITH TELEGRAM' : 'SCAN TO OPEN DIRECT WEB APP'}
            </span>
          </div>

          {/* Sticker Specs Footer */}
          <div className="w-full grid grid-cols-2 gap-1.5 text-[9.5px] font-mono bg-[#FFF2E6]/60 p-2 rounded-xl border border-[#143503]/8 print:bg-gray-50 print:border-black/10">
            <div>
              <span className="text-[#4B633E] block text-[8.5px] print:text-gray-600">Assigned Pet:</span>
              <span className="font-bold text-[#143503] flex items-center gap-1 print:text-black">
                <PetIcon icon={device.petIcon || device.petEmoji} size={11} />
                <span className="truncate">{device.petName}</span>
              </span>
            </div>
            <div>
              <span className="text-[#4B633E] block text-[8.5px] print:text-gray-600">Claim Token:</span>
              <span className="font-bold text-[#143503] truncate block print:text-black" title={claimToken}>
                {claimToken.substring(0, 12)}...
              </span>
            </div>
          </div>
        </div>

        {/* Presentation & Demo Instructions Tip */}
        <div className="p-2 rounded-xl bg-[#BCDBF0]/30 border border-[#143503]/10 text-xs text-[#143503] flex items-start gap-2 relative z-10 print:hidden">
          <Sparkles size={13} className="text-[#143503] shrink-0 mt-0.5" />
          <div className="text-[10.5px] leading-relaxed">
            {linkTarget === 'telegram' ? (
              <span>
                <strong>Why Username Not Found:</strong> The bot <code className="font-bold text-[#143503]">@{cleanBot}</code> must be registered with Telegram&apos;s <strong>@BotFather</strong> (<code className="font-mono bg-white/70 px-1 rounded">/newbot</code> & <code className="font-mono bg-white/70 px-1 rounded">/newapp</code>). Or switch to <strong>Direct Web Link</strong> above to test immediately in your phone browser!
              </span>
            ) : (
              <span>
                <strong>Direct Web Mode:</strong> Opens directly in Chrome/Safari on your phone or PC over your Wi-Fi! Auto-claims and pairs the feeder without needing Telegram BotFather.
              </span>
            )}
          </div>
        </div>

        {/* Actions: Copy Link, Modern Badge PNG, & Print */}
        <div className="grid grid-cols-3 gap-1.5 relative z-10 pt-0.5 print:hidden">
          <button
            type="button"
            onClick={handleCopy}
            className="py-2 px-2 rounded-xl bg-white hover:bg-[#FFF2E6] border border-[#143503]/20 text-[#143503] text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs active:scale-95"
          >
            {copied ? (
              <>
                <Check size={11} className="text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={11} />
                <span>Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadQr}
            className="py-2 px-2 rounded-xl bg-white hover:bg-[#FFF2E6] border border-[#143503]/20 text-[#143503] text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs active:scale-95"
            disabled={downloading}
            title="Download high-resolution presentation pairing card"
          >
            {downloading ? (
              <>
                <Loader2 size={11} className="animate-spin text-[#143503]" />
                <span>Rendering...</span>
              </>
            ) : (
              <>
                <Download size={11} />
                <span>Badge (PNG)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="py-2 px-2 rounded-xl bg-[#143503] hover:bg-[#245308] text-[#FFF2E6] text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs active:scale-95"
          >
            <Printer size={11} />
            <span>Print</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}


