'use client';

import React, { useState } from 'react';
import { useOrgMembers } from '@/hooks/useOrganizations';
import { useWorkspaceStore } from '@/store/workspace';
import { User, Check, Search, Loader2 } from 'lucide-react';

interface ExecutiveSelectorProps {
  currentAssignee?: string;
  onAssign: (userId: string) => void;
  isUpdating?: boolean;
}

export function ExecutiveSelector({
  currentAssignee,
  onAssign,
  isUpdating = false,
}: ExecutiveSelectorProps) {
  const { activeOrgId } = useWorkspaceStore();
  const { data: members, isLoading } = useOrgMembers(activeOrgId);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Filter for 'executive' or 'field_agent' roles
  const executives = members?.filter(
    (m: any) =>
      ['executive', 'field_agent', 'admin', 'owner'].includes(m.role) &&
      (m.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        m.user?.email?.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedMember = members?.find(
    (m: any) => m.userId === currentAssignee
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className="bg-surface-container-low p-6 rounded-[2rem] border border-[var(--border-subtle)] space-y-2 group hover:border-primary/20 transition-all w-full text-left"
      >
        <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
          ASSIGNED_EXECUTIVE
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User
              className={`w-4 h-4 ${selectedMember ? 'text-primary' : 'text-[var(--text-muted)]/20'}`}
            />
            <span
              className={`text-sm font-black italic ${selectedMember ? 'text-[var(--color-text-base)]' : 'text-[var(--text-muted)]/40'}`}
            >
              {selectedMember?.user?.fullName || 'UNASSIGNED_PROTOCOL'}
            </span>
          </div>
          {isUpdating && (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-4 bg-background border border-[var(--border-subtle)] rounded-[2.5rem] shadow-obsidian-xl z-50 p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]/40" />
            <input
              className="w-full bg-surface-lowest border border-[var(--border-subtle)] rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-[var(--color-text-base)] outline-none focus:border-primary transition-all"
              placeholder="Filter by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1 pr-2">
            {isLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : executives?.length === 0 ? (
              <div className="py-8 text-center text-[10px] font-black text-[var(--text-muted)]/40 uppercase tracking-widest italic">
                No executives match filter
              </div>
            ) : (
              executives?.map((m: any) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onAssign(m.userId);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full p-4 rounded-xl transition-all group ${currentAssignee === m.userId ? 'bg-primary/10 border border-primary/20' : 'hover:bg-surface-lowest'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container-low border border-[var(--border-subtle)] flex items-center justify-center overflow-hidden">
                      {m.user?.avatarUrl ? (
                        <img
                          src={m.user.avatarUrl}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-[var(--text-muted)]/40" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-bold text-[var(--color-text-base)]">
                        {m.user?.fullName}
                      </p>
                      <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-tighter opacity-40">
                        {m.role}
                      </p>
                    </div>
                  </div>
                  {currentAssignee === m.userId && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
