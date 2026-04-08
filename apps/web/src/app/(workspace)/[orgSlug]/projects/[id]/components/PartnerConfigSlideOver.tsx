'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Key,
  Globe,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { BgvPartner } from '@/services/partner.service';
import {
  useUpdatePartner,
  useRegenerateToken,
  useCreatePartner,
} from '@/hooks/usePartners';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface PartnerConfigSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  partner: BgvPartner | null;
  orgId: string;
}

export function PartnerConfigSlideOver({
  isOpen,
  onClose,
  partner,
  orgId,
}: PartnerConfigSlideOverProps) {
  const updatePartner = useUpdatePartner(orgId);
  const regenerateToken = useRegenerateToken(orgId);
  const createPartner = useCreatePartner(orgId);
  const [formData, setFormData] = useState({
    name: '',
    outboundApiKey: '',
    webhookSigningSecret: '',
    allowedIps: '',
    rateLimit: 60,
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    if (partner) {
      setFormData({
        name: partner.name || '',
        outboundApiKey: partner.outboundApiKey || '',
        webhookSigningSecret: partner.webhookSigningSecret || '',
        allowedIps: partner.allowedIps?.join(', ') || '',
        rateLimit: partner.rateLimit || 60,
      });
    } else {
      setFormData({
        name: '',
        outboundApiKey: '',
        webhookSigningSecret: '',
        allowedIps: '',
        rateLimit: 60,
      });
    }
  }, [partner]);

  const handleSave = () => {
    const data = {
      name: formData.name,
      outboundApiKey: formData.outboundApiKey,
      webhookSigningSecret: formData.webhookSigningSecret,
      allowedIps: formData.allowedIps
        .split(',')
        .map((ip) => ip.trim())
        .filter(Boolean),
      rateLimit: formData.rateLimit,
    };

    if (partner) {
      logger.info('[Partner:Config:Save:Update]', { partnerId: partner.id });
      updatePartner.mutate(
        { id: partner.id, data },
        {
          onSuccess: () => {
            toast.success('Partner configuration updated');
            onClose();
          },
          onError: (err) => {
            toast.error('Failed to update configuration');
            logger.error('[Partner:Config:Save:Error]', {
              partnerId: partner.id,
              error: err,
            });
          },
        }
      );
    } else {
      logger.info('[Partner:Config:Save:Create]', { name: data.name });
      createPartner.mutate(data, {
        onSuccess: () => {
          toast.success('New Partner created');
          onClose();
        },
        onError: (err) => {
          toast.error('Failed to create partner');
          logger.error('[Partner:Config:Create:Error]', { error: err });
        },
      });
    }
  };

  const handleRegenerateToken = () => {
    if (!partner) return;
    if (
      confirm(
        'Are you sure? This will immediately invalidate the current token and may break active integrations.'
      )
    ) {
      regenerateToken.mutate(partner.id);
    }
  };

  const copyInboundToken = () => {
    if (partner?.inboundApiToken) {
      navigator.clipboard.writeText(partner.inboundApiToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
      toast.success('Inbound Token copied');
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
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {partner ? 'Partner Secrets' : 'Connect New Partner'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {partner ? partner.name : 'Enterprise BGV Integration'}
                  </p>
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
              {/* Security Warning */}
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Credentials provided here are **encrypted at rest** and only
                  decrypted when making outbound requests. Never share your BGV
                  API keys in plaintext logs or support tickets.
                </p>
              </div>

              {/* Basic Info */}
              {!partner && (
                <section className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Partner Information
                  </h3>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600 mb-1.5 block">
                      Partner Name
                    </span>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. First Advantage"
                    />
                  </label>
                </section>
              )}

              {/* Inbound Connectivity */}
              {partner && (
                <section className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" /> Inbound Connectivity
                    (Validiant)
                  </h3>
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-600 mb-1.5 block">
                        Inbound API Token
                      </span>
                      <div className="flex gap-2">
                        <div className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-600 overflow-hidden truncate">
                          {partner.inboundApiToken ||
                            '********************************'}
                        </div>
                        <button
                          onClick={copyInboundToken}
                          className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          {copiedToken ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </label>
                    <p className="text-[10px] text-slate-400 italic">
                      Use this token in your BGV partner's webhook configuration
                      to push data to Validiant.
                    </p>
                  </div>
                </section>
              )}

              {/* Outbound Connectivity */}
              <section className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> Outbound Integration (
                  {partner ? partner.name : 'Settings'})
                </h3>
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600 mb-1.5 block">
                      Partner API Key
                    </span>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={formData.outboundApiKey}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            outboundApiKey: e.target.value,
                          })
                        }
                        className="block w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Enter partner API key"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={handleRegenerateToken}
                      disabled={regenerateToken.isPending}
                      className="w-full mt-2 py-2 border border-red-200 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                      {regenerateToken.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      REGENERATE TOKEN
                    </button>
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600 mb-1.5 block">
                      Webhook Signing Secret
                    </span>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Shield className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type={showWebhookSecret ? 'text' : 'password'}
                        value={formData.webhookSigningSecret}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            webhookSigningSecret: e.target.value,
                          })
                        }
                        className="block w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Enter webhook secret"
                      />
                      <button
                        type="button"
                        onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showWebhookSecret ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </label>
                </div>
              </section>

              {/* Network Settings */}
              <section className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> Network & Guardrails
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <label className="col-span-2 block">
                    <span className="text-xs font-semibold text-slate-600 mb-1.5 block">
                      Allowed Inbound IPs
                    </span>
                    <input
                      type="text"
                      value={formData.allowedIps}
                      onChange={(e) =>
                        setFormData({ ...formData, allowedIps: e.target.value })
                      }
                      className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. 1.2.3.4, 5.6.7.8"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600 mb-1.5 block">
                      Rate Limit (req/min)
                    </span>
                    <input
                      type="number"
                      value={formData.rateLimit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rateLimit: parseInt(e.target.value),
                        })
                      }
                      className="block w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </label>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={
                  updatePartner.isPending ||
                  createPartner.isPending ||
                  (!partner && !formData.name)
                }
                className="flex-[2] px-4 py-2 bg-indigo-600 text-[var(--color-text-base)] text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updatePartner.isPending || createPartner.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {partner ? 'Save Configuration' : 'Create Partner'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
