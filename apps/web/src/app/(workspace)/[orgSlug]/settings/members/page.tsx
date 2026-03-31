'use client';

import React, { useState } from 'react';
import {
  Shield,
  UserPlus,
  Mail,
  Trash2,
  Copy,
  Check,
  Search,
  Filter,
  MoreVertical,
  Clock,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/store/workspace';
import {
  useOrgMembers,
  useInviteMember,
  useOrgInvitations,
  useDeleteInvitation,
} from '@/hooks/useOrganizations';

export default function MembersSettings() {
  const activeOrgId = useWorkspaceStore((state) => state.activeOrgId);
  const { data: members, isLoading: isLoadingMembers } =
    useOrgMembers(activeOrgId);
  const { data: invitations, isLoading: isLoadingInvites } =
    useOrgInvitations(activeOrgId);
  const inviteMutation = useInviteMember(activeOrgId || '');
  const deleteInviteMutation = useDeleteInvitation(activeOrgId || '');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'guest'>(
    'member'
  );
  const [copyToken, setCopyToken] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      await inviteMutation.mutateAsync({
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteEmail('');
    } catch (error) {
      console.error('Invite failed', error);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyToken(id);
    setTimeout(() => setCopyToken(null), 2000);
  };

  const filteredMembers = members?.filter(
    (m) =>
      m.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoadingMembers || isLoadingInvites) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-base)] tracking-tight flex items-center gap-2">
            Team Members
            <span className="px-2.5 py-0.5 bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] text-xs font-bold rounded-full">
              {members?.length || 0}
            </span>
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm">
            Manage who has access to your organization and their permission
            levels.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface-soft)] text-[var(--color-text-base)] text-sm font-bold rounded-xl transition-all">
            <ShieldCheck className="w-4 h-4" />
            Roles & Permissions
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Members List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card-surface overflow-hidden">
            {/* Table Header / Filters */}
            <div className="p-4 border-b border-[var(--color-border-base)] flex items-center justify-between bg-[var(--color-surface-soft)]">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-[var(--color-text-base)]"
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] rounded-lg transition-all">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Members Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left bg-[var(--color-surface-muted)]/30 text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-bold">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-base)]/50">
                  {filteredMembers?.map((member) => (
                    <tr
                      key={member.id}
                      className="group hover:bg-[var(--color-surface-muted)] transition-all"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[var(--color-surface-muted)] rounded-full flex items-center justify-center overflow-hidden">
                            {member.user.avatarUrl ? (
                              <img
                                src={member.user.avatarUrl}
                                alt={member.user.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold text-[var(--color-text-muted)]">
                                {member.user.fullName.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[var(--color-text-base)]">
                              {member.user.fullName}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)]">
                              {member.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Shield
                            className={cn(
                              'w-3.5 h-3.5',
                              member.role === 'owner'
                                ? 'text-amber-500'
                                : member.role === 'admin'
                                  ? 'text-[var(--color-accent-base)]'
                                  : 'text-[var(--color-text-muted)]'
                            )}
                          />
                          <span className="text-xs font-semibold capitalize text-[var(--color-text-base)]">
                            {member.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-success-500/10 text-success-600 text-[10px] font-bold rounded-full border border-success-500/20">
                          <div className="w-1 h-1 bg-success-500 rounded-full" />
                          ACTIVE
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] rounded-lg hover:bg-[var(--color-surface-muted)] transition-all opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Invite & Queue Sidebar */}
        <div className="space-y-6">
          {/* Invite Form */}
          <div className="card-surface p-6 space-y-4">
            <h3 className="text-sm font-bold text-[var(--color-text-base)] uppercase tracking-widest flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[var(--color-accent-base)]" />{' '}
              Invite Teammate
            </h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text-muted)]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface-muted)] border border-[var(--color-border-base)] rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 outline-none text-[var(--color-text-base)]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text-muted)]">
                  Assign Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-[var(--color-surface-muted)] border border-[var(--color-border-base)] rounded-xl text-sm outline-none text-[var(--color-text-base)]"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="guest">Guest</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={inviteMutation.isPending || !inviteEmail}
                className="btn btn-primary w-full py-3 shadow-lg shadow-[var(--color-accent-base)]/20 disabled:opacity-50"
              >
                {inviteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Generate Invite Link'
                )}
              </button>
            </form>
            <p className="text-[10px] text-[var(--color-text-muted)] text-center leading-relaxed font-medium">
              A private invitation link will be generated. You can copy and send
              it manually.
            </p>
          </div>

          {/* Active Invitations */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest px-1 flex items-center justify-between">
              Active Invitations
              <span className="bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] px-1.5 py-0.5 rounded-md">
                {invitations?.length || 0}
              </span>
            </h3>
            <div className="space-y-3">
              {invitations?.map((invite) => (
                <div
                  key={invite.id}
                  className="card-surface p-4 group animate-in slide-in-from-right-4 duration-300"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[var(--color-surface-muted)] rounded-lg flex items-center justify-center">
                        <Mail className="w-4 h-4 text-[var(--color-text-muted)]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--color-text-base)] truncate max-w-[140px]">
                          {invite.email}
                        </p>
                        <p className="text-[10px] text-[var(--color-text-muted)] font-medium uppercase">
                          {invite.role}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteInviteMutation.mutate(invite.id)}
                      className="p-1.5 text-[var(--color-text-muted)]/50 hover:text-[var(--color-critical-base)] hover:bg-[var(--color-critical-base)]/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `https://validiant.in/accept-invite?token=${invite.token}`,
                          invite.id
                        )
                      }
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold transition-all border',
                        copyToken === invite.id
                          ? 'bg-success-500/10 text-success-600 border-success-500/20'
                          : 'bg-[var(--color-surface-soft)] text-[var(--color-text-subtle)] border-[var(--color-border-base)] hover:bg-[var(--color-surface-muted)]'
                      )}
                    >
                      {copyToken === invite.id ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      {copyToken === invite.id ? 'Copied' : 'Copy Magic Link'}
                    </button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[var(--color-border-base)] flex items-center justify-between text-[9px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Expires in 7d
                    </span>
                  </div>
                </div>
              ))}
              {invitations?.length === 0 && (
                <div className="text-center py-8 bg-[var(--color-surface-soft)]/50 rounded-2xl border-2 border-dashed border-[var(--color-border-base)]">
                  <p className="text-xs text-[var(--color-text-muted)] font-medium">
                    No pending invitations
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
