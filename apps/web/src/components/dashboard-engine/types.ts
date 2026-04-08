import React from 'react';

export interface WidgetProps {
  orgId: string;
  projectId?: string;
  isEditing?: boolean;
}

export interface WidgetDefinition {
  id: string; // The permanent catalog ID (e.g., 'project-status-matrix')
  name: string; // Human-readable name
  description: string;
  category: 'analytics' | 'projects' | 'tasks' | 'team' | 'custom';
  icon: React.ComponentType<{ className?: string }>;
  defaultSize: { w: number; h: number }; // In RGL grid units
  minSize: { w: number; h: number };
  maxSize?: { w: number; h: number };
  component: React.ComponentType<WidgetProps>; // Use normal components or React.lazy wrapped
}

export interface LayoutItem {
  i: string; // The specific instance ID on the dashboard
  w: number;
  h: number;
  x: number;
  y: number;
  widgetId: string; // References WidgetDefinition.id
}

export interface DashboardLayout {
  widgets: LayoutItem[];
  version: number;
}
