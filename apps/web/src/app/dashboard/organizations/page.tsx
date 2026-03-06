/**
 * Organizations Page
 *
 * List and manage organizations.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from '@/lib/utils';
import { organizationsApi } from '@/lib/api';
import { CreateOrganizationModalTrigger } from '@/components/modals/CreateOrganizationModal';
import { DeleteOrganizationModal } from '@/components/modals/DeleteOrganizationModal';
import { OrgSettingsModal } from '@/components/modals/OrgSettingsModal';
import { InviteModal } from '@/components/modals/InviteModal';
import { JoinOrganizationModal } from '@/components/modals/JoinOrganizationModal';
import {
  Building2,
  Search,
  Users,
  FolderKanban,
  MoreVertical,
  Settings,
  UserPlus,
  Trash2,
  LogOut,
} from 'lucide-react';

/**
 * Organization interface
 */
interface Organization {
  id: string;
  name: string;
  description: string;
  role: 'owner' | 'admin' | 'member';
  memberCount: number;
  projectCount: number;
  createdAt: string;
  [key: string]: any;
}

/**
 * Role badge component
 */
function RoleBadge({ role }: { role: Organization['role'] }) {
  const styles = {
    owner: 'badge-primary',
    admin: 'badge-warning',
    member: 'badge-secondary',
  };

  const labels = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
  };

  return (
    <span className={`badge ${styles[role]}`}>{labels[role] || 'Member'}</span>
  );
}

/**
 * Organization card component
 */
function OrganizationCard({ org }: { org: Organization }) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLeave = async () => {
    if (!confirm(`Are you sure you want to leave ${org.name}?`)) return;
    try {
      await organizationsApi.leave(org.id);
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    } catch (err) {
      alert('Failed to leave organization.');
    }
  };

  return (
    <>
      <div className="card hover:shadow-lg transition-shadow">
        <div className="card-body">
          {/* Header */}
          <div
            className="flex items-start justify-between mb-4 relative"
            ref={menuRef}
          >
            <div className="flex items-start gap-3 flex-1">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {org.logoUrl ? (
                  <img
                    src={org.logoUrl}
                    alt={org.name}
                    className="w-8 h-8 rounded shrink-0 object-cover"
                  />
                ) : (
                  <Building2 className="h-6 w-6 text-primary-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                  {org.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {org.description || 'No description provided.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 top-10 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 animate-in fade-in slide-in-from-top-2">
                {(org.role === 'owner' || org.role === 'admin') && (
                  <button
                    onClick={() => {
                      setSettingsModalOpen(true);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                )}
                {org.role === 'owner' && (
                  <button
                    onClick={() => {
                      setDeleteModalOpen(true);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
                {org.role !== 'owner' && (
                  <button
                    onClick={() => {
                      handleLeave();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Leave</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Role Badge */}
          <div className="mb-4">
            <RoleBadge role={org.role} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-200">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {org.memberCount || 1}
                </p>
                <p className="text-xs text-gray-600">Members</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {org.projectCount || 0}
                </p>
                <p className="text-xs text-gray-600">Projects</p>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="mt-4">
            <p className="text-xs text-gray-500">
              Created{' '}
              {format.date(org.createdAt, { month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            {org.role === 'owner' || org.role === 'admin' ? (
              <>
                <button
                  onClick={() => setSettingsModalOpen(true)}
                  className="btn btn-outline btn-sm flex-1"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={() => setInviteModalOpen(true)}
                  className="btn btn-primary btn-sm flex-1"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Invite</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleLeave}
                className="btn btn-outline btn-sm w-full text-amber-600 hover:bg-amber-50 hover:text-amber-700 border-amber-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Leave Organization</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <DeleteOrganizationModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        organizationId={org.id}
        organizationName={org.name}
      />

      <OrgSettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        organization={org}
      />

      <InviteModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        organizationId={org.id}
      />
    </>
  );
}

/**
 * Organizations Page Component
 */
export default function OrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['organizations', 'my'],
    queryFn: () => organizationsApi.getAll(),
  });

  const organizations = (response?.data?.data?.organizations || []) as any[];

  const filteredOrganizations = (
    organizations as unknown as Organization[]
  ).filter(
    (org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasOrganizations = organizations.length > 0;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-red-500 mb-2">Failed to load organizations</p>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-600 mt-1">
            Manage your organizations and teams
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setJoinModalOpen(true)}
            className="btn btn-outline btn-md"
          >
            <UserPlus className="h-5 w-5" />
            <span>Join</span>
          </button>
          <CreateOrganizationModalTrigger />
        </div>
      </div>

      {hasOrganizations ? (
        <>
          {/* Search */}
          <div className="card">
            <div className="card-body">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
          </div>

          {/* Organizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOrganizations.map((org) => (
              <OrganizationCard key={org.id} org={org} />
            ))}
          </div>

          {/* Info Card */}
          <div className="card border-primary-200 bg-primary-50">
            <div className="card-body">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-primary-900 mb-1">
                    Organization Benefits
                  </h3>
                  <ul className="text-xs text-primary-800 space-y-1">
                    <li>• Centralized project and team management</li>
                    <li>• Enhanced collaboration with shared workspaces</li>
                    <li>• Granular permissions and access control</li>
                    <li>• Organization-wide settings and policies</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card">
          <div className="card-body text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No organizations yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create or join an organization to collaborate with your team and
              manage projects together.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <CreateOrganizationModalTrigger />
              <button
                onClick={() => setJoinModalOpen(true)}
                className="btn btn-outline btn-md"
              >
                <UserPlus className="h-5 w-5" />
                <span>Join Organization</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <JoinOrganizationModal
        open={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
      />
    </div>
  );
}
