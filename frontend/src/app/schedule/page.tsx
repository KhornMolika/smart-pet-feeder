import { Metadata } from 'next';
import { Suspense } from 'react';
import { ScheduleScreen } from '@/components/schedule/schedule-screen';

export const metadata: Metadata = {
  title: 'ចិញ្ចឹម (ChinChem) | Feeding Schedules & Alarms',
  description: 'Manage automated feeding schedules, portion timers, and daily meal goals.',
};

export default function SchedulePage() {
  return (
    <Suspense fallback={null}>
      <ScheduleScreen />
    </Suspense>
  );
}
