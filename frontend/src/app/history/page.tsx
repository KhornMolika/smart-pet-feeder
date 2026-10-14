import { Metadata } from 'next';
import { HistoryScreen } from '@/components/history/history-screen';

export const metadata: Metadata = {
  title: 'ចិញ្ចឹម (ChinChem) | Feeding History & Logs',
  description: 'View real-time dispensing logs and export feeding records.',
};

export default function HistoryPage() {
  return <HistoryScreen />;
}
