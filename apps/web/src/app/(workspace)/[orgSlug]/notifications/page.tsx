'use client';

import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification, Notification } from '@/hooks/useNotifications';
import { Bell, CheckCircle2, Trash2, ExternalLink, Calendar, AlertTriangle, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function NotificationsPage() {
  const { orgSlug } = useParams();
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Alert Center</h1>
          <p className="text-slate-500 mt-1">Updates and compliance notices for <span className="font-bold text-blue-600">{orgSlug}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => markAllAsRead.mutate()}
            disabled={notifications.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" /> Mark All Read
          </button>
        </div>
      </div>

      {/* List Container */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 font-medium">Syncing notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-24 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Silence is compliance</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-2">You don&apos;t have any unread alerts at the moment. Keep up the good work!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-6 flex gap-5 group hover:bg-slate-50/50 transition-colors relative ${!n.readAt ? 'bg-blue-50/20' : ''}`}
              >
                <div className="shrink-0 mt-1">
                  {getPriorityIcon(n.priority)}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className={`text-base leading-tight ${!n.readAt ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                      {n.title}
                    </h4>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium whitespace-nowrap">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                    {n.body}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    {n.actionUrl && (
                      <Link 
                        href={n.actionUrl}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg transition-colors"
                      >
                        Execute Action <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                    {!n.readAt && (
                      <button 
                        onClick={() => markAsRead.mutate(n.id)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors uppercase tracking-wider"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => deleteNotification.mutate(n.id)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete Notification"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center pb-12">
        <p className="text-xs text-slate-400">
          Showing notifications from the last 30 days. Older alerts are automatically archived.
        </p>
      </div>
    </div>
  );
}
