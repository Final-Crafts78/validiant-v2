import { useMemo, useState } from 'react';
import { useTasks, useBulkDeleteTasks } from '@/hooks/useTasks';
import { useVerificationTypes } from '@/hooks/useVerificationTypes';
import { useWorkspaceStore } from '@/store/workspace';
import { logger } from '@/lib/logger';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Search,
  Loader2,
  FileDigit,
  Upload,
  LayoutDashboard,
  Columns,
  Plus,
} from 'lucide-react';
import { BulkUploadWizard } from '@/components/tasks/BulkUploadWizard';
import { TaskStatus } from '@validiant/shared';
import { TasksBoard } from '@/components/tasks/TasksBoard';
import { BulkActionBar } from '@/components/tasks/BulkActionBar';
import { BulkAssignModal } from '@/components/modals/BulkAssignModal';
import { BulkStatusModal } from '@/components/modals/BulkStatusModal';
import { CreateTaskModal } from '@/components/modals/CreateTaskModal';

interface VerificationType {
  id: string;
  code: string;
  name: string;
  fieldSchema?: any[];
}

export function DataExplorerTab({ projectId }: { projectId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { activeOrgId } = useWorkspaceStore();
  const { data: vTypes } = useVerificationTypes(activeOrgId || '');
  const { data: tasksData, isLoading } = useTasks(projectId);
  const bulkDeleteMutation = useBulkDeleteTasks();

  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Extract the project's custom verification schema
  const customSchemaFields = useMemo(() => {
    if (!vTypes) return [];
    const projectWorkflow = vTypes.find(
      (v: VerificationType) => v.code === `PRJ_${projectId}_CUSTOM`
    );
    logger.debug('[DataExplorerTab:SchemaMap]', {
      projectId,
      workflowFound: !!projectWorkflow,
      fieldCount: projectWorkflow?.fieldSchema?.length || 0,
    });
    return projectWorkflow?.fieldSchema || [];
  }, [vTypes, projectId]);

  // Aggregate tasks flat array
  const tasks = useMemo(() => {
    const raw = tasksData?.pages.flatMap((page) => page.tasks) ?? [];
    if (!searchTerm) return raw;
    return raw.filter((t) =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasksData, searchTerm]);

  const toggleSelectAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tasks.map((t) => t.id));
    }
  };

  const toggleSelectTask = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleViewChange = (mode: 'table' | 'kanban') => {
    logger.info('[DataExplorer:ViewTransition]', { from: viewMode, to: mode });
    setViewMode(mode);
  };

  const handleBulkSuccess = () => {
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete ${selectedTaskIds.length} tasks? This cannot be undone.`
      )
    ) {
      bulkDeleteMutation.mutate(
        { projectId, taskIds: selectedTaskIds },
        {
          onSuccess: () => {
            logger.info('[MassDelete:Commit]', {
              taskCount: selectedTaskIds.length,
            });
            handleBulkSuccess();
          },
        }
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative group flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search tasks, IDs, subjects..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full sm:w-72 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            <button
              onClick={() => handleViewChange('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Table View"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewChange('kanban')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Kanban Board"
            >
              <Columns className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </button>
          <button
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          <p className="text-sm font-bold tracking-tight text-slate-500">
            SYNCING COMMAND CENTER DATA...
          </p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-20 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-400 text-sm flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
            <FileDigit className="w-8 h-8 text-slate-200" />
          </div>
          <p className="font-bold text-slate-800 text-lg mb-1">
            No tasks found
          </p>
          <p className="text-slate-500">
            Try adjusting your filters or upload a CSV to get started.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    checked={
                      tasks.length > 0 &&
                      selectedTaskIds.length === tasks.length
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Reference
                </th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Task Detail
                </th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Assignees
                </th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Created
                </th>
                {customSchemaFields.map((field: any) => (
                  <th
                    key={field.fieldKey}
                    className="p-4 text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-50/30"
                  >
                    <div className="flex items-center gap-1.5">
                      {field.label}
                      {field.required && (
                        <span className="text-red-400 text-xs">*</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('taskId', task.id);
                    router.push(`${pathname}?${params.toString()}`);
                  }}
                  className={`hover:bg-slate-50/50 transition-colors group cursor-pointer ${
                    selectedTaskIds.includes(task.id) ? 'bg-indigo-50/30' : ''
                  }`}
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      className="rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={selectedTaskIds.includes(task.id)}
                      onChange={() => toggleSelectTask(task.id)}
                    />
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      ID-{task.id.slice(0, 6).toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-slate-800 leading-tight">
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                        {task.description}
                      </p>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       <span
                        className={`w-2 h-2 rounded-full ${
                          task.status === TaskStatus.COMPLETED
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                            : task.status === TaskStatus.IN_PROGRESS
                              ? 'bg-blue-500 animate-pulse'
                              : 'bg-slate-300'
                        }`}
                      />
                      <span className="text-xs font-bold text-slate-600">
                        {task.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex -space-x-2">
                      {(task as any).assignees?.length > 0 ? (
                        (task as any).assignees
                          .slice(0, 3)
                          .map((a: any) => (
                            <div
                              key={a.id}
                              className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm"
                              title={a.fullName}
                            >
                              {a.fullName.charAt(0).toUpperCase()}
                            </div>
                          ))
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                          None
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-medium text-slate-400">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  {customSchemaFields.map((field: any) => (
                    <td key={field.fieldKey} className="p-4 border-l border-slate-50/50">
                      <span className="text-xs text-slate-600 font-medium">
                        {String(
                          (task.customFields as any)?.[field.fieldKey] || '-'
                        )}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
          <TasksBoard
            tasks={tasks as any}
            onTaskClick={(id: string) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('taskId', id);
              router.push(`${pathname}?${params.toString()}`);
            }}
          />
        </div>
      )}

      {/* Bulk Action Bar - Sticky/Floating at the bottom */}
      <BulkActionBar
        selectedCount={selectedTaskIds.length}
        onClear={() => setSelectedTaskIds([])}
        onAssign={() => setIsAssignOpen(true)}
        onStatusChange={() => setIsStatusOpen(true)}
        onDelete={handleBulkDelete}
      />

      {/* Triage Modals */}
      <BulkUploadWizard
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        fieldSchema={customSchemaFields}
      />

      <CreateTaskModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultProjectId={projectId}
      />

      <BulkAssignModal
        open={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        selectedTaskIds={selectedTaskIds}
        projectId={projectId}
        orgId={activeOrgId || ''}
        onSuccess={handleBulkSuccess}
      />

      <BulkStatusModal
        open={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        selectedTaskIds={selectedTaskIds}
        projectId={projectId}
        onSuccess={handleBulkSuccess}
      />
    </div>
  );
}
