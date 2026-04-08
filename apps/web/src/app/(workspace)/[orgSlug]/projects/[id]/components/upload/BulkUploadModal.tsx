'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  Upload,
  FileSpreadsheet,
  ArrowRight,
  Loader2,
  Database,
} from 'lucide-react';
import {
  ProjectType,
  CreateRecordDataInput,
} from '@validiant/shared';
import { useTypeColumns } from '@/hooks/useTypeColumns';
import { useRecords } from '@/hooks/useRecords';
import { toast } from 'react-hot-toast';

// Sub-components (to be created)
import { HeaderMapper } from './HeaderMapper';
import { ValidationPreview } from './ValidationPreview';

interface BulkUploadModalProps {
  projectId: string;
  projectType: ProjectType;
  onClose: () => void;
}

type UploadStep = 'selection' | 'mapping' | 'preview' | 'ingestion';

/**
 * BulkUploadModal - High-fidelity 4-step wizard for schema-aware ingestion.
 * Follows Obsidian Verifier aesthetic.
 */
export function BulkUploadModal({
  projectId,
  projectType,
  onClose,
}: BulkUploadModalProps) {
  const [step, setStep] = useState<UploadStep>('selection');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({}); // CSV Header -> Schema Key
  const [isProcessing, setIsProcessing] = useState(false);

  const { columns = [] } = useTypeColumns(projectId, projectType.id);
  const { bulkCreateRecords } = useRecords(projectId);

  // 1. Handle File Selection & Parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        if (!bstr) throw new Error('File read failed');
        
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        if (!wsname) throw new Error('No sheets found in workbook');
        
        const ws = wb.Sheets[wsname];
        if (!ws) throw new Error('Sheet not found');
        
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (!data || data.length < 2) {
          toast.error('File appears to be empty or missing headers');
          setIsProcessing(false);
          return;
        }

        const firstRow = data?.[0];
        if (!firstRow) {
          toast.error('Could not identify data headers');
          setIsProcessing(false);
          return;
        }

        const csvHeaders = firstRow
          .filter((h) => !!h)
          .map((h) => String(h).trim());
        const rows = XLSX.utils.sheet_to_json(ws) as any[];

        setHeaders(csvHeaders);
        setParsedData(rows);

        // Intelligent Auto-Mapping
        const initialMapping: Record<string, string> = {};
        csvHeaders.forEach((header) => {
          const match = columns.find(
            (col) =>
              col.name.toLowerCase() === header.toLowerCase() ||
              col.key.toLowerCase() === header.toLowerCase()
          );
          if (match) initialMapping[header] = match.key;
        });
        setMapping(initialMapping);

        setStep('mapping');
      } catch (err) {
        toast.error('Failed to parse file. Ensure it is a valid CSV or XLSX.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  // 2. Handle Ingestion
  const handleFinalIngest = async () => {
    setIsProcessing(true);
    try {
      // Transform parsed data using mapping
      const recordsToCreate: CreateRecordDataInput[] = parsedData.map((row) => {
        const data: Record<string, any> = {};
        Object.entries(mapping).forEach(([csvHeader, schemaKey]) => {
          if (schemaKey) {
            data[schemaKey] = row[csvHeader];
          }
        });
        return {
          typeId: projectType.id,
          data,
          status: 'pending', // Default ingestion state
        };
      });

      const result = await bulkCreateRecords.mutateAsync(recordsToCreate);
      toast.success(
        `Successfully ingested ${result.created} records. ${result.updated} updated.`
      );
      onClose();
    } catch (err) {
      toast.error('Ingestion failed. Check for duplicate reference keys.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="w-full max-w-4xl bg-[#151b2d] rounded-[3rem] shadow-obsidian-2xl border border-[var(--color-border-base)]/40 overflow-hidden flex flex-col h-[80vh] relative">
        <header className="p-8 border-b border-[var(--color-border-base)]/20 flex items-center justify-between bg-surface-container-low/20 backdrop-blur-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                INGESTION_WIZARD
              </span>
            </div>
            <h3 className="text-2xl font-black text-[var(--color-text-base)] tracking-tight uppercase">
              Bulk Record Injection
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-[var(--color-surface-muted)]/50 rounded-2xl border border-[var(--color-border-base)]/20 transition-all group"
          >
            <X className="w-5 h-5 text-[var(--color-text-base)]/40 group-hover:text-[var(--color-text-base)]" />
          </button>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-4 p-6 border-b border-white/[0.02] bg-[#070d1f]/30">
            {['Selection', 'Mapping', 'Preview', 'Ingestion'].map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${
                      step === s.toLowerCase()
                        ? 'bg-primary border-primary text-[#0c1324] shadow-[0_0_15px_rgba(173,198,255,0.3)]'
                        : 'border-[var(--color-border-base)]/20 text-[var(--color-text-base)]/20'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest ${step === s.toLowerCase() ? 'text-[var(--color-text-base)]' : 'text-[var(--color-text-base)]/10'}`}
                  >
                    {s}
                  </span>
                </div>
                {i < 3 && <ArrowRight className="w-4 h-4 text-[var(--color-text-base)]/5" />}
              </React.Fragment>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
            {step === 'selection' && (
              <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="w-32 h-32 bg-primary/5 rounded-[3rem] border border-dashed border-primary/20 flex items-center justify-center relative group cursor-pointer hover:border-primary/40 transition-all overflow-hidden">
                  <div className="absolute inset-0 bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-all" />
                  <Upload className="w-12 h-12 text-primary relative z-10 group-hover:scale-110 transition-transform" />
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                  />
                </div>
                <div className="text-center space-y-2">
                  <h4 className="text-xl font-bold text-[var(--color-text-base)] tracking-tight">
                    Select Data Universe
                  </h4>
                  <p className="text-xs text-[var(--color-text-base)]/30 max-w-xs leading-relaxed">
                    Drop your CSV or Excel file here. The architect will
                    intelligently parse headers for schema alignment.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-muted)]/50 rounded-xl border border-[var(--color-border-base)]/20">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-black text-[var(--color-text-base)]/40 uppercase tracking-widest">
                      CSV_INGEST
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-surface-muted)]/50 rounded-xl border border-[var(--color-border-base)]/20">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[10px] font-black text-[var(--color-text-base)]/40 uppercase tracking-widest">
                      XLSX_PROTO
                    </span>
                  </div>
                </div>
              </div>
            )}

            {step === 'mapping' && (
              <HeaderMapper
                headers={headers}
                columns={columns}
                mapping={mapping}
                onMappingChange={setMapping}
                onNext={() => setStep('preview')}
              />
            )}

            {step === 'preview' && (
              <ValidationPreview
                data={parsedData}
                columns={columns}
                mapping={mapping}
                onBack={() => setStep('mapping')}
                onIngest={handleFinalIngest}
              />
            )}

            {step === 'ingestion' && (
              <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in zoom-in duration-500">
                <div className="relative">
                  <div className="w-40 h-40 rounded-full border-4 border-primary/20 animate-spin border-t-primary shadow-[0_0_50px_rgba(173,198,255,0.1)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Database className="w-12 h-12 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h4 className="text-xl font-bold text-[var(--color-text-base)] tracking-tight uppercase">
                    Ingesting Universe...
                  </h4>
                  <p className="text-xs text-[var(--color-text-base)]/30 font-mono animate-pulse">
                    Encrypting protocols and committing to immutable ledger
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {isProcessing && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center">
            <div className="bg-[#151b2d] p-8 rounded-3xl border border-[var(--color-border-base)]/40 flex flex-col items-center gap-4 shadow-2xl">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <span className="text-xs font-black text-[var(--color-text-base)]/60 uppercase tracking-widest">
                Processing Data...
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
