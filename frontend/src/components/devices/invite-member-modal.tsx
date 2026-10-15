'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { triggerHaptic } from '@/lib/utils/telegram.util';
import { UserPlus, X, Copy, Check, Send, QrCode, Shield, HeartHandshake } from 'lucide-react';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
  petName: string;
  onCreateInvite: (role: 'family' | 'guest') => Promise<{ inviteUrl: string; inviteToken: string }>;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  deviceId,
  petName,
  onCreateInvite,
}: InviteMemberModalProps) {
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<'family' | 'guest'>('family');
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  // Generate invite when role changes or modal opens
  useEffect(() => {
    if (isOpen) {
      let active = true;
      setIsGenerating(true);
      onCreateInvite(role).then((data) => {
        if (active && data?.inviteUrl) {
          setInviteUrl(data.inviteUrl);
          setIsGenerating(false);
        }
      });
      return () => {
        active = false;
      };
    }
  }, [isOpen, role, onCreateInvite]);

  if (!isOpen || !mounted) return null;

  const handleCopyLink = async () => {
    triggerHaptic('light');
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {}
  };

  const handleShareTelegram = () => {
    triggerHaptic('medium');
    const text = encodeURIComponent(`🐾 Come join and take care of ${petName} on ChinChem Smart Pet Feeder!`);
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${text}`;

    const tg = (window as unknown as { Telegram?: { WebApp?: { openTelegramLink?: (url: string) => void } } })
      .Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs animate-fadeIn overflow-hidden"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-[#FFF2E6] border border-[#143503]/15 shadow-2xl p-3.5 flex flex-col gap-2.5 animate-scaleUp relative overflow-hidden max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Decorative Glows */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#BCDBF0]/30 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-[#A7D1AE]/25 rounded-full blur-xl pointer-events-none" />

        {/* 1. Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#143503]/10 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#143503] text-[#FFF2E6] flex items-center justify-center shadow-xs">
              <UserPlus size={13} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#143503] leading-none">
                Invite Household Member
              </h3>
              <p className="text-[10px] text-[#4B633E] mt-0.5">
                Share access to {petName}&apos;s Feeder
              </p>
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

        {/* 2. Role Selector Segmented Control */}
        <div className="flex flex-col gap-1 relative z-10">
          <label className="text-[11px] font-bold text-[#143503] flex items-center justify-between">
            <span>Select Permission Role</span>
            <span className="text-[9.5px] text-[#4B633E] font-medium">7-Day Invitation</span>
          </label>

          <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/70 rounded-xl border border-[#143503]/10">
            {/* Family Member Option */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setRole('family');
              }}
              className={`p-1.5 rounded-lg text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                role === 'family'
                  ? 'bg-[#143503] text-[#FFF2E6] shadow-xs'
                  : 'hover:bg-white text-[#143503]'
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-xs">
                <HeartHandshake size={12} />
                <span>Family Member</span>
              </div>
              <span
                className={`text-[9px] leading-tight ${
                  role === 'family' ? 'text-[#FFF2E6]/80' : 'text-[#4B633E]'
                }`}
              >
                Feed, edit schedules & alarms
              </span>
            </button>

            {/* Pet Sitter Option */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setRole('guest');
              }}
              className={`p-1.5 rounded-lg text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                role === 'guest'
                  ? 'bg-[#143503] text-[#FFF2E6] shadow-xs'
                  : 'hover:bg-white text-[#143503]'
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-xs">
                <Shield size={12} />
                <span>Pet Sitter</span>
              </div>
              <span
                className={`text-[9px] leading-tight ${
                  role === 'guest' ? 'text-[#FFF2E6]/80' : 'text-[#4B633E]'
                }`}
              >
                Feed & check history logs only
              </span>
            </button>
          </div>
        </div>

        {/* 3. Generated Invite Link Box */}
        <div className="flex flex-col gap-1 relative z-10">
          <label className="text-[11px] font-bold text-[#143503] flex items-center justify-between">
            <span>Telegram Invitation Link</span>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowQr(!showQr);
              }}
              className="text-[9.5px] font-bold text-[#143503] hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <QrCode size={10} />
              <span>{showQr ? 'Hide QR' : 'Show QR'}</span>
            </button>
          </label>

          <div className="flex items-center gap-1.5 bg-white rounded-xl border border-[#143503]/15 p-1.5 shadow-2xs">
            <input
              type="text"
              readOnly
              value={isGenerating ? 'Generating secure link...' : inviteUrl}
              className="flex-1 bg-transparent text-[11px] font-mono text-[#143503] outline-none px-1 truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              disabled={isGenerating || !inviteUrl}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#A7D1AE]/35 hover:bg-[#A7D1AE]/60 text-[#143503] border border-[#143503]/10'
              }`}
            >
              {copied ? (
                <>
                  <Check size={11} strokeWidth={3} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={11} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4. Real Scannable QR Code Preview */}
        {showQr && inviteUrl && (
          <div className="p-2.5 rounded-xl bg-white border border-[#143503]/10 flex flex-col items-center justify-center gap-1.5 text-center relative z-10 animate-fadeIn">
            <div className="p-1.5 bg-white rounded-lg border border-[#143503]/15 shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=4&data=${encodeURIComponent(inviteUrl)}`}
                alt="Invite QR Code"
                width={120}
                height={120}
                className="w-28 h-28 object-contain rounded"
              />
            </div>
            <span className="text-[9px] text-[#4B633E] font-medium">
              Point phone camera or scan in Telegram to join {petName}&apos;s feeder
            </span>
          </div>
        )}

        {/* 5. Direct Telegram Share Action */}
        <div className="pt-1 flex flex-col gap-1.5 relative z-10">
          <button
            type="button"
            onClick={handleShareTelegram}
            disabled={isGenerating || !inviteUrl}
            className="w-full py-2 rounded-xl bg-[#143503] hover:bg-[#143503]/90 text-[#FFF2E6] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            <Send size={12} />
            <span>Send Invite in Telegram Chat</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
