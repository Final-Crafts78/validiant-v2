'use client';

import { 
  Server, 
  ShieldCheck, 
  Cpu, 
  Globe, 
  Zap
} from 'lucide-react';
import { useParams } from 'next/navigation';

export default function InfraPage() {
  const { orgSlug } = useParams();

  const services = [
    { name: 'Core API Engine', status: 'operational', region: 'US-East-1', latency: '42ms', uptime: '99.99%' },
    { name: 'Organization DB Cluster', status: 'operational', region: 'Global-Edge', latency: '12ms', uptime: '99.999%' },
    { name: 'Durable Object Store', status: 'operational', region: 'Cloudflare', latency: '8ms', uptime: '100%' },
    { name: 'Realtime Pipeline', status: 'degraded', region: 'EU-West-1', latency: '145ms', uptime: '98.5%' },
    { name: 'RSC Prefetch Worker', status: 'operational', region: 'Edge', latency: '24ms', uptime: '99.9%' },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Infrastructure</h1>
          <p className="text-slate-500 mt-1">Resource allocation and health for <span className="text-blue-600 font-bold">{orgSlug}</span></p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-bold border border-emerald-100 italic">
          <ShieldCheck className="w-4 h-4" /> System Nominal
        </div>
      </div>

      {/* Resource Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Compute Capacity</p>
              <h3 className="text-4xl font-black">2.4 <span className="text-lg text-slate-500">TFlops</span></h3>
              <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[65%]" />
              </div>
            </div>
            <Cpu className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-800 opacity-20" />
         </div>

         <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Globe className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-sm font-bold text-slate-800">Edge Propagation</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-500">Active Nodes</span>
                <span className="text-slate-900">124</span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-500">Global Coverage</span>
                <span className="text-slate-900">92%</span>
              </div>
            </div>
         </div>

         <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Zap className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-sm font-bold text-slate-800">API Throughput</p>
            </div>
            <div className="text-3xl font-black text-slate-900">4.1k <span className="text-sm text-slate-400">req/s</span></div>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">+12% from last hour</p>
         </div>
      </div>

      {/* Services Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Service</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Region</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Latency</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Uptime</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {services.map((s) => (
              <tr key={s.name} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Server className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    <span className="text-sm font-semibold text-slate-700">{s.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${s.status === 'operational' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                    <span className={`text-xs font-bold capitalize ${s.status === 'operational' ? 'text-emerald-700' : 'text-amber-700'}`}>{s.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500 font-medium">{s.region}</td>
                <td className="px-6 py-4 text-xs text-slate-500 font-bold font-mono">{s.latency}</td>
                <td className="px-6 py-4 text-xs text-emerald-600 font-bold">{s.uptime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
