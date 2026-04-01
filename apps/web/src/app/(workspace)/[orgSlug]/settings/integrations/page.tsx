'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  MapPin,
  Check,
  ExternalLink,
  Loader2,
  Lock,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspace';
import {
  useOrganization,
  useUpdateOrganization,
} from '@/hooks/useOrganizations';
import toast from 'react-hot-toast';
import { usePermission } from '@/hooks/usePermission';

export default function IntegrationsSettings() {
  useParams();
  const hasPermission = usePermission('org:settings');
  const activeOrgId = useWorkspaceStore((state) => state.activeOrgId);
  const { data: org, isLoading } = useOrganization(activeOrgId || '');
  const updateMutation = useUpdateOrganization(activeOrgId || '');

  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (org?.settings) {
      setSettings(org.settings as Record<string, unknown>);
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
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            Access Restricted
          </h2>
          <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
            You do not have the{' '}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-red-600 text-xs font-bold">
              org:settings
            </code>{' '}
            permission required to access this portal.
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

  const updateSetting = (key: string, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Integrations & Bridges
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Connect your workforce with third-party data providers.
          </p>
        </div>

        {isDirty && (
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            Save Integration Config
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Didit Integration */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group hover:border-blue-500 transition-all duration-300">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-10 h-10 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-black text-slate-900">
                  Didit (KYC)
                </h3>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded-md border border-emerald-100">
                  Certified Bridge
                </span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
                Automated identity verification and KYC processing. Enable this
                bridge to allow field executives to verify identity at the point
                of ingestion.
              </p>
            </div>
            <div className="flex flex-col gap-3 min-w-[240px]">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  API Key (Secret)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={(settings.diditKey as string) || ''}
                    onChange={(e) => updateSetting('diditKey', e.target.value)}
                    placeholder="didit_live_..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>
              <a
                href="https://didit.me"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors px-1"
              >
                Get your credentials from Didit Dashboard
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>

        {/* OpenRouteService Integration */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group hover:border-indigo-500 transition-all duration-300">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <MapPin className="w-10 h-10 text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-black text-slate-900">
                  OpenRouteService
                </h3>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase rounded-md border border-indigo-100">
                  Routing & Geospatial
                </span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
                Advanced matrix routing and field executive optimization. Powers
                the smart deployment engine for geographic territory management.
              </p>
            </div>
            <div className="flex flex-col gap-3 min-w-[240px]">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  API Token
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={(settings.orsToken as string) || ''}
                    onChange={(e) => updateSetting('orsToken', e.target.value)}
                    placeholder="5b3ce..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>
              <a
                href="https://openrouteservice.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors px-1"
              >
                Sign up for an ORS API Token
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Security Disclaimer */}
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-32 -mt-32 group-hover:bg-blue-500/20 transition-all duration-700" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-black mb-2">
              Cryptographical Vault Security
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed max-w-2xl font-medium">
              All integration credentials are encrypted using AES-256-GCM at
              rest. Credentials are only decrypted in memory during active API
              handshakes and never leave the secure Vercel Edge runtime.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-center px-4 py-2 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                AES-256
              </p>
              <p className="text-xs font-bold text-blue-400">End-to-End</p>
            </div>
            <div className="text-center px-4 py-2 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                SafeStore
              </p>
              <p className="text-xs font-bold text-blue-400">Storage</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
