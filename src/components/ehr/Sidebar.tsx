"use client";

import React from "react";
import { useEHR } from "@/lib/ehr-context";
import { useAuth } from "@/lib/auth-context";
import { Department } from "@/lib/ehr-data";

const icons: Record<string, React.ReactNode> = {
  grid: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"></rect>
      <rect x="14" y="3" width="7" height="7"></rect>
      <rect x="14" y="14" width="7" height="7"></rect>
      <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
  ),
  user: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  alert: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  ),
  pill: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 20.5L3.5 13.5C2.12 12.12 2.12 9.88 3.5 8.5L8.5 3.5C9.88 2.12 12.12 2.12 13.5 3.5L20.5 10.5C21.88 11.88 21.88 14.12 20.5 15.5L15.5 20.5C14.12 21.88 11.88 21.88 10.5 20.5Z"></path>
      <line x1="8.5" y1="8.5" x2="15.5" y2="15.5"></line>
    </svg>
  ),
  flask: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6v6l5 9H4l5-9V3z"></path>
      <line x1="9" y1="3" x2="15" y2="3"></line>
    </svg>
  ),
  clipboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
      <line x1="8" y1="10" x2="16" y2="10"></line>
      <line x1="8" y1="14" x2="16" y2="14"></line>
      <line x1="8" y1="18" x2="12" y2="18"></line>
    </svg>
  )
};

const departments = [
  { id: 'dashboard' as Department, name: 'Dashboard', icon: 'grid' },
  { id: 'opd' as Department, name: 'Outpatient', icon: 'user' },
  { id: 'er' as Department, name: 'Emergency', icon: 'alert' },
  { id: 'pharmacy' as Department, name: 'Pharmacy', icon: 'pill' },
  { id: 'lab' as Department, name: 'Laboratory', icon: 'flask' },
  { id: 'nursing' as Department, name: 'Nursing Admin', icon: 'clipboard' }
];

export function Sidebar() {
  const { currentDepartment, setCurrentDepartment } = useEHR();
  const { user } = useAuth();

  return (
    <aside className="w-[280px] bg-[#1E293B] min-h-screen flex flex-col text-white">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold">MedConnect</h1>
            <p className="text-xs text-slate-400">EHR System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {departments.map((dept) => (
            <li key={dept.id}>
              <button
                onClick={() => setCurrentDepartment(dept.id)}
                className={`sidebar-item w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                  currentDepartment === dept.id 
                    ? 'active bg-teal-700' 
                    : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                {icons[dept.icon]}
                <span className="font-medium">{dept.name}</span>
                {dept.id === 'er' && (
                  <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse-dot"></span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-sm font-semibold">
            {user ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'U'}
          </div>
          <div>
            <p className="text-sm font-medium">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-400">{user?.departmentName || 'Department'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
