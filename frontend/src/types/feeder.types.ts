export type FeedSource = 'scheduled' | 'manual_app' | 'physical_button' | 'telegram_group';

export type ActuationStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'timeout';

export interface FeederDevice {
  id: string;
  name: string;
  petName: string;
  petEmoji?: string;
  petIcon?: string;
  room: string;
  isOnline: boolean;
  rtcValid: boolean;
  wifiRssi?: number;
  lastSeenAt: string;
  nextScheduledFeedAt?: string | null;
  lastFeedAt?: string | null;
  todayMealsServed?: number;
  todayMealsTarget?: number;
  customPresets?: PortionPreset[];
  isAwayMode?: boolean;
  claimToken?: string;
  telegramGroupId?: string | null;
  telegramGroupName?: string | null;
  groupFeedEnabled?: boolean;
  groupGuestFeedAllowed?: boolean;
}

export interface PortionPreset {
  id: 'snack' | 'bowl' | 'feast';
  name: string;
  emoji?: string;
  icon?: string;
  durationMs: number;
  labelSeconds: string;
  description: string;
}

export interface FeedingSchedule {
  id: string;
  deviceId: string;
  timeLocal: string; // HH:mm format, e.g. "08:00"
  daysOfWeek: number[]; // 0 = Sunday, 1 = Mon, ..., 6 = Sat
  durationMs: number;
  enabled: boolean;
  label?: string;
}

export interface FeedingEvent {
  id: string;
  deviceId: string;
  deviceName: string;
  source: FeedSource;
  status: ActuationStatus;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  note?: string;
}

export interface DeviceSettings {
  deviceId: string;
  buzzerEnabled: boolean;
  buzzerTone: 'chirp' | 'beep' | 'melody';
  soundAlertEnabled: boolean;
  telegramNotificationsEnabled: boolean;
  cooldownSeconds: number;
  maxFeedsPerDay: number;
}

export interface DeviceMember {
  id: string;
  deviceId: string;
  userId: string;
  userName: string;
  role: 'owner' | 'family' | 'guest';
  avatarEmoji?: string;
  telegramId?: number;
  createdAt: string;
}

