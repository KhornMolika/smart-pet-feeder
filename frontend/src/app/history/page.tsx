import { Metadata } from 'next';
import { Suspense } from 'react';
import { HistoryScreen } from '@/components/history/history-screen';

export const metadata: Metadata = {
  title: 'Feeding History & Dispense Logs',
  description:
    'Review real-time meal dispensing activity, monitor portion durations, and export historical feeding records.',
};

export default function HistoryPage() {
  return (
    <Suspense fallback={null}>
      <HistoryScreen />
    </Suspense>
  );
}
