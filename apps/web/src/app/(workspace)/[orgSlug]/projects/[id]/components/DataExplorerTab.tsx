'use client';

import { useMemo, useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useVerificationTypes } from '@/hooks/useVerificationTypes';
import { useWorkspaceStore } from '@/store/workspace';
import { logger } from '@/lib/logger';
import {
  Loader2,
  Upload,
  LayoutDashboard,
  Columns,
  Plus,
  Search,
  Database,
} from 'lucide-react';
import { BulkUploadWizard } from '@/components/tasks/BulkUploadWizard';
import { type VerificationField } from '@/types/tasks';
import { TasksBoard } from '@/components/tasks/TasksBoard';
import { TasksTable } from '@/components/tasks/TasksTable';
import { BulkActionBar } from '@/components/tasks/BulkActionBar';
import { BulkAssignModal } from '@/components/modals/BulkAssignModal';
import { BulkStatusModal } from '@/components/modals/BulkStatusModal';
import { CreateTaskModal } from '@/components/modals/CreateTaskModal';
import { type Task } from '@/hooks/useTasks';

// Phase 2 Imports
import { useProjectTypes } from '@/hooks/useProjectTypes';
import { useRecords } from '@/hooks/useRecords';
import { RecordTable } from '@/components/records/RecordTable';
import { RecordSlideOver } from '@/components/records/RecordSlideOver';

interface VerificationType {
  id: string;
  code: string;
  name: string;
  fieldSchema?: VerificationField[];
}

export function DataExplorerTab({ projectId }: { projectId: string }) {
  const { activeOrgId } = useWorkspaceStore();
  const { data: vTypes } = useVerificationTypes(activeOrgId || '');
  const { data: tasksData, isLoading, isError, error } = useTasks(projectId);

  if (isError) {
    console.error('[DataExplorer:FetchError]', { projectId, error });
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'universe'>('universe');
  
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const [selectedRecordId, setSelectedRecordId] = useState<string | undefined>();
  const [isRecordOpen, setIsRecordOpen] = useState(false);

  // Phase 2: Project Types & Records
  const { data: projectTypes } = useProjectTypes(projectId);
  const { records, isLoading: recordsLoading } = useRecords(projectId);
  const activeType = projectTypes?.[0];

  const customSchemaFields = useMemo(() => {
    if (!vTypes) return [];
    const projectWorkflow = vTypes.find(
      (v: VerificationType) => v.code === `PRJ_${projectId}_CUSTOM`
    );
    return projectWorkflow?.fieldSchema || [];
  }, [vTypes, projectId]);

  const tasks = useMemo<Task[]>(() => {
    const raw = tasksData?.pages.flatMap((page) => page.tasks) ?? [];
    if (!searchTerm) return raw;
    return raw.filter((t) =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasksData, searchTerm]);

  const selectedTaskIds = useMemo(() => 
    Object.keys(rowSelection).filter(id => rowSelection[id]), 
    [rowSelection]
  );

  const handleViewChange = (mode: 'table' | 'kanban' | 'universe') => {
    logger.info('[DataExplorer:ViewTransition]', { from: viewMode, to: mode });
    setViewMode(mode);
  };

  const handleBulkSuccess = () => {
    setRowSelection({});
  };

  const onTaskClick = (taskId: string) => {
    logger.debug('[DataExplorer:TaskClick]', { taskId });
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
            <button
              onClick={() => handleViewChange('universe')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'universe'
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Data Universe"
            >
              <Database className="w-4 h-4" />
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
            onClick={() => {
              if (viewMode === 'universe') {
                setIsRecordOpen(true);
              } else {
                setIsCreateOpen(true);
              }
            }}
          >
            <Plus className="w-4 h-4" />
            {viewMode === 'universe' ? 'New Record' : 'New Task'}
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
      ) : (
        <>
          {viewMode === 'table' && (
            <TasksTable
              tasks={tasks}
              onTaskClick={onTaskClick}
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
            />
          )}

          {viewMode === 'kanban' && (
            <TasksBoard 
              tasks={tasks} 
              onTaskClick={onTaskClick}
            />
          )}

          {viewMode === 'universe' && activeType && (
            <RecordTable
              projectType={activeType}
              records={records || []}
              isLoading={recordsLoading}
              onEdit={(id) => {
                setSelectedRecordId(id);
                setIsRecordOpen(true);
              }}
            />
          )}
        </>
      )}

      {/* Global Action Bar */}
      {selectedTaskIds.length > 0 && (
        <BulkActionBar
          selectedCount={selectedTaskIds.length}
          onClear={() => setRowSelection({})}
          onAssign={() => setIsAssignOpen(true)}
          onStatusChange={() => setIsStatusOpen(true)}
        />
      )}

      {/* Slide-overs & Modals */}
      <CreateTaskModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultProjectId={projectId}
      />

      {activeType && (
        <RecordSlideOver
          isOpen={isRecordOpen}
          onClose={() => {
            setIsRecordOpen(false);
            setSelectedRecordId(undefined);
          }}
          projectId={projectId}
          projectType={activeType}
          recordId={selectedRecordId}
        />
      )}

      <BulkUploadWizard
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        fieldSchema={customSchemaFields}
      />

      <BulkAssignModal
        open={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        projectId={projectId}
        selectedTaskIds={selectedTaskIds}
        orgId={activeOrgId || ''}
        onSuccess={handleBulkSuccess}
      />

      <BulkStatusModal
        open={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        projectId={projectId}
        selectedTaskIds={selectedTaskIds}
        onSuccess={handleBulkSuccess}
      />
    </div>
  );
}
