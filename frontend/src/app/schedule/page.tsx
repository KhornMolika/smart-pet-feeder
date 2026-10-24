import { Metadata } from 'next';
import { Suspense } from 'react';
import { ScheduleScreen } from '@/components/schedule/schedule-screen';

export const metadata: Metadata = {
  title: 'Feeding Schedules & Alarms',
  description:
    'Manage automated daily feeding routines, set precision meal portion timers, and configure daily nutrition targets.',
};

export default function SchedulePage() {
  return (
    <Suspense fallback={null}>
      <ScheduleScreen />
    </Suspense>
  );
}
