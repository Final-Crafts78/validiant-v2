'use client';

import { useState } from 'react';
import { Project } from '@validiant/shared';
import {
  useUpdateProject,
  useArchiveProject,
  useUnarchiveProject,
  useCompleteProject,
  useLeaveProject,
} from '@/hooks/useProjects';
import {
  Settings,
  Shield,
  Palette,
  Image as ImageIcon,
  Archive,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCcw,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspace';

export function SettingsTab({ project }: { project: Project }) {
  const updateMutation = useUpdateProject(project.id);
  const archiveMutation = useArchiveProject(project.id);
  const unarchiveMutation = useUnarchiveProject(project.id);
  const completeMutation = useCompleteProject(project.id);
  const leaveMutation = useLeaveProject(project.id);
  const router = useRouter();
  const activeOrgSlug = useWorkspaceStore((s) => s.activeOrgSlug);

  const [themeColor, setThemeColor] = useState(project.themeColor || '#4F46E5');
  const [logoUrl, setLogoUrl] = useState(project.logoUrl || '');
  const [autoDispatch, setAutoDispatch] = useState(
    project.autoDispatchVerified || false
  );

  const handleSaveSettings = () => {
    logger.info('[Settings:Branding:Update:Start]', {
      projectId: project.id,
      themeColor,
      logoUrl,
      autoDispatch,
    });

    updateMutation.mutate(
      {
        themeColor,
        logoUrl,
        autoDispatchVerified: autoDispatch,
      },
      {
        onSuccess: () => {
          toast.success('Branding and dispatch settings updated');
          logger.info('[Settings:Branding:Update:Success]', {
            projectId: project.id,
          });
        },
        onError: (err) => {
          toast.error('Failed to update branding');
          logger.error('[Settings:Branding:Update:Error]', {
            projectId: project.id,
            error: err,
          });
        },
      }
    );
  };

  const handleArchive = () => {
    logger.info('[Project:Archive:Start]', { projectId: project.id });
    archiveMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Project archived successfully');
        logger.info('[Project:Archive:Success]', { projectId: project.id });
      },
    });
  };

  const handleUnarchive = () => {
    logger.info('[Project:Unarchive:Start]', { projectId: project.id });
    unarchiveMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Project restored');
        logger.info('[Project:Unarchive:Success]', { projectId: project.id });
      },
    });
  };

  const handleComplete = () => {
    logger.info('[Project:Complete:Start]', { projectId: project.id });
    completeMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Project marked as completed');
        logger.info('[Project:Complete:Success]', { projectId: project.id });
      },
    });
  };

  const handleLeave = () => {
    if (
      confirm(
        'Are you sure you want to leave this project? You will lose access until re-invited.'
      )
    ) {
      logger.info('[Project:Leave:Start]', { projectId: project.id });
      leaveMutation.mutate(undefined, {
        onSuccess: () => {
          toast.success('You have left the project');
          logger.info('[Project:Leave:Success]', { projectId: project.id });
          router.push(`/${activeOrgSlug}/projects`);
        },
      });
    }
  };

  const isPending =
    updateMutation.isPending ||
    archiveMutation.isPending ||
    unarchiveMutation.isPending ||
    completeMutation.isPending ||
    leaveMutation.isPending;

  return (
    <div className="space-y-6 max-w-4xl pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Core Settings */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-500" />
                <h2 className="text-lg font-bold text-slate-800">
                  Command Center Branding
                </h2>
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={isPending}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Save Branding'
                )}
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    <Palette className="w-3 h-3" /> Theme Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="w-12 h-12 rounded-lg border border-slate-200 cursor-pointer p-1"
                    />
                    <input
                      type="text"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                    <ImageIcon className="w-3 h-3" /> Custom Logo URL
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://your-domain.com/logo.png"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Auto-Dispatch Verification
                  </h3>
                  <p className="text-xs text-slate-500">
                    Automatically push verified results to client webhooks.
                  </p>
                </div>
                <button
                  onClick={() => setAutoDispatch(!autoDispatch)}
                  className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${autoDispatch ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${autoDispatch ? 'translate-x-6' : ''}`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Workflow & Compliance Stub (For context) */}
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-slate-800">
                Compliance & RBAC
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              Granular project-level permissions and data retention policies can
              be configured in the{' '}
              <span className="font-bold text-slate-700">Workflow Builder</span>{' '}
              tab.
            </p>
          </section>
        </div>

        {/* Right Column: Danger Zone / Actions */}
        <div className="space-y-6">
          <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
              Project Actions
            </h2>

            <div className="space-y-3">
              {project.status !== 'archived' ? (
                <button
                  onClick={handleArchive}
                  disabled={isPending}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-amber-300 hover:bg-amber-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Archive className="w-4 h-4 text-slate-400 group-hover:text-amber-500" />
                    <span>Archive Project</span>
                  </div>
                </button>
              ) : (
                <button
                  onClick={handleUnarchive}
                  disabled={isPending}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <RefreshCcw className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                    <span>Unarchive Project</span>
                  </div>
                </button>
              )}

              <button
                onClick={handleComplete}
                disabled={isPending || project.status === 'completed'}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />
                  <span>Mark as Completed</span>
                </div>
              </button>

              <button
                onClick={handleLeave}
                disabled={isPending}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                  <span>Leave Project</span>
                </div>
              </button>

              <button className="w-full flex items-center justify-between px-4 py-3 bg-white border border-red-100 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all group">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-400 group-hover:text-red-500" />
                  <span>Permanent Delete Project</span>
                </div>
              </button>
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                    Visibility Note
                  </h4>
                  <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                    Archived projects are hidden from the dashboard but remain
                    discoverable via search.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
