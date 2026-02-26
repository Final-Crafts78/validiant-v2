/**
 * Tasks Page
 *
 * List and manage tasks.
 * Corporate Light Theme — Phase 9 (live data via react-query).
 *
 * Data flow:
 *   tasksApi.getAll()
 *     → AxiosResponse<APIResponse<Task[]>>
 *     → response.data       = APIResponse<Task[]>   (our wrapper)
 *     → response.data.data  = { tasks: Task[] }     (the live payload)
 *     → response.data.data.tasks = Task[]           (the actual array)
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from '@/lib/utils';
import { tasksApi } from '@/lib/api';
import type { Task } from '@validiant/shared';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Circle,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Loader2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Shared input class
// ---------------------------------------------------------------------------
const inputCls =
  'w-full bg-white border border-slate-300 rounded-lg text-sm text-slate-900 ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 ' +
  'focus:border-transparent transition';

// ---------------------------------------------------------------------------
// Priority Badge
// TaskPriority enum values: 'none' | 'low' | 'medium' | 'high' | 'urgent'
// ---------------------------------------------------------------------------
type TaskPriorityValue = Task['priority'];

function PriorityBadge({ priority }: { priority: TaskPriorityValue }) {
  const styles: Record<string, string> = {
    none:   'bg-slate-100 text-slate-500 border border-slate-200',
    low:    'bg-slate-100 text-slate-700 border border-slate-200',
    medium: 'bg-blue-50 text-blue-700 border border-blue-200',
    high:   'bg-amber-50 text-amber-700 border border-amber-200',
    urgent: 'bg-red-50 text-red-700 border border-red-200',
  };

  const labels: Record<string, string> = {
    none:   'None',
    low:    'Low',
    medium: 'Medium',
    high:   'High',
    urgent: 'Urgent',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        styles[priority] ?? styles['none']
      }`}
    >
      {labels[priority] ?? priority}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Task Row
//
// Uses the real Task type from @validiant/shared.
//
// Mapping notes (plain Task — no populated relations):
 //   assigneeId  → displayed as-is with a fallback of 'Unassigned'
 //   projectId   → displayed as-is with a fallback of 'No Project'
 //   description → optional on real Task, guarded with || ''
 //   dueDate     → optional Date on real Task, rendered only when present
 //
 // TaskStatus enum values used in statusIcon:
 //   'todo' | 'in_progress' | 'in_review' | 'blocked' | 'completed' | 'cancelled'
// ---------------------------------------------------------------------------
function TaskRow({ task }: { task: Task }) {
  const isOverdue =
    task.dueDate != null &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'completed' &&
    task.status !== 'cancelled';

  // Map all known TaskStatus values to an icon; unknown statuses get a fallback.
  const statusIconMap: Record<string, React.ReactNode> = {
    todo:        <Circle className="h-5 w-5 text-slate-400 shrink-0" />,
    in_progress: <Clock className="h-5 w-5 text-blue-600 shrink-0" />,
    in_review:   <Clock className="h-5 w-5 text-amber-500 shrink-0" />,
    blocked:     <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />,
    completed:   <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
    cancelled:   <Circle className="h-5 w-5 text-slate-300 shrink-0" />,
  };
  const statusIcon = statusIconMap[task.status] ?? (
    <Circle className="h-5 w-5 text-slate-400 shrink-0" />
  );

  // Graceful display values for fields that may not be populated on plain Task
  const displayAssignee = task.assigneeId ?? 'Unassigned';
  const displayProject  = task.projectId  ?? 'No Project';
  const displayDesc     = task.description ?? '';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        {/* Status Icon */}
        <button
          type="button"
          aria-label={`Task status: ${task.status}`}
          className="mt-0.5 shrink-0"
        >
          {statusIcon}
        </button>

        {/* Task Details */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div className="flex-1 min-w-0">
              <h3
                className={`text-base font-semibold leading-snug ${
                  task.status === 'completed'
                    ? 'text-slate-400 line-through'
                    : 'text-slate-900'
                }`}
              >
                {task.title}
              </h3>
            </div>
            <PriorityBadge priority={task.priority} />
          </div>

          {/* Description — optional on real Task */}
          {displayDesc && (
            <p className="text-sm text-slate-500 line-clamp-1 mb-3">
              {displayDesc}
            </p>
          )}

          {/* Task meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
            {/* Assignee */}
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <User className="h-3.5 w-3.5 shrink-0" />
              {displayAssignee}
            </span>

            {/* Project */}
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <CheckSquare className="h-3.5 w-3.5 shrink-0" />
              {displayProject}
            </span>

            {/* Due Date — optional on real Task */}
            {task.dueDate != null && (
              <span
                className={`flex items-center gap-1.5 text-xs ${
                  isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'
                }`}
              >
                {isOverdue && <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
                Due{' '}
                {format.date(task.dueDate, { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
      <button
        type="button"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Create Task
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tasks Page Component
// ---------------------------------------------------------------------------
export default function TasksPage() {
  const [searchQuery, setSearchQuery]     = useState('');
  const [statusFilter, setStatusFilter]   = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // ------------------------------------------------------------------
  // Live data via react-query
  // response                      = AxiosResponse<APIResponse<...>>
  // response.data                 = APIResponse<...>  (our wrapper object)
  // response.data.data            = { tasks: Task[] } (the live payload)
  // response.data.data.tasks      = Task[]            (the actual array)
  // ------------------------------------------------------------------
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['tasks', 'all'],
    queryFn:  () => tasksApi.getAll(),
  });

  // Extract the tasks array from the API response payload: response.data.data.tasks
  const liveTasks: Task[] = response?.data?.data?.tasks ?? [];

  // ------------------------------------------------------------------
  // Loading state
  // ------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500">Loading tasks...</p>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Error state
  // ------------------------------------------------------------------
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
          <AlertCircle className="h-7 w-7 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Failed to load tasks</h3>
        <p className="text-sm text-slate-500">
          There was a problem fetching your tasks. Please try refreshing the page.
        </p>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Derived filtered list (applied to the live array)
  // Status filter values match TaskStatus enum: 'todo' | 'in_progress' |
  //   'in_review' | 'blocked' | 'completed' | 'cancelled'
  // Priority filter values match TaskPriority enum: 'none' | 'low' |
  //   'medium' | 'high' | 'urgent'
  // ------------------------------------------------------------------
  const filteredTasks = liveTasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus   = statusFilter   === 'all' || task.status   === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // ------------------------------------------------------------------
  // Stats — derived from the full liveTasks array (unfiltered),
  // so the metric cards always reflect the true totals.
  // ------------------------------------------------------------------
  const stats = {
    total:      liveTasks.length,
    todo:       liveTasks.filter((t) => t.status === 'todo').length,
    inProgress: liveTasks.filter((t) => t.status === 'in_progress').length,
    completed:  liveTasks.filter((t) => t.status === 'completed').length,
  };

  const hasTasks = liveTasks.length > 0;

  return (
    <div className="space-y-6">

      {/* ===================================================================
          PAGE HEADER
      =================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage and track all your tasks
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>

      {hasTasks ? (
        <>
          {/* =================================================================
              STATS GRID — 4 columns
              Counts derived from liveTasks (unfiltered totals)
          ================================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Total */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-center">
              <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">
                Total
              </p>
            </div>

            {/* To Do */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-center">
              <p className="text-3xl font-bold text-slate-900">{stats.todo}</p>
              <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">
                To Do
              </p>
            </div>

            {/* In Progress */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-center">
              <p className="text-3xl font-bold text-blue-600">
                {stats.inProgress}
              </p>
              <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">
                In Progress
              </p>
            </div>

            {/* Completed */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-center">
              <p className="text-3xl font-bold text-emerald-600">
                {stats.completed}
              </p>
              <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">
                Completed
              </p>
            </div>

          </div>

          {/* =================================================================
              FILTERS BAR
              Select option values match real TaskStatus / TaskPriority enums
          ================================================================= */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-3">

              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search tasks…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${inputCls} pl-9 py-2`}
                />
              </div>

              {/* Status Filter — values mirror TaskStatus enum */}
              <div className="w-full lg:w-44 relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`${inputCls} pl-9 py-2 appearance-none`}
                >
                  <option value="all">All Status</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="blocked">Blocked</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Priority Filter — values mirror TaskPriority enum */}
              <div className="w-full lg:w-44">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
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

          {/* =================================================================
              TASK LIST
              Renders filteredTasks; EmptyState shown if filter yields nothing
          ================================================================= */}
          <div className="space-y-4">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))
            ) : (
              <div className="bg-white border border-dashed border-slate-200 rounded-xl py-12 text-center">
                <p className="text-sm font-medium text-slate-500">
                  No tasks match your current filters.
                </p>
              </div>
            )}
          </div>

          {/* Pagination info */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing{' '}
              <span className="font-medium text-slate-700">{filteredTasks.length}</span>
              {' '}of{' '}
              <span className="font-medium text-slate-700">{liveTasks.length}</span>
              {' '}tasks
            </p>
          </div>
        </>
      ) : (
        <EmptyState />
      )}

    </div>
  );
}
