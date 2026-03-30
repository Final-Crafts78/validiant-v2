/**
 * TasksTable Component
 *
 * Advanced task list with persistent column settings,
 * virtualization, and server-side preference syncing.
 */

import React, { useMemo } from 'react';
import {
  DataTable,
  type ColumnDef,
  type RowSelectionState,
  type OnChangeFn,
} from '@validiant/ui';
import { TaskStatus, TaskPriority } from '@validiant/shared';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { format } from '@/lib/utils';
import {
  Circle,
  Clock,
  CheckCircle2,
  Settings2,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Task } from '@/hooks/useTasks';

interface TasksTableProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
}

export function TasksTable({
  tasks,
  onTaskClick,
  rowSelection = {},
  onRowSelectionChange,
}: TasksTableProps) {
  const [showColumnPicker, setShowColumnPicker] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const { preferences, updatePreferences } = useUserPreferences();

  // Close dropdown on click outside
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowColumnPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Column Visibility & Order from User Preferences
  const columnVisibility =
    (preferences?.tableSettings?.tasks?.visibility as Record<
      string,
      boolean
    >) || {};
  const columnOrder =
    (preferences?.tableSettings?.tasks?.order as string[]) || [];

  const handleVisibilityChange = (colId: string, visible: boolean) => {
    updatePreferences({
      tableSettings: {
        ...preferences?.tableSettings,
        tasks: {
          ...preferences?.tableSettings?.tasks,
          visibility: {
            ...columnVisibility,
            [colId]: visible,
          },
        },
      },
    });
  };

  const handleOrderChange = (newOrder: string[]) => {
    updatePreferences({
      tableSettings: {
        ...preferences?.tableSettings,
        tasks: {
          ...preferences?.tableSettings?.tasks,
          order: newOrder,
        },
      },
    });
  };

  const columns = useMemo<ColumnDef<Task>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <div className="px-1">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[var(--color-border-base)] bg-[var(--color-surface-base)] text-[var(--color-accent-base)] focus:ring-[var(--color-accent-base)] cursor-pointer"
              checked={table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="px-1">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onChange={row.getToggleSelectedHandler()}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
        size: 40,
      },
      {
        id: 'status',
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => {
          const val = row.original.status as TaskStatus;
          if (val === TaskStatus.COMPLETED) {
            return <CheckCircle2 className="h-4 w-4 text-[var(--color-positive-base)]" />;
          }
          if (val === TaskStatus.IN_PROGRESS) {
            return <Clock className="h-4 w-4 text-[var(--color-accent-base)]" />;
          }
          if (val === TaskStatus.VERIFIED) {
            return <Clock className="h-4 w-4 text-[var(--color-warning-base)]" />;
          }
          return <Circle className="h-4 w-4 text-[var(--color-text-muted)]" />;
        },
        size: 80,
      },
      {
        id: 'title',
        header: 'Title',
        accessorKey: 'title',
        cell: ({ row }) => (
          <span className="font-medium text-[var(--color-text-base)] truncate block">
            {row.original.title}
          </span>
        ),
        size: 300,
      },
      {
        id: 'priority',
        header: 'Priority',
        accessorKey: 'priority',
        cell: ({ row }) => {
          const p = row.original.priority as TaskPriority;
          const colors: Record<string, string> = {
            [TaskPriority.URGENT]: 'bg-danger-500/10 text-danger-600',
            [TaskPriority.HIGH]: 'bg-warning-500/10 text-warning-600',
            [TaskPriority.MEDIUM]: 'bg-primary-500/10 text-primary-600',
            [TaskPriority.LOW]: 'bg-surface-muted text-text-subtle',
            none: 'bg-surface-muted text-text-muted',
          };
          return (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors[p] || colors.none}`}
            >
              {p}
            </span>
          );
        },
        size: 100,
      },
      {
        id: 'assignee',
        header: 'Assignee',
        cell: ({ row }) =>
          row.original.assignees?.[0]?.fullName || 'Unassigned',
        size: 150,
      },
      {
        id: 'dueDate',
        header: 'Due Date',
        cell: ({ row }) =>
          row.original.dueDate ? format.date(row.original.dueDate) : '-',
        size: 120,
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text-subtle)] uppercase tracking-wider">
          Task Queue
        </h3>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowColumnPicker(!showColumnPicker)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[var(--color-text-subtle)] bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-lg hover:bg-[var(--color-surface-muted)] transition-all shadow-sm"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Columns
            <ChevronDown
              className={`h-3 w-3 transition-transform ${showColumnPicker ? 'rotate-180' : ''}`}
            />
          </button>

          {showColumnPicker && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-xl shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-1">
              <p className="px-3 py-1 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1">
                Visibility
              </p>
              {columns.map((column) => (
                <button
                  key={column.id}
                  onClick={() => {
                    const colId = column.id;
                    if (colId) {
                      handleVisibilityChange(
                        colId,
                        columnVisibility[colId] === false
                      );
                    }
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-[var(--color-text-subtle)] hover:bg-[var(--color-surface-muted)] transition-colors"
                >
                  <span className="capitalize">{column.id}</span>
                  {column.id && columnVisibility[column.id] !== false && (
                    <Check className="h-3 w-3 text-[var(--color-accent-base)]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-xl overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          data={tasks}
          height="550px"
          onRowClick={(task) => onTaskClick(task.id)}
          columnOrder={columnOrder}
          columnVisibility={columnVisibility}
          rowSelection={rowSelection}
          onRowSelectionChange={onRowSelectionChange}
          onColumnOrderChange={(updater) => {
            const newOrder =
              typeof updater === 'function'
                ? (updater as any)(columnOrder)
                : updater;
            handleOrderChange(newOrder);
          }}
          onColumnVisibilityChange={(updater) => {
            const newVisibility =
              typeof updater === 'function'
                ? (updater as any)(columnVisibility)
                : updater;
            updatePreferences({
              tableSettings: {
                ...preferences?.tableSettings,
                tasks: {
                  ...preferences?.tableSettings?.tasks,
                  visibility: newVisibility,
                },
              },
            });
          }}
        />
      </div>
    </div>
  );
}
