'use client';

import { Server, ShieldCheck, Cpu, Globe, Zap } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function InfraPage() {
  const { orgSlug } = useParams();

  const services = [
    {
      name: 'Core API Engine',
      status: 'operational',
      region: 'US-East-1',
      latency: '42ms',
      uptime: '99.99%',
    },
    {
      name: 'Organization DB Cluster',
      status: 'operational',
      region: 'Global-Edge',
      latency: '12ms',
      uptime: '99.999%',
    },
    {
      name: 'Durable Object Store',
      status: 'operational',
      region: 'Cloudflare',
      latency: '8ms',
      uptime: '100%',
    },
    {
      name: 'Realtime Pipeline',
      status: 'degraded',
      region: 'EU-West-1',
      latency: '145ms',
      uptime: '98.5%',
    },
    {
      name: 'RSC Prefetch Worker',
      status: 'operational',
      region: 'Edge',
      latency: '24ms',
      uptime: '99.9%',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-base)] pb-6">
        <div>
          <h1 className="text-3xl font-black text-[var(--color-text-base)]">
            Infrastructure
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Resource allocation and health for{' '}
            <span className="text-[var(--color-accent-base)] font-bold">
              {orgSlug}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-success-500/10 text-success-600 rounded-full text-sm font-bold border border-success-500/20 italic">
          <ShieldCheck className="w-4 h-4" /> System Nominal
        </div>
      </div>

      {/* Resource Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--color-surface-soft)] rounded-2xl p-6 text-[var(--color-text-base)] shadow-xl relative overflow-hidden ring-1 ring-[var(--color-border-base)]">
          <div className="relative z-10">
            <p className="text-[var(--color-text-muted)] text-xs font-bold uppercase tracking-widest mb-1">
              Compute Capacity
            </p>
            <h3 className="text-4xl font-black">
              2.4{' '}
              <span className="text-lg text-[var(--color-text-muted)]">
                TFlops
              </span>
            </h3>
            <div className="mt-4 h-1.5 w-full bg-[var(--color-surface-muted)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--color-accent-base)] w-[65%]" />
            </div>
          </div>
          <Cpu className="absolute -right-4 -bottom-4 w-32 h-32 text-[var(--color-surface-muted)] opacity-20" />
        </div>

        <div className="card-surface p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-500/10 rounded-lg">
              <Globe className="w-5 h-5 text-[var(--color-accent-base)]" />
            </div>
            <p className="text-sm font-bold text-[var(--color-text-base)]">
              Edge Propagation
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-[var(--color-text-muted)]">
                Active Nodes
              </span>
              <span className="text-[var(--color-text-base)]">124</span>
            </div>
            <div className="flex justify-between text-xs font-medium">
              <span className="text-[var(--color-text-muted)]">
                Global Coverage
              </span>
              <span className="text-[var(--color-text-base)]">92%</span>
            </div>
          </div>
        </div>

        <div className="card-surface p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-warning-500/10 rounded-lg">
              <Zap className="w-5 h-5 text-warning-600" />
            </div>
            <p className="text-sm font-bold text-[var(--color-text-base)]">
              API Throughput
            </p>
          </div>
          <div className="text-3xl font-black text-[var(--color-text-base)]">
            4.1k{' '}
            <span className="text-sm text-[var(--color-text-muted)]">
              req/s
            </span>
          </div>
          <p className="text-[10px] text-success-600 font-bold mt-1">
            +12% from last hour
          </p>
        </div>
      </div>

      {/* Services Table */}
      <div className="card-surface overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--color-surface-soft)]/50 border-b border-[var(--color-border-base)]">
              <th className="px-6 py-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Region
              </th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Latency
              </th>
              <th className="px-6 py-4 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                Uptime
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-base)]/50">
            {services.map((s) => (
              <tr
                key={s.name}
                className="hover:bg-[var(--color-surface-soft)] transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Server className="w-4 h-4 text-[var(--color-text-muted)]/50 group-hover:text-[var(--color-accent-base)] transition-colors" />
                    <span className="text-sm font-semibold text-[var(--color-text-subtle)]">
                      {s.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${s.status === 'operational' ? 'bg-success-500' : 'bg-warning-500'} animate-pulse`}
                    />
                    <span
                      className={`text-xs font-bold capitalize ${s.status === 'operational' ? 'text-success-600' : 'text-warning-600'}`}
                    >
                      {s.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-[var(--color-text-muted)] font-medium">
                  {s.region}
                </td>
                <td className="px-6 py-4 text-xs text-[var(--color-text-muted)] font-bold font-mono">
                  {s.latency}
                </td>
                <td className="px-6 py-4 text-xs text-success-600 font-bold">
                  {s.uptime}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
