export function triggerHaptic(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') {
  if (typeof window === 'undefined') return;

  try {
    const tg = (window as unknown as {
      Telegram?: {
        WebApp?: {
          isVersionAtLeast?: (ver: string) => boolean;
          HapticFeedback?: {
            impactOccurred: (s: string) => void;
            notificationOccurred: (s: string) => void;
          };
        };
      };
    }).Telegram?.WebApp;

    if (tg?.isVersionAtLeast?.('6.1') && tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred(style);
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

export function getTelegramWebApp() {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { Telegram?: { WebApp?: { ready?: () => void; expand?: () => void } } }).Telegram?.WebApp || null;
}
