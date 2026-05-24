"use client";

import { ReactNode } from "react";

interface PatientHeaderProps {
  patient: {
    id: string;
    name: string;
    age: number;
    gender: string;
  };
  status?: {
    label: string;
    color?: "critical" | "urgent" | "stable" | "info" | "success" | "warning";
  };
  priority?: number;
  extraInfo?: ReactNode;
  onClose?: () => void;
}

export function PatientHeader({ patient, status, priority, extraInfo, onClose }: PatientHeaderProps) {
  const statusColors = {
    critical: "bg-red-100 text-red-700 border-red-200",
    urgent: "bg-orange-100 text-orange-700 border-orange-200",
    stable: "bg-green-100 text-green-700 border-green-200",
    info: "bg-blue-100 text-blue-700 border-blue-200",
    success: "bg-emerald-100 text-emerald-700 border-emerald-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
  };

  return (
    <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
      <div className="p-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-800">{patient.name}</h3>
          <p className="text-slate-500">
            {patient.id} • {patient.age} years • {patient.gender}
            {priority && <span className="ml-2 font-medium">Priority {priority}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {status && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[status.color || "info"]}`}>
              {status.label}
            </span>
          )}
          {extraInfo}
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}