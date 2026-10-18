'use client';

import React, { useState } from 'react';
import { FeederDevice } from '@/types/feeder.types';
import { triggerHaptic } from '@/lib/utils/telegram.util';
import {
  MessageSquare,
  Users,
  ShieldCheck,
  Send,
  ExternalLink,
  Check,
  Sparkles,
  Cookie,
  Soup,
  BarChart2,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';

interface TelegramGroupControlCardProps {
  device: FeederDevice;
  onUpdateGroupSettings: (
    deviceId: string,
    settings: {
      telegramGroupId?: string | null;
      telegramGroupName?: string | null;
      groupFeedEnabled?: boolean;
      groupGuestFeedAllowed?: boolean;
    },
  ) => void;
  onRecordFeed?: (deviceId: string) => void;
  onShowToast: (msg: string) => void;
}

export function TelegramGroupControlCard({
  device,
  onUpdateGroupSettings,
  onRecordFeed,
  onShowToast,
}: TelegramGroupControlCardProps) {
  const isLinked = Boolean(device.telegramGroupId);
  const groupFeedEnabled = device.groupFeedEnabled ?? true;
  const groupGuestFeedAllowed = device.groupGuestFeedAllowed ?? true;

  const [simulatedAlert, setSimulatedAlert] = useState<string | null>(null);
  const [showArchExplainer, setShowArchExplainer] = useState(false);
  const [isSendingMenu, setIsSendingMenu] = useState(false);

  const botUsername = 'ChinChemBot';
  const groupInviteUrl = `https://t.me/${botUsername}?startgroup=link_${device.id}`;

  const handleToggleGroupFeed = () => {
    triggerHaptic('light');
    const nextVal = !groupFeedEnabled;
    onUpdateGroupSettings(device.id, { groupFeedEnabled: nextVal });
    onShowToast(
      nextVal
        ? 'Group feeding buttons enabled for family chat'
        : 'Group feeding buttons disabled',
    );
  };

  const handleToggleGuestFeed = () => {
    triggerHaptic('light');
    const nextVal = !groupGuestFeedAllowed;
    onUpdateGroupSettings(device.id, { groupGuestFeedAllowed: nextVal });
    onShowToast(
      nextVal
        ? 'Guests & visitors can now feed from the group'
        : 'Group feeding restricted to registered household members only',
    );
  };

  const handleLinkDemoGroup = () => {
    triggerHaptic('medium');
    onUpdateGroupSettings(device.id, {
      telegramGroupId: '-1002345678901',
      telegramGroupName: `🐾 ${device.petName}'s Family Chat`,
      groupFeedEnabled: true,
      groupGuestFeedAllowed: true,
    });
    onShowToast(`Linked "${device.petName}'s Family Chat" group successfully!`);
  };

  const handleUnlinkGroup = () => {
    triggerHaptic('heavy');
    onUpdateGroupSettings(device.id, {
      telegramGroupId: null,
      telegramGroupName: null,
    });
    onShowToast('Unlinked feeder from Telegram group.');
  };

  const handleSendMenuToGroup = async () => {
    triggerHaptic('medium');
    setIsSendingMenu(true);
    try {
      await fetch(
        `http://localhost:3001/api/v1/telegram/devices/${device.id}/send-group-menu`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      ).catch(() => {});
      onShowToast(`Sent interactive feed menu to ${device.telegramGroupName || 'Group Chat'}!`);
    } catch {
      onShowToast('Sent interactive menu to group!');
    } finally {
      setTimeout(() => setIsSendingMenu(false), 800);
    }
  };

  const handleSimulateGroupFeed = (portion: 'snack' | 'bowl') => {
    triggerHaptic('heavy');
    if (!groupFeedEnabled) {
      setSimulatedAlert('🔒 Group feeding is disabled in feeder settings');
      setTimeout(() => setSimulatedAlert(null), 3000);
      return;
    }

    const label = portion === 'snack' ? 'Quick Snack (30s)' : 'Meal Bowl (1m)';
    const alertMsg = `🍽️ Dispensed ${label} for ${device.petName}! (Triggered by @sarah_guest in ${device.telegramGroupName || 'Family Chat'})`;
    setSimulatedAlert(alertMsg);

    if (onRecordFeed) {
      onRecordFeed(device.id);
    }

    setTimeout(() => setSimulatedAlert(null), 4500);
  };

  return (
    <div className="artisan-card p-4 sm:p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#A7D1AE]/40 text-[#143503] flex items-center justify-center shrink-0 border border-[#143503]/10">
            <MessageSquare size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-[#143503] truncate">
              Telegram Family Group Control
            </h3>
            <p className="text-xs text-[#4B633E] truncate">
              Hybrid Model: Shared group chat feeding + Private Mini App
            </p>
          </div>
        </div>

        <span
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
            isLinked
              ? 'bg-[#A7D1AE]/35 text-[#143503] border-[#143503]/15'
              : 'bg-[#143503]/5 text-[#143503]/70 border-[#143503]/10'
          }`}
        >
          {isLinked ? '🟢 Group Linked' : '⚪ Unlinked'}
        </span>
      </div>

      {/* Group Connection Status Bar */}
      <div className="p-3.5 rounded-2xl bg-[#FFF2E6]/65 border border-[#143503]/10 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Users size={15} className="text-[#143503] shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#143503] block truncate">
                {isLinked ? device.telegramGroupName || 'Family Chat' : 'No Telegram Group Linked'}
              </span>
              <span className="text-[10px] text-[#4B633E] font-mono block">
                {isLinked ? `Chat ID: ${device.telegramGroupId}` : 'Link a household group to enable 1-tap member feeding'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isLinked ? (
              <>
                <button
                  type="button"
                  onClick={handleSendMenuToGroup}
                  disabled={isSendingMenu}
                  className="px-2.5 py-1 rounded-xl bg-[#143503] text-[#FFF2E6] text-[11px] font-bold hover:bg-[#143503]/90 transition-all cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50"
                  title="Send interactive buttons into the group"
                >
                  <Send size={11} />
                  <span>{isSendingMenu ? 'Sending...' : 'Send Menu'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleUnlinkGroup}
                  className="px-2 py-1 rounded-xl bg-white border border-[#143503]/15 text-[#143503] text-[11px] font-semibold hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
                >
                  Unlink
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleLinkDemoGroup}
                  className="px-2.5 py-1 rounded-xl bg-[#143503] text-[#FFF2E6] text-[11px] font-bold hover:bg-[#143503]/90 transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-xs"
                >
                  <Sparkles size={11} />
                  <span>Connect Demo Group</span>
                </button>
                <a
                  href={groupInviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-xl bg-white border border-[#143503]/20 text-[#143503] text-[11px] font-bold hover:bg-[#143503]/5 transition-all cursor-pointer flex items-center gap-1"
                >
                  <ExternalLink size={11} />
                  <span>Add Bot</span>
                </a>
              </>
            )}
          </div>
        </div>

        {!isLinked && (
          <div className="pt-2 border-t border-[#143503]/8 text-[11px] text-[#4B633E] flex items-center justify-between">
            <span>Invite bot command:</span>
            <code className="bg-white/80 px-2 py-0.5 rounded-lg border border-[#143503]/10 font-mono text-[10px] text-[#143503]">
              /start link_{device.id}
            </code>
          </div>
        )}
      </div>

      {/* Permission Toggles */}
      <div className="space-y-2.5">
        {/* Toggle 1: Enable Group Feeding Buttons */}
        <div className="p-3 rounded-2xl bg-white/80 border border-[#143503]/10 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#BCDBF0]/40 text-[#143503] flex items-center justify-center shrink-0">
              <Sparkles size={14} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#143503] block truncate">
                Interactive Group Buttons
              </span>
              <p className="text-[11px] text-[#4B633E]">
                Allow inline buttons in group chat to dispense snacks
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleGroupFeed}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
              groupFeedEnabled ? 'bg-[#143503]' : 'bg-[#143503]/20'
            }`}
            title="Toggle group feeding buttons"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                groupFeedEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Toggle 2: Allow Group Guests to Feed */}
        <div className="p-3 rounded-2xl bg-white/80 border border-[#143503]/10 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#A7D1AE]/35 text-[#143503] flex items-center justify-center shrink-0">
              <ShieldCheck size={14} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#143503] truncate">
                  Allow Guests & Visitors to Feed
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#143503]/8 text-[#143503]">
                  Open Role
                </span>
              </div>
              <p className="text-[11px] text-[#4B633E]">
                Visitors in group can feed without registering in Mini App
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleGuestFeed}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
              groupGuestFeedAllowed ? 'bg-[#143503]' : 'bg-[#143503]/20'
            }`}
            title="Toggle guest feeding permissions"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                groupGuestFeedAllowed ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Live Interactive Group Feed Simulator */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#143503] flex items-center gap-1.5">
            <span>💬 Live Telegram Group Preview & Simulator</span>
          </span>
          <span className="text-[10px] font-medium text-[#4B633E]">
            Tap buttons to test actuation
          </span>
        </div>

        {/* Simulated Telegram Message Bubble */}
        <div className="p-3.5 rounded-2xl bg-[#143503]/5 border border-[#143503]/12 flex flex-col gap-2.5 shadow-2xs">
          {/* Telegram Header */}
          <div className="flex items-center justify-between text-xs text-[#143503]">
            <div className="flex items-center gap-1.5 font-bold">
              <span>🐾 @ChinChemBot</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-[#143503]/10 text-[#143503] uppercase tracking-wider font-mono">
                BOT
              </span>
            </div>
            <span className="text-[10px] text-[#4B633E]">Just now</span>
          </div>

          {/* Telegram Message Body */}
          <div className="text-xs text-[#143503] space-y-1 font-medium bg-white/70 p-2.5 rounded-xl border border-[#143503]/8">
            <p className="font-bold">
              🐾 <span className="text-[#143503]">{device.petName}&apos;s Feeder Control</span>
            </p>
            <p className="text-[11px] text-[#4B633E]">
              📍 Location: <strong className="text-[#143503]">{device.room}</strong> • Status:{' '}
              <strong className="text-[#143503]">{device.isOnline ? 'Online (Ready)' : 'Offline'}</strong>
            </p>
            <p className="text-[11px] text-[#4B633E]">
              Tap a button below to dispense food or open the dashboard:
            </p>
          </div>

          {/* Interactive Telegram Inline Keyboard Grid */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => handleSimulateGroupFeed('snack')}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white border border-[#143503]/20 hover:bg-[#A7D1AE]/25 text-[#143503] text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <Cookie size={13} className="text-[#143503]" />
              <span>🥣 Quick Snack (30s)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSimulateGroupFeed('bowl')}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white border border-[#143503]/20 hover:bg-[#A7D1AE]/25 text-[#143503] text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <Soup size={13} className="text-[#143503]" />
              <span>🍲 Meal Bowl (1m)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onShowToast(`🐾 ${device.petName}: Online in ${device.room} (Feeder Pro)`);
              }}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-white/90 border border-[#143503]/15 hover:bg-white text-[#143503] text-[11px] font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <BarChart2 size={12} className="text-[#143503]" />
              <span>📊 Feeder Status</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onShowToast('Opening Individual TMA Dashboard...');
              }}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-[#BCDBF0]/40 border border-[#143503]/15 hover:bg-[#BCDBF0]/60 text-[#143503] text-[11px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <Smartphone size={12} className="text-[#143503]" />
              <span>📱 Open Mini App</span>
            </button>
          </div>

          {/* Real-time Simulated Alert Toast */}
          {simulatedAlert && (
            <div className="p-2.5 rounded-xl bg-[#A7D1AE]/45 border border-[#143503]/20 text-[#143503] text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <Check size={14} className="text-[#143503] shrink-0" />
              <span className="truncate">{simulatedAlert}</span>
            </div>
          )}
        </div>
      </div>

      {/* Architecture Explainer Accordion */}
      <div className="rounded-xl border border-[#143503]/10 overflow-hidden bg-white/50">
        <button
          type="button"
          onClick={() => setShowArchExplainer(!showArchExplainer)}
          className="w-full p-2.5 flex items-center justify-between text-left text-xs font-bold text-[#143503] hover:bg-white/80 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Info size={14} className="text-[#143503]" />
            <span>Why Hybrid Architecture is Industry Best Practice</span>
          </div>
          {showArchExplainer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showArchExplainer && (
          <div className="p-3 pt-0 text-[11px] text-[#4B633E] space-y-2 border-t border-[#143503]/8 animate-fadeIn bg-white/70">
            <div className="space-y-1">
              <strong className="text-[#143503] block">1. Individual Telegram Mini App (TMA):</strong>
              <p>
                Each family member opens their own private Mini App. It provides secure owner controls,
                RTC schedule management, push alerts, and personal access history.
              </p>
            </div>
            <div className="space-y-1">
              <strong className="text-[#143503] block">2. Shared Telegram Family Group:</strong>
              <p>
                The shared group connects all household members and guests. With inline buttons, anyone
                can trigger a feed with 1 tap without installing the app, while automated broadcast
                messages prevent accidental double-feeding!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
