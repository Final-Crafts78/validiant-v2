'use client';

import { useProjectStats } from '@/hooks/useProjectStats';
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
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export function AnalyticsTab({ projectId }: { projectId: string }) {
  const { data: stats, isLoading } = useProjectStats(projectId);

  if (isLoading || !stats) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="font-bold text-sm uppercase tracking-widest">
          Mining Intelligence...
        </p>
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
    <div className="space-y-6 pb-24">
      {/* 1. Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Cases"
          value={summary.total.toString()}
          description="Across all categories"
          icon={<Layers className="w-5 h-5 text-indigo-500" />}
          trend="+12%"
        />
        <StatsCard
          title="Completion Rate"
          value={`${summary.completionRate.toFixed(1)}%`}
          description="Finalized vs Received"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          trend="+5%"
        />
        <StatsCard
          title="SLA Fulfillment"
          value={`${summary.slaFulfillment.toFixed(1)}%`}
          description="Within 72hr window"
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          trend="-2%"
          trendType="negative"
        />
        <StatsCard
          title="Live Throughput"
          value={summary.inProgress.toString()}
          description="Currently in field"
          icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}
          trend="+8%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Volume Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Case Ingestion Trend
              </h3>
              <p className="text-xs text-slate-500">Daily volume (Last 7 Days)</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-bold text-slate-400">CREATED</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-400">COMPLETED</span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="created"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCreated)"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Distribution Chart */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">
            Workload Distribution
          </h3>
          <div className="h-64 w-full flex flex-col items-center justify-center relative">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <span className="text-2xl font-black text-slate-800 leading-none">
                {summary.total}
              </span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Total
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 w-full mt-4">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-[8px] font-bold text-slate-400 uppercase">
                      {d.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-800">{d.value}</span>
                </div>
              ))}
            </div>
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
    <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-slate-50 rounded-xl">{icon}</div>
        <div
          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[10px] font-bold ${
            trendType === 'positive'
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-rose-50 text-rose-600'
          }`}
        >
          {trend}
          <ArrowUpRight className={`w-2.5 h-2.5 ${trendType === 'negative' ? 'rotate-90' : ''}`} />
        </div>
      </div>
      <h4 className="text-2xl font-black text-slate-800">{value}</h4>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
        {title}
      </p>
      <p className="text-[10px] text-slate-400 mt-2 italic line-clamp-1">
        {description}
      </p>
    </div>
  );
}
