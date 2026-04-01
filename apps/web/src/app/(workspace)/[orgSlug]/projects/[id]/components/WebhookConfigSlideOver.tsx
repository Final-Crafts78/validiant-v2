'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Zap,
  Globe,
  Save,
  Loader2,
  Trash2,
  Settings,
  ChevronRight,
  Code,
} from 'lucide-react';
import { AutomationRule } from '@/services/automation.service';
import {
  useCreateAutomation,
  useUpdateAutomation,
  useDeleteAutomation,
} from '@/hooks/useAutomations';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface WebhookConfigSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  automation: AutomationRule | null;
  projectId: string;
  orgId: string;
}

export function WebhookConfigSlideOver({
  isOpen,
  onClose,
  automation,
  projectId,
  orgId,
}: WebhookConfigSlideOverProps) {
  const createMutation = useCreateAutomation(orgId);
  const updateMutation = useUpdateAutomation(orgId);
  const deleteMutation = useDeleteAutomation(orgId);

  const [formData, setFormData] = useState({
    name: '',
    triggerEvent: 'TASK_COMPLETED',
    actionType: 'SEND_WEBHOOK',
    webhookUrl: '',
    webhookSecret: '',
    isActive: true,
  });

  useEffect(() => {
    if (automation) {
      setFormData({
        name: automation.name,
        triggerEvent: automation.triggerEvent,
        actionType: automation.actionType,
        webhookUrl: automation.config?.url || '',
        webhookSecret: automation.config?.secret || '',
        isActive: automation.isActive,
      });
    } else {
      setFormData({
        name: 'New Workflow',
        triggerEvent: 'TASK_COMPLETED',
        actionType: 'SEND_WEBHOOK',
        webhookUrl: '',
        webhookSecret: '',
        isActive: true,
      });
    }
  }, [automation]);

  const handleSave = () => {
    const payload = {
      name: formData.name,
      triggerEvent: formData.triggerEvent,
      actionType: formData.actionType,
      isActive: formData.isActive,
      projectId,
      config: {
        url: formData.webhookUrl,
        secret: formData.webhookSecret,
      },
    };

    if (automation) {
      logger.info('[Automation:Update:Start]', { id: automation.id });
      updateMutation.mutate(
        { id: automation.id, data: payload },
        {
          onSuccess: () => {
            toast.success('Automation updated');
            onClose();
          },
        }
      );
    } else {
      logger.info('[Automation:Create:Start]', { projectId });
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Automation created');
          onClose();
        },
      });
    }
  };

  const handleDelete = () => {
    if (!automation) return;
    if (confirm('Are you sure you want to delete this automation?')) {
      deleteMutation.mutate(automation.id, {
        onSuccess: () => {
          toast.success('Automation deleted');
          onClose();
        },
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md">
          <div className="h-full flex flex-col bg-white shadow-2xl border-l border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {automation ? 'Edit Automation' : 'New Automation'}
                  </h2>
                  <p className="text-xs text-slate-500">Workflow Definition</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Basic Info */}
              <section className="space-y-4">
                <label className="block">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                    Automation Name
                  </span>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="e.g. Notify Slack on Completion"
                  />
                </label>
              </section>

              {/* Trigger & Action */}
              <section className="space-y-4">
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                      Trigger
                    </span>
                    <select
                      value={formData.triggerEvent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          triggerEvent: e.target.value,
                        })
                      }
                      className="w-full bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 p-0"
                    >
                      <option value="TASK_CREATED">Task Created</option>
                      <option value="TASK_COMPLETED">Task Completed</option>
                      <option value="DOCUMENT_UPLOADED">
                        Document Uploaded
                      </option>
                      <option value="VERIFICATION_FAILED">
                        Verification Failed
                      </option>
                    </select>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                      Action
                    </span>
                    <select
                      value={formData.actionType}
                      onChange={(e) =>
                        setFormData({ ...formData, actionType: e.target.value })
                      }
                      className="w-full bg-transparent border-none text-sm font-bold text-indigo-600 focus:ring-0 p-0"
                    >
                      <option value="SEND_WEBHOOK">Send Webhook</option>
                      <option value="SEND_EMAIL">Send Email</option>
                      <option value="AI_SUMMARIZE">AI Summarize</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Webhook Details */}
              {formData.actionType === 'SEND_WEBHOOK' && (
                <section className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" /> Webhook Configuration
                  </h3>
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-600 mb-1.5 block">
                        Target URL
                      </span>
                      <input
                        type="url"
                        value={formData.webhookUrl}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            webhookUrl: e.target.value,
                          })
                        }
                        className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        placeholder="https://api.example.com/webhook"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-600 mb-1.5 block">
                        Signing Secret (Optional)
                      </span>
                      <input
                        type="password"
                        value={formData.webhookSecret}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            webhookSecret: e.target.value,
                          })
                        }
                        className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        placeholder="••••••••••••••••"
                      />
                    </label>
                  </div>
                </section>
              )}

              {/* Advanced Mapping (Data.txt Item #14) */}
              <section className="space-y-4 pt-4 border-t border-slate-100 opacity-50 pointer-events-none">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Code className="w-3.5 h-3.5" /> Logical Payload Mapping
                  </h3>
                  <span className="text-[8px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded leading-none">
                    ENTERPRISE
                  </span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Settings className="w-6 h-6" />
                  <p className="text-[10px] font-bold uppercase tracking-wider">
                    Advanced Payload Builder
                  </p>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              {automation && (
                <button
                  onClick={handleDelete}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100"
                  title="Delete Automation"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {automation ? 'Update Rule' : 'Activate Workflow'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
