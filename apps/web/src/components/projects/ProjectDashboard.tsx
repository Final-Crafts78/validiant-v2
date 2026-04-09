'use client';

import React from 'react';
import { useProject } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { format } from 'date-fns';
import { TaskStatus, TaskPriority } from '@validiant/shared';
import {
  Filter,
  Plus,
  Archive,
  Trash2,
  Share2,
  MoreVertical,
  AlertTriangle,
  Database,
  TrendingUp,
  Activity,
  History,
  Map as MapIcon,
  Timer
} from 'lucide-react';
import { cn } from '@validiant/ui';

interface ProjectDashboardProps {
  projectId: string;
}

export function ProjectDashboard({ projectId }: ProjectDashboardProps) {
  const { data: project } = useProject(projectId);
  const { data: tasksData } = useTasks(projectId);
  const tasks = tasksData?.pages?.flatMap(p => p.tasks) || [];

  // Fallback defaults if no project data
  const projectName = project?.name || 'Loading...';
  const taskCount = tasks.length;

  // Derived stats from tasks
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.VERIFIED).length;
  const completionRate = taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0;
  
  // High-Density Data Table mockup mapping tasks to Obsidian Verifier rows
  const tableRows = tasks.slice(0, 10).map((task, i) => {
    let statusLabel = 'Pending';
    let statusColor = 'text-[var(--color-text-muted)]';
    let statusBg = 'bg-[var(--color-text-muted)]';
    let statusGlow = 'shadow-none';
    let confFill = 'w-[0%] bg-[var(--color-surface-muted)]';
    
    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.VERIFIED) {
      statusLabel = 'Verified';
      statusColor = 'text-primary';
      statusBg = 'bg-primary';
      statusGlow = 'shadow-[0_0_8px_rgba(var(--color-primary-rgb,173,198,255),0.8)]';
      confFill = 'w-[98%] bg-primary';
    } else if (task.status === TaskStatus.IN_PROGRESS) {
      statusLabel = 'In Progress';
      statusColor = 'text-[#ffb786]'; // tertiary warning color
      statusBg = 'bg-[#ffb786]';
      statusGlow = 'shadow-[0_0_8px_rgba(255,183,134,0.8)]';
      confFill = 'w-[62%] bg-[#ffb786]';
    } else if (task.priority === TaskPriority.HIGH || task.priority === TaskPriority.URGENT) {
      statusLabel = 'Warning';
      statusColor = 'text-[#ffb4ab]'; // error color
      statusBg = 'bg-[#ffb4ab]';
      statusGlow = 'shadow-[0_0_8px_rgba(255,180,171,0.8)]';
      confFill = 'w-[30%] bg-[#ffb4ab]';
    }

    return {
      id: task.id,
      traceId: `TRX-${(task.id || '').substring(0, 4).toUpperCase()}`,
      statusLabel,
      statusColor,
      statusBg,
      statusGlow,
      entityName: task.title || `Task ${i+1}`,
      latency: Math.floor(Math.random() * 50) + 'ms',
      timestamp: task.createdAt ? format(new Date(task.createdAt), 'yyyy-MM-dd HH:mm:ss') : 'Unknown',
      confFill,
    };
  });

  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar font-manrope">
      {/* DESKTOP LAYOUT (lg+) */}
      <div className="hidden lg:flex flex-col gap-8 w-full max-w-[1400px] mx-auto">
        
        {/* Editoral Hero Header */}
        <section className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">System Integrity</span>
            <h2 className="text-4xl font-black font-headline tracking-tighter text-[var(--color-text-base)]">
              {projectName}
            </h2>
          </div>
          <div className="flex gap-4">
            <button className="bg-[var(--surface-container-highest)] hover:bg-[var(--surface-bright)] text-[var(--color-text-base)] px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all">
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button className="bg-gradient-to-br from-primary to-[#2170e4] text-[#ffffff] px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-[0_4px_12px_rgba(var(--color-primary-rgb,0,88,190),0.2)] hover:opacity-90 active:scale-95 transition-all">
              <Plus className="w-4 h-4" />
              New Verification
            </button>
          </div>
        </section>

        {/* Bulk Action Toolbar */}
        <div className="bg-[var(--surface-container-low)] px-4 py-3 flex items-center justify-between rounded-xl">
          <div className="flex items-center gap-4">
            <input type="checkbox" className="rounded bg-transparent text-primary border-[var(--color-border-base)]" />
            <span className="text-xs font-medium text-[var(--color-text-muted)]">0 items selected</span>
            <div className="h-4 w-[1px] bg-[var(--color-border-base)] mx-2" />
            <div className="flex gap-2">
              <button className="p-1.5 hover:bg-[var(--color-surface-muted)]/20 rounded text-[var(--color-text-muted)] transition-colors"><Archive className="w-4 h-4"/></button>
              <button className="p-1.5 hover:bg-[var(--color-surface-muted)]/20 rounded text-[var(--color-text-muted)] transition-colors"><Trash2 className="w-4 h-4"/></button>
              <button className="p-1.5 hover:bg-[var(--color-surface-muted)]/20 rounded text-[var(--color-text-muted)] transition-colors"><Share2 className="w-4 h-4"/></button>
            </div>
          </div>
          <div className="text-xs text-[var(--color-text-muted)] font-medium">
            Showing 1-{tableRows.length} of {taskCount} records
          </div>
        </div>

        {/* High-Density Data Table */}
        <section className="bg-[var(--surface-container-lowest)] rounded-2xl overflow-hidden border border-[var(--color-border-base)]/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--surface-container-low)]">
                  <th className="px-6 py-4 text-[10px] font-bold tracking-[0.15em] text-[var(--color-text-muted)] uppercase">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-[0.15em] text-[var(--color-text-muted)] uppercase">Trace ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-[0.15em] text-[var(--color-text-muted)] uppercase">Entity Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-[0.15em] text-[var(--color-text-muted)] uppercase">Latency</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-[0.15em] text-[var(--color-text-muted)] uppercase">Timestamp</th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-[0.15em] text-[var(--color-text-muted)] uppercase">Confidence</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-base)]/10">
                {tableRows.map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--surface-container-high)] transition-all duration-200 group relative">
                    <td className="px-6 py-4 group-hover:-translate-y-px transition-transform">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", row.statusBg, row.statusGlow)} />
                        <span className={cn("text-xs font-bold", row.statusColor)}>{row.statusLabel}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[var(--color-text-muted)] group-hover:-translate-y-px transition-transform">
                      {row.traceId}
                    </td>
                    <td className="px-6 py-4 group-hover:-translate-y-px transition-transform">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--surface-container-high)] flex items-center justify-center">
                           <Database className="w-4 h-4 text-primary opacity-80" />
                        </div>
                        <span className="text-sm font-bold text-[var(--color-text-base)] max-w-[200px] truncate">{row.entityName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-[var(--color-text-muted)] group-hover:-translate-y-px transition-transform">{row.latency}</td>
                    <td className="px-6 py-4 text-xs font-medium text-[var(--color-text-muted)] group-hover:-translate-y-px transition-transform">{row.timestamp}</td>
                    <td className="px-6 py-4 group-hover:-translate-y-px transition-transform">
                      <div className="w-24 h-1.5 bg-[var(--surface-container-highest)] rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", row.confFill)} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="opacity-0 group-hover:opacity-100 p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {tasks.length > 10 && (
            <div className="px-6 py-4 bg-[var(--surface-container-low)] flex justify-center border-t border-[var(--color-border-base)]/5">
              <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline hover:opacity-80 transition-all">
                View All {taskCount} Records
              </button>
            </div>
          )}
        </section>

        {/* Bento SLA Highlights */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
          
          <div className="bg-[var(--surface-container-low)] p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-[0_12px_40px_rgba(15,23,42,0.02)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-500" />
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black tracking-[0.2em] text-[var(--color-text-muted)] uppercase">Completion Rate</span>
                <Activity className="text-primary w-5 h-5" />
              </div>
              <div className="flex items-baseline gap-2 font-headline">
                <span className="text-4xl font-black text-[var(--color-text-base)]">{completionRate}</span>
                <span className="text-sm font-bold text-primary">%</span>
              </div>
              <div className="w-full h-1 bg-[var(--surface-container-highest)] rounded-full overflow-hidden">
                <div className="h-full bg-primary shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.5)]" style={{ width: `${completionRate}%` }} />
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] font-medium">All active verifications</p>
            </div>
          </div>

          <div className="bg-[var(--surface-container-low)] p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-[0_12px_40px_rgba(15,23,42,0.02)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors duration-500" />
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black tracking-[0.2em] text-[var(--color-text-muted)] uppercase">Throughput</span>
                <TrendingUp className="text-emerald-500 w-5 h-5" />
              </div>
              <div className="flex items-baseline gap-2 font-headline">
                <span className="text-4xl font-black text-[var(--color-text-base)]">{taskCount}</span>
                <span className="text-sm font-bold text-emerald-500">ops</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500">
                <TrendingUp className="w-3 h-3" />
                <span>+12.4% from average</span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--surface-container-low)] p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-[0_12px_40px_rgba(15,23,42,0.02)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffb4ab]/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#ffb4ab]/10 transition-colors duration-500" />
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black tracking-[0.2em] text-[var(--color-text-muted)] uppercase">Warning Rate</span>
                <AlertTriangle className="text-[#ffb4ab] w-5 h-5" />
              </div>
              <div className="flex items-baseline gap-2 font-headline">
                <span className="text-4xl font-black text-[var(--color-text-base)]">2.4</span>
                <span className="text-sm font-bold text-[#ffb4ab]">%</span>
              </div>
              <div className="text-[10px] font-medium text-[var(--color-text-muted)]">
                Threshold: 5.0%
              </div>
            </div>
          </div>

          <div className="bg-[var(--surface-container-low)] p-6 rounded-2xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-[0_12px_40px_rgba(15,23,42,0.02)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffb786]/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#ffb786]/10 transition-colors duration-500" />
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black tracking-[0.2em] text-[var(--color-text-muted)] uppercase">Audit Density</span>
                <History className="text-[#ffb786] w-5 h-5" />
              </div>
              <div className="flex items-baseline gap-2 font-headline">
                <span className="text-4xl font-black text-[var(--color-text-base)]">12.8</span>
                <span className="text-sm font-bold text-[var(--color-text-muted)]">k</span>
              </div>
              <div className="text-[10px] font-medium text-[var(--color-text-muted)] flex items-center justify-between">
                <span>Indexed records</span>
                <span className="text-[#ffb786] font-bold uppercase tracking-widest">Optimized</span>
              </div>
            </div>
          </div>

        </section>
      </div>

      {/* MOBILE LAYOUT (<lg) */}
      <div className="lg:hidden flex flex-col gap-6 w-full pb-28">
        
        <header className="flex flex-col gap-4">
          <h2 className="text-3xl font-black text-[var(--color-text-base)] tracking-tighter">{projectName}</h2>
          
          <div className="bg-[var(--surface-container-highest)] rounded-xl flex items-center px-4 py-3">
            <Filter className="w-4 h-4 text-[var(--color-text-muted)] mr-3" />
            <input 
              type="text" 
              placeholder="Search active tasks..." 
              className="bg-transparent border-none text-sm w-full text-[var(--color-text-base)] placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:ring-0" 
            />
          </div>
          
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
            <button className="whitespace-nowrap px-4 py-2 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">All Active</button>
            <button className="whitespace-nowrap px-4 py-2 bg-[var(--surface-container-highest)] text-[var(--color-text-base)] rounded-full text-[10px] font-bold uppercase tracking-widest">Critical</button>
            <button className="whitespace-nowrap px-4 py-2 bg-[var(--surface-container-highest)] text-[var(--color-text-base)] rounded-full text-[10px] font-bold uppercase tracking-widest">Near Me</button>
            <button className="whitespace-nowrap px-4 py-2 bg-[var(--surface-container-highest)] text-[var(--color-text-base)] rounded-full text-[10px] font-bold uppercase tracking-widest">Assigned</button>
          </div>
        </header>

        <section className="flex flex-col gap-4">
          {tasks.slice(0, 5).map((task) => (
            <div key={task.id} className="bg-[var(--surface-container-low)] p-5 rounded-2xl flex flex-col gap-4 border border-[var(--color-border-base)]/5 shadow-md">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-black tracking-widest text-[var(--color-text-muted)] uppercase">CASE: {task.id.substring(0,8)}</span>
                <span className="px-2 py-0.5 bg-[#ffb786]/10 text-[#ffb786] rounded text-[9px] font-bold tracking-widest uppercase">
                  {task.priority || 'Medium'}
                </span>
              </div>
              
              <h3 className="text-xl font-black text-[var(--color-text-base)] leading-tight">{task.title}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">Type</span>
                  <span className="text-xs font-bold text-[var(--color-text-base)]">Field Audit</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">Due Date</span>
                  <span className="text-xs font-bold text-primary">In 4 Hours</span>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-[var(--color-border-base)]/10 mt-1">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[var(--surface-container-high)] border border-[var(--surface-container-low)] flex items-center justify-center text-[8px] font-bold">V</div>
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary border border-[var(--surface-container-low)] flex items-center justify-center text-[8px] font-bold">+2</div>
                </div>
                <button className="bg-gradient-to-br from-primary to-[#2170e4] text-[#ffffff] px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                  Begin Check
                </button>
              </div>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div className="bg-[var(--surface-container-low)] p-4 rounded-xl flex flex-col gap-3">
            <div className="p-2 bg-primary/10 w-fit rounded-lg shadow-inner">
              <MapIcon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-[var(--color-text-base)] font-headline">12.4</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Miles Total</span>
            </div>
          </div>
          <div className="bg-[var(--surface-container-low)] p-4 rounded-xl flex flex-col gap-3">
            <div className="p-2 bg-emerald-500/10 w-fit rounded-lg shadow-inner">
              <Timer className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-[var(--color-text-base)] font-headline">45</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Avg Mins</span>
            </div>
          </div>
        </section>
      </div>

    </div>
  );
}
