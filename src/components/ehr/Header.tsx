"use client";

import { useEHR } from "@/lib/ehr-context";
import { departments } from "@/lib/ehr-data";

export function Header() {
  const { currentDepartment, patients, labOrders, prescriptions } = useEHR();

  const currentDept = departments.find(d => d.id === currentDepartment);
  
  const pendingLabResults = labOrders.filter(o => o.status === 'pending').length;
  const pendingPrescriptions = prescriptions.filter(p => p.status === 'pending').length;
  const criticalPatients = patients.filter(p => p.status === 'critical').length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold" style={{ color: currentDept?.color || '#0F766E' }}>
          {currentDept?.name || 'Dashboard'}
        </h2>
        <span className="text-sm text-slate-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {criticalPatients > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg">
              <span className="status-dot critical"></span>
              <span className="text-sm font-medium">{criticalPatients} Critical</span>
            </div>
          )}
          {pendingLabResults > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 3h6v6l5 9H4l5-9V3z"></path>
              </svg>
              <span className="text-sm font-medium">{pendingLabResults} Lab Pending</span>
            </div>
          )}
          {pendingPrescriptions > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.5 20.5L3.5 13.5C2.12 12.12 2.12 9.88 3.5 8.5L8.5 3.5C9.88 2.12 12.12 2.12 13.5 3.5L20.5 10.5C21.88 11.88 21.88 14.12 20.5 15.5L15.5 20.5C14.12 21.88 11.88 21.88 10.5 20.5Z"></path>
              </svg>
              <span className="text-sm font-medium">{pendingPrescriptions} Rx Pending</span>
            </div>
          )}
        </div>

        <div className="w-px h-8 bg-slate-200"></div>

        <button className="p-2 hover:bg-slate-100 rounded-lg relative">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
