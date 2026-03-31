'use client';

import React from 'react';
import { 
  FolderKanban, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight,
  Clock,
  Users,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { useOrganizations } from '@/hooks/useOrganizations';

export default function GlobalProjectsPage() {
  const { data: organizations = [], isLoading } = useOrganizations();

  // Aggregate all projects from all organizations
  const allProjects = organizations.flatMap(org => 
    (org as any).projects?.map((p: any) => ({ ...p, orgName: org.name, orgSlug: org.slug })) || []
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Global Projects
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Unified view of all strategic initiatives across your decentralized network
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter projects..."
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all w-64"
            />
          </div>
          <button className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-600 transition-colors shadow-sm">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {allProjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-20 text-center">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-600">
            <FolderKanban className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No Active Projects</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8 font-medium">
            Project data will aggregate here once you initialize initiatives within your workspaces.
          </p>
          <button className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            Initialize Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allProjects.map((project: any) => (
            <div 
              key={project.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-100 dark:border-blue-900/30">
                  {project.orgName}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors truncate">
                {project.name}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-2 mb-6 h-10">
                {project.description || 'No project metadata provided.'}
              </p>
              <div className="flex items-center justify-between pt-5 border-t border-slate-50 dark:border-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        U
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">+5 members</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase">2d ago</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
