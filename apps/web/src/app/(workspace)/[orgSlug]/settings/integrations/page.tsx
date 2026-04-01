'use client';

import React, { useState, useEffect } from 'react';
import { 
  Unplug, 
  ShieldCheck, 
  Map as MapIcon, 
  Save, 
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspace';
import { useOrganization, useUpdateOrganization } from '@/hooks/useOrganizations';
import toast from 'react-hot-toast';
import { usePermission } from '@/hooks/usePermission';

export default function IntegrationsSettings() {
  const { orgSlug } = useParams() as { orgSlug: string };
  const hasPermission = usePermission('org:settings');
  const activeOrgId = useWorkspaceStore((state) => state.activeOrgId);
  const { data: org, isLoading } = useOrganization(activeOrgId || '');
  const updateMutation = useUpdateOrganization(activeOrgId || '');

  const [settings, setSettings] = useState<any>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (org?.settings) {
      setSettings(org.settings);
    }
  }, [org]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-6">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
            You do not have the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-red-600 text-xs font-bold">org:settings</code> permission required to access this portal.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!activeOrgId) return;
    try {
      await updateMutation.mutateAsync({ settings });
      setIsDirty(false);
      toast.success('Integration settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Integrations
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Manage 3rd-party services and global API connectivity.
          </p>
        </div>
        
        {isDirty && (
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Didit Integration (KYC) */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 flex flex-col group shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-6">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            {settings.diditApiKey ? (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected
              </span>
            ) : (
              <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 uppercase tracking-wider">
                Not Configured
              </span>
            )}
          </div>
          
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Didit (KYC)</h3>
          <p className="text-xs text-slate-500 mt-2 mb-8 leading-relaxed font-medium">
            Identity verification and background screening platform. Required for high-assurance tasks and automated candidate onboarding.
          </p>

          <div className="space-y-5 mt-auto">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                API Key
              </label>
              <input
                type="password"
                value={settings.diditApiKey || ''}
                onChange={(e) => updateSetting('diditApiKey', e.target.value)}
                placeholder="sk_live_..."
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                Vendor ID
              </label>
              <input
                type="text"
                value={settings.diditVendorId || ''}
                onChange={(e) => updateSetting('diditVendorId', e.target.value)}
                placeholder="vid_..."
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <a 
            href="https://didit.me" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 mt-8 transition-colors group-hover:translate-x-1 duration-300"
          >
            Manage via Didit Dashboard <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* OpenRouteService (Optimization) */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 flex flex-col group shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-6">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100 shadow-inner">
              <MapIcon className="w-7 h-7" />
            </div>
            {settings.orsApiKey ? (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active
              </span>
            ) : (
              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 uppercase tracking-wider">
                System Default
              </span>
            )}
          </div>
          
          <h3 className="text-xl font-black text-slate-900 tracking-tight">OpenRouteService</h3>
          <p className="text-xs text-slate-500 mt-2 mb-8 leading-relaxed font-medium">
            Powering advanced route optimization and turn-by-turn navigation for field executives. Overrides global system defaults.
          </p>

          <div className="space-y-5 mt-auto">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                API Key (Override)
              </label>
              <input
                type="password"
                value={settings.orsApiKey || ''}
                onChange={(e) => updateSetting('orsApiKey', e.target.value)}
                placeholder="5b3ce35..."
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono"
              />
            </div>
          </div>
          
          <p className="text-[10px] text-slate-400 mt-6 italic bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-start gap-2 leading-relaxed">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500 mt-0.5" />
            Leave blank to use Validiant's shared infrastructure tokens. Add your own for high-volume enterprise traffic.
          </p>

          <a 
            href="https://openrouteservice.org" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 mt-8 transition-colors group-hover:translate-x-1 duration-300"
          >
            Create ORS Token <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-indigo-100 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-white/20 transition-all duration-700" />
        
        <div className="flex-1 relative z-10 text-center md:text-left">
          <h4 className="text-lg font-black flex items-center justify-center md:justify-start gap-2 mb-2">
            <Unplug className="w-6 h-6" />
            Zero-Trust Vault Protocol
          </h4>
          <p className="text-sm text-indigo-100 leading-relaxed font-medium max-w-xl">
            Validiant uses AES-256-GCM encryption for storing these keys at rest. Credentials are only decrypted in memory during active API requests and are never persisted to logs or client-side storage.
          </p>
        </div>
        
        <div className="flex gap-10 relative z-10 shrink-0">
          <div className="text-center">
            <p className="text-2xl font-black mb-1">100%</p>
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">End-to-End</p>
          </div>
          <div className="text-center border-l border-white/20 pl-10">
            <p className="text-2xl font-black mb-1">Vault</p>
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Storage</p>
          </div>
        </div>
      </div>
    </div>
  );
}
