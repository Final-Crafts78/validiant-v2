/**
 * Dashboard Page
 * 
 * Main dashboard with overview statistics and recent activity.
 */

'use client';

import { useAuthStore } from '@/store/auth';
import { format } from '@/lib/utils';
import {
  FolderKanban,
  CheckSquare,
  Users,
  Clock,
  TrendingUp,
  Calendar,
  AlertCircle,
} from 'lucide-react';

/**
 * Stat card component
 */
function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon: React.ComponentType<{ className?: string }>;
  color: 'primary' | 'success' | 'warning' | 'secondary';
}) {
  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
            {change && (
              <div className="flex items-center gap-1">
                <TrendingUp
                  className={`h-4 w-4 ${
                    changeType === 'increase'
                      ? 'text-success-600'
                      : 'text-danger-600'
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    changeType === 'increase'
                      ? 'text-success-600'
                      : 'text-danger-600'
                  }`}
                >
                  {change}
                </span>
                <span className="text-sm text-gray-500">vs last month</span>
              </div>
            )}
          </div>
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${color}-100`}
          >
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Recent activity item
 */
function ActivityItem({
  title,
  description,
  time,
  type,
}: {
  title: string;
  description: string;
  time: string;
  type: 'project' | 'task' | 'user';
}) {
  const iconColor =
    type === 'project'
      ? 'bg-primary-100 text-primary-600'
      : type === 'task'
      ? 'bg-success-100 text-success-600'
      : 'bg-secondary-100 text-secondary-600';

  const Icon =
    type === 'project' ? FolderKanban : type === 'task' ? CheckSquare : Users;

  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-200 last:border-0">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-600 mt-0.5">{description}</p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
}

/**
 * Dashboard Page Component
 */
export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  // Current date
  const currentDate = new Date();
  const greeting = `Good ${currentDate.getHours() < 12 ? 'morning' : currentDate.getHours() < 18 ? 'afternoon' : 'evening'}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {greeting}, {user.firstName}! 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your projects today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Projects"
          value={8}
          change="+12%"
          changeType="increase"
          icon={FolderKanban}
          color="primary"
        />
        <StatCard
          title="Active Tasks"
          value={24}
          change="+8%"
          changeType="increase"
          icon={CheckSquare}
          color="success"
        />
        <StatCard
          title="Team Members"
          value={12}
          change="+3"
          changeType="increase"
          icon={Users}
          color="warning"
        />
        <StatCard
          title="Hours Tracked"
          value="142h"
          change="+15%"
          changeType="increase"
          icon={Clock}
          color="secondary"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Recent Activity
                </h2>
                <button className="text-sm font-medium text-primary-600 hover:text-primary-700">
                  View All
                </button>
              </div>

              <div className="space-y-0">
                <ActivityItem
                  type="project"
                  title="New project created"
                  description='"Website Redesign" has been created'
                  time="2 hours ago"
                />
                <ActivityItem
                  type="task"
                  title="Task completed"
                  description='"Update landing page" marked as complete'
                  time="4 hours ago"
                />
                <ActivityItem
                  type="user"
                  title="New team member"
                  description="John Doe joined the team"
                  time="5 hours ago"
                />
                <ActivityItem
                  type="project"
                  title="Project milestone reached"
                  description='"Mobile App" reached 75% completion'
                  time="1 day ago"
                />
                <ActivityItem
                  type="task"
                  title="Task assigned"
                  description="3 new tasks assigned to you"
                  time="2 days ago"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <div className="card-body">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-2">
                <button className="btn btn-primary btn-sm w-full">
                  <FolderKanban className="h-4 w-4" />
                  <span>New Project</span>
                </button>
                <button className="btn btn-outline btn-sm w-full">
                  <CheckSquare className="h-4 w-4" />
                  <span>New Task</span>
                </button>
                <button className="btn btn-outline btn-sm w-full">
                  <Users className="h-4 w-4" />
                  <span>Invite Team</span>
                </button>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Upcoming Deadlines
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-danger-500 rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Website Launch
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Due in 2 days
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-warning-500 rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Client Presentation
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Due in 5 days
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-success-500 rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Budget Review
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Due in 1 week
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="card border-warning-200 bg-warning-50">
            <div className="card-body">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-warning-900 mb-1">
                    Verification Required
                  </h3>
                  <p className="text-xs text-warning-800 mb-3">
                    Please verify your email address to unlock all features.
                  </p>
                  <button className="text-xs font-medium text-warning-900 hover:text-warning-950 underline">
                    Verify Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
