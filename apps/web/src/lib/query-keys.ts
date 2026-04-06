/**
 * TanStack Query Key Factory
 *
 * Centralized query key management for type safety, consistency, and surgical invalidation.
 * Pattern: [domain, { scope, ...params }]
 */

export const queryKeys = {
  // Authentication
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.users.all, 'detail', id] as const,
    profile: (id: string) =>
      [...queryKeys.users.detail(id), 'profile'] as const,
  },

  // Organizations
  organizations: {
    all: ['organizations'] as const,
    lists: () => [...queryKeys.organizations.all, 'list'] as const,
    my: () => [...queryKeys.organizations.lists(), 'my'] as const,
    detail: (id: string) =>
      [...queryKeys.organizations.all, 'detail', id] as const,
    members: (id: string) =>
      [...queryKeys.organizations.detail(id), 'members'] as const,
    projects: (id: string) =>
      [...queryKeys.organizations.detail(id), 'projects'] as const,
    invitations: (id: string) =>
      [...queryKeys.organizations.detail(id), 'invitations'] as const,
    roles: (id: string) =>
      [...queryKeys.organizations.detail(id), 'roles'] as const,
  },

  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    org: (orgId: string) => [...queryKeys.projects.lists(), { orgId }] as const,
    detail: (id: string) => [...queryKeys.projects.all, 'detail', id] as const,
    tasks: (id: string, filters?: any) =>
      filters
        ? ([...queryKeys.projects.detail(id), 'tasks', filters] as const)
        : ([...queryKeys.projects.detail(id), 'tasks'] as const),
    members: (id: string) =>
      [...queryKeys.projects.detail(id), 'members'] as const,
    types: (id: string) =>
      [...queryKeys.projects.detail(id), 'types'] as const,
    typeColumns: (id: string, typeId: string) =>
      [...queryKeys.projects.detail(id), 'types', typeId, 'columns'] as const,
  },

  // Tasks
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.tasks.all, 'detail', id] as const,
    byProject: (projectId: string) =>
      [...queryKeys.tasks.lists(), { projectId }] as const,
    byUser: (userId: string) =>
      [...queryKeys.tasks.lists(), { userId }] as const,
    timeline: (id: string) =>
      [...queryKeys.tasks.detail(id), 'timeline'] as const,
    comments: (id: string) =>
      [...queryKeys.tasks.detail(id), 'comments'] as const,
    assignees: (id: string) =>
      [...queryKeys.tasks.detail(id), 'assignees'] as const,
  },

  // Cases (special view for tasks)
  cases: {
    all: ['cases'] as const,
    hub: (caseId: string) => [...queryKeys.cases.all, 'hub', caseId] as const,
  },

  // Memberships (RBAC)
  memberships: {
    org: (orgId: string) => ['memberships', 'org', orgId] as const,
    project: (projectId: string) =>
      ['memberships', 'project', projectId] as const,
  },

  // Notifications (Phase 26)
  notifications: {
    all: ['notifications'] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
    list: (orgId: string) =>
      [...queryKeys.notifications.all, 'list', { orgId }] as const,
  },

  // Project Types (Phase 5)
  types: {
    all: ['types'] as const,
    byProject: (projectId: string) =>
      [...queryKeys.types.all, { projectId }] as const,
    detail: (projectId: string, typeId: string) =>
      [...queryKeys.types.byProject(projectId), typeId] as const,
  },

  // Type Columns (Phase 5)
  columns: {
    all: ['columns'] as const,
    byType: (projectId: string, typeId: string) =>
      [...queryKeys.columns.all, { projectId, typeId }] as const,
  },

  // Project Records (Phase 5)
  records: {
    all: ['records'] as const,
    byProject: (projectId: string, filters?: any) =>
      filters
        ? ([...queryKeys.records.all, 'list', { projectId, ...filters }] as const)
        : ([...queryKeys.records.all, 'list', { projectId }] as const),
    detail: (projectId: string, recordId: string) =>
      [...queryKeys.records.all, 'detail', { projectId, recordId }] as const,
    history: (projectId: string, recordId: string) =>
      [...queryKeys.records.detail(projectId, recordId), 'history'] as const,
  },
} as const;

// Alias for easier imports and backward compatibility if needed
export const ORG_KEYS = queryKeys.organizations;
export const TASK_KEYS = queryKeys.tasks;
export const USER_KEYS = queryKeys.users;
export const PROJECT_KEYS = queryKeys.projects;
export const AUTH_KEYS = queryKeys.auth;
