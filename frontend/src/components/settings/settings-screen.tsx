'use client';

import React, { useState, useEffect } from 'react';
import { FeederDevice } from '@/types/feeder.types';
import { useDeviceMembers } from '@/hooks/useDeviceMembers';
import { useFeederContext } from '@/context/feeder-context';
import {
  triggerHaptic,
  NotificationAlertConfig,
  DEFAULT_NOTIFICATION_CONFIG,
  getStoredNotificationConfig,
  saveStoredNotificationConfig,
  formatTelegramBotAlert,
} from '@/lib/utils/telegram.util';
import { playToneSound, SOUND_TONE_PRESETS } from '@/lib/utils/audio.util';

// Modular Cards
import { DeviceFleetCard } from './cards/device-fleet-card';
import { HouseholdAccessCard } from './cards/household-access-card';
import { TelegramGroupControlCard } from './cards/telegram-group-control-card';
import { TelegramNotificationsCard } from './cards/telegram-notifications-card';
import { MelodyChimeCard } from './cards/melody-chime-card';

// Modular Modals
import { UnpairDeviceModal } from './modals/unpair-device-modal';
import { MelodyPickerModal } from './modals/melody-picker-modal';
import { RevokeMemberModal } from './modals/revoke-member-modal';
import { InviteMemberModal } from '@/components/devices/invite-member-modal';
import { DeviceQrStickerModal } from '@/components/devices/device-qr-sticker-modal';
import { WifiSetupModal } from '@/components/devices/wifi-setup-modal';

import { Radio, Plus, Sparkles } from 'lucide-react';

interface SettingsScreenProps {
  devices?: FeederDevice[];
  activeDevice?: FeederDevice;
  onSelectDevice?: (deviceId: string) => void;
}

export function SettingsScreen(props: SettingsScreenProps = {}) {
  const context = useFeederContext();
  const devices = props.devices || context.devices;
  const activeDevice = props.activeDevice || context.activeDevice;

  if (!activeDevice || !devices || devices.length === 0) {
    return (
      <div className="w-full flex flex-col gap-4 animate-fadeIn">
        <div className="w-full flex flex-col items-center justify-center p-6 text-center bg-white/70 backdrop-blur-md rounded-3xl border border-[#143503]/10 shadow-sm gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#143503]/8 text-[#143503] flex items-center justify-center">
            <Radio size={28} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#143503]">No Feeder Registered</h2>
            <p className="text-xs text-[#4B633E] mt-1 max-w-xs leading-relaxed">
              Pair your hardware feeder to configure alert tones, household access, and Telegram group settings.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
            <button
              type="button"
              onClick={() => context.setIsAddDeviceOpen(true)}
              className="flex-1 py-2.5 rounded-2xl bg-[#143503] text-[#FFF2E6] text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-[#143503]/90 transition-all cursor-pointer active:scale-95"
            >
              <Plus size={14} />
              <span>Pair Feeder</span>
            </button>
            <button
              type="button"
              onClick={() => context.loadDemoData()}
              className="flex-1 py-2.5 rounded-2xl bg-white border border-[#143503]/15 text-[#143503] text-xs font-bold flex items-center justify-center gap-2 shadow-xs hover:bg-[#FFF2E6] transition-all cursor-pointer active:scale-95"
            >
              <Sparkles size={14} className="text-amber-600" />
              <span>Load Demo</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <SettingsDashboard {...props} activeDevice={activeDevice} devices={devices} />;
}

function SettingsDashboard({
  activeDevice,
  devices,
  onSelectDevice: propSelectDevice,
}: SettingsScreenProps & { activeDevice: FeederDevice; devices: FeederDevice[] }) {
  const context = useFeederContext();
  const onSelectDevice = propSelectDevice || context.switchDevice;

  const { members, createInvite, removeMember } = useDeviceMembers(activeDevice.id);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastVisible, setToastVisible] = useState(false);

  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showQrStickerModal, setShowQrStickerModal] = useState(false);
  const [showWifiModal, setShowWifiModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [deviceToUnpair, setDeviceToUnpair] = useState<FeederDevice | null>(null);
  const [showToneModal, setShowToneModal] = useState(false);

  // Notification & Audio Alert state
  const [notifConfig, setNotifConfig] = useState<NotificationAlertConfig>(DEFAULT_NOTIFICATION_CONFIG);
  const [testAlertToast, setTestAlertToast] = useState<string | null>(null);

  useEffect(() => {
    setNotifConfig(getStoredNotificationConfig());
  }, []);

  const currentTonePreset =
    SOUND_TONE_PRESETS.find((t) => t.id === (notifConfig.soundToneId || 'gentle_chime')) ||
    SOUND_TONE_PRESETS[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const handleConfirmUnpair = () => {
    if (!deviceToUnpair) return;
    triggerHaptic('heavy');
    const petName = deviceToUnpair.petName;
    const success = context.removeDevice(deviceToUnpair.id);
    showToast(success ? `Unpaired ${petName}'s feeder` : 'Cannot unpair your only active feeder');
    setDeviceToUnpair(null);
  };

  const updateNotifConfig = (partial: Partial<NotificationAlertConfig>) => {
    triggerHaptic('light');
    setNotifConfig((prev) => {
      const next = { ...prev, ...partial };
      saveStoredNotificationConfig(next);
      return next;
    });
  };

  const handleSendTestAlert = (eventType: 'meal_served' | 'food_jam') => {
    triggerHaptic('medium');
    const msg = formatTelegramBotAlert(eventType, {
      petName: activeDevice.petName,
      room: activeDevice.room,
      mealName: 'Morning Breakfast',
      duration: '1m',
    });
    setTestAlertToast(msg);
    setTimeout(() => setTestAlertToast(null), 4000);
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fadeIn pb-6">
      {/* Toast Notification Banner */}
      {toastVisible && (
        <div className="p-3 rounded-xl bg-[#A7D1AE]/45 border border-[#143503]/20 text-[#143503] text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Device Fleet Selector Card */}
      <DeviceFleetCard
        devices={devices}
        activeDevice={activeDevice}
        onSelectDevice={onSelectDevice}
        onOpenPairModal={() => context.setIsAddDeviceOpen(true)}
        onPromptUnpair={(dev) => setDeviceToUnpair(dev)}
        onOpenQrSticker={() => setShowQrStickerModal(true)}
        onOpenWifiGuide={() => setShowWifiModal(true)}
      />

      {/* 2. Household & Shared Access Card */}
      <HouseholdAccessCard
        members={members}
        petName={activeDevice.petName}
        onOpenInviteModal={() => setShowInviteModal(true)}
        onPromptRemoveMember={(mem) => setMemberToRemove(mem)}
      />

      {/* 3. Telegram Family Group Control (Hybrid Architecture) */}
      <TelegramGroupControlCard
        device={activeDevice}
        onUpdateGroupSettings={context.updateGroupSettings}
        onRecordFeed={context.recordDispense}
        onShowToast={showToast}
      />

      {/* 4. Telegram Notifications Card */}
      <TelegramNotificationsCard
        notifConfig={notifConfig}
        onUpdateNotifConfig={updateNotifConfig}
        onSendTestAlert={handleSendTestAlert}
        testAlertToast={testAlertToast}
      />

      {/* 4. Melody Chime Card */}
      <MelodyChimeCard
        notifConfig={notifConfig}
        currentTonePreset={currentTonePreset}
        onUpdateNotifConfig={updateNotifConfig}
        onOpenToneModal={() => setShowToneModal(true)}
        onTestCall={() => {
          triggerHaptic('light');
          playToneSound(notifConfig.soundToneId || 'gentle_chime', notifConfig.soundRepeatCount || 2);
        }}
      />

      {/* Modals */}
      <DeviceQrStickerModal
        isOpen={showQrStickerModal}
        onClose={() => setShowQrStickerModal(false)}
        device={activeDevice}
      />

      <WifiSetupModal
        isOpen={showWifiModal}
        onClose={() => setShowWifiModal(false)}
        deviceId={activeDevice.id}
      />

      <UnpairDeviceModal
        device={deviceToUnpair}
        onCancel={() => setDeviceToUnpair(null)}
        onConfirm={handleConfirmUnpair}
      />

      <MelodyPickerModal
        isOpen={showToneModal}
        onClose={() => setShowToneModal(false)}
        petName={activeDevice.petName}
        initialToneId={notifConfig.soundToneId || 'gentle_chime'}
        initialTiming={notifConfig.soundTiming || 'before'}
        initialRepeats={notifConfig.soundRepeatCount || 2}
        onApply={({ toneId, timing, repeats }) => {
          updateNotifConfig({
            soundToneId: toneId,
            soundTiming: timing,
            soundRepeatCount: repeats,
          });
          const chosen = SOUND_TONE_PRESETS.find((t) => t.id === toneId);
          showToast(`Melody set to "${chosen?.name || 'Dinner Chime'}" • ${timing === 'before' ? '1.5s Before Drop' : 'After Drop'} • ${repeats}x Call!`);
        }}
      />

      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        deviceId={activeDevice.id}
        petName={activeDevice.petName}
        onCreateInvite={createInvite}
      />

      <RevokeMemberModal
        member={memberToRemove}
        petName={activeDevice.petName}
        onCancel={() => setMemberToRemove(null)}
        onConfirm={() => {
          if (!memberToRemove) return;
          triggerHaptic('medium');
          removeMember(memberToRemove.id);
          showToast(`Revoked access for ${memberToRemove.name}`);
          setMemberToRemove(null);
        }}
      />
    </div>
  );
}
