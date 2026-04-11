import React from 'react';
import { WidgetDefinition } from './types';
import {
  PieChart,
  Activity,
  Grip,
  FolderKanban,
  CheckSquare,
  Users,
} from 'lucide-react';

// Using dynamic imports for widgets to keep dashboard payload small
const ProjectStatusMatrix = React.lazy(
  () => import('./widgets/ProjectStatusMatrix')
);
const KPIScorecard = React.lazy(() => import('./widgets/KPIScorecard'));
const TaskBurndown = React.lazy(() => import('./widgets/TaskBurndown'));
const TeamWorkload = React.lazy(() => import('./widgets/TeamWorkload'));
const PriorityDistribution = React.lazy(
  () => import('./widgets/PriorityDistribution')
);
const RecentActivity = React.lazy(() => import('./widgets/RecentActivity'));
const QuickActions = React.lazy(() => import('./widgets/QuickActions'));
const TimelineOverview = React.lazy(() => import('./widgets/TimelineOverview'));

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  'project-status-matrix': {
    id: 'project-status-matrix',
    name: 'Project Matrix',
    description: 'Grid view of all projects and health status',
    category: 'projects',
    icon: FolderKanban,
    defaultSize: { w: 12, h: 4 },
    minSize: { w: 6, h: 4 },
    component: ProjectStatusMatrix,
  },
  'kpi-scorecard': {
    id: 'kpi-scorecard',
    name: 'KPI Scorecard',
    description: 'Key performance indicators for the organization',
    category: 'analytics',
    icon: Activity,
    defaultSize: { w: 12, h: 3 },
    minSize: { w: 6, h: 2 },
    component: KPIScorecard,
  },
  'task-burndown': {
    id: 'task-burndown',
    name: 'Task Burndown',
    description: 'Velocity and task completion over time',
    category: 'tasks',
    icon: Activity,
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    component: TaskBurndown,
  },
  'team-workload': {
    id: 'team-workload',
    name: 'Team Workload',
    description: 'Active tasks distributed by assignee',
    category: 'team',
    icon: Users,
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    component: TeamWorkload,
  },
  'priority-distribution': {
    id: 'priority-distribution',
    name: 'Priority Focus',
    description: 'Breakdown of active task priorities',
    category: 'analytics',
    icon: PieChart,
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    component: PriorityDistribution,
  },
  'recent-activity': {
    id: 'recent-activity',
    name: 'Audit Feed',
    description: 'Live feed of recent actions and events',
    category: 'analytics', // Changed to analytics or audit
    icon: Activity,
    defaultSize: { w: 4, h: 6 },
    minSize: { w: 3, h: 4 },
    component: RecentActivity,
  },
  'quick-actions': {
    id: 'quick-actions',
    name: 'Quick Actions',
    description: 'Shortcut buttons to create items rapidly',
    category: 'custom',
    icon: Grip,
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    component: QuickActions,
  },
  'timeline-overview': {
    id: 'timeline-overview',
    name: 'Timeline',
    description: 'Horizontal roadmap of project milestones',
    category: 'projects',
    icon: CheckSquare,
    defaultSize: { w: 12, h: 5 },
    minSize: { w: 6, h: 4 },
    component: TimelineOverview,
  },
};

export const getAllWidgets = () => Object.values(WIDGET_REGISTRY);

export const getWidgetDefinition = (
  id: string
): WidgetDefinition | undefined => {
  return WIDGET_REGISTRY[id];
};
