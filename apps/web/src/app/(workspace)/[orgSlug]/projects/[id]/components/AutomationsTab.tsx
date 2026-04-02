'use client';

import { useWorkspaceStore } from '@/store/workspace';
import { useAutomations, useUpdateAutomation } from '@/hooks/useAutomations';
import { usePartners, useUpdatePartner } from '@/hooks/usePartners';
import {
  Webhook,
  Zap,
  ShieldCheck,
  Plus,
  Settings,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Loader2,
  Box,
  Cpu,
  ArrowRight,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';
import { PartnerConfigSlideOver } from './PartnerConfigSlideOver';
import { WebhookConfigSlideOver } from './WebhookConfigSlideOver';
import { useState } from 'react';
import { BgvPartner } from '@/services/partner.service';
import { AutomationRule } from '@/services/automation.service';

export function AutomationsTab({ projectId }: { projectId: string }) {
  const activeOrgId = useWorkspaceStore((s) => s.activeOrgId);
  const { data: automations, isLoading: automationsLoading } = useAutomations(
    activeOrgId || ''
  );
  const { data: partners, isLoading: partnersLoading } = usePartners(
    activeOrgId || ''
  );

  const updateAutomation = useUpdateAutomation(activeOrgId || '');
  const updatePartner = useUpdatePartner(activeOrgId || '');
  const [selectedPartner, setSelectedPartner] = useState<BgvPartner | null>(
    null
  );
  const [isPartnerSlideOverOpen, setIsPartnerSlideOverOpen] = useState(false);

  const [selectedAutomation, setSelectedAutomation] =
    useState<AutomationRule | null>(null);
  const [isAutomationSlideOverOpen, setIsAutomationSlideOverOpen] =
    useState(false);

  // Filter automations for this specific project
  const projectRules =
    automations?.filter((a) => a.projectId === projectId) || [];

  const handleToggleAutomation = (id: string, currentStatus: boolean) => {
    logger.info('[Automation:Toggle:Start]', { id, newStatus: !currentStatus });
    updateAutomation.mutate(
      { id, data: { isActive: !currentStatus } },
      {
        onSuccess: () => {
          toast.success(`Workflow ${!currentStatus ? 'Activated' : 'Paused'}`);
          logger.info('[Automation:Toggle:Success]', { id });
        },
      }
    );
  };

  const handleTogglePartner = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    logger.info('[Partner:Toggle:Start]', { id, newStatus });
    updatePartner.mutate(
      { id, data: { isActive: newStatus === 'active' } },
      {
        onSuccess: () => {
          toast.success(
            `Partner ${newStatus === 'active' ? 'Connected' : 'Disconnected'}`
          );
          logger.info('[Partner:Toggle:Success]', { id });
        },
      }
    );
  };

  const openPartnerConfig = (partner: BgvPartner) => {
    setSelectedPartner(partner);
    setIsPartnerSlideOverOpen(true);
  };

  const openAutomationConfig = (automation: AutomationRule | null) => {
    setSelectedAutomation(automation);
    setIsAutomationSlideOverOpen(true);
  };

  if (automationsLoading || partnersLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="font-bold text-sm uppercase tracking-widest">
          Syncing Automation Hub...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl pb-24">
      {/* 1. Integrated Partners Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Box className="w-5 h-5 text-indigo-500" />
              Enterprise Integration Partners
            </h2>
            <p className="text-sm text-slate-500">
              Connect external BGV services directly to this project's workflow.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedPartner(null);
              setIsPartnerSlideOverOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-200 transition-all border border-slate-200"
          >
            <Plus className="w-4 h-4" /> Add Partner
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners?.map((partner) => (
            <div
              key={partner.id}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                  <ShieldCheck className="w-6 h-6 text-indigo-500" />
                </div>
                <button
                  onClick={() =>
                    handleTogglePartner(partner.id, partner.status)
                  }
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${partner.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-50 text-slate-400 border border-slate-200'}`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${partner.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}
                  />
                  {partner.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {partner.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                {partner.partnerKey} Integration Protocol
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <button
                  onClick={() => openPartnerConfig(partner)}
                  className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline"
                >
                  Configure Settings <ArrowRight className="w-3 h-3" />
                </button>
                <ExternalLink className="w-4 h-4 text-slate-300" />
              </div>
            </div>
          ))}

          {/* Placeholder for FADV (Data.txt requirement) */}
          {partners?.length === 0 && (
            <div className="lg:col-span-3 py-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                No Partners Connected
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Start by connecting First Advantage (FADV) or Sterling APIs.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Slide Overs */}
      <PartnerConfigSlideOver
        isOpen={isPartnerSlideOverOpen}
        onClose={() => setIsPartnerSlideOverOpen(false)}
        partner={selectedPartner}
        orgId={activeOrgId || ''}
      />

      <WebhookConfigSlideOver
        isOpen={isAutomationSlideOverOpen}
        onClose={() => setIsAutomationSlideOverOpen(false)}
        automation={selectedAutomation}
        projectId={projectId}
        orgId={activeOrgId || ''}
      />

      {/* 2. Automation Rules Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Project Automation Rules
            </h2>
            <p className="text-sm text-slate-500">
              Zapier-style logic to bridge task events to external webhooks.
            </p>
          </div>
          <button
            onClick={() => openAutomationConfig(null)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all"
          >
            <Zap className="w-4 h-4" /> Create Workflow
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {projectRules.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {projectRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-xl border ${rule.isActive ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                    >
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {rule.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">
                          {rule.triggerEvent}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-300" />
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase">
                          {rule.actionType}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() =>
                        handleToggleAutomation(rule.id, rule.isActive)
                      }
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      {rule.isActive ? (
                        <ToggleRight className="w-8 h-8 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-slate-300" />
                      )}
                    </button>
                    <button
                      onClick={() => openAutomationConfig(rule)}
                      className="p-2 text-slate-400 hover:text-slate-600"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <Webhook className="w-full h-full text-slate-200" />
                <Plus className="absolute -top-1 -right-1 w-6 h-6 text-indigo-400 bg-white rounded-full border-2 border-white shadow-sm" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                No active webhooks found.
              </p>
              <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto">
                Connect this project to Zapier or your internal ERP via
                enterprise webhooks.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 3. Advanced Settings Helper */}
      <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex gap-4">
        <div className="p-2 bg-blue-100 rounded-xl h-fit">
          <Info className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-900">
            Partner-Level Event Ingestion
          </h4>
          <p className="text-xs text-blue-700 mt-1 leading-relaxed">
            Inbound case ingestion mappings (Data.txt Item #14) are
            automatically synchronized when a partner protocol is activated.
            Verification schemas defined in the Workflow Builder will be pushed
            to the connected partner as verification requirements.
          </p>
        </div>
      </div>
    </div>
  );
}
