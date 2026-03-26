"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEHR } from "@/lib/ehr-context";
import { useAuth } from "@/lib/auth-context";
import { departments } from "@/lib/ehr-data";
import { IncidentReportForm } from "./IncidentReportForm";

export function Header() {
  const router = useRouter();
  const { currentDepartment, patients, labOrders, prescriptions } = useEHR();
  const { user, logout } = useAuth();
  const [showIncidentForm, setShowIncidentForm] = useState(false);

  const currentDept = departments.find(d => d.id === currentDepartment);
  
  const pendingLabResults = labOrders.filter(o => o.status === 'pending').length;
  const pendingPrescriptions = prescriptions.filter(p => p.status === 'pending').length;
  const criticalPatients = patients.filter(p => p.status === 'critical').length;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'doctor': return 'bg-blue-100 text-blue-700';
      case 'nurse': return 'bg-green-100 text-green-700';
      case 'admin': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <>
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

        <button
          onClick={() => setShowIncidentForm(true)}
          className="p-2 hover:bg-amber-100 rounded-lg text-amber-600"
          title="Report Incident"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </button>

        {user && (
          <>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{user.name}</p>
                <div className="flex items-center gap-2 justify-end">
                  <span className={`text-xs px-2 py-0.5 rounded ${getRoleBadgeColor(user.role)}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-semibold">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600"
                title="Logout"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </header>

    {showIncidentForm && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">Incident Report</h3>
            <button
              onClick={() => setShowIncidentForm(false)}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <IncidentReportForm />
        </div>
      </div>
    )}
    </>
  );
}
