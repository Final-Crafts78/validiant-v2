'use client';

import { useState } from 'react';
import { useProjectStats } from '@/hooks/useProjectStats';
import { useRecords } from '@/hooks/useRecords';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpRight,
  Loader2,
  Download,
  FileText,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export function AnalyticsTab({ projectId }: { projectId: string }) {
  const { data: stats, isLoading } = useProjectStats(projectId);
  const [isExporting, setIsExporting] = useState(false);
  const { records: recordsData } = useRecords(projectId);

  const handleExport = async () => {
    if (!recordsData || recordsData.length === 0) return;
    setIsExporting(true);

    try {
      // Basic CSV generation
      const headers = [
        'ID',
        'Number',
        'Type',
        'Status',
        'CreatedAt',
        'SubmittedAt',
        'ClosedAt',
      ];
      const rows = recordsData.map((r: any) =>
        [
          r.id,
          r.number,
          r.typeId,
          r.status,
          r.createdAt,
          r.submittedAt || '',
          r.closedAt || '',
        ].join(',')
      );

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project_${projectId}_universe_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center">
          <p className="font-black text-xl text-slate-200 uppercase tracking-[0.2em] animate-pulse">
            Mining Intelligence
          </p>
          <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest font-bold">
            Aggregating Project Data Universe...
          </p>
        </div>
      </div>
    );
  }

  const { summary, distribution, trend } = stats;

  const pieData = [
    { name: 'Pending', value: distribution.pending },
    { name: 'In Progress', value: distribution.inProgress },
    { name: 'Completed', value: distribution.completed },
  ];

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700">
      {/* 1. Executive Intelligence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Universe"
          value={summary.total.toString()}
          description="Total records ingested"
          icon={<Layers className="w-5 h-5 text-indigo-400" />}
          trend="+12%"
        />
        <StatsCard
          title="Fulfillment Rate"
          value={`${summary.completionRate.toFixed(1)}%`}
          description="Verified vs Inbound"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          trend="+5%"
        />
        <StatsCard
          title="SLA Compliance"
          value={`${summary.slaFulfillment.toFixed(1)}%`}
          description="Within archetype window"
          icon={<ShieldCheck className="w-5 h-5 text-blue-400" />}
          trend="-2%"
          trendType={summary.slaFulfillment < 90 ? 'negative' : 'positive'}
        />
        <StatsCard
          title="Field Latency"
          value={summary.inProgress.toString()}
          description="Nodes in cultivation"
          icon={<Clock className="w-5 h-5 text-amber-400" />}
          trend="+8%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Volume Trend Node */}
        <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -mr-32 -mt-32" />

          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h3 className="text-lg font-black text-[var(--color-text-base)] uppercase tracking-tighter">
                Ingestion Dynamics
              </h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                Last 7 Days Volatility
              </p>
            </div>
            <div className="flex items-center gap-6 px-4 py-2 bg-slate-950/50 rounded-2xl border border-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  CREATED
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  VERIFIED
                </span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorCompleted"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#1e293b"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '20px',
                    border: '1px solid #1e293b',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                    padding: '12px',
                  }}
                  itemStyle={{
                    fontSize: '12px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                  }}
                  labelStyle={{
                    color: '#94a3b8',
                    marginBottom: '4px',
                    fontWeight: 700,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="created"
                  stroke="#6366f1"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorCreated)"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Distribution Node */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-[2.5rem] p-8 shadow-2xl relative group">
          <h3 className="text-lg font-black text-[var(--color-text-base)] uppercase tracking-tighter mb-8">
            State Distribution
          </h3>
          <div className="h-72 w-full flex flex-col items-center justify-center relative">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '16px',
                    border: '1px solid #1e293b',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-4xl font-black text-[var(--color-text-base)] leading-none block">
                {summary.total}
              </span>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">
                UNIVERSE
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 w-full mt-6">
              {pieData.map((d, i) => (
                <div
                  key={d.name}
                  className="flex flex-col items-center p-3 bg-slate-950/50 rounded-2xl border border-slate-800/50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full ring-2 ring-white/5"
                      style={{ backgroundColor: COLORS[i] }}
                    />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {d.name}
                    </span>
                  </div>
                  <span className="text-sm font-black text-[var(--color-text-base)]">
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Report Builder & Data Export */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(79,70,229,0.3)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-surface-muted)] blur-[80px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 blur-[60px] -ml-32 -mb-32" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-start gap-6 max-w-2xl">
            <div className="p-4 bg-[var(--color-surface-muted)] backdrop-blur-md rounded-[2rem] border border-[var(--color-border-base)]">
              <FileText className="w-10 h-10 text-[var(--color-text-base)]" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[var(--color-text-base)] uppercase tracking-tighter leading-tight">
                Data Universe Export
              </h3>
              <p className="text-indigo-100 mt-2 text-sm font-medium leading-relaxed">
                Generate a comprehensive local snapshot of all records in this
                project universe. Includes metadata, verification timestamps,
                and archetype telemetry.
              </p>
            </div>
          </div>

          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="h-16 px-10 bg-white text-indigo-600 hover:bg-slate-50 font-black uppercase tracking-widest rounded-3xl shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {isExporting ? 'Generating...' : 'Export Universe'}
          </Button>
        </div>
      </div>

      {/* 5. SLA & Quality Intelligence (Static Nodes) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 p-6 rounded-[2rem] flex items-center gap-5">
          <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              At-Risk Nodes
            </p>
            <p className="text-lg font-black text-[var(--color-text-base)]">
              4 Cases
            </p>
          </div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 p-6 rounded-[2rem] flex items-center gap-5">
          <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Avg. Processing
            </p>
            <p className="text-lg font-black text-[var(--color-text-base)]">
              12.4 Hours
            </p>
          </div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 p-6 rounded-[2rem] flex items-center gap-5">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <FileText className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Active Archetypes
            </p>
            <p className="text-lg font-black text-[var(--color-text-base)]">
              3 Active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  trendType = 'positive',
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend: string;
  trendType?: 'positive' | 'negative';
}) {
  return (
    <div className="group bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 p-6 rounded-[2rem] shadow-xl hover:shadow-indigo-500/10 transition-all hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/50 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${
            trendType === 'positive'
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
          }`}
        >
          {trend}
          <ArrowUpRight
            className={`w-3 h-3 ${trendType === 'negative' ? 'rotate-90' : ''}`}
          />
        </div>
      </div>
      <h4 className="text-3xl font-black text-[var(--color-text-base)] tracking-tighter">
        {value}
      </h4>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2 group-hover:text-slate-400 transition-colors">
        {title}
      </p>
      <p className="text-[10px] text-slate-600 mt-4 font-bold border-t border-slate-800/50 pt-4 uppercase tracking-widest italic line-clamp-1">
        {description}
      </p>
    </div>
  );
}
