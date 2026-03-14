'use client';

import { useState } from 'react';
import { Search as SearchIcon, Filter, X, Command, ArrowRight } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function SearchPage() {
  const { orgSlug } = useParams();
  const [query, setQuery] = useState('');

  const suggestions = [
    { type: 'Task', title: 'Update compliance documentation', route: `/${orgSlug}/tasks` },
    { type: 'Project', title: 'Q4 Financial Audit', route: `/${orgSlug}/projects` },
    { type: 'Member', title: 'Sarah Jenkins (Admin)', route: `/${orgSlug}/settings/members` },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 animate-in fade-in zoom-in-95 duration-500">
      {/* Search Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Global Index Search</h1>
        <p className="text-slate-500">Scanning through <span className="text-blue-600 font-bold">{orgSlug}</span> workspace resources.</p>
      </div>

      {/* Hero Search Box */}
      <div className="relative group">
        <div className="absolute inset-0 bg-blue-500/10 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <div className="relative bg-white border-2 border-slate-200 group-focus-within:border-blue-500 rounded-3xl shadow-2xl p-2 flex items-center gap-4 transition-all overflow-hidden">
          <div className="pl-6">
            <SearchIcon className="w-6 h-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input 
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, projects, people, or commands..."
            className="flex-1 bg-transparent border-none outline-none text-xl font-medium text-slate-800 placeholder:text-slate-300 py-4"
          />
          <div className="flex items-center gap-2 pr-4 text-slate-400">
             <kbd className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-500">
               <Command className="w-3 h-3" />
             </kbd>
             <kbd className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-500">
               K
             </kbd>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        {['All Results', 'Tasks', 'Projects', 'Members', 'Artifacts', 'Settings'].map((filter, i) => (
          <button 
            key={filter}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
              i === 0 ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {filter}
          </button>
        ))}
        <button className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-slate-600 transition-colors">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-bold">More Filters</span>
        </button>
      </div>

      {/* Suggested Results */}
      {!query && (
        <div className="mt-16 space-y-8 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div>
             <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Recommended for you</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {suggestions.map((s) => (
                 <a 
                   key={s.title}
                   href={s.route}
                   className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all"
                 >
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{s.type}</span>
                     <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                   </div>
                   <p className="font-bold text-slate-800">{s.title}</p>
                 </a>
               ))}
             </div>
          </div>
        </div>
      )}

      {/* Empty State / Query results UI would go here */}
      {query && (
        <div className="mt-16 text-center py-24 space-y-4">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
             <SearchIcon className="w-10 h-10 text-slate-200" />
           </div>
           <h3 className="text-xl font-bold text-slate-800">No immediate matches found</h3>
           <p className="text-slate-500 max-w-xs mx-auto">We couldn&apos;t find anything matching &quot;{query}&quot;. Try adjusting your filters or checking your spelling.</p>
        </div>
      )}
    </div>
  );
}
