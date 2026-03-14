import React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  ColumnOrderState,
  VisibilityState,
  OnChangeFn,
  RowSelectionState,
} from '@tanstack/react-table';

export type {
  ColumnDef,
  SortingState,
  ColumnOrderState,
  VisibilityState,
  OnChangeFn,
  RowSelectionState,
};
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '../../lib/utils';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

/**
 * Obsidian Command DataTable Component
 * Built with @tanstack/react-virtual for O(1) rendering of large datasets.
 */
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  height?: string;
  onRowClick?: (row: TData) => void;
  columnOrder?: ColumnOrderState;
  columnVisibility?: VisibilityState;
  onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  height = '600px',
  onRowClick,
  columnOrder,
  columnVisibility,
  onColumnOrderChange,
  onColumnVisibilityChange,
  rowSelection,
  onRowSelectionChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnOrderChange,
    onColumnVisibilityChange,
    onRowSelectionChange,
    state: {
      sorting,
      columnOrder,
      columnVisibility,
      rowSelection,
    },
  });

  const { rows } = table.getRowModel();

  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52, // Height of a row in pixels
    overscan: 10,
  });

  return (
    <div className="rounded-xl border border-[var(--color-border-base)] bg-[var(--color-surface-base)] shadow-sm overflow-hidden">
      <div
        ref={parentRef}
        className="overflow-auto scrollbar-hide"
        style={{ height }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-[var(--color-surface-soft)] border-b border-[var(--color-border-base)]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left font-semibold text-[var(--color-text-muted)] select-none uppercase tracking-wider text-[0.65rem]"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              header.column.getCanSort() &&
                                'flex cursor-pointer items-center gap-1 hover:text-[var(--color-text-base)]'
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getCanSort() && (
                              <span>
                                {header.column.getIsSorted() === 'asc' ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : header.column.getIsSorted() === 'desc' ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronsUpDown className="h-3 w-3 opacity-30" />
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                if (!row) return null;
                return (
                  <tr
                    key={row.id}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    className={cn(
                      'border-b border-[var(--color-border-base)] transition-colors hover:bg-[var(--color-surface-soft)]/50',
                      onRowClick && 'cursor-pointer'
                    )}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 align-middle text-[var(--color-text-base)]"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
