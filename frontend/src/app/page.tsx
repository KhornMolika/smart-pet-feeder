import { Metadata } from 'next';
import { FeedScreen } from '@/components/feed/feed-screen';

export const metadata: Metadata = {
  title: 'Dashboard — Feed Your Pets',
  description:
    'Feed your pets instantly, control portion timers, and monitor daily nutrition targets directly through Telegram.',
};

export default function FeederHomePage() {
  return <FeedScreen />;
}
