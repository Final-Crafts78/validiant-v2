import * as React from 'react';
import { Upload } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { ProgressBar } from './ProgressBar';

/**
 * Obsidian Command FileUploadDropzone Component
 * Optimized for Forensic Media Capture (Phase 20/21)
 */
export interface FileUploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  accept?: string;
  className?: string;
  isUploading?: boolean;
  uploadProgress?: number;
}

export function FileUploadDropzone({
  onFilesSelected,
  maxFiles = 5,
  accept = 'image/*,application/pdf',
  className,
  isUploading = false,
  uploadProgress = 0,
}: FileUploadDropzoneProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const filesArray = Array.from(e.dataTransfer.files).slice(0, maxFiles);
      onFilesSelected(filesArray);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const filesArray = Array.from(e.target.files).slice(0, maxFiles);
      onFilesSelected(filesArray);
    }
  };

  return (
    <div
      className={cn(
        'relative flex min-h-[200px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 bg-[var(--color-surface-base)]',
        dragActive
          ? 'border-[var(--color-accent-base)] bg-[var(--color-accent-subtle)]/5'
          : 'border-[var(--color-border-base)] hover:border-[var(--color-accent-base)]/50',
        className
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center px-4 pb-6 pt-5 text-center">
        <div className="mb-4 rounded-full bg-[var(--color-surface-soft)] p-3">
          <Upload className="h-6 w-6 text-[var(--color-accent-base)]" />
        </div>
        <p className="mb-2 text-sm font-semibold text-[var(--color-text-base)]">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          {accept.replace(/\//g, ' ').toUpperCase()} (Max: {maxFiles} files)
        </p>
      </div>

      {isUploading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-[var(--color-surface-base)]/80 px-12 backdrop-blur-sm">
          <p className="mb-2 text-sm font-medium">Uploading...</p>
          <ProgressBar value={uploadProgress} className="w-full" />
        </div>
      )}

      {!isUploading && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mb-4"
          onClick={() => inputRef.current?.click()}
        >
          Select Files
        </Button>
      )}
    </div>
  );
}
