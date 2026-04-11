import React, { useState } from 'react';
import { useUpdateCaseFields } from '@/hooks/useCaseHub';
import { useRBAC } from '@/hooks/useRBAC';
import { Task } from '@/hooks/useTasks';
import {
  FileText,
  CheckSquare,
  Calendar,
  Hash,
  Save,
  Loader2,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useUploadEvidence } from '@/hooks/useCaseHub';
import { EvidenceUploadField } from './EvidenceUploadField';
import { useOrganization } from '@/hooks/useOrganizations';

interface FieldSchema {
  id: string;
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'file';
  required?: boolean;
  roleRequired?: 'admin' | 'owner' | 'manager' | 'contributor';
}

interface CaseFieldGridProps {
  task: Task;
}

export const CaseFieldGrid: React.FC<CaseFieldGridProps> = ({ task }) => {
  const { mutate: updateFields, isPending } = useUpdateCaseFields();
  const { mutate: uploadEvidence, isPending: isUploading } =
    useUploadEvidence();
  const { data: orgData } = useOrganization(
    task.project?.organizationId || null
  );
  const watermarkEnabled = (orgData as any)?.settings?.watermarkEnabled ?? true;

  const { projectRole, isOrgAdmin, isProjectManager } = useRBAC(
    task.project?.organizationId,
    task.projectId
  );

  const [localValues, setLocalValues] = useState<Record<string, unknown>>(
    task.customFields || {}
  );
  const [isDirty, setIsDirty] = useState(false);

  const schema = (task.verificationType?.fieldSchema as unknown as FieldSchema[]) || [];

  const handleValueChange = (key: string, value: unknown) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    updateFields(
      {
        taskId: task.id,
        caseId: (task as any).caseId || task.id,
        values: localValues,
      },
      {
        onSuccess: () => {
          setIsDirty(false);
          toast.success('Fields updated successfully');
        },
        onError: (err: any) => {
          toast.error('Failed to update fields: ' + err.message);
        },
      }
    );
  };

  const checkFieldAccess = (field: FieldSchema) => {
    if (!field.roleRequired) return true;
    if (isOrgAdmin) return true;
    if (isProjectManager) return true;

    if (field.roleRequired === 'contributor' && projectRole === 'contributor')
      return true;

    return false;
  };

  if (!schema.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl opacity-50">
        <FileText className="w-12 h-12 mb-4" />
        <p className="text-sm font-medium">
          No custom fields defined for this case type.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2 gap-4 flex-wrap">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          Evidence & Field Management
          <span className="text-[10px] bg-primary-600/10 text-primary-600 px-2 py-0.5 rounded-full uppercase tracking-widest whitespace-nowrap">
            {schema.length} Fields
          </span>
        </h3>

        {isDirty && (
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-[var(--color-text-base)] rounded-full text-sm font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schema.map((field) => {
          const hasAccess = checkFieldAccess(field);
          const value = localValues[field.key];

          return (
            <div
              key={field.id || field.key}
              className={cn(
                'group p-4 rounded-2xl border transition-all duration-300',
                hasAccess
                  ? 'bg-white hover:border-primary-500/50'
                  : 'bg-gray-50 cursor-not-allowed border-dashed'
              )}
            >
              <div className="flex items-center justify-between mb-3 text-left">
                <label className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-2">
                  {field.type === 'text' && <FileText className="w-3 h-3" />}
                  {field.type === 'number' && <Hash className="w-3 h-3" />}
                  {field.type === 'boolean' && (
                    <CheckSquare className="w-3 h-3" />
                  )}
                  {field.type === 'date' && <Calendar className="w-3 h-3" />}
                  {field.label}
                  {field.required && <span className="text-rose-500">*</span>}
                </label>
                {!hasAccess && <Lock className="w-3 h-3 text-rose-500" />}
              </div>

              {field.type === 'boolean' ? (
                <div className="flex items-center justify-between p-2 bg-gray-100 rounded-lg">
                  <span className="text-sm font-medium">
                    {value ? 'Yes' : 'No'}
                  </span>
                  <button
                    onClick={() => handleValueChange(field.key, !value)}
                    disabled={!hasAccess || isPending}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      value ? 'bg-primary-600' : 'bg-gray-300'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        value ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              ) : field.type === 'file' ? (
                <EvidenceUploadField
                  label={field.label}
                  watermarkEnabled={watermarkEnabled}
                  isPending={isUploading}
                  onUpload={(file, geoTag) => {
                    uploadEvidence(
                      {
                        taskId: task.id,
                        caseId: (task as any).caseId || task.id,
                        fieldKey: field.key,
                        file,
                        geoTag,
                      },
                      {
                        onSuccess: () => {
                          toast.success(
                            `${field.label} uploaded with forensic tag`
                          );
                        },
                        onError: (err: any) => {
                          toast.error(`Upload failed: ${err.message}`);
                        },
                      }
                    );
                  }}
                />
              ) : (
                <input
                  type={
                    field.type === 'number'
                      ? 'number'
                      : field.type === 'date'
                        ? 'date'
                        : 'text'
                  }
                  value={(value as string) || ''}
                  onChange={(e) => handleValueChange(field.key, e.target.value)}
                  disabled={!hasAccess || isPending}
                  className="w-full bg-gray-100 border-none focus:ring-1 focus:ring-primary-500 h-11 px-4 rounded-xl text-sm"
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                />
              )}

              {!hasAccess && (
                <p className="mt-2 text-[10px] text-rose-500 font-medium bg-rose-500/10 px-2 py-0.5 rounded-md inline-block">
                  Requires {field.roleRequired} role or higher
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
