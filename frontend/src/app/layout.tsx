import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FeederProvider } from '@/context/feeder-context';
import { AppShell } from '@/components/layout/app-shell';

export const metadata: Metadata = {
  title: 'ចិញ្ចឹម (ChinChem) | Smart Pet Feeder Telegram Mini App',
  description: 'Smart automated pet feeder with custom feeding schedules, portion control, and instant feeding.',
  icons: {
    icon: '/images/logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FFF2E6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="km" suppressHydrationWarning>
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" async />
      </head>
      <body className="min-h-screen bg-[#FFF2E6] text-[#143503] antialiased">
        <FeederProvider>
          <AppShell>{children}</AppShell>
        </FeederProvider>
      </body>
    </html>
  );
}
