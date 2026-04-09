'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  Navigation,
  Lock,
  Loader2,
  Moon,
  Sun,
  User,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { usePermission } from '@/hooks/usePermission';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';

export default function FieldAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { orgSlug } = useParams() as { orgSlug: string };
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

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
    { name: 'Profile', href: `/${orgSlug}/settings/profile`, icon: User },
  ];

  if (isCheckPending) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-bright)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-base)] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-error-container rounded-3xl flex items-center justify-center text-on-error-container mb-6">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-[var(--color-text-base)] font-display mb-2">
          Access Restricted
        </h1>
        <p className="text-[var(--color-text-muted)] text-sm max-w-[240px] mb-8">
          You do not have the required permissions to access the Field Executive
          console.
        </p>
        <button
          onClick={() => router.push(`/${orgSlug}/dashboard`)}
          className="w-full max-w-xs py-4 bg-primary text-on-primary rounded-[2rem] font-black hover:opacity-90 transition-all active:scale-95 shadow-xl"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Force light mode aesthetically using the surface tokens if needed, but it will rely on the global theme.
  return (
    <div className="min-h-screen bg-[var(--color-surface-bright)] flex flex-col font-sans">
      {/* Mobile-First Header (TopAppBar) */}
      <header className="sticky top-0 z-30 bg-[var(--color-surface-container-lowest)]/80 backdrop-blur-md px-4 py-3 flex items-center justify-between shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => router.push(`/${orgSlug}/dashboard`)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-container-high)] transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
             <h1 className="text-sm font-black text-[var(--color-text-base)] tracking-tight font-display uppercase">
               Validiant <span className="text-primary">Field</span>
             </h1>
             <p className="text-[9px] font-bold text-[var(--color-text-muted)] tracking-widest uppercase">
               Executive Console
             </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:text-primary hover:bg-[var(--color-surface-container-high)] transition-all"
            title={
              theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'
            }
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
          
          <div className="w-8 h-8 rounded-full bg-[var(--color-surface-container-highest)] border-2 border-[var(--color-surface-container-lowest)] shadow-sm flex items-center justify-center text-[10px] font-bold text-[var(--color-text-base)] uppercase overflow-hidden">
            {user?.fullName?.substring(0, 2) || 'FE'}
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
      <nav className="fixed bottom-0 left-0 right-0 bg-[var(--color-surface-container-lowest)] border-t border-[var(--color-surface-container-high)] px-6 py-3 flex items-center justify-around z-40 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)] rounded-t-2xl">
        <div className="flex items-center justify-around w-full max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 transition-all',
                  isActive ? 'text-primary' : 'text-[var(--color-on-surface-variant)]'
                )}
              >
                <div
                  className={cn(
                    'px-4 py-1 rounded-2xl flex items-center justify-center transition-all',
                    isActive ? 'bg-primary/10' : 'bg-transparent'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      isActive ? 'fill-primary/20' : ''
                    )}
                  />
                </div>
                <span className={cn('text-[10px] font-bold tracking-tighter', isActive ? 'text-primary' : 'text-[var(--color-text-muted)]')}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
