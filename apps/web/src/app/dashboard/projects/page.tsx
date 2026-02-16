/**
 * Projects Page
 *
 * List and manage projects.
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

/**
 * Project interface
 */
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

/**
 * Mock projects data
 */
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

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: Project['status'] }) {
  const styles = {
    active: 'badge-success',
    completed: 'badge-primary',
    'on-hold': 'badge-warning',
    planning: 'badge-secondary',
  };

  const labels = {
    active: 'Active',
    completed: 'Completed',
    'on-hold': 'On Hold',
    planning: 'Planning',
  };

  return <span className={`badge ${styles[status]}`}>{labels[status]}</span>;
}

/**
 * Project card component
 */
function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="card-body">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FolderKanban className="h-6 w-6 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                {project.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {project.description}
              </p>
            </div>
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>

        {/* Status */}
        <div className="mb-4">
          <StatusBadge status={project.status} />
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-semibold text-gray-900">
              {project.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {project.memberCount} members
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {project.taskCount} tasks
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {format.date(project.dueDate, { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link
            href={ROUTES.PROJECT_DETAIL(project.id)}
            className="btn btn-outline btn-sm w-full"
          >
            View Details
          </Link>
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
          <FolderKanban className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No projects yet
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Create your first project to start organizing your work and
          collaborating with your team.
        </p>
        <button className="btn btn-primary btn-md">
          <Plus className="h-5 w-5" />
          <span>Create Project</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Projects Page Component
 */
export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // TODO: Replace with actual data fetching
  const projects = mockProjects;
  const hasProjects = projects.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            Manage and track all your projects
          </p>
        </div>
        <button className="btn btn-primary btn-md">
          <Plus className="h-5 w-5" />
          <span>New Project</span>
        </button>
      </div>

      {hasProjects ? (
        <>
          {/* Filters */}
          <div className="card">
            <div className="card-body">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input pl-10 w-full"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="w-full lg:w-48">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="input pl-10 w-full"
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
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {/* Pagination Info */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{projects.length}</span> of{' '}
              <span className="font-medium">{projects.length}</span> projects
            </p>
          </div>
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
