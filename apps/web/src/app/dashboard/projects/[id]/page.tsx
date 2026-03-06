'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
  useProjectMembers,
  useAddProjectMember,
  useRemoveProjectMember,
} from '@/hooks/useProjects';
import { useTasks, Task } from '@/hooks/useTasks';
import { useWorkspaceStore } from '@/store/workspace';
import { organizationsApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import {
  ProjectStatus,
  TaskStatus,
  OrganizationMemberWithUser,
} from '@validiant/shared';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  BarChart3,
  UserPlus,
  X,
  Users,
} from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  [ProjectStatus.ACTIVE]: 'bg-emerald-50 text-emerald-700',
  [ProjectStatus.PLANNING]: 'bg-blue-50    text-blue-700',
  [ProjectStatus.ON_HOLD]: 'bg-amber-50   text-amber-700',
  [ProjectStatus.COMPLETED]: 'bg-slate-100  text-slate-600',
  [ProjectStatus.ARCHIVED]: 'bg-slate-100  text-slate-400',
  [ProjectStatus.CANCELLED]: 'bg-red-50     text-red-600',
};

const STATUS_OPTIONS = [
  { value: ProjectStatus.PLANNING, label: 'Planning' },
  { value: ProjectStatus.ACTIVE, label: 'Active' },
  { value: ProjectStatus.ON_HOLD, label: 'On Hold' },
  { value: ProjectStatus.COMPLETED, label: 'Completed' },
  { value: ProjectStatus.ARCHIVED, label: 'Archived' },
  { value: ProjectStatus.CANCELLED, label: 'Cancelled' },
];

// ── Members Panel ─────────────────────────────────────────────────────────────
function MembersPanel({
  projectId,
  orgId,
}: {
  projectId: string;
  orgId: string;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member');

  const { data: members = [] } = useProjectMembers(projectId);
  const addMember = useAddProjectMember(projectId);
  const removeMember = useRemoveProjectMember(projectId);

  // Fetch org members to populate the add-member dropdown
  const { data: orgMembersRes } = useQuery({
    queryKey: ['org-members', orgId],
    queryFn: () => organizationsApi.getMembers(orgId),
    enabled: !!orgId && showAdd,
    staleTime: 2 * 60 * 1000,
  });
  const orgMembers = (orgMembersRes?.data?.data?.members ??
    []) as OrganizationMemberWithUser[];

  // Only show org members not already in the project
  const memberIds = new Set(members.map((m) => m.userId));
  const available = orgMembers.filter((m) => !memberIds.has(m.userId));

  const handleAdd = async () => {
    if (!selectedUserId) return;
    await addMember.mutateAsync({ userId: selectedUserId, role });
    setSelectedUserId('');
    setShowAdd(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <h2 className="text-base font-semibold text-slate-900">Members</h2>
          <span className="text-xs text-slate-400 font-medium">
            ({members.length})
          </span>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" /> Add Member
        </button>
      </div>

      {/* Add member form */}
      {showAdd && (
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
              Member
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a member…</option>
              {available.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.fullName ?? m.user.email ?? m.userId}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={!selectedUserId || addMember.isPending}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {addMember.isPending ? 'Adding…' : 'Add'}
          </button>
          <button
            onClick={() => setShowAdd(false)}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 border border-slate-300 rounded-lg"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Member list */}
      {members.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-400">
          No members yet. Add org members to this project.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-6 py-3">
              {m.user?.avatarUrl ? (
                <img
                  src={m.user.avatarUrl}
                  alt={m.user.fullName}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-blue-700">
                    {m.user?.fullName?.charAt(0) ?? '?'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {m.user?.fullName ?? 'Unknown'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {m.user?.email}
                </p>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                {m.role}
              </span>
              <button
                onClick={() => removeMember.mutate(m.userId)}
                disabled={removeMember.isPending}
                className="p-1 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50"
                title="Remove from project"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const { setActiveProject } = useWorkspaceStore();

  const { data: project, isLoading, isError } = useProject(id);
  const updateMutation = useUpdateProject(id);
  const deleteMutation = useDeleteProject();

  const { data: rawTasks = [] } = useTasks(id, undefined, { enabled: !!id });
  // Cast to Task[] from @validiant/shared
  const tasks = rawTasks as Task[];

  const handleDelete = async () => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
      await deleteMutation.mutateAsync(id);
      setActiveProject(null as unknown as string);
      router.push('/dashboard/projects');
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );

  if (isError || !project)
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-slate-500">Project not found.</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-blue-600 underline"
        >
          Go back
        </button>
      </div>
    );

  const completedTasks = tasks.filter(
    (t) => t.status === TaskStatus.COMPLETED
  ).length;
  const inProgressTasks = tasks.filter(
    (t) => t.status === TaskStatus.IN_PROGRESS
  ).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back nav */}
      <button
        onClick={() => router.push('/dashboard/projects')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> All Projects
      </button>

      {/* Project header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900">
                {project.name}
              </h1>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  STATUS_STYLES[project.status] ??
                  STATUS_STYLES[ProjectStatus.PLANNING]
                }`}
              >
                {project.status}
              </span>
            </div>
            {project.description && (
              <p className="text-sm text-slate-500 mt-1">
                {project.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 flex-wrap text-xs text-slate-400">
              {project.startDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Start: {new Date(project.startDate).toLocaleDateString()}
                </span>
              )}
              {project.endDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Due: {new Date(project.endDate).toLocaleDateString()}
                </span>
              )}
              <span className="capitalize font-medium text-slate-500">
                Priority: {project.priority}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={project.status}
              onChange={(e) =>
                updateMutation.mutate({
                  status: e.target.value as ProjectStatus,
                })
              }
              disabled={updateMutation.isPending}
              className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Delete project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Overall Progress
            </span>
            <span className="text-sm font-bold text-slate-700">
              {project.progress ?? 0}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${project.progress ?? 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Tasks',
            value: tasks.length,
            icon: BarChart3,
            color: 'text-slate-600',
          },
          {
            label: 'In Progress',
            value: inProgressTasks,
            icon: Clock,
            color: 'text-blue-600',
          },
          {
            label: 'Completed',
            value: completedTasks,
            icon: CheckCircle2,
            color: 'text-emerald-600',
          },
          {
            label: 'Remaining',
            value: tasks.length - completedTasks,
            icon: AlertCircle,
            color: 'text-amber-600',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center"
          >
            <Icon className={`w-5 h-5 mx-auto mb-1.5 ${color}`} />
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Member Management */}
      <MembersPanel projectId={id} orgId={project.organizationId} />

      {/* Task list */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Tasks</h2>
          <button
            onClick={() => router.push('/dashboard/tasks')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Manage Tasks
          </button>
        </div>
        {tasks.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">
            No tasks yet. Head to the Tasks page to create some.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tasks.slice(0, 10).map((task) => (
              <li key={task.id} className="flex items-center gap-3 px-6 py-3">
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    task.status === TaskStatus.COMPLETED
                      ? 'text-emerald-500'
                      : 'text-slate-300'
                  }`}
                />
                <span
                  className={`text-sm flex-1 min-w-0 truncate ${
                    task.status === TaskStatus.COMPLETED
                      ? 'text-slate-400 line-through'
                      : 'text-slate-700'
                  }`}
                >
                  {task.title}
                </span>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {task.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
