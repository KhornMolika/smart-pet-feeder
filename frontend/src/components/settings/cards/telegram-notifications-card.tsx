'use client';

import React from 'react';
import { NotificationAlertConfig } from '@/lib/utils/telegram.util';
import { Bell, Send, Check } from 'lucide-react';

interface TelegramNotificationsCardProps {
  notifConfig: NotificationAlertConfig;
  onUpdateNotifConfig: (partial: Partial<NotificationAlertConfig>) => void;
  onSendTestAlert: (eventType: 'meal_served' | 'low_food' | 'food_jam') => void;
  testAlertToast: string | null;
}

export function TelegramNotificationsCard({
  notifConfig,
  onUpdateNotifConfig,
  onSendTestAlert,
  testAlertToast,
}: TelegramNotificationsCardProps) {
  return (
    <div className="artisan-card p-4 sm:p-5 flex flex-col gap-4">
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#143503]/8 text-[#143503] flex items-center justify-center shrink-0">
            <Bell size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-[#143503] truncate">Telegram Notifications</h3>
            <p className="text-xs text-[#4B633E] truncate">Telegram bot push events & feed alerts</p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold text-[#143503] bg-[#A7D1AE]/35 px-2 py-0.5 rounded-full border border-[#143503]/10 shrink-0">
          {notifConfig.telegramEnabled ? 'Bot Active' : 'Muted'}
        </span>
      </div>

      {/* Test Alert Simulation Banner */}
      {testAlertToast && (
        <div className="p-3 rounded-xl bg-[#BCDBF0]/40 border border-[#143503]/20 text-[#143503] text-xs font-semibold flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <Send size={14} className="text-[#143503] shrink-0" />
            <span className="truncate">{testAlertToast}</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#143503]/70 shrink-0">Test Sent</span>
        </div>
      )}

      <div className="space-y-3 mt-0.5">
        {/* Master Telegram Bot Toggle Card */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FFF2E6]/60 border border-[#143503]/12 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#BCDBF0]/50 text-[#143503] flex items-center justify-center shrink-0 border border-[#143503]/10">
                <Send size={15} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-[#143503] truncate">Telegram Bot Alerts</span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#143503]/8 text-[#143503]">@ChinChemBot</span>
                </div>
                <p className="text-xs text-[#4B633E] truncate mt-0.5">Push notifications to your Telegram channel or chat</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateNotifConfig({ telegramEnabled: !notifConfig.telegramEnabled })}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                notifConfig.telegramEnabled ? 'bg-[#143503]' : 'bg-[#143503]/20'
              }`}
              title={notifConfig.telegramEnabled ? 'Disable Telegram alerts' : 'Enable Telegram alerts'}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  notifConfig.telegramEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Granular Sub-Events */}
          {notifConfig.telegramEnabled && (
            <div className="pt-2.5 border-t border-[#143503]/10 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#143503]">Event Preferences:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSendTestAlert('meal_served')}
                    className="px-2 py-0.5 rounded-lg bg-white border border-[#143503]/15 text-[#143503] text-[10px] font-bold hover:bg-[#143503]/5 shadow-2xs transition-all cursor-pointer"
                    title="Send sample test alert"
                  >
                    Test Alert
                  </button>
                </div>
              </div>

              {/* Sub-Event 1: Meal Dispensed */}
              <div
                onClick={() => onUpdateNotifConfig({ mealServedAlert: !notifConfig.mealServedAlert })}
                className="flex items-center justify-between p-2 rounded-xl bg-white/70 hover:bg-white border border-[#143503]/8 transition-colors cursor-pointer text-xs"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-semibold text-[#143503] block truncate">🍽️ Meal Served Confirmations</span>
                  <span className="text-[11px] text-[#4B633E] block truncate">Scheduled & manual feeding confirmations with portion duration</span>
                </div>
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                  notifConfig.mealServedAlert ? 'bg-[#143503] border-[#143503] text-white' : 'border-[#143503]/30 bg-white'
                }`}>
                  {notifConfig.mealServedAlert && <Check size={11} strokeWidth={3} />}
                </div>
              </div>

              {/* Sub-Event 2: Low Food & Empty Tank */}
              <div
                onClick={() => onUpdateNotifConfig({ lowFoodAlert: !notifConfig.lowFoodAlert })}
                className="flex items-center justify-between p-2 rounded-xl bg-white/70 hover:bg-white border border-[#143503]/8 transition-colors cursor-pointer text-xs"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-semibold text-[#143503] block truncate">⚠️ Low Food & Empty Tank Alerts</span>
                  <span className="text-[11px] text-[#4B633E] block truncate">Instant warning when food level drops below 20% or empty</span>
                </div>
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                  notifConfig.lowFoodAlert ? 'bg-[#143503] border-[#143503] text-white' : 'border-[#143503]/30 bg-white'
                }`}>
                  {notifConfig.lowFoodAlert && <Check size={11} strokeWidth={3} />}
                </div>
              </div>

              {/* Sub-Event 3: Food Jam & Feeder Offline */}
              <div
                onClick={() => onUpdateNotifConfig({ jamAndErrorAlert: !notifConfig.jamAndErrorAlert })}
                className="flex items-center justify-between p-2 rounded-xl bg-white/70 hover:bg-white border border-[#143503]/8 transition-colors cursor-pointer text-xs"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-semibold text-[#143503] block truncate">🚨 Food Jam & Hardware Safety</span>
                  <span className="text-[11px] text-[#4B633E] block truncate">Urgent alert if kibble jams the motor or feeder goes offline</span>
                </div>
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                  notifConfig.jamAndErrorAlert ? 'bg-[#143503] border-[#143503] text-white' : 'border-[#143503]/30 bg-white'
                }`}>
                  {notifConfig.jamAndErrorAlert && <Check size={11} strokeWidth={3} />}
                </div>
              </div>

              {/* Sub-Event 4: Physical Machine Button */}
              <div
                onClick={() => onUpdateNotifConfig({ physicalButtonAlert: !notifConfig.physicalButtonAlert })}
                className="flex items-center justify-between p-2 rounded-xl bg-white/70 hover:bg-white border border-[#143503]/8 transition-colors cursor-pointer text-xs"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-semibold text-[#143503] block truncate">🐾 Physical Machine Button Feed</span>
                  <span className="text-[11px] text-[#4B633E] block truncate">Notify when someone presses the button directly on the feeder</span>
                </div>
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                  notifConfig.physicalButtonAlert ? 'bg-[#143503] border-[#143503] text-white' : 'border-[#143503]/30 bg-white'
                }`}>
                  {notifConfig.physicalButtonAlert && <Check size={11} strokeWidth={3} />}
                </div>
              </div>

              {/* Sub-Event 5: Evening Daily Summary Digest */}
              <div
                onClick={() => onUpdateNotifConfig({ dailyDigestAlert: !notifConfig.dailyDigestAlert })}
                className="flex items-center justify-between p-2 rounded-xl bg-white/70 hover:bg-white border border-[#143503]/8 transition-colors cursor-pointer text-xs"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-semibold text-[#143503] block truncate">📋 Daily Evening Digest (8:00 PM)</span>
                  <span className="text-[11px] text-[#4B633E] block truncate">Single daily recap of total meals served, treats, and food level</span>
                </div>
                <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                  notifConfig.dailyDigestAlert ? 'bg-[#143503] border-[#143503] text-white' : 'border-[#143503]/30 bg-white'
                }`}>
                  {notifConfig.dailyDigestAlert && <Check size={11} strokeWidth={3} />}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
