"use client";

import { useNotifications } from '@/lib/notifications';

export function NotificationBell() {
  const { notifications, unreadCount } = useNotifications();

  return (
    <div className="relative">
      <button className="relative p-2 text-slate-600 hover:text-slate-800">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.444-.9 9.944 9.944 0 01-1.121.678A9.944 9.944 0 0112 21.75a9.944 9.944 0 01-8.622-4.678 9.944 9.944 0 011.121-.9 23.848 23.848 0 015.444.9z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 18.75a9.944 9.944 0 01.678-4.678A9.944 9.944 0 0112 3.75a9.944 9.944 0 018.622 4.678 9.944 9.944 0 01-.678 4.678" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}