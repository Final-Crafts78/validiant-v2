'use client';

import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Navigation,
  LayoutDashboard,
  Lock,
  Loader2,
  Moon,
  Sun
} from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/store/workspace';
import { usePermission } from '@/hooks/usePermission';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function FieldAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { orgSlug } = useParams() as { orgSlug: string };
  const { activeOrgId } = useWorkspaceStore();
  const { theme, toggleTheme } = useTheme();
  
  const hasPermission = usePermission('field:access' as any);
  const [isCheckPending, setIsCheckPending] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsCheckPending(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const navItems = [
    { name: 'Tasks', href: `/${orgSlug}/field/tasks`, icon: CheckCircle2 },
    { name: 'Route', href: `/${orgSlug}/field/route`, icon: Navigation },
    { name: 'Logs', href: `/${orgSlug}/field/logs`, icon: Clock },
  ];

  if (isCheckPending) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100 shadow-xl shadow-red-50">
          <Lock className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Access Restricted</h2>
        <p className="text-slate-500 max-w-xs mx-auto mb-8 font-medium">
          Your current role does not have the 
          <code className="mx-1 bg-slate-100 px-1.5 py-0.5 rounded text-red-600 text-[10px] font-black uppercase">
            field:access
          </code> 
          permission required for mobile operations.
        </p>
        <button 
          onClick={() => router.push(`/${orgSlug}/dashboard`)}
          className="w-full max-w-xs py-4 bg-slate-900 text-white rounded-[2rem] font-black hover:bg-slate-800 transition-all active:scale-95 shadow-xl"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Mobile-First Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Navigation className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none uppercase">
              Validiant
            </h1>
            <p className="text-[10px] font-bold text-indigo-600 tracking-widest leading-none mt-0.5">
              FIELD OP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => router.push(`/${orgSlug}/projects`)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            title="Switch to Management Console"
          >
            <LayoutDashboard className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
            FE
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-md mx-auto p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>

      {/* Bottom Navigation (Sticky) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 px-6 py-3 flex items-center justify-around z-40 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex flex-col items-center gap-1 transition-all relative py-1',
                isActive ? 'text-indigo-600' : 'text-slate-400'
              )}
            >
              {isActive && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.6)]" />
              )}
              <Icon className={cn(
                'w-6 h-6 transition-transform',
                isActive ? 'scale-110' : 'scale-100 group-active:scale-95'
              )} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
