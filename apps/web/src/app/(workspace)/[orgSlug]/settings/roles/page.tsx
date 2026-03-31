'use client';

import React, { useState } from 'react';
import {
  Shield,
  Plus,
  Check,
  X,
  Info,
  Users,
  Lock,
  Layout,
  FileText,
  Loader2,
  Save,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/store/workspace';
import { useOrgRoles, useCreateCustomRole, useUpdateCustomRole } from '@/hooks/useOrganizations';

const PERMISSION_GROUPS = [
  {
    name: 'Cases & Field Work',
    icon: FileText,
    permissions: [
      {
        key: 'cases.read',
        label: 'View Cases',
        description: 'Can search and view case details.',
      },
      {
        key: 'cases.create',
        label: 'Create Cases',
        description: 'Can initiate new verification requests.',
      },
      {
        key: 'cases.update',
        label: 'Update Cases',
        description: 'Can modify case fields and status.',
      },
      {
        key: 'cases.verify',
        label: 'Verify Evidence',
        description: 'Can approve/verify forensic evidence.',
      },
      {
        key: 'cases.delete',
        label: 'Archive Cases',
        description: 'Can archive or delete case records.',
      },
    ],
  },
  {
    name: 'Team Management',
    icon: Users,
    permissions: [
      {
        key: 'users.invite',
        label: 'Invite Members',
        description: 'Can generate magic links for new users.',
      },
      {
        key: 'users.manage',
        label: 'Manage Members',
        description: 'Can remove users or change their roles.',
      },
      {
        key: 'roles.manage',
        label: 'Manage Roles',
        description: 'Can create and edit custom roles.',
      },
    ],
  },
  {
    name: 'Organization & Whitelabel',
    icon: Layout,
    permissions: [
      {
        key: 'branding.update',
        label: 'Update Branding',
        description: 'Can change logo, colors, and display name.',
      },
      {
        key: 'billing.manage',
        label: 'Billing & Subscription',
        description: 'Can manage enterprise plan and invoices.',
      },
      {
        key: 'audit.read',
        label: 'View Audit Logs',
        description: 'Can access security and activity logs.',
      },
    ],
  },
];

export default function RolesSettings() {
  const activeOrgId = useWorkspaceStore((state) => state.activeOrgId);
  const { data: roles, isLoading: isLoadingRoles } = useOrgRoles(activeOrgId);
  const createRoleMutation = useCreateCustomRole(activeOrgId || '');
  const updateRoleMutation = useUpdateCustomRole(activeOrgId || '');

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  const selectedRole = roles?.find((r) => r.id === selectedRoleId);

  // Default to first role if none selected
  React.useEffect(() => {
    if (roles?.length && !selectedRoleId) {
      setSelectedRoleId(roles?.[0]?.id || '');
    }
  }, [roles, selectedRoleId]);

  const togglePermission = async (permKey: string) => {
    if (!selectedRole || selectedRole.isDefault || !activeOrgId) return;

    const currentPermissions = selectedRole.permissions || [];
    const newPermissions = currentPermissions.includes(permKey)
      ? currentPermissions.filter((p) => p !== permKey)
      : [...currentPermissions, permKey];

    // eslint-disable-next-line no-console
    console.debug('[Roles:Permissions] Toggling permission:', {
      roleId: selectedRoleId,
      permission: permKey,
      newState: newPermissions.includes(permKey),
      timestamp: new Date().toISOString(),
    });

    try {
      await updateRoleMutation.mutateAsync({
        roleId: selectedRole.id,
        payload: { permissions: newPermissions },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Roles:Permissions] Toggle FAILED', err);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim() || !activeOrgId) {
      // eslint-disable-next-line no-console
      console.warn('[Roles:Create] Validation failed', {
        name: newRoleName,
        orgId: activeOrgId,
      });
      return;
    }

    // eslint-disable-next-line no-console
    console.info('[Roles:Create] Initiating role creation', {
      name: newRoleName,
      orgId: activeOrgId,
      timestamp: new Date().toISOString(),
    });

    try {
      await createRoleMutation.mutateAsync({
        name: newRoleName,
        description: `Custom role: ${newRoleName}`,
        permissions: [], // Start with empty permissions
      });

      // eslint-disable-next-line no-console
      console.info('[Roles:Create] SUCCESS', {
        name: newRoleName,
        timestamp: new Date().toISOString(),
      });

      setNewRoleName('');
      setIsCreating(false);
    } catch (err) {
      const error = err as { message: string; details?: unknown };
      // eslint-disable-next-line no-console
      console.error('[Roles:Create] FAILED', {
        error,
        name: newRoleName,
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
      });
      // Error handling UI could be added here
    }
  };

  if (isLoadingRoles) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-base)] tracking-tight">
            Roles & Permissions
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm">
            Define granular access control for your team members.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn btn-primary px-4 py-2 shadow-lg shadow-[var(--color-accent-base)]/20 transition-all font-bold"
        >
          <Plus className="w-4 h-4" />
          Create New Role
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Roles Sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest px-1">
            Available Roles
          </h3>
          <div className="card-surface overflow-hidden">
            {roles?.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={cn(
                  'w-full flex items-center justify-between p-4 text-left transition-all border-b border-[var(--color-border-base)]/30 last:border-0 group',
                  selectedRoleId === role.id
                    ? 'bg-primary-500/10 text-[var(--color-accent-base)]'
                    : 'hover:bg-[var(--color-surface-soft)] text-[var(--color-text-subtle)]'
                )}
              >
                <div className="flex items-center gap-3">
                  <Shield
                    className={cn(
                      'w-4 h-4',
                      selectedRoleId === role.id
                        ? 'text-[var(--color-accent-base)]'
                        : 'text-[var(--color-text-muted)]'
                    )}
                  />
                  <div>
                    <p className="text-sm font-bold">{role.name}</p>
                    <p className="text-[10px] uppercase font-medium text-[var(--color-text-muted)]">
                      {role.isDefault ? 'System' : 'Custom'}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={cn(
                    'w-4 h-4 transition-transform',
                    selectedRoleId === role.id
                      ? 'translate-x-0 opacity-100'
                      : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Builder */}
        <div className="lg:col-span-3">
          {selectedRole ? (
            <div className="card-surface overflow-hidden">
              <div className="p-6 border-b border-[var(--color-border-base)] flex items-center justify-between bg-[var(--color-surface-soft)]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[var(--color-surface-base)] rounded-xl shadow-sm border border-[var(--color-border-base)] flex items-center justify-center">
                    <Shield className="w-6 h-6 text-[var(--color-accent-base)]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--color-text-base)]">
                      {selectedRole.name}
                    </h2>
                    <p className="text-xs text-[var(--color-text-muted)] max-w-md">
                      {selectedRole.description ||
                        'Configurable permissions for this role.'}
                    </p>
                  </div>
                </div>
                {selectedRole.isDefault && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] text-[10px] font-bold rounded-lg border border-[var(--color-border-base)]">
                    <Lock className="w-3 h-3" />
                    READ ONLY (SYSTEM ROLE)
                  </div>
                )}
              </div>

              <div className="p-6 space-y-8">
                {PERMISSION_GROUPS.map((group) => {
                  const Icon = group.icon;
                  return (
                    <div key={group.name} className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-[var(--color-border-base)]/50 pb-2">
                        <Icon className="w-4 h-4 text-[var(--color-text-muted)]" />
                        <h3 className="text-xs font-bold text-[var(--color-text-base)] uppercase tracking-wider">
                          {group.name}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {group.permissions.map((perm) => {
                          const isEnabled =
                            selectedRole.permissions.includes(perm.key) ||
                            selectedRole.key === 'owner';
                          return (
                            <button
                              key={perm.key}
                              disabled={selectedRole.isDefault}
                              onClick={() => togglePermission(perm.key)}
                              className={cn(
                                'flex items-start gap-4 p-4 rounded-2xl border transition-all text-left group',
                                isEnabled
                                  ? 'bg-success-500/10 border-success-500/20 ring-1 ring-success-500/10'
                                  : 'bg-[var(--color-surface-base)] border-[var(--color-border-base)]/30 hover:border-[var(--color-border-base)]'
                              )}
                            >
                              <div
                                className={cn(
                                  'mt-1 w-5 h-5 rounded-md flex items-center justify-center transition-all',
                                  isEnabled
                                    ? 'bg-success-500 text-white shadow-lg shadow-success-500/20'
                                    : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'
                                )}
                              >
                                {isEnabled ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <X className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p
                                  className={cn(
                                    'text-sm font-bold',
                                    isEnabled
                                      ? 'text-[var(--color-text-base)]'
                                      : 'text-[var(--color-text-muted)]'
                                  )}
                                >
                                  {perm.label}
                                </p>
                                <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed font-medium mt-0.5">
                                  {perm.description}
                                </p>
                              </div>
                              <Info className="w-3.5 h-3.5 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!selectedRole.isDefault && (
                <div className="p-6 bg-[var(--color-surface-soft)] border-t border-[var(--color-border-base)] flex justify-end">
                  <button className="btn btn-primary px-8 py-3 shadow-lg shadow-[var(--color-accent-base)]/20 transition-all font-bold">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 bg-[var(--color-surface-soft)]/50 border-2 border-dashed border-[var(--color-border-base)] rounded-3xl text-center">
              <Shield className="w-12 h-12 text-[var(--color-text-muted)] mb-4" />
              <h3 className="text-lg font-bold text-[var(--color-text-base)]">
                No Role Selected
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-xs">
                Select a role from the sidebar to view and manage its
                permissions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Role Modal Placeholder */}
      {isCreating && (
        <div className="fixed inset-0 bg-[var(--color-surface-subtle)]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface-base)] w-full max-w-md rounded-3xl shadow-2xl border border-[var(--color-border-base)] p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[var(--color-text-base)]">
                Create Custom Role
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)] rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text-muted)]">
                  Role Name
                </label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Regional Manager"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-surface-base)] text-[var(--color-text-base)] border border-[var(--color-border-base)] focus:ring-2 focus:ring-primary-500/20 focus:border-[var(--color-accent-base)] transition-all outline-none"
                />
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed italic">
                Custom roles inherit from the basic 'Member' role and allow you
                to add specific granular permissions.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsCreating(false)}
                disabled={createRoleMutation.isPending}
                className="flex-1 py-3 text-[var(--color-text-subtle)] font-bold text-sm bg-[var(--color-surface-soft)] hover:bg-[var(--color-surface-muted)] rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                disabled={createRoleMutation.isPending}
                className="btn btn-primary flex-1 py-3 shadow-lg shadow-[var(--color-accent-base)]/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createRoleMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Role'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
