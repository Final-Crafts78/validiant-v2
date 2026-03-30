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
          role="table"
        >
          {/* Table Header */}
          <div 
            className="sticky top-0 z-10 flex border-b border-[var(--color-border-base)] bg-[var(--color-surface-soft)]"
            role="rowgroup"
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <div key={headerGroup.id} className="flex w-full" role="row">
                {headerGroup.headers.map((header) => (
                  <div
                    key={header.id}
                    className="flex items-center px-4 py-3 text-left font-semibold text-[var(--color-text-muted)] select-none uppercase tracking-wider text-[0.65rem]"
                    style={{ 
                      width: header.getSize(),
                      flex: header.column.getCanResize() ? `0 0 ${header.getSize()}px` : '1 1 auto' 
                    }}
                    role="columnheader"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          'flex w-full items-center gap-1',
                          header.column.getCanSort() &&
                            'cursor-pointer hover:text-[var(--color-text-base)]'
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="shrink-0">
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
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Table Body */}
          <div role="rowgroup">
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              if (!row) return null;
              return (
                <div
                  key={row.id}
                  data-index={virtualRow.index}
                  role="row"
                  ref={virtualizer.measureElement}
                  className={cn(
                    'absolute left-0 top-0 flex w-full border-b border-[var(--color-border-base)] transition-colors hover:bg-[var(--color-surface-soft)]/50',
                    onRowClick && 'cursor-pointer'
                  )}
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <div
                      key={cell.id}
                      className="flex items-center px-4 py-3 text-[var(--color-text-base)] text-sm"
                      style={{ 
                        width: cell.column.getSize(),
                        flex: cell.column.getCanResize() ? `0 0 ${cell.column.getSize()}px` : '1 1 auto'
                      }}
                      role="cell"
                    >
                      <div className="w-full truncate">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
