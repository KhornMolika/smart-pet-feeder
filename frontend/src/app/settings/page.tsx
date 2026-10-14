import { Metadata } from 'next';
import { SettingsScreen } from '@/components/settings/settings-screen';

export const metadata: Metadata = {
  title: 'ចិញ្ចឹម (ChinChem) | Schedule & Timer Settings',
  description: 'Manage automated feeding schedules and portion durations.',
};

export default function SettingsPage() {
  return <SettingsScreen />;
}
