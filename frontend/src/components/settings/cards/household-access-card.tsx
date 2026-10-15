'use client';

import React from 'react';
import { DeviceMember } from '@/types/feeder.types';
import { triggerHaptic } from '@/lib/utils/telegram.util';
import { Users, UserPlus, X } from 'lucide-react';

interface HouseholdAccessCardProps {
  members: DeviceMember[];
  petName: string;
  onOpenInviteModal: () => void;
  onPromptRemoveMember: (member: { id: string; name: string }) => void;
}

export function HouseholdAccessCard({
  members,
  petName,
  onOpenInviteModal,
  onPromptRemoveMember,
}: HouseholdAccessCardProps) {
  return (
    <div className="artisan-card p-4 sm:p-5 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#BCDBF0]/40 text-[#143503] flex items-center justify-center shrink-0 border border-[#143503]/10">
            <Users size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-[#143503] truncate">
              Household & Family Access
            </h3>
            <p className="text-xs text-[#4B633E] truncate">
              People connected to {petName}&apos;s Feeder
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onOpenInviteModal();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#143503] hover:bg-[#143503]/90 text-[#FFF2E6] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
        >
          <UserPlus size={12} />
          <span>Invite</span>
        </button>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-2.5 rounded-2xl bg-white/80 border border-[#143503]/10 shadow-2xs hover:border-[#143503]/20 transition-all"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#A7D1AE]/35 text-base flex items-center justify-center shrink-0 border border-[#143503]/10 shadow-2xs">
                {member.avatarEmoji || (member.role === 'owner' ? '👑' : member.role === 'guest' ? '🐾' : '👤')}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#143503] truncate">
                    {member.userName}
                  </span>
                  {member.role === 'owner' && (
                    <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-full border border-amber-200 shrink-0">
                      Owner
                    </span>
                  )}
                  {member.role === 'family' && (
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200 shrink-0">
                      Family
                    </span>
                  )}
                  {member.role === 'guest' && (
                    <span className="text-[9px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded-full border border-sky-200 shrink-0">
                      Pet Sitter
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#4B633E] truncate mt-0.5">
                  {member.role === 'owner'
                    ? 'Primary administrator'
                    : member.role === 'family'
                    ? 'Can feed & edit schedules'
                    : 'Feed & check logs only'}
                </div>
              </div>
            </div>

            {member.role !== 'owner' && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  onPromptRemoveMember({ id: member.id, name: member.userName });
                }}
                className="w-6 h-6 rounded-full hover:bg-rose-50 text-rose-500 hover:text-rose-700 flex items-center justify-center cursor-pointer transition-colors shrink-0 ml-1"
                title={`Remove ${member.userName}`}
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
