'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Utensils, Sliders, History } from 'lucide-react';
import { triggerHaptic } from '@/lib/utils/telegram.util';

export function BottomNav() {
  const pathname = usePathname();

  const handleNavClick = () => {
    triggerHaptic('light');
  };

  const tabs = [
    {
      href: '/',
      label: 'Feed',
      khmer: 'ចំណី',
      icon: <Utensils size={17} />,
      isActive: pathname === '/' || pathname === '/feed',
    },
    {
      href: '/settings',
      label: 'Schedule',
      khmer: 'កំណត់',
      icon: <Sliders size={17} />,
      isActive: pathname.startsWith('/settings'),
    },
    {
      href: '/history',
      label: 'History',
      khmer: 'ប្រវត្តិ',
      icon: <History size={17} />,
      isActive: pathname.startsWith('/history'),
    },
  ];

  return (
    <nav
      className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md h-16 bg-white/95 backdrop-blur-2xl border border-[#143503]/10 rounded-2xl flex items-center justify-around p-1.5 z-40 shadow-lg shadow-[#143503]/8 select-none"
      aria-label="Main Navigation"
    >
      {tabs.map((tab) => {
        return (
          <Link
            key={tab.href}
            href={tab.href}
            onClick={handleNavClick}
            className={`flex-1 h-full flex flex-col items-center justify-center rounded-xl transition-all duration-200 ${
              tab.isActive
                ? 'bg-[#143503] text-[#FFF2E6] shadow-xs font-semibold'
                : 'text-[#4B633E] hover:text-[#143503] hover:bg-[#143503]/5 font-medium'
            }`}
          >
            {tab.icon}
            <span className="text-xs mt-1 tracking-tight flex items-center gap-1 leading-none">
              <span>{tab.label}</span>
              <span className="text-xs opacity-75 font-normal">({tab.khmer})</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
