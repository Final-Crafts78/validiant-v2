/**
 * Organizations Page
 * 
 * List and manage organizations.
 */

'use client';

import { useState } from 'react';
import { format } from '@/lib/utils';
import {
  Building2,
  Plus,
  Search,
  Users,
  FolderKanban,
  MoreVertical,
  Settings,
  UserPlus,
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
}

/**
 * Mock organizations data
 */
const mockOrganizations: Organization[] = [
  {
    id: '1',
    name: 'Acme Corporation',
    description: 'Leading provider of innovative solutions',
    role: 'owner',
    memberCount: 24,
    projectCount: 12,
    createdAt: '2025-06-15',
  },
  {
    id: '2',
    name: 'TechStart Inc.',
    description: 'Building the future of technology',
    role: 'admin',
    memberCount: 15,
    projectCount: 8,
    createdAt: '2025-09-20',
  },
  {
    id: '3',
    name: 'Creative Agency',
    description: 'Design and marketing excellence',
    role: 'member',
    memberCount: 10,
    projectCount: 5,
    createdAt: '2025-11-10',
  },
];

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

  return <span className={`badge ${styles[role]}`}>{labels[role]}</span>;
}

/**
 * Organization card component
 */
function OrganizationCard({ org }: { org: Organization }) {
  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="card-body">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                {org.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {org.description}
              </p>
            </div>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="h-5 w-5" />
          </button>
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
                {org.memberCount}
              </p>
              <p className="text-xs text-gray-600">Members</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {org.projectCount}
              </p>
              <p className="text-xs text-gray-600">Projects</p>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-4">
          <p className="text-xs text-gray-500">
            Member since {format.date(org.createdAt, { month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button className="btn btn-outline btn-sm flex-1">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
          <button className="btn btn-primary btn-sm flex-1">
            <UserPlus className="h-4 w-4" />
            <span>Invite</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="card">
      <div className="card-body text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No organizations yet
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Create or join an organization to collaborate with your team and manage
          projects together.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button className="btn btn-primary btn-md">
            <Plus className="h-5 w-5" />
            <span>Create Organization</span>
          </button>
          <button className="btn btn-outline btn-md">
            <UserPlus className="h-5 w-5" />
            <span>Join Organization</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Organizations Page Component
 */
export default function OrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // TODO: Replace with actual data fetching
  const organizations = mockOrganizations;
  const hasOrganizations = organizations.length > 0;

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
        <div className="flex gap-2">
          <button className="btn btn-outline btn-md">
            <UserPlus className="h-5 w-5" />
            <span>Join</span>
          </button>
          <button className="btn btn-primary btn-md">
            <Plus className="h-5 w-5" />
            <span>Create</span>
          </button>
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
            {organizations.map((org) => (
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
        <EmptyState />
      )}
    </div>
  );
}
