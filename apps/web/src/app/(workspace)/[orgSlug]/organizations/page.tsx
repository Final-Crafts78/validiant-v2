'use client';
import { useState } from 'react';
import { useWorkspaceStore } from '@/store/workspace';
import {
  useOrganizations,
  useOrgMembers,
  useInviteMember,
} from '@/hooks/useOrganizations';
import { Users, Mail } from 'lucide-react';

export default function OrganizationsPage() {
  const { activeOrgId, setActiveOrg } = useWorkspaceStore();
  const { data: orgs = [], isLoading: orgsLoading } = useOrganizations();
  const { data: members = [], isLoading: membersLoading } =
    useOrgMembers(activeOrgId);
  const inviteMutation = useInviteMember(activeOrgId ?? '');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'guest'>(
    'member'
  );
  const [inviteError, setInviteError] = useState('');

  const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? orgs[0];

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgId || !inviteEmail) return;
    setInviteError('');
    try {
      await inviteMutation.mutateAsync({
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteEmail('');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to send invite';
      setInviteError(message);
    }
  };

  if (orgsLoading) return <div className="p-8 text-slate-400">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Org Switcher (if user has multiple orgs) */}
      {orgs.length > 1 && (
        <div>
          <h2 className="text-sm font-medium text-slate-500 mb-2">
            Your Organizations
          </h2>
          <div className="flex flex-wrap gap-2">
            {orgs.map((org) => (
              <button
                key={org.id}
                onClick={() => setActiveOrg(org.id, org.slug)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  org.id === activeOrgId
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                }`}
              >
                {org.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Org Info */}
      {activeOrg && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h1 className="text-xl font-bold text-slate-900">{activeOrg.name}</h1>
          {activeOrg.industry && (
            <p className="text-sm text-slate-500 mt-1">{activeOrg.industry}</p>
          )}
        </div>
      )}

      {/* Members */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4" /> Members
          </h2>
        </div>

        {membersLoading ? (
          <p className="text-sm text-slate-400">Loading members…</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {m.user.fullName}
                  </p>
                  <p className="text-xs text-slate-500">{m.user.email}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    m.role === 'owner'
                      ? 'bg-amber-100 text-amber-700'
                      : m.role === 'admin'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {m.role}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Invite Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4" /> Invite a Member
        </h2>
        <form onSubmit={handleInvite} className="flex gap-3 flex-wrap">
          <input
            type="email"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <select
            value={inviteRole}
            onChange={(e) =>
              setInviteRole(e.target.value as 'admin' | 'member' | 'guest')
            }
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="guest">Guest (read-only)</option>
          </select>
          <button
            type="submit"
            disabled={inviteMutation.isPending}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {inviteMutation.isPending ? 'Sending…' : 'Send Invite'}
          </button>
        </form>
        {inviteError && (
          <p className="text-sm text-red-600 mt-2">{inviteError}</p>
        )}
        {inviteMutation.isSuccess && (
          <p className="text-sm text-green-600 mt-2">
            Invite sent successfully!
          </p>
        )}
      </div>
    </div>
  );
}
