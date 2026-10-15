'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Utensils, Clock, History, Sliders } from 'lucide-react';
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
      icon: Utensils,
      isActive: pathname === '/' || pathname === '/feed',
    },
    {
      href: '/schedule',
      label: 'Schedule',
      icon: Clock,
      isActive: pathname.startsWith('/schedule'),
    },
    {
      href: '/history',
      label: 'History',
      icon: History,
      isActive: pathname.startsWith('/history'),
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Sliders,
      isActive: pathname.startsWith('/settings'),
    },
  ];

  return (
    <nav
      className="fixed bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-[360px] h-[54px] bg-white/85 backdrop-blur-2xl border border-white/80 ring-1 ring-[#143503]/8 rounded-[20px] flex items-center justify-between p-1 z-40 shadow-[0_12px_32px_-6px_rgba(20,53,3,0.20)] select-none transition-all duration-300"
      aria-label="Main Navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.isActive;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            onClick={handleNavClick}
            className={`group relative flex-1 h-full flex flex-col items-center justify-center rounded-[15px] transition-all duration-300 ease-out ${
              active
                ? 'bg-gradient-to-b from-[#143503] to-[#1c4406] text-[#FFF2E6] shadow-[0_4px_12px_rgba(20,53,3,0.24)] ring-1 ring-white/20'
                : 'text-[#4B633E] hover:text-[#143503] hover:bg-[#143503]/6 active:scale-95'
            }`}
          >
            {/* Top delicate highlight glow when active */}
            {active && (
              <div className="absolute top-0.5 inset-x-2.5 h-[1px] bg-gradient-to-r from-transparent via-[#A7D1AE]/60 to-transparent pointer-events-none" />
            )}

            <div className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <Icon size={15} className={active ? 'text-[#FFF2E6]' : 'text-current'} />
              {active && (
                <span className="absolute -top-0.5 -right-1 w-1 h-1 rounded-full bg-[#A7D1AE] shadow-[0_0_5px_#A7D1AE] animate-pulse" />
              )}
            </div>

            <span
              className={`text-[9.5px] font-bold tracking-tight mt-0.5 leading-none transition-colors duration-200 ${
                active ? 'text-[#FFF2E6]' : 'text-[#4B633E] group-hover:text-[#143503]'
              }`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
