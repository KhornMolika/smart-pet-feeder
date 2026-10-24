import { Metadata } from 'next';
import { Suspense } from 'react';
import { SettingsScreen } from '@/components/settings/settings-screen';

export const metadata: Metadata = {
  title: 'Device & Telegram Settings',
  description:
    'Manage hardware feeders, household family access, custom melody chime alerts, and Telegram group feeding permissions.',
};

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsScreen />
    </Suspense>
  );
}
