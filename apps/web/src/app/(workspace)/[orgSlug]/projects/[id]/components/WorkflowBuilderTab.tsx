'use client';

import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/store/workspace';
import {
  useVerificationTypes,
  useSaveVerificationType,
} from '@/hooks/useVerificationTypes';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Shield,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';
import { MobileSchemaPreview } from './schema/MobileSchemaPreview';
import { ColumnType } from '@validiant/shared';

const FIELD_TYPES = [
  {
    value: 'heading',
    label: 'Section Header / Divider',
    backendType: 'heading',
  },
  { value: 'text', label: 'Short Text', backendType: 'text' },
  { value: 'textarea', label: 'Long Text', backendType: 'long_text' },
  { value: 'number', label: 'Number / Integer', backendType: 'number' },
  { value: 'currency', label: 'Currency Amount', backendType: 'currency' },
  { value: 'date', label: 'Date Picker', backendType: 'date' },
  { value: 'date_range', label: 'Date Range', backendType: 'date_range' },
  {
    value: 'boolean',
    label: 'Yes/No Toggle (Sub-class Trigger)',
    backendType: 'checkbox',
  },
  { value: 'select', label: 'Single Select (Dropdown)', backendType: 'select' },
  {
    value: 'multi_select',
    label: 'Multi Select (Tags)',
    backendType: 'multi_select',
  },
  { value: 'phone', label: 'Phone Number', backendType: 'phone' },
  { value: 'email', label: 'Email Address', backendType: 'email' },
  { value: 'url', label: 'URL / Website', backendType: 'url' },
  { value: 'rating', label: 'Star Rating', backendType: 'rating' },
  {
    value: 'barcode_scan',
    label: 'Barcode / QR Scanner',
    backendType: 'barcode_scan',
  },
  {
    value: 'photo-request',
    label: 'Camera / Photo Upload',
    backendType: 'photo_capture',
  },
  {
    value: 'signature',
    label: 'E-Signature Capture',
    backendType: 'signature',
  },
  {
    value: 'gps',
    label: 'GPS / Location Capture',
    backendType: 'gps_location',
  },
  { value: 'otp', label: 'OTP Verification Field', backendType: 'otp' },
  {
    value: 'formula',
    label: 'Calculated Field (Formula)',
    backendType: 'formula',
  },
  {
    value: 'pdf-upload',
    label: 'Document Upload (PDF)',
    backendType: 'file_upload',
  },
];

const ROLES = [
  { value: 'manager', label: 'Manager' },
  { value: 'executive', label: 'Executive' },
  { value: 'viewer', label: 'Viewer/Client' },
];

export function WorkflowBuilderTab({ projectId }: { projectId: string }) {
  const { activeOrgId } = useWorkspaceStore();
  const { data: vTypes, isLoading } = useVerificationTypes(activeOrgId || '');
  const saveMutation = useSaveVerificationType(activeOrgId || '');

  const [schemaId, setSchemaId] = useState<string | null>(null);
  const [fields, setFields] = useState<any[]>([]);

  // Find the specific project workflow schema
  useEffect(() => {
    if (vTypes) {
      const projectWorkflow = vTypes.find(
        (v: any) => v.code === `PRJ_${projectId}_CUSTOM`
      );
      logger.debug('[WorkflowBuilderTab:Init]', {
        projectId,
        hasWorkflow: !!projectWorkflow,
        id: projectWorkflow?.id,
      });
      if (projectWorkflow) {
        setSchemaId(projectWorkflow.id);
        setFields(projectWorkflow.fieldSchema || []);
      }
    }
  }, [vTypes, projectId]);

  const addField = () => {
    setFields([
      ...fields,
      {
        key: `field_${Date.now()}`,
        type: 'text',
        label: 'New Field',
        isRequired: false,
        settings: {
          conditions: [],
          sectionId: '',
          sectionName: '',
          isFullWidth: false,
        },
        visibleTo: ['owner', 'admin', 'manager', 'executive', 'viewer'],
        editableBy: ['owner', 'admin', 'manager', 'executive'],
      },
    ]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === fields.length - 1) return;

    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [
      newFields[targetIndex],
      newFields[index],
    ];
    setFields(newFields);
  };

  const updateField = (index: number, key: string, value: any) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setFields(newFields);
  };

  const handleSave = () => {
    // Validate schema
    for (const f of fields) {
      if (!f.key || !f.label) {
        toast.error('All fields must have a Key and Label');
        return;
      }
    }

    logger.debug('[WorkflowBuilderTab:Save]', {
      projectId,
      schemaId,
      fieldsCount: fields.length,
    });

    saveMutation.mutate({
      id: schemaId || undefined,
      data: {
        code: `PRJ_${projectId}_CUSTOM`,
        name: `Custom Workflow for Project ${projectId.slice(0, 8)}`,
        fieldSchema: fields.map((f) => ({
          ...f,
          // Map to backend backendType if exists
          type:
            FIELD_TYPES.find((t) => t.value === f.type)?.backendType || f.type,
          // Ensure prompt is removed (not in backend schema)
          prompt: undefined,
        })),
      },
    });
  };

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex gap-8 items-start h-full relative w-full">
      <div className="flex-1 space-y-6 max-w-4xl pb-24 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-base)]">
              Dynamic Workflow Builder
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Construct the exact data collection requirements and visibility
              rules for field executives.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-[var(--color-text-base)] text-sm font-semibold rounded-lg hover:bg-indigo-700 shadow-sm transition-all shadow-indigo-200"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Schema
          </button>
        </div>

        <div className="space-y-4">
          {fields.length === 0 ? (
            <div className="bg-[var(--color-surface-container-low)] border-2 border-dashed border-[var(--color-border-subtle)] rounded-xl p-12 text-center text-[var(--color-text-muted)]">
              No fields configured yet. Start building your custom workflow!
            </div>
          ) : (
            fields.map((field, idx) => (
              <div
                key={idx}
                className="bg-[var(--color-surface-container-low)] border border-[var(--color-border-subtle)] rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row"
              >
                {/* Drag handle / Actions sidebar */}
                <div className="bg-[var(--color-surface-muted)]/30 border-r border-[var(--color-border-subtle)] p-3 flex flex-row md:flex-col items-center justify-center gap-2">
                  <button
                    onClick={() => moveField(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] disabled:opacity-30"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-[var(--color-text-muted)]">
                    {idx + 1}
                  </span>
                  <button
                    onClick={() => moveField(idx, 'down')}
                    disabled={idx === fields.length - 1}
                    className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] disabled:opacity-30"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Main Form Fields */}
                <div className="p-5 flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1.5">
                        Field Label
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) =>
                          updateField(idx, 'label', e.target.value)
                        }
                        className="input py-2 text-sm"
                        placeholder="e.g. Identity Document Front"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1.5">
                        Database Key
                      </label>
                      <input
                        type="text"
                        value={field.key || field.fieldKey}
                        onChange={(e) =>
                          updateField(idx, 'key', e.target.value)
                        }
                        className="input py-2 text-sm bg-transparent font-mono text-primary outline-dashed outline-1 outline-[var(--color-border-subtle)] focus:outline-primary border-none"
                        placeholder="e.g. id_front"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1.5">
                        UI Section Name
                      </label>
                      <input
                        type="text"
                        value={field.settings?.sectionName || ''}
                        onChange={(e) =>
                          updateField(idx, 'settings', {
                            ...field.settings,
                            sectionName: e.target.value.toUpperCase(),
                            sectionId: e.target.value
                              .toLowerCase()
                              .replace(/\s+/g, '_'),
                          })
                        }
                        className="input py-2 text-sm"
                        placeholder="e.g. RESIDENCE DETAIL"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={field.settings?.isFullWidth || false}
                          onChange={(e) =>
                            updateField(idx, 'settings', {
                              ...field.settings,
                              isFullWidth: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-emerald-500 rounded border-[var(--color-border-subtle)] bg-transparent focus:ring-emerald-500 focus:ring-offset-[var(--color-surface-container-low)]"
                        />
                        <span className="text-sm font-semibold text-[var(--color-text-base)] group-hover:text-emerald-500 transition-colors">
                          Full-Width Layout
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-1.5">
                        Input Type
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) =>
                          updateField(idx, 'type', e.target.value)
                        }
                        className="input py-2 text-sm max-w-full"
                      >
                        {FIELD_TYPES.map((ft) => (
                          <option
                            key={ft.value}
                            value={ft.value}
                            className="bg-[var(--color-surface-base)] text-[var(--color-text-base)]"
                          >
                            {ft.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={field.isRequired || field.required}
                          onChange={(e) =>
                            updateField(idx, 'isRequired', e.target.checked)
                          }
                          className="w-4 h-4 text-primary rounded border-[var(--color-border-subtle)] focus:ring-primary focus:ring-offset-[var(--color-surface-container-low)] bg-transparent"
                        />
                        <span className="text-sm font-semibold text-[var(--color-text-base)] group-hover:text-primary transition-colors">
                          Required Field
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Granular RBAC */}
                  <div className="pt-3 mt-3 border-t border-[var(--color-border-subtle)]">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-sm font-bold text-[var(--color-text-base)]">
                        Field-Level Security (RBAC)
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2">
                          Read Access (Who can view this?)
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {ROLES.map((role) => (
                            <label
                              key={role.value}
                              className={`px-2.5 py-1 text-xs font-medium rounded-full border cursor-pointer transition-colors
                                  ${(field.visibleTo || field.readRoles)?.includes(role.value) ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-transparent border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-border-base)]'}
                               `}
                            >
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={
                                  (
                                    field.visibleTo || field.readRoles
                                  )?.includes(role.value) || false
                                }
                                onChange={(e) => {
                                  const cur = new Set(
                                    field.visibleTo || field.readRoles || []
                                  );
                                  e.target.checked
                                    ? cur.add(role.value)
                                    : cur.delete(role.value);
                                  updateField(
                                    idx,
                                    'visibleTo',
                                    Array.from(cur)
                                  );
                                }}
                              />
                              {role.label}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2">
                          Write Access (Who can fill this?)
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {ROLES.filter((r) => r.value !== 'viewer').map(
                            (role) => (
                              <label
                                key={role.value}
                                className={`px-2.5 py-1 text-xs font-medium rounded-full border cursor-pointer transition-colors
                                  ${(field.editableBy || field.writeRoles)?.includes(role.value) ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-transparent border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-border-base)]'}
                               `}
                              >
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={
                                    (
                                      field.editableBy || field.writeRoles
                                    )?.includes(role.value) || false
                                  }
                                  onChange={(e) => {
                                    const cur = new Set(
                                      field.editableBy || field.writeRoles || []
                                    );
                                    e.target.checked
                                      ? cur.add(role.value)
                                      : cur.delete(role.value);
                                    updateField(
                                      idx,
                                      'editableBy',
                                      Array.from(cur)
                                    );
                                  }}
                                />
                                {role.label}
                              </label>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* VISIBILITY LOGIC / SUB-CLASS TRIGGER */}
                  <div className="pt-3 mt-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-muted)]/10 -mx-5 -mb-5 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-500" />
                        <h4 className="text-sm font-bold text-[var(--color-text-base)]">
                          Visibility Logic (Sub-classes)
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {fields[idx].settings?.conditions?.map(
                        (cond: any, cIdx: number) => (
                          <div
                            key={cIdx}
                            className="flex flex-wrap items-center gap-2 bg-[var(--color-surface-container-low)] p-3 rounded-lg border border-[var(--color-border-subtle)] shadow-sm animate-in fade-in zoom-in-95"
                          >
                            <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase">
                              IF
                            </span>
                            <select
                              value={cond.fieldKey}
                              onChange={(e) => {
                                const newConds = [
                                  ...(fields[idx].settings?.conditions || []),
                                ];
                                newConds[cIdx] = {
                                  ...cond,
                                  fieldKey: e.target.value,
                                };
                                updateField(idx, 'settings', {
                                  ...fields[idx].settings,
                                  conditions: newConds,
                                });
                              }}
                              className="bg-transparent border-b border-[var(--color-border-subtle)] text-[11px] font-bold text-primary outline-none focus:border-primary px-1"
                            >
                              <option value="">Select Field...</option>
                              {fields
                                .filter((_, i) => i !== idx)
                                .map((f) => (
                                  <option key={f.key} value={f.key}>
                                    {f.label}
                                  </option>
                                ))}
                            </select>
                            <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase">
                              EQUALS
                            </span>
                            <select
                              value={cond.value}
                              onChange={(e) => {
                                const newConds = [
                                  ...(fields[idx].settings?.conditions || []),
                                ];
                                newConds[cIdx] = {
                                  ...cond,
                                  value: e.target.value,
                                };
                                updateField(idx, 'settings', {
                                  ...fields[idx].settings,
                                  conditions: newConds,
                                });
                              }}
                              className="bg-transparent border-b border-[var(--color-border-subtle)] text-[11px] font-bold text-emerald-500 outline-none focus:border-emerald-500 px-1"
                            >
                              <option value="true">Yes</option>
                              <option value="false">No</option>
                              <option value="checked">Is Checked</option>
                              <option value="not_checked">Is Empty</option>
                            </select>
                            <button
                              onClick={() => {
                                const newConds = [
                                  ...fields[idx].settings.conditions,
                                ];
                                newConds.splice(cIdx, 1);
                                updateField(idx, 'settings', {
                                  ...fields[idx].settings,
                                  conditions: newConds,
                                });
                              }}
                              className="ml-auto text-xs text-rose-500 hover:text-rose-400 font-bold uppercase tracking-tighter"
                            >
                              Remove
                            </button>
                          </div>
                        )
                      )}

                      <button
                        onClick={() => {
                          const newProps = { ...(fields[idx].settings || {}) };
                          newProps.conditions = [
                            ...(newProps.conditions || []),
                            { fieldKey: '', operator: 'equals', value: 'true' },
                          ];
                          updateField(idx, 'settings', newProps);
                        }}
                        className="text-[10px] font-black text-indigo-500 hover:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 px-3 py-2 border border-dashed border-indigo-500/30 rounded-lg w-full justify-center transition-all hover:bg-indigo-500/5 group"
                      >
                        <Plus className="w-3.5 h-3.5 group-hover:scale-125 transition-transform" />
                        Add Visibility Rule
                      </button>
                    </div>
                  </div>
                </div>

                {/* Delete Action */}
                <div className="p-3 border-t md:border-t-0 md:border-l border-[var(--color-border-subtle)] flex items-center justify-center bg-[var(--color-surface-muted)]/30">
                  <button
                    onClick={() => removeField(idx)}
                    className="p-2 text-[var(--color-text-muted)] hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}

          <button
            onClick={addField}
            className="w-full py-4 border-2 border-dashed border-primary/40 rounded-xl text-primary font-semibold hover:bg-primary/5 hover:border-primary/60 transition-colors flex items-center justify-center gap-2 mb-8"
          >
            <Plus className="w-5 h-5" /> Add New Field
          </button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="hidden lg:block sticky top-0 self-start">
        <MobileSchemaPreview
          typeName={
            schemaId
              ? `Protocol: ${schemaId.substring(0, 6).toUpperCase()}`
              : 'Dynamic Schema'
          }
          columns={fields.map((f, i) => ({
            id: f.key || `field_${i}`,
            projectId: projectId,
            typeId: schemaId || '',
            name: f.label || 'Untitled Field',
            key: f.key || f.fieldKey || `field_${i}`,
            columnType:
              f.type === 'boolean'
                ? ColumnType.CHECKBOX
                : f.type === 'photo-request'
                  ? ColumnType.PHOTO_CAPTURE
                  : f.type === 'signature'
                    ? ColumnType.SIGNATURE
                    : f.type === 'gps'
                      ? ColumnType.GPS_LOCATION
                      : f.type === 'otp'
                        ? ColumnType.OTP
                        : f.type === 'heading'
                          ? ColumnType.HEADING
                          : f.type === 'pdf-upload'
                            ? ColumnType.FILE_UPLOAD
                            : f.type === 'textarea'
                              ? ColumnType.LONG_TEXT
                              : ColumnType.TEXT,
            order: i,
            settings: { ...f.settings, required: f.isRequired || f.required },
            createdAt: new Date(),
          }))}
        />
      </div>
    </div>
  );
}
