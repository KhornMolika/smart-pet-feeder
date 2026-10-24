import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FeederProvider } from '@/context/feeder-context';
import { AppShell } from '@/components/layout/app-shell';

export const metadata: Metadata = {
  metadataBase: new URL('https://chinchem.molika.app'),
  title: {
    default: 'ចិញ្ចឹម (ChinChem) — Smart Pet Feeder Telegram Mini App',
    template: '%s | ចិញ្ចឹម (ChinChem)',
  },
  description:
    'Automate your pet’s daily meals, control portion sizes (30s snack, 1m bowl, 3m feast), feed remotely in Telegram family chats, and track feeding logs in real time.',
  keywords: [
    'ChinChem',
    'ចិញ្ចឹម',
    'Smart Pet Feeder',
    'Telegram Mini App',
    'Pet Feeder IoT',
    'ESP32 Feeder',
    'Automated Cat Feeder',
    'Automated Dog Feeder',
    'Pet Nutrition',
  ],
  authors: [{ name: 'ChinChem Team', url: 'https://chinchem.molika.app' }],
  creator: 'ChinChem',
  publisher: 'ChinChem',
  applicationName: 'ChinChem Smart Feeder',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'km_KH',
    alternateLocale: ['en_US'],
    url: 'https://chinchem.molika.app',
    siteName: 'ចិញ្ចឹម (ChinChem)',
    title: 'ចិញ្ចឹម (ChinChem) — Smart Pet Feeder Telegram Mini App',
    description:
      'Automate your pet’s daily meals, control portion sizes (30s snack, 1m bowl, 3m feast), feed remotely in Telegram family chats, and track feeding logs in real time.',
    images: [
      {
        url: '/images/chinchem-og-1200x630.png',
        width: 1200,
        height: 630,
        alt: 'ចិញ្ចឹម (ChinChem) Smart Pet Feeder',
      },
      {
        url: '/images/chinchem-cover-640x360.png',
        width: 640,
        height: 360,
        alt: 'ចិញ្ចឹម (ChinChem) Telegram Mini App Cover',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ចិញ្ចឹម (ChinChem) — Smart Pet Feeder',
    description:
      'Automate your pet’s daily meals, control portion sizes, and feed remotely via Telegram.',
    images: ['/images/chinchem-og-1200x630.png'],
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
