"use client";

import { useState } from "react";
import { useEHR } from "@/lib/ehr-context";
import { Nurse, ShiftType, Department } from "@/lib/ehr-data";

const generateId = () => `A${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function NursingAdmin() {
  const { nurses, patients, updateNurse, addActivity } = useEHR();
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);
  const [activeTab, setActiveTab] = useState<'roster' | 'schedule'>('roster');

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const shifts: ShiftType[] = ['morning', 'afternoon', 'night'];

  const nursesByDepartment = {
    er: nurses.filter(n => n.department === 'er'),
    opd: nurses.filter(n => n.department === 'opd'),
    lab: nurses.filter(n => n.department === 'lab'),
    pharmacy: nurses.filter(n => n.department === 'pharmacy'),
    nursing: nurses.filter(n => n.department === 'nursing'),
  };

  const getShiftColor = (shift: ShiftType) => {
    switch (shift) {
      case 'morning': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'afternoon': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'night': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    }
  };

  const handleShiftChange = (nurseId: string, day: string, shift: ShiftType) => {
    const nurse = nurses.find(n => n.id === nurseId);
    if (nurse) {
      updateNurse({ ...nurse, shift });
      addActivity({
        id: generateId(),
        type: 'nurse-assign',
        department: 'nursing',
        description: `Shift updated for ${nurse.name}: ${shift} on ${day}`,
        timestamp: new Date().toISOString()
      });
    }
  };

  const getDepartmentLabel = (dept: Department) => {
    switch (dept) {
      case 'er': return 'Emergency';
      case 'opd': return 'Outpatient';
      case 'lab': return 'Laboratory';
      case 'pharmacy': return 'Pharmacy';
      case 'nursing': return 'Nursing Admin';
      default: return dept;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Nursing Administration</h2>
          <p className="text-slate-500">Staff management and scheduling</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Nurses</p>
              <p className="text-2xl font-bold">{nurses.length}</p>
            </div>
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">On Duty</p>
              <p className="text-2xl font-bold text-green-600">{nurses.filter(n => n.status === 'on-duty').length}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Available</p>
              <p className="text-2xl font-bold text-blue-600">{nurses.filter(n => n.status === 'available').length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Off Duty</p>
              <p className="text-2xl font-bold text-slate-400">{nurses.filter(n => n.status === 'off-duty').length}</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'roster' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Staff Roster
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'schedule' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Weekly Schedule
        </button>
      </div>

      {activeTab === 'roster' && (
        <div className="space-y-6">
          {Object.entries(nursesByDepartment).map(([dept, deptNurses]) => (
            <div key={dept} className="card">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold">{getDepartmentLabel(dept as Department)} ({deptNurses.length})</h3>
              </div>
              <div className="divide-y divide-slate-200">
                {deptNurses.map((nurse) => (
                  <div 
                    key={nurse.id} 
                    className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelectedNurse(nurse)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-semibold">
                        {nurse.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium">{nurse.name}</p>
                        <p className="text-sm text-slate-500">{nurse.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`badge ${nurse.status === 'on-duty' ? 'badge-success' : nurse.status === 'available' ? 'badge-info' : 'badge-neutral'}`}>
                          {nurse.status}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">Shift: {nurse.shift}</p>
                      </div>
                      <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="card overflow-x-auto">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold">Weekly Shift Schedule</h3>
          </div>
          <table className="min-w-[800px]">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white">Nurse</th>
                {days.map(day => (
                  <th key={day} className="text-center">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nurses.map((nurse) => (
                <tr key={nurse.id}>
                  <td className="sticky left-0 bg-white font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 text-xs font-semibold">
                        {nurse.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span>{nurse.name}</span>
                    </div>
                  </td>
                  {days.map((day) => (
                    <td key={day} className="text-center">
                      <select
                        value={nurse.shift}
                        onChange={(e) => handleShiftChange(nurse.id, day, e.target.value as ShiftType)}
                        className={`px-2 py-1 text-sm rounded border ${getShiftColor(nurse.shift)} bg-transparent`}
                      >
                        {shifts.map(shift => (
                          <option key={shift} value={shift} className="bg-white">
                            {shift.charAt(0).toUpperCase() + shift.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedNurse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedNurse(null)}>
          <div className="bg-white rounded-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 text-xl font-semibold">
                  {selectedNurse.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedNurse.name}</h3>
                  <p className="text-slate-500">{getDepartmentLabel(selectedNurse.department)}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium">{selectedNurse.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-medium">{selectedNurse.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Current Shift</p>
                  <span className={`badge ${getShiftColor(selectedNurse.shift)}`}>
                    {selectedNurse.shift.charAt(0).toUpperCase() + selectedNurse.shift.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <span className={`badge ${selectedNurse.status === 'on-duty' ? 'badge-success' : selectedNurse.status === 'available' ? 'badge-info' : 'badge-neutral'}`}>
                    {selectedNurse.status}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">Assigned Patients</p>
                <p className="text-2xl font-bold">{selectedNurse.assignedPatients}</p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-2 justify-end">
              <button className="btn btn-secondary" onClick={() => setSelectedNurse(null)}>Close</button>
              <button className="btn btn-primary">Edit Profile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
