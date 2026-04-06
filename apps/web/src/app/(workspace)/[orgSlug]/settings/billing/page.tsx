'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Check,
  CreditCard,
  Zap,
  Crown,
  ShieldCheck,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  History as HistoryIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getOrganizationBySlug,
  createCheckoutSession,
  type Organization,
} from '@/services/organization.service';
import { useToast } from '@/hooks/use-toast';

/**
 * Phase 6: Billing & Subscription Node
 * High-fidelity Obsidian design for commercial management.
 */

const PLAN_FEATURES = {
  free: [
    'Up to 1 Project',
    '100 records per project',
    '2 Sub-Accounts (Agents)',
    'Standard Support',
    'Basic Analytics',
  ],
  pro: [
    'Up to 10 Projects',
    '5000 records per project',
    '20 Sub-Accounts (Agents)',
    'Priority Support',
    'Advanced Intelligence Dashboard',
    'SLA Breach Monitoring',
    'CSV Data Universe Export',
  ],
  enterprise: [
    'Unlimited Projects',
    'Unlimited Records',
    'Unlimited Sub-Accounts',
    'Dedicated Account Manager',
    'Custom Data Retention',
    'SSO/SAML Integration',
    'R2 Automated Backups',
  ],
};

const PLAN_LIMITS = {
  free: { projects: 1, records: 100, subAccounts: 2 },
  pro: { projects: 10, records: 5000, subAccounts: 20 },
  enterprise: { projects: 999999, records: 999999, subAccounts: 999999 },
};

export default function BillingPage() {
  const { orgSlug } = useParams() as { orgSlug: string };
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);

  useEffect(() => {
    loadOrg();
  }, [orgSlug]);

  const loadOrg = async () => {
    try {
      setLoading(true);
      const data = await getOrganizationBySlug(orgSlug);
      setOrg(data);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load billing information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: 'pro' | 'enterprise') => {
    if (!org) return;
    try {
      setUpgrading(plan);
      const { url } = await createCheckoutSession(
        org.id,
        plan,
        `${window.location.origin}/${orgSlug}/settings/billing?success=true`,
        `${window.location.origin}/${orgSlug}/settings/billing?canceled=true`
      );
      window.location.href = url;
    } catch (err: any) {
      toast({
        title: 'Upgrade Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent-base)]" />
      </div>
    );
  }

  const currentPlan = org?.plan || 'free';
  const limits = PLAN_LIMITS[currentPlan];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-base)]">
            Billing & Subscription
          </h1>
          <p className="text-[var(--color-text-subtle)] mt-1">
            Manage your organization's plan and resource usage.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary-500/10 rounded-xl border border-primary-500/20">
          <Zap className="h-4 w-4 text-[var(--color-accent-base)]" />
          <span className="text-sm font-bold text-[var(--color-accent-base)] uppercase tracking-wider">
            Current Plan: {currentPlan}
          </span>
        </div>
      </div>

      {/* Usage Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <UsageCard
          title="Projects"
          current={org?.projectCount || 0}
          max={limits.projects}
        />
        <UsageCard
          title="Total Records (Active)"
          current={0} // Potential: fetch total records across all projects
          max={limits.records}
        />
        <UsageCard
          title="Sub-Accounts"
          current={org?.memberCount || 0}
          max={limits.subAccounts}
        />
      </div>

      {/* Plans Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        <PlanCard
          plan="free"
          price="Free Forever"
          isCurrent={currentPlan === 'free'}
          onUpgrade={() => {}}
          loading={upgrading === 'free'}
        />
        <PlanCard
          plan="pro"
          price="$49 / mo"
          isCurrent={currentPlan === 'pro'}
          onUpgrade={() => handleUpgrade('pro')}
          loading={upgrading === 'pro'}
          highlight
        />
        <PlanCard
          plan="enterprise"
          price="Custom"
          isCurrent={currentPlan === 'enterprise'}
          onUpgrade={() => handleUpgrade('enterprise')}
          loading={upgrading === 'enterprise'}
        />
      </div>

      {/* Invoice Placeholder */}
      <div className="card-surface p-6 mt-12">
        <div className="flex items-center gap-3 mb-6 font-bold text-lg">
          <CreditCard className="h-5 w-5 text-[var(--color-text-subtle)]" />
          <h2>Billing History</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-[var(--color-border-base)] rounded-2xl bg-[var(--color-surface-soft)]/50">
          <HistoryIcon className="h-10 w-10 text-[var(--color-text-muted)] mb-3" />
          <p className="text-[var(--color-text-subtle)]">No invoices yet.</p>
        </div>
      </div>
    </div>
  );
}

function UsageCard({
  title,
  current,
  max,
}: {
  title: string;
  current: number;
  max: number;
}) {
  const percentage = Math.min((current / max) * 100, 100);
  const isNearLimit = percentage > 80;

  return (
    <div className="card-surface p-6 relative overflow-hidden group">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-[var(--color-text-subtle)]">
          {title}
        </h3>
        {isNearLimit && (
          <AlertCircle className="h-4 w-4 text-amber-500 animate-pulse" />
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-bold text-[var(--color-text-base)]">
          {current}
        </span>
        <span className="text-sm text-[var(--color-text-muted)]">
          / {max === 999999 ? '∞' : max}
        </span>
      </div>

      <div className="w-full h-2 bg-[var(--color-surface-soft)] rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-1000 ease-out rounded-full',
            isNearLimit ? 'bg-amber-500' : 'bg-[var(--color-accent-base)]'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  price,
  isCurrent,
  onUpgrade,
  highlight = false,
  loading = false,
}: any) {
  const features = PLAN_FEATURES[plan as keyof typeof PLAN_FEATURES];
  const Icon = plan === 'free' ? Zap : plan === 'pro' ? Crown : ShieldCheck;

  return (
    <div
      className={cn(
        'card-surface p-8 relative flex flex-col transition-all duration-300',
        highlight &&
          'border-[var(--color-accent-base)] border-2 scale-105 shadow-xl shadow-primary-500/10 z-10',
        !highlight && 'border-[var(--color-border-base)]'
      )}
    >
      {highlight && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[var(--color-accent-base)] text-white text-[10px] font-black uppercase tracking-widest rounded-full">
          Most Popular
        </div>
      )}

      <div className="mb-8">
        <div
          className={cn(
            'h-12 w-12 rounded-2xl flex items-center justify-center mb-6',
            plan === 'free' && 'bg-slate-500/10 text-slate-400',
            plan === 'pro' && 'bg-amber-500/10 text-amber-500',
            plan === 'enterprise' && 'bg-indigo-500/10 text-indigo-500'
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold capitalize text-[var(--color-text-base)]">
          {plan}
        </h3>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-black text-[var(--color-text-base)]">
            {price}
          </span>
        </div>
      </div>

      <ul className="flex-1 space-y-4 mb-8">
        {features.map((feature, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-sm text-[var(--color-text-subtle)]"
          >
            <Check className="h-4 w-4 text-[var(--color-success-base)] mt-0.5 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onUpgrade}
        disabled={isCurrent || loading}
        className={cn(
          'w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2',
          isCurrent
            ? 'bg-[var(--color-surface-soft)] text-[var(--color-text-muted)] cursor-not-allowed'
            : highlight
              ? 'bg-[var(--color-accent-base)] text-white hover:bg-[var(--color-accent-base)]/90 hover:scale-[1.02] shadow-lg shadow-primary-500/20'
              : 'border border-[var(--color-border-base)] text-[var(--color-text-base)] hover:bg-[var(--color-surface-soft)]'
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isCurrent ? (
          'Active Subscription'
        ) : (
          <>
            {plan === 'enterprise' ? 'Contact Sales' : `Upgrade to ${plan}`}
            <ArrowUpRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}
