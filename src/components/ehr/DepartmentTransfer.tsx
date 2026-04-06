"use client";

import { useState } from "react";
import { useEHR } from "@/lib/ehr-context";
import { useAuth } from "@/lib/auth-context";
import { Patient, Department } from "@/lib/ehr-data";

interface DepartmentTransferProps {
  patient: Patient;
  onClose: () => void;
}

const departments: { id: Department; name: string; color: string }[] = [
  { id: 'opd', name: 'Outpatient Department', color: '#3B82F6' },
  { id: 'er', name: 'Emergency Room', color: '#EF4444' },
  { id: 'general-ward', name: 'General Ward', color: '#14B8A6' },
  { id: 'pharmacy', name: 'Pharmacy', color: '#8B5CF6' },
  { id: 'lab', name: 'Laboratory', color: '#F59E0B' },
  { id: 'nursing', name: 'Nursing Admin', color: '#10B981' }
];

export function DepartmentTransfer({ patient, onClose }: DepartmentTransferProps) {
  const { transferPatient } = useEHR();
  const { user } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState<Department | "">("");
  const [reason, setReason] = useState("");

  const handleTransfer = () => {
    if (!selectedDepartment || !reason) return;
    
    const userName = user && 'name' in user ? user.name : 'Unknown';
    transferPatient(patient, selectedDepartment, reason, userName);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Transfer Patient</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-4 bg-slate-50 rounded-lg">
          <p className="font-medium text-slate-800">{patient.name}</p>
          <p className="text-sm text-slate-500">ID: {patient.id} | Current: {patient.department}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Transfer To</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value as Department)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="">Select department</option>
              {departments.filter(d => d.id !== patient.department).map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Transfer</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              rows={3}
              placeholder="Explain reason for transfer..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleTransfer}
              disabled={!selectedDepartment || !reason}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              Transfer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}