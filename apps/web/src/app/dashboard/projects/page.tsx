/**
 * Projects Page
 *
 * List and manage projects.
 * Corporate Light Theme — Phase 8.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/config';
import { format } from '@/lib/utils';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Users,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Project interface — preserved verbatim
// ---------------------------------------------------------------------------
interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on-hold' | 'planning';
  progress: number;
  memberCount: number;
  taskCount: number;
  dueDate: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Mock projects data — preserved verbatim
// ---------------------------------------------------------------------------
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Complete redesign of the company website with modern UI/UX',
    status: 'active',
    progress: 65,
    memberCount: 5,
    taskCount: 24,
    dueDate: '2026-03-15',
    createdAt: '2026-01-10',
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Native mobile app for iOS and Android platforms',
    status: 'active',
    progress: 45,
    memberCount: 8,
    taskCount: 38,
    dueDate: '2026-04-20',
    createdAt: '2025-12-01',
  },
  {
    id: '3',
    name: 'Marketing Campaign',
    description: 'Q1 2026 digital marketing and social media campaign',
    status: 'planning',
    progress: 15,
    memberCount: 4,
    taskCount: 12,
    dueDate: '2026-03-31',
    createdAt: '2026-02-01',
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
// Status Badge — pure Tailwind pills
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: Project['status'] }) {
  const styles: Record<Project['status'], string> = {
    active: 'bg-blue-50 text-blue-700 border border-blue-200',
    completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'on-hold': 'bg-amber-50 text-amber-700 border border-amber-200',
    planning: 'bg-slate-100 text-slate-700 border border-slate-200',
  };

  const labels: Record<Project['status'], string> = {
    active: 'Active',
    completed: 'Completed',
    'on-hold': 'On Hold',
    planning: 'Planning',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Project Card
// ---------------------------------------------------------------------------
function ProjectCard({ project }: { project: Project }) {
  const isOverdue =
    new Date(project.dueDate) < new Date() && project.status !== 'completed';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">

      {/* Card Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Project icon */}
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
            <FolderKanban className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 truncate">
              {project.name}
            </h3>
            <StatusBadge status={project.status} />
          </div>
        </div>
        <button
          type="button"
          aria-label="Project options"
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-500 line-clamp-2 mb-4">
        {project.description}
      </p>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Progress
          </span>
          <span className="text-xs font-semibold text-slate-700">
            {project.progress}%
          </span>
        </div>
        {/* Track */}
        <div className="w-full bg-slate-100 rounded-full h-2">
          {/* Fill — inline style for dynamic width; no arbitrary Tailwind value */}
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${project.progress}%` }}
            role="progressbar"
            aria-valuenow={project.progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Meta Footer — pushed to bottom via mt-auto */}
      <div className="mt-auto pt-4 border-t border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-y-2">
          {/* Team & Tasks */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              {project.memberCount}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
              {project.taskCount} tasks
            </span>
          </div>

          {/* Due Date */}
          <span
            className={`flex items-center gap-1.5 text-xs ${
              isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'
            }`}
          >
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {format.date(project.dueDate, { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* View Details Link */}
        <Link
          href={ROUTES.PROJECT_DETAIL(project.id)}
          className="mt-3 w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          View Details
        </Link>
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
        <FolderKanban className="h-7 w-7 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        No projects found
      </h3>
      <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
        Create your first project to start organizing your work and
        collaborating with your team.
      </p>
      <button
        type="button"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Create Project
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Projects Page Component
// ---------------------------------------------------------------------------
export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // TODO: Replace with actual data fetching
  const projects = mockProjects;
  const hasProjects = projects.length > 0;

  // Derived stats
  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    onHold: projects.filter(
      (p) => p.status === 'on-hold' || p.status === 'planning'
    ).length,
  };

  return (
    <div className="space-y-6">

      {/* =================================================================
          PAGE HEADER
      ================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage workspaces and track project milestones
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {hasProjects ? (
        <>
          {/* =============================================================
              STATS GRID
          ============================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-center">
              <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">
                Total
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.active}</p>
              <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">
                Active
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-center">
              <p className="text-3xl font-bold text-emerald-600">
                {stats.completed}
              </p>
              <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">
                Completed
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-center">
              <p className="text-3xl font-bold text-amber-600">
                {stats.onHold}
              </p>
              <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wide">
                Planning / On Hold
              </p>
            </div>

          </div>

          {/* =============================================================
              FILTERS BAR
          ============================================================= */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex flex-col lg:flex-row gap-3">

              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search projects…"
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
                  <option value="active">Active</option>
                  <option value="planning">Planning</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

            </div>
          </div>

          {/* =============================================================
              PROJECTS GRID
          ============================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {/* Pagination info */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing{' '}
              <span className="font-medium text-slate-700">
                {projects.length}
              </span>
              {' '}of{' '}
              <span className="font-medium text-slate-700">
                {projects.length}
              </span>
              {' '}projects
            </p>
          </div>
        </>
      ) : (
        <EmptyState />
      )}

    </div>
  );
}
