/**
 * Tasks Page
 *
 * List and manage tasks.
 * Corporate Light Theme — Phase 8.
 */

'use client';

import { useState } from 'react';
import { format } from '@/lib/utils';
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
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Task interface — preserved verbatim
// ---------------------------------------------------------------------------
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: string;
  projectName: string;
  dueDate: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Mock tasks data — preserved verbatim
// ---------------------------------------------------------------------------
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Update landing page design',
    description: 'Redesign the hero section with new brand colors',
    status: 'in-progress',
    priority: 'high',
    assignee: 'John Doe',
    projectName: 'Website Redesign',
    dueDate: '2026-02-20',
    createdAt: '2026-02-10',
  },
  {
    id: '2',
    title: 'Fix mobile navigation bug',
    description: 'Menu not closing on mobile devices',
    status: 'todo',
    priority: 'urgent',
    assignee: 'Jane Smith',
    projectName: 'Website Redesign',
    dueDate: '2026-02-16',
    createdAt: '2026-02-12',
  },
  {
    id: '3',
    title: 'Write API documentation',
    description: 'Document all REST API endpoints',
    status: 'completed',
    priority: 'medium',
    assignee: 'Mike Johnson',
    projectName: 'Mobile App Development',
    dueDate: '2026-02-15',
    createdAt: '2026-02-08',
  },
  {
    id: '4',
    title: 'Create social media content',
    description: 'Design posts for Instagram and LinkedIn',
    status: 'todo',
    priority: 'low',
    assignee: 'Sarah Williams',
    projectName: 'Marketing Campaign',
    dueDate: '2026-02-25',
    createdAt: '2026-02-11',
  },
  {
    id: '5',
    title: 'Review pull requests',
    description: 'Review and merge pending PRs',
    status: 'in-progress',
    priority: 'medium',
    assignee: 'John Doe',
    projectName: 'Mobile App Development',
    dueDate: '2026-02-18',
    createdAt: '2026-02-13',
  },
];

// ---------------------------------------------------------------------------
// Shared input class
// ---------------------------------------------------------------------------
const inputCls =
  'w-full bg-white border border-slate-300 rounded-lg text-sm text-slate-900 ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 ' +
  'focus:border-transparent transition';

// ---------------------------------------------------------------------------
// Priority Badge — Corporate Light Tailwind pill variants
// ---------------------------------------------------------------------------
function PriorityBadge({ priority }: { priority: Task['priority'] }) {
  const styles: Record<Task['priority'], string> = {
    low: 'bg-slate-100 text-slate-700 border border-slate-200',
    medium: 'bg-blue-50 text-blue-700 border border-blue-200',
    high: 'bg-amber-50 text-amber-700 border border-amber-200',
    urgent: 'bg-red-50 text-red-700 border border-red-200',
  };

  const labels: Record<Task['priority'], string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[priority]}`}
    >
      {labels[priority]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Task Row
// ---------------------------------------------------------------------------
function TaskRow({ task }: { task: Task }) {
  const isOverdue =
    new Date(task.dueDate) < new Date() && task.status !== 'completed';

  const statusIcon = {
    todo: <Circle className="h-5 w-5 text-slate-400 shrink-0" />,
    'in-progress': <Clock className="h-5 w-5 text-blue-600 shrink-0" />,
    completed: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
  }[task.status];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start gap-4">
        {/* Status Icon */}
        <button
          type="button"
          aria-label={`Mark task as ${task.status === 'todo' ? 'in progress' : 'complete'}`}
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

          {/* Description */}
          <p className="text-sm text-slate-500 line-clamp-1 mb-3">
            {task.description}
          </p>

          {/* Task meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {/* Assignee */}
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <User className="h-3.5 w-3.5 shrink-0" />
              {task.assignee}
            </span>

            {/* Project */}
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <CheckSquare className="h-3.5 w-3.5 shrink-0" />
              {task.projectName}
            </span>

            {/* Due Date */}
            <span
              className={`flex items-center gap-1.5 text-xs ${
                isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'
              }`}
            >
              {isOverdue && <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
              Due{' '}
              {format.date(task.dueDate, { month: 'short', day: 'numeric' })}
            </span>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // TODO: Replace with actual data fetching
  const tasks = mockTasks;
  const hasTasks = tasks.length > 0;

  // Derived stats — preserved verbatim
  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

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

              {/* Status Filter */}
              <div className="w-full lg:w-44 relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`${inputCls} pl-9 py-2 appearance-none`}
                >
                  <option value="all">All Status</option>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Priority Filter */}
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
                </select>
              </div>

            </div>
          </div>

          {/* =================================================================
              TASK LIST
          ================================================================= */}
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>

          {/* Pagination info */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing{' '}
              <span className="font-medium text-slate-700">{tasks.length}</span>
              {' '}of{' '}
              <span className="font-medium text-slate-700">{tasks.length}</span>
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
