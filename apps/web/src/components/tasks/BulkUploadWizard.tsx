'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
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
  Settings2,
  Table,
  ChevronRight,
  ArrowRight,
  Database
} from 'lucide-react';
import { logger } from '@/lib/logger';
import toast from 'react-hot-toast';

interface VerificationField {
  fieldKey: string;
  label: string;
  type: string;
  required?: boolean;
}

interface BulkUploadWizardProps {
  open: boolean;
  onClose: () => void;
  fieldSchema: VerificationField[];
}

const STANDARD_FIELDS = [
  { key: 'title', label: 'Task Title', required: true, description: 'Main heading for the task' },
  { key: 'description', label: 'Description', required: false, description: 'Detailed context or instructions' },
  { key: 'candidateName', label: 'Candidate Name', required: false, description: 'Name of the person being verified' },
  { key: 'candidateEmail', label: 'Candidate Email', required: false, description: 'Contact email for BGV' },
  { key: 'externalId', label: 'External Reference ID', required: false, description: 'ID from your own system' },
  { key: 'address', label: 'Location / Address', required: false, description: 'Physical location if applicable' },
];

export function BulkUploadWizard({
  open,
  onClose,
  fieldSchema,
}: BulkUploadWizardProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeProjectId = useWorkspaceStore((state) => state.activeProjectId);

  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'done'>('upload');
  const [parseError, setParseError] = useState('');

  // Auto-map logic helper
  const findBestMatch = (fieldLabel: string, headers: string[]) => {
    const normalized = fieldLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
    return headers.find(h => {
      const hn = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      return hn === normalized || hn.includes(normalized) || normalized.includes(hn);
    }) || '';
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    try {
      setParseError('');
      const XLSX = await import(/* webpackIgnore: true */ 'xlsx');
      const buffer = await f.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet);

      if (json.length === 0) {
        setParseError('The sheet is empty.');
        return;
      }

      const headers = Object.keys(json[0]);
      setCsvHeaders(headers);
      setRows(json);
      setFile(f);

      // Initialize mapping with auto-discovery
      const initialMapping: Record<string, string> = {};
      [...STANDARD_FIELDS, ...fieldSchema].forEach(field => {
        const key = 'fieldKey' in field ? (field as any).fieldKey : (field as any).key;
        const match = findBestMatch(field.label, headers);
        if (match) initialMapping[key] = match;
      });

      setMapping(initialMapping);
      setStep('map');
    } catch (err) {
      logger.error('[BulkUpload:ParseError]', err);
      setParseError('Failed to parse file. Use .csv or .xlsx');
    }
  }, [fieldSchema]);

  const mappedData = useMemo(() => {
    return rows.map(row => {
      const result: any = {
        customFields: {}
      };

      // Map Standard Fields
      STANDARD_FIELDS.forEach(sf => {
        const csvCol = mapping[sf.key];
        if (csvCol) result[sf.key] = row[csvCol];
      });

      // Map Custom Schema Fields
      fieldSchema.forEach(fs => {
        const csvCol = mapping[fs.fieldKey];
        if (csvCol) result.customFields[fs.fieldKey] = row[csvCol];
      });

      // Default title if missing
      if (!result.title) result.title = `Bulk Task ${Date.now().toString().slice(-4)}`;

      return result;
    });
  }, [rows, mapping, fieldSchema]);

  const mutation = useMutation({
    mutationFn: (data: any[]) => {
      if (!activeProjectId) throw new Error('No project selected');
      return tasksApi.bulkCreate(activeProjectId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setStep('done');
      toast.success(`${rows.length} tasks created successfully`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Bulk upload failed');
    }
  });

  const reset = () => {
    setFile(null);
    setRows([]);
    setCsvHeaders([]);
    setMapping({});
    setStep('upload');
    setParseError('');
    mutation.reset();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                Task Importer Pro
              </h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${step === 'upload' ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                <span className={`h-1.5 w-1.5 rounded-full ${step === 'map' ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                <span className={`h-1.5 w-1.5 rounded-full ${step === 'preview' ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Engine: V4.2 High Precision
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {step === 'upload' && (
            <div 
              className="h-full min-h-[300px] border-4 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-center p-10 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) {
                  const input = { target: { files: [f] } } as any;
                  handleFileSelect(input);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-slate-100">
                <FileSpreadsheet className="w-10 h-10 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Drop your spreadsheet here</h3>
              <p className="text-slate-500 mt-2 max-w-sm">
                We support .CSV and .XLSX files. Our AI will attempt to auto-map your columns.
              </p>
              <input ref={fileInputRef} type="file" className="hidden" accept=".csv,.xlsx" onChange={handleFileSelect} />
              
              {parseError && (
                <div className="mt-8 flex items-center gap-3 bg-red-50 text-red-600 px-6 py-3 rounded-2xl border border-red-100 animate-bounce">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-bold">{parseError}</span>
                </div>
              )}
            </div>
          )}

          {step === 'map' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Settings2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-black text-slate-800 uppercase tracking-tight">Manual Field Mapping</h3>
                </div>
                <div className="bg-slate-100 px-4 py-1.5 rounded-full">
                  <p className="text-[10px] font-black text-slate-500">COLUMNS DETECTED: {csvHeaders.length}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Standard Fields Section */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Core Identity Fields</p>
                  {STANDARD_FIELDS.map(field => (
                    <div key={field.key} className="flex items-center gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm hover:border-indigo-200 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-700">{field.label}</span>
                          {field.required && <span className="text-red-500 text-xs font-bold">*REQUIRED</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">{field.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                      <select 
                        value={mapping[field.key] || ''}
                        onChange={(e) => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">— Skip Field —</option>
                        {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Custom Schema Fields Section */}
                {fieldSchema.length > 0 && (
                  <div className="space-y-3 pt-6">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest px-2">Project Custom Data (Schema)</p>
                    {fieldSchema.map(field => (
                      <div key={field.fieldKey} className="flex items-center gap-4 bg-indigo-50/30 border border-indigo-100 p-4 rounded-2xl">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-indigo-900">{field.label}</span>
                            {field.required && <span className="text-indigo-400 text-[10px] font-black underline decoration-indigo-200">MANDATORY</span>}
                          </div>
                          <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest opacity-60">Type: {field.type}</p>
                        </div>
                        <Database className="w-4 h-4 text-indigo-200" />
                        <select 
                          value={mapping[field.fieldKey] || ''}
                          onChange={(e) => setMapping(prev => ({ ...prev, [field.fieldKey]: e.target.value }))}
                          className="w-48 bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="">— Skip Field —</option>
                          {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Table className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-black text-slate-800 uppercase tracking-tight">Data Preview (Bottom-Line Check)</h3>
                </div>
                <p className="text-xs font-bold text-slate-400">Showing first 5 of {rows.length} rows</p>
              </div>

              <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-inner bg-slate-50">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200">
                      <th className="p-4 font-black uppercase text-slate-500">#</th>
                      <th className="p-4 font-black uppercase text-slate-500">Task Title</th>
                      <th className="p-4 font-black uppercase text-slate-500">Details</th>
                      <th className="p-4 font-black uppercase text-slate-500">Custom Fields</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mappedData.slice(0, 5).map((d, i) => (
                      <tr key={i} className="bg-white">
                        <td className="p-4 font-bold text-slate-300">{i + 1}</td>
                        <td className="p-4 font-black text-indigo-600">{d.title}</td>
                        <td className="p-4">
                          <p className="font-bold text-slate-700">{d.candidateName || 'N/A'}</p>
                          <p className="text-slate-400">{d.candidateEmail || 'No email'}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(d.customFields).map(([k, v]) => (
                              <span key={k} className="px-2 py-1 bg-slate-100 rounded text-[10px] font-mono font-bold text-slate-500">
                                {k}: {String(v)}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-100">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight">Upload Finalized</h3>
              <p className="text-slate-500 mt-2 max-w-sm font-medium">
                We've successfully ingested {rows.length} records into the Command Center.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
          {step !== 'done' ? (
            <>
              <button 
                onClick={step === 'upload' ? onClose : reset}
                className="px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
              >
                {step === 'upload' ? 'Cancel' : 'Start Over'}
              </button>
              
              <div className="flex gap-4">
                {step === 'map' && (
                  <button 
                    onClick={() => setStep('preview')}
                    className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95"
                  >
                    Preview Data
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                {step === 'preview' && (
                  <button 
                    onClick={() => mutation.mutate(mappedData)}
                    disabled={mutation.isPending}
                    className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50"
                  >
                    {mutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                    Commit {rows.length} Tasks
                  </button>
                )}
              </div>
            </>
          ) : (
            <button 
              onClick={handleClose}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all active:scale-95 shadow-xl"
            >
              Back to Command Center
            </button>
          )}
        </div>
      </div>
    </div>
  );

  function handleClose() {
    reset();
    onClose();
  }
}
