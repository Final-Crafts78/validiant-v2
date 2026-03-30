'use client';
/**
 * Bulk Upload Wizard
 *
 * Phase 24: Drag-and-drop .csv/.xlsx upload for tasks.
 * Uses SheetJS (xlsx) to parse files, then submits via tasksApi.bulkCreate.
 */

import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/store/workspace';
import { tasksApi } from '@/lib/api';
import {
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react';

interface BulkUploadWizardProps {
  open: boolean;
  onClose: () => void;
}

export function BulkUploadWizard({ open, onClose }: BulkUploadWizardProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeProjectId = useWorkspaceStore((state) => state.activeProjectId);

  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [parseError, setParseError] = useState('');
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');

  // Mutation to submit parsed rows
  const mutation = useMutation({
    mutationFn: (tasks: Record<string, unknown>[]) => {
      if (!activeProjectId) throw new Error('No active project selected.');
      return tasksApi.bulkCreate(activeProjectId, tasks);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setStep('done');
    },
  });

  // Parse file using SheetJS (dynamic import to avoid SSR issues)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const parseFile = useCallback(async (f: File) => {
    try {
      setParseError('');
      const XLSX = await import(/* webpackIgnore: true */ 'xlsx');
      const buffer = await f.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) {
        setParseError('The file contains no sheets.');
        return;
      }
      const sheet = wb.Sheets[sheetName];
      if (!sheet) {
        setParseError('Could not read the sheet.');
        return;
      }
      const json: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);
      if (json.length === 0) {
        setParseError('The sheet is empty. Please add at least one data row.');
        return;
      }
      setRows(json);
      setFile(f);
      setStep('preview');
    } catch {
      setParseError(
        'Failed to parse the file. Please ensure it is a valid .csv or .xlsx.'
      );
    }
  }, []);

  // Drag-and-drop handlers
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) parseFile(f);
    },
    [parseFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) parseFile(f);
    },
    [parseFile]
  );

  const reset = () => {
    setFile(null);
    setRows([]);
    setParseError('');
    setStep('upload');
    mutation.reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="modal-surface w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-base)]">
            <h2 className="text-lg font-bold text-[var(--color-text-base)]">
              Bulk Upload Tasks
            </h2>
            <button
              onClick={handleClose}
              className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] hover:bg-[var(--color-surface-muted)] rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            {/* Step: Upload */}
            {step === 'upload' && (
              <div>
                <div
                  className="border-2 border-dashed border-[var(--color-border-base)] rounded-xl p-8 text-center hover:border-[var(--color-accent-base)] hover:bg-primary-500/5 transition-colors cursor-pointer"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ')
                      fileInputRef.current?.click();
                  }}
                >
                  <Upload className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3" />
                  <p className="text-sm font-medium text-[var(--color-text-subtle)] mb-1">
                    Drag &amp; drop a file here, or click to browse
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Supported formats: .csv, .xlsx
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {parseError && (
                  <div className="mt-4 flex items-start gap-2 bg-danger-500/10 border border-[var(--color-danger-base)]/20 text-[var(--color-critical-base)] text-sm rounded-lg px-4 py-3">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    {parseError}
                  </div>
                )}
              </div>
            )}

            {/* Step: Preview */}
            {step === 'preview' && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5 text-[var(--color-accent-base)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-base)] truncate">
                      {file?.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {rows.length} row{rows.length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                  <button
                    onClick={reset}
                    className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-critical-base)] hover:bg-danger-500/10 rounded-lg transition-colors"
                    aria-label="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Column preview */}
                {rows.length > 0 && (
                  <div className="bg-[var(--color-surface-muted)] rounded-lg p-3 mb-4 overflow-x-auto">
                    <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                      Detected Columns
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.keys(rows[0] ?? {}).map((col) => (
                        <span
                          key={col}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-[var(--color-surface-base)] border border-[var(--color-border-base)] rounded-md text-[var(--color-text-subtle)]"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {mutation.isError && (
                  <div className="mb-4 flex items-start gap-2 bg-danger-500/10 border border-[var(--color-danger-base)]/20 text-[var(--color-critical-base)] text-sm rounded-lg px-4 py-3">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    {(mutation.error as { message?: string })?.message ||
                      'Failed to upload tasks. Please try again.'}
                  </div>
                )}

                <button
                  onClick={() => mutation.mutate(rows)}
                  disabled={mutation.isPending}
                  className="btn btn-primary w-full shadow-sm"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading {rows.length} tasks…
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload {rows.length} Tasks
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step: Done */}
            {step === 'done' && (
              <div className="text-center py-6">
                <CheckCircle2 className="w-14 h-14 text-[var(--color-positive-base)] mx-auto mb-4" />
                <h3 className="text-lg font-bold text-[var(--color-text-base)] mb-1">
                  Upload Complete!
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] mb-6">
                  {rows.length} task{rows.length !== 1 ? 's' : ''} have been
                  created successfully.
                </p>
                <button
                  onClick={handleClose}
                  className="btn btn-primary px-8"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
