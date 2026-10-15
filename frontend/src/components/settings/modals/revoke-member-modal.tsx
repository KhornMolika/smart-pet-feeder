'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

interface RevokeMemberModalProps {
  member: { id: string; name: string } | null;
  petName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RevokeMemberModal({
  member,
  petName,
  onCancel,
  onConfirm,
}: RevokeMemberModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (member) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [member]);

  if (!member || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fadeIn"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-[#FFF2E6] border border-[#143503]/15 shadow-2xl p-4 flex flex-col gap-3 animate-scaleUp relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#143503]/10">
          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#143503] leading-none">
              Revoke Access
            </h3>
            <p className="text-[10px] text-[#4B633E] mt-0.5">
              Remove {member.name} from feeder
            </p>
          </div>
        </div>

        <p className="text-xs text-[#143503]/85 leading-relaxed">
          Are you sure you want to revoke {member.name}&apos;s access to {petName}&apos;s feeder? They will no longer be able to dispense food or view feeding history.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="py-2 rounded-xl bg-white/70 hover:bg-white border border-[#143503]/15 text-xs font-semibold text-[#4B633E] transition-all cursor-pointer"
          >
            Keep Access
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
          >
            Revoke Member
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
