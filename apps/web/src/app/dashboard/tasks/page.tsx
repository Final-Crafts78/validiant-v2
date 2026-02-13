/**
 * Tasks Page
 * 
 * List and manage tasks.
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

/**
 * Task interface
 */
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

/**
 * Mock tasks data
 */
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

/**
 * Priority badge component
 */
function PriorityBadge({ priority }: { priority: Task['priority'] }) {
  const styles = {
    low: 'badge-secondary',
    medium: 'badge-primary',
    high: 'badge-warning',
    urgent: 'badge-danger',
  };

  const labels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  };

  return <span className={`badge ${styles[priority]}`}>{labels[priority]}</span>;
}

/**
 * Task row component
 */
function TaskRow({ task }: { task: Task }) {
  const statusIcons = {
    todo: <Circle className="h-5 w-5 text-gray-400" />,
    'in-progress': <Clock className="h-5 w-5 text-primary-600" />,
    completed: <CheckCircle2 className="h-5 w-5 text-success-600" />,
  };

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="card-body">
        <div className="flex items-start gap-4">
          {/* Status Icon */}
          <button className="flex-shrink-0 mt-1">
            {statusIcons[task.status]}
          </button>

          {/* Task Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1">
                <h3
                  className={`text-base font-semibold mb-1 ${
                    task.status === 'completed'
                      ? 'text-gray-500 line-through'
                      : 'text-gray-900'
                  }`}
                >
                  {task.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-1">
                  {task.description}
                </p>
              </div>
              <PriorityBadge priority={task.priority} />
            </div>

            {/* Task Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{task.assignee}</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckSquare className="h-4 w-4" />
                <span>{task.projectName}</span>
              </div>
              <div
                className={`flex items-center gap-1 ${
                  isOverdue ? 'text-danger-600 font-medium' : ''
                }`}
              >
                {isOverdue && <AlertCircle className="h-4 w-4" />}
                <span>
                  Due {format.date(task.dueDate, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
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
          <CheckSquare className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No tasks yet
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Create your first task to start tracking your work and staying organized.
        </p>
        <button className="btn btn-primary btn-md">
          <Plus className="h-5 w-5" />
          <span>Create Task</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Tasks Page Component
 */
export default function TasksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // TODO: Replace with actual data fetching
  const tasks = mockTasks;
  const hasTasks = tasks.length > 0;

  // Stats
  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">Manage and track all your tasks</p>
        </div>
        <button className="btn btn-primary btn-md">
          <Plus className="h-5 w-5" />
          <span>New Task</span>
        </button>
      </div>

      {hasTasks ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <div className="card-body text-center">
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600 mt-1">Total</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <p className="text-3xl font-bold text-gray-900">{stats.todo}</p>
                <p className="text-sm text-gray-600 mt-1">To Do</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <p className="text-3xl font-bold text-primary-600">
                  {stats.inProgress}
                </p>
                <p className="text-sm text-gray-600 mt-1">In Progress</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <p className="text-3xl font-bold text-success-600">
                  {stats.completed}
                </p>
                <p className="text-sm text-gray-600 mt-1">Completed</p>
              </div>
            </div>
          </div>

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
                      placeholder="Search tasks..."
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
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Priority Filter */}
                <div className="w-full lg:w-48">
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="input w-full"
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
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>

          {/* Pagination Info */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{tasks.length}</span> of{' '}
              <span className="font-medium">{tasks.length}</span> tasks
            </p>
          </div>
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
