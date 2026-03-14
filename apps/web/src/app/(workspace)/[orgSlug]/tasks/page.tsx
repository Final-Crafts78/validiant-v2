/**
 * Tasks Page
 *
 * List and manage tasks.
 * Corporate Light Theme — Phase 9 (live data via react-query).
 */

'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTasks } from '@/hooks/useTasks';
import { useRBAC } from '@/hooks/useRBAC';
import { useOrganization } from '@/hooks/useOrganizations';
import { useWorkspaceStore } from '@/store/workspace';
import { useAuthStore } from '@/store/auth';
import { canFeature } from '@validiant/shared';
import { TaskDetailSlideOver } from '@/components/tasks/TaskDetailSlideOver';
import { BulkUploadWizard } from '@/components/tasks/BulkUploadWizard';
import { TasksBoard } from '@/components/tasks/TasksBoard';
import { CreateTaskModalTrigger } from '@/components/modals/CreateTaskModal';
import { BulkActionBar } from '@/components/tasks/BulkActionBar';
import { BulkAssignModal } from '@/components/tasks/BulkAssignModal';
import { BulkStatusModal } from '@/components/tasks/BulkStatusModal';
import { useBulkAssignTasks, useBulkUpdateTaskStatus } from '@/hooks/useTasks';
import { TasksTable } from '@/components/tasks/TasksTable';
import { type RowSelectionState } from '@validiant/ui';
import { useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
  CheckSquare,
  Search,
  Filter,
  AlertCircle,
  Upload,
  Loader2,
} from 'lucide-react';
import { TaskStatus } from '@validiant/shared';

// ---------------------------------------------------------------------------
// Shared input class
// ---------------------------------------------------------------------------
const inputCls =
  'w-full bg-white border border-slate-300 rounded-lg text-sm text-slate-900 ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 ' +
  'focus:border-transparent transition';

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------
function EmptyState() {
  return (
    <div className="bg-white border border-dashed border-slate-200 rounded-xl py-16 text-center">
      <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckSquare className="h-7 w-7 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        No tasks found
      </h3>
      <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
        Create your first task to start tracking your work and staying
        organized.
      </p>
      <CreateTaskModalTrigger />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tasks Page Component
// ---------------------------------------------------------------------------
function TasksPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // URL State Synced Filters
  const searchQuery = searchParams.get('q') || '';
  const statusFilter = searchParams.get('status') || 'all';
  const priorityFilter = searchParams.get('priority') || 'all';
  const viewMode = (searchParams.get('view') as 'table' | 'board') || 'table';

  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);

  // Bulk Operations Hooks
  const bulkAssign = useBulkAssignTasks();
  const bulkUpdateStatus = useBulkUpdateTaskStatus();

  // Workspace Context
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId);

  // Data Fetching
  const { data, isLoading, isError } = useTasks(activeProjectId ?? '');

  const { data: org } = useOrganization(activeOrgId);
  const { orgRole } = useRBAC(activeOrgId ?? '', activeProjectId ?? '');
  const user = useAuthStore((s) => s.user);

  const liveTasks = useMemo(() => {
    return data?.pages.flatMap((page) => page.tasks) ?? [];
  }, [data]);

  // Feature Flag Cache
  const boardEnabled = canFeature('BOARD_VIEW', org?.settings);

  // URL State Helpers
  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (
        value === null ||
        value === 'all' ||
        (key === 'view' && value === 'table')
      ) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const openTask = (taskId: string) => {
    updateQuery({ taskId });
  };

  // ------------------------------------------------------------------
  // Role-Based UI Tweak
  // ------------------------------------------------------------------
  const isExecutive = orgRole === 'executive';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Loading tasks...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
          <AlertCircle className="h-7 w-7 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">
          Failed to load tasks
        </h3>
        <p className="text-sm text-slate-500">
          There was a problem fetching your tasks.
        </p>
      </div>
    );
  }

  // Filter Logic
  const filteredTasks = liveTasks.filter((task) => {
    if (isExecutive) {
      const isAssignedToMe = task.assignees?.some((a) => a.id === user?.id);
      if (!isAssignedToMe) return false;
    }

    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description ?? '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority =
      priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const selectedTaskIds = Object.keys(rowSelection);
  const selectedCount = selectedTaskIds.length;

  const handleBulkAssign = async (assigneeId: string) => {
    try {
      await bulkAssign.mutateAsync({
        taskIds: selectedTaskIds,
        userId: assigneeId,
        projectId: activeProjectId || '',
      });
      toast.success(`Successfully assigned ${selectedCount} tasks`);
      setRowSelection({});
      setBulkAssignOpen(false);
    } catch (error) {
      toast.error('Failed to assign tasks in bulk');
    }
  };

  const handleBulkStatusChange = async (statusKey: TaskStatus) => {
    try {
      const result = await bulkUpdateStatus.mutateAsync({
        taskIds: selectedTaskIds,
        status: statusKey,
        projectId: activeProjectId || '',
      });

      const resultData = (result as any)?.data?.data;
      if (resultData?.failed?.length > 0) {
        toast.error(
          `${resultData.failed.length} tasks failed to update status (logic violation)`
        );
      } else {
        toast.success(`Successfully updated ${selectedCount} tasks`);
      }

      setRowSelection({});
      setBulkStatusOpen(false);
    } catch (error) {
      toast.error('Failed to update task statuses');
    }
  };

  // Stats
  const stats = {
    total: liveTasks.length,
    pending: liveTasks.filter((t) => t.status === TaskStatus.PENDING).length,
    inProgress: liveTasks.filter((t) => t.status === TaskStatus.IN_PROGRESS)
      .length,
    completed: liveTasks.filter((t) => t.status === TaskStatus.COMPLETED)
      .length,
  };

  const hasTasks = liveTasks.length > 0;

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            {isExecutive ? 'My Queue' : 'Tasks'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isExecutive
              ? 'Your assigned tasks and action items'
              : 'Manage and track all your tasks'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isExecutive && (
            <>
              <button
                type="button"
                onClick={() => setBulkUploadOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
              >
                <Upload className="h-4 w-4" />
                Bulk Upload
              </button>
              <CreateTaskModalTrigger />
            </>
          )}
        </div>
      </div>

      {hasTasks ? (
        <>
          {/* STATS & VIEW TOGGLE */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-center">
                <p className="text-3xl font-bold text-slate-900">
                  {stats.total}
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">
                  Total
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-center">
                <p className="text-3xl font-bold text-slate-900">
                  {stats.pending}
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">
                  Pending
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-center border-b-2 border-b-blue-600">
                <p className="text-3xl font-bold text-blue-600">
                  {stats.inProgress}
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">
                  In Progress
                </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-center border-b-2 border-b-emerald-600">
                <p className="text-3xl font-bold text-emerald-600">
                  {stats.completed}
                </p>
                <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">
                  Completed
                </p>
              </div>
            </div>

            {boardEnabled && !isExecutive && (
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0 self-start lg:self-auto">
                <button
                  onClick={() => updateQuery({ view: 'table' })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    viewMode === 'table'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => updateQuery({ view: 'board' })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    viewMode === 'board'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Board
                </button>
              </div>
            )}
          </div>

          {!isExecutive && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => updateQuery({ q: e.target.value })}
                    className={`${inputCls} pl-9 py-2`}
                  />
                </div>

                <div className="w-full lg:w-44 relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <select
                    value={statusFilter}
                    onChange={(e) => updateQuery({ status: e.target.value })}
                    className={`${inputCls} pl-9 py-2 appearance-none`}
                  >
                    <option value="all">All Status</option>
                    <option value={TaskStatus.UNASSIGNED}>Unassigned</option>
                    <option value={TaskStatus.PENDING}>Pending</option>
                    <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                    <option value={TaskStatus.VERIFIED}>Verified</option>
                    <option value={TaskStatus.COMPLETED}>Completed</option>
                  </select>
                </div>

                <div className="w-full lg:w-44">
                  <select
                    value={priorityFilter}
                    onChange={(e) => updateQuery({ priority: e.target.value })}
                    className={`${inputCls} px-3 py-2 appearance-none`}
                  >
                    <option value="all">All Priority</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TASK CONTENT */}
          <div className="min-h-[400px]">
            {viewMode === 'board' && boardEnabled ? (
              <TasksBoard tasks={filteredTasks} onTaskClick={openTask} />
            ) : (
              <TasksTable
                tasks={filteredTasks}
                onTaskClick={openTask}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
              />
            )}
          </div>

          <BulkActionBar
            selectedCount={selectedCount}
            onClear={() => setRowSelection({})}
            onAssign={() => setBulkAssignOpen(true)}
            onStatusChange={() => setBulkStatusOpen(true)}
          />

          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing{' '}
              <span className="font-medium text-slate-700">
                {filteredTasks.length}
              </span>{' '}
              of{' '}
              <span className="font-medium text-slate-700">
                {liveTasks.length}
              </span>{' '}
              tasks
            </p>
          </div>
        </>
      ) : (
        <EmptyState />
      )}

      {/* Task Detail Slide-Over */}
      <TaskDetailSlideOver />

      {/* Bulk Upload Wizard Modal */}
      <BulkUploadWizard
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
      />

      {/* Bulk Operations Modals */}
      <BulkAssignModal
        open={bulkAssignOpen}
        onClose={() => setBulkAssignOpen(false)}
        onConfirm={handleBulkAssign}
        count={selectedCount}
      />

      <BulkStatusModal
        open={bulkStatusOpen}
        onClose={() => setBulkStatusOpen(false)}
        onConfirm={handleBulkStatusChange}
        count={selectedCount}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <TasksPageContent />
    </Suspense>
  );
}
