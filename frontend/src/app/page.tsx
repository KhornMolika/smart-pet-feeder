import { Metadata } from 'next';
import { FeedScreen } from '@/components/feed/feed-screen';

export const metadata: Metadata = {
  title: 'ចិញ្ចឹម (ChinChem) | Smart Pet Feeder',
  description: 'Feed your pets, manage automated schedules, and review feeding logs.',
};

export default function FeederHomePage() {
  return <FeedScreen />;
}
