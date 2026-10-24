export function triggerHaptic(
  style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'selection' = 'light',
) {
  if (typeof window === 'undefined') return;

  try {
    const tg = (window as unknown as {
      Telegram?: {
        WebApp?: {
          isVersionAtLeast?: (ver: string) => boolean;
          HapticFeedback?: {
            impactOccurred: (s: string) => void;
            notificationOccurred: (s: string) => void;
            selectionChanged: () => void;
          };
        };
      };
    }).Telegram?.WebApp;

    if (tg?.isVersionAtLeast?.('6.1') && tg?.HapticFeedback) {
      if (style === 'selection') {
        tg.HapticFeedback.selectionChanged();
      } else {
        tg.HapticFeedback.impactOccurred(style);
      }
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(style === 'heavy' ? 40 : 20);
    }
  } catch {}
}

export function triggerNotificationHaptic(type: 'error' | 'success' | 'warning') {
  if (typeof window === 'undefined') return;

  try {
    const tg = (window as unknown as {
      Telegram?: {
        WebApp?: {
          isVersionAtLeast?: (ver: string) => boolean;
          HapticFeedback?: { notificationOccurred: (s: string) => void };
        };
      };
    }).Telegram?.WebApp;

    if (tg?.isVersionAtLeast?.('6.1') && tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred(type);
    }
  } catch {}
}

import { BuzzerToneType } from './audio.util';

export function getTelegramWebApp() {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { Telegram?: { WebApp?: { ready?: () => void; expand?: () => void } } }).Telegram?.WebApp || null;
}

export function getTelegramStartParam(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Check native Telegram WebApp start_param
    const tg = (window as unknown as {
      Telegram?: {
        WebApp?: {
          initDataUnsafe?: {
            start_param?: string;
          };
        };
      };
    }).Telegram?.WebApp;

    if (tg?.initDataUnsafe?.start_param) {
      return tg.initDataUnsafe.start_param;
    }

    // 2. Fallback to standard URL search params for web preview / browser testing
    const searchParams = new URLSearchParams(window.location.search);
    const startAppParam =
      searchParams.get('startapp') || searchParams.get('start') || searchParams.get('claim');
    if (startAppParam) {
      return startAppParam;
    }
  } catch {}

  return null;
}

export interface TelegramUserInfo {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  displayName: string;
}

export function getTelegramUser(): TelegramUserInfo | null {
  if (typeof window === 'undefined') return null;

  try {
    const tg = (window as unknown as {
      Telegram?: {
        WebApp?: {
          initDataUnsafe?: {
            user?: {
              id: number;
              first_name: string;
              last_name?: string;
              username?: string;
            };
          };
        };
      };
    }).Telegram?.WebApp;

    const user = tg?.initDataUnsafe?.user;
    if (user && user.first_name) {
      const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ');
      return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
        displayName: displayName || user.first_name,
      };
    }
  } catch {}

  return null;
}

export function getTelegramAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-bff-source': 'NextJS-AppRouter',
  };

  const user = getTelegramUser();
  if (user) {
    headers['x-telegram-user-id'] = String(user.id);
    headers['x-telegram-user-name'] = user.displayName;
    if (user.username) headers['x-telegram-username'] = user.username;
  }

  const initData = getTelegramInitData();
  if (initData) {
    headers['x-telegram-init-data'] = initData;
  }

  return headers;
}

export function getTelegramInitData(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp
      ?.initData || null
  );
}

/**
 * Extract claim token from raw QR code text or URL
 * e.g. "https://t.me/ChinChemBot/app?startapp=claim_feeder_esp32_01" -> "claim_feeder_esp32_01"
 * e.g. "claim_feeder_esp32_01" -> "claim_feeder_esp32_01"
 * e.g. "feeder_esp32_01" -> "claim_feeder_esp32_01"
 */
export function parseFeederClaimToken(rawInput: string): string | null {
  if (!rawInput) return null;
  const trimmed = rawInput.trim();

  // If it's a URL
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('tg://')) {
      const url = new URL(trimmed);
      const startParam =
        url.searchParams.get('startapp') ||
        url.searchParams.get('start') ||
        url.searchParams.get('claim') ||
        url.searchParams.get('tgWebAppStartParam');
      if (startParam) {
        return startParam.startsWith('claim_') ? startParam : `claim_${startParam}`;
      }
    }
  } catch {}

  // If raw token or device id
  if (trimmed.startsWith('claim_')) {
    return trimmed;
  }
  if (trimmed.startsWith('feeder_') || trimmed.startsWith('feeder-')) {
    return `claim_${trimmed}`;
  }

  return trimmed;
}

/**
 * Open Telegram WebApp native QR scanner popup
 * Returns true if native Telegram QR scanner is supported and opened, false otherwise
 */
export function openTelegramQrScanner(
  promptText: string,
  onScan: (scannedText: string) => boolean | void,
): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const tg = (window as unknown as {
      Telegram?: {
        WebApp?: {
          showScanQrPopup?: (
            params: { text?: string },
            callback: (text: string) => boolean | void,
          ) => void;
          closeScanQrPopup?: () => void;
        };
      };
    }).Telegram?.WebApp;

    if (typeof tg?.showScanQrPopup === 'function') {
      tg.showScanQrPopup({ text: promptText }, (text: string) => {
        const close = onScan(text);
        return close ?? true;
      });
      return true;
    }
  } catch {}

  return false;
}

export function closeTelegramQrScanner() {
  if (typeof window === 'undefined') return;
  try {
    const tg = (window as unknown as {
      Telegram?: {
        WebApp?: {
          closeScanQrPopup?: () => void;
        };
      };
    }).Telegram?.WebApp;
    tg?.closeScanQrPopup?.();
  } catch {}
}

export interface NotificationAlertConfig {
  telegramEnabled: boolean;
  mealServedAlert: boolean;
  jamAndErrorAlert: boolean;
  physicalButtonAlert: boolean;
  dailyDigestAlert: boolean;
  soundChimeEnabled: boolean;
  soundToneId: BuzzerToneType;
  soundTiming: 'before' | 'after';
  soundRepeatCount: 1 | 2 | 3;
}

export const DEFAULT_NOTIFICATION_CONFIG: NotificationAlertConfig = {
  telegramEnabled: true,
  mealServedAlert: true,
  jamAndErrorAlert: true,
  physicalButtonAlert: true,
  dailyDigestAlert: false,
  soundChimeEnabled: true,
  soundToneId: 'gentle_chime',
  soundTiming: 'before',
  soundRepeatCount: 2,
};


const STORAGE_KEY_NOTIFICATION_CONFIG = 'chinchum_notification_config';

export function getStoredNotificationConfig(): NotificationAlertConfig {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATION_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATION_CONFIG);
    if (raw) return { ...DEFAULT_NOTIFICATION_CONFIG, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_NOTIFICATION_CONFIG;
}

export function saveStoredNotificationConfig(config: NotificationAlertConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFICATION_CONFIG, JSON.stringify(config));
  } catch {}
}

export function formatTelegramBotAlert(
  eventType: 'meal_served' | 'food_jam' | 'button_pressed' | 'daily_digest',
  data: {
    petName: string;
    room?: string;
    mealName?: string;
    duration?: string;
    servedToday?: number;
    targetToday?: number;
  }
): string {
  switch (eventType) {
    case 'meal_served':
      return `🍽️ Meal Served for ${data.petName}: ${data.mealName || 'Regular Meal'} (${data.duration || '1m'}) in ${data.room || 'Living Room'}`;
    case 'food_jam':
      return `🚨 Dispenser Jam Alert: Motor obstruction detected on ${data.petName}'s feeder (${data.room || 'Feeder'}). Food chute cleared.`;
    case 'button_pressed':
      return `🐾 Manual Feed Button: Someone pressed the physical feed button on ${data.petName}'s feeder in ${data.room || 'Living Room'}.`;
    case 'daily_digest':
      return `📊 Daily Feeding Digest: ${data.petName} had ${data.servedToday ?? 3}/${data.targetToday ?? 3} meals today.`;
  }
}
