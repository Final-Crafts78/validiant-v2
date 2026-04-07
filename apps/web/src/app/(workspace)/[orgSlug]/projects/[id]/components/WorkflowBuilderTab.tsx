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

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text', backendType: 'text' },
  { value: 'textarea', label: 'Long Text', backendType: 'text' },
  { value: 'boolean', label: 'Yes/No Toggle', backendType: 'boolean' },
  {
    value: 'photo-request',
    label: 'Camera / Photo Upload',
    backendType: 'photo',
  },
  { value: 'signature', label: 'E-Signature', backendType: 'photo' },
  {
    value: 'pdf-upload',
    label: 'Document Upload (PDF)',
    backendType: 'document',
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
    <div className="space-y-6 max-w-4xl pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Dynamic Workflow Builder
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Construct the exact data collection requirements and visibility
            rules for field executives.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 shadow-sm transition-all shadow-indigo-200"
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
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500">
            No fields configured yet. Start building your custom workflow!
          </div>
        ) : (
          fields.map((field, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row"
            >
              {/* Drag handle / Actions sidebar */}
              <div className="bg-slate-50 border-r border-slate-200 p-3 flex flex-row md:flex-col items-center justify-center gap-2">
                <button
                  onClick={() => moveField(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-400">
                  {idx + 1}
                </span>
                <button
                  onClick={() => moveField(idx, 'down')}
                  disabled={idx === fields.length - 1}
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>

              {/* Main Form Fields */}
              <div className="p-5 flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Field Label
                    </label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) =>
                        updateField(idx, 'label', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. Identity Document Front"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Database Key
                    </label>
                    <input
                      type="text"
                      value={field.key || field.fieldKey}
                      onChange={(e) => updateField(idx, 'key', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 font-mono text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. id_front"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Input Type
                    </label>
                    <select
                      value={field.type}
                      onChange={(e) => updateField(idx, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      {FIELD_TYPES.map((ft) => (
                        <option key={ft.value} value={ft.value}>
                          {ft.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.isRequired || field.required}
                        onChange={(e) =>
                          updateField(idx, 'isRequired', e.target.checked)
                        }
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-semibold text-slate-700">
                        Required Field
                      </span>
                    </label>
                  </div>
                </div>

                {/* Granular RBAC */}
                <div className="pt-3 mt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-sm font-bold text-slate-800">
                      Field-Level Security (RBAC)
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">
                        Read Access (Who can view this?)
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {ROLES.map((role) => (
                          <label
                            key={role.value}
                            className={`px-2.5 py-1 text-xs font-medium rounded-full border cursor-pointer transition-colors
                                  ${(field.visibleTo || field.readRoles)?.includes(role.value) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}
                               `}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={
                                (field.visibleTo || field.readRoles)?.includes(
                                  role.value
                                ) || false
                              }
                              onChange={(e) => {
                                const cur = new Set(
                                  field.visibleTo || field.readRoles || []
                                );
                                e.target.checked
                                  ? cur.add(role.value)
                                  : cur.delete(role.value);
                                updateField(idx, 'visibleTo', Array.from(cur));
                              }}
                            />
                            {role.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">
                        Write Access (Who can fill this?)
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {ROLES.filter((r) => r.value !== 'viewer').map(
                          (role) => (
                            <label
                              key={role.value}
                              className={`px-2.5 py-1 text-xs font-medium rounded-full border cursor-pointer transition-colors
                                  ${(field.editableBy || field.writeRoles)?.includes(role.value) ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}
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

                {/* Sub-config based on type */}
                {['photo-request'].includes(field.type) && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg mt-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.validationRules?.requireGeoTag || false}
                        onChange={(e) =>
                          updateField(idx, 'validationRules', {
                            ...field.validationRules,
                            requireGeoTag: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                      />
                      <span className="text-sm font-semibold text-amber-900">
                        Enforce Hard-GPS Geotagging
                      </span>
                    </label>
                    <p className="text-xs text-amber-700 ml-6 mt-1">
                      If enabled, Field Executives cannot submit without
                      matching active GPS location.
                    </p>
                  </div>
                )}
              </div>

              {/* Delete Action */}
              <div className="p-3 border-t md:border-t-0 md:border-l border-slate-100 flex items-center justify-center bg-slate-50">
                <button
                  onClick={() => removeField(idx)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}

        <button
          onClick={addField}
          className="w-full py-4 border-2 border-dashed border-indigo-200 rounded-xl text-indigo-600 font-semibold hover:bg-indigo-50 hover:border-indigo-300 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add New Field
        </button>
      </div>
    </div>
  );
}
