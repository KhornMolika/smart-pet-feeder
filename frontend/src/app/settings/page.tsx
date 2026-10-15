import { Metadata } from 'next';
import { Suspense } from 'react';
import { SettingsScreen } from '@/components/settings/settings-screen';

export const metadata: Metadata = {
  title: 'ចិញ្ចឹម (ChinChem) | Feeder & Fleet Settings',
  description: 'Manage feeder devices, household member access, and Telegram notifications.',
};

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsScreen />
    </Suspense>
  );
}
