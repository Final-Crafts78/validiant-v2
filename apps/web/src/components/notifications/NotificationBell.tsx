'use client';
/**
 * Notification Bell Component
 *
 * Displays a bell icon with unread count and a popover list of alerts.
 * Implements priority sorting, grouping, and pulsing animation.
 */

import { useState, useRef, useEffect } from 'react';
import { Bell, Trash2, ExternalLink, AlertTriangle, Info } from 'lucide-react';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  Notification,
} from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: notifications = [] as Notification[], isLoading } =
    useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const hasUrgent = notifications.some(
    (n) => n.priority === 'urgent' && !n.readAt
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-full transition-all hover:bg-slate-100 ${
          hasUrgent ? 'animate-[ring-pulse_2s_infinite]' : ''
        }`}
      >
        <Bell
          className={`w-5 h-5 ${unreadCount > 0 ? 'text-blue-600' : 'text-slate-500'}`}
        />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[480px] bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead.mutate()}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto scrollbar-hide py-1">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-slate-400 text-sm italic">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-slate-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n: Notification) => (
                <div
                  key={n.id}
                  className={`group px-4 py-3 hover:bg-slate-50 transition-colors flex gap-3 relative border-b border-slate-50 last:border-0 ${
                    !n.readAt ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="shrink-0 mt-1">
                    {getPriorityIcon(n.priority)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm leading-tight ${!n.readAt ? 'font-semibold text-slate-900' : 'text-slate-600'}`}
                      >
                        {n.title}
                      </p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {n.body}
                    </p>

                    <div className="mt-2 flex items-center gap-3">
                      {n.actionUrl && (
                        <Link
                          href={n.actionUrl}
                          className="text-[10px] uppercase tracking-wider font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          onClick={() => setOpen(false)}
                        >
                          View Action <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      )}
                      {!n.readAt && (
                        <button
                          onClick={() => markAsRead.mutate(n.id)}
                          className="text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Delete button on hover */}
                  <button
                    onClick={() => deleteNotification.mutate(n.id)}
                    className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              href="/notifications"
              className="text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              View all alerts
            </Link>
          </div>
        </div>
      )}

      {/* Pulsing Style */}
      <style jsx global>{`
        @keyframes ring-pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
