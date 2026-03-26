"use client";

import { useState } from "react";
import { useEHR } from "@/lib/ehr-context";
import { Nurse, ShiftType, Department } from "@/lib/ehr-data";

const generateId = () => `A${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function NursingAdmin() {
  const { nurses, patients, updateNurse, addActivity, incidentReports, updateIncidentReport, prescriptions, labOrders } = useEHR();
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);
  const [activeTab, setActiveTab] = useState<'roster' | 'schedule' | 'incidents' | 'census'>('roster');
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

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

  const censusData = {
    opd: {
      totalVisits: patients.filter(p => p.department === 'opd').length,
      waiting: patients.filter(p => p.department === 'opd' && p.status === 'waiting').length,
      inTreatment: patients.filter(p => p.department === 'opd' && p.status === 'in-treatment').length,
      completed: patients.filter(p => p.department === 'opd' && p.status === 'discharged').length,
    },
    er: {
      totalVisits: patients.filter(p => p.department === 'er').length,
      critical: patients.filter(p => p.department === 'er' && p.status === 'critical').length,
      stable: patients.filter(p => p.department === 'er' && p.status === 'stable').length,
      waiting: patients.filter(p => p.department === 'er' && p.status === 'waiting').length,
      inTreatment: patients.filter(p => p.department === 'er' && p.status === 'in-treatment').length,
      mortality: 0,
    },
    pharmacy: {
      totalPrescriptions: prescriptions.length,
      pending: prescriptions.filter(p => p.status === 'pending').length,
      dispensed: prescriptions.filter(p => p.status === 'dispensed').length,
    },
    lab: {
      totalOrders: labOrders.length,
      pending: labOrders.filter(o => o.status === 'pending').length,
      inProgress: labOrders.filter(o => o.status === 'in-progress').length,
      completed: labOrders.filter(o => o.status === 'completed').length,
    },
    nursing: {
      totalStaff: nurses.length,
      onDuty: nurses.filter(n => n.status === 'on-duty').length,
      available: nurses.filter(n => n.status === 'available').length,
      offDuty: nurses.filter(n => n.status === 'off-duty').length,
    },
    incidents: {
      total: incidentReports.length,
      pending: incidentReports.filter(r => r.status === 'pending').length,
      reviewed: incidentReports.filter(r => r.status === 'reviewed').length,
      resolved: incidentReports.filter(r => r.status === 'resolved').length,
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
          Schedule
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'incidents' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Incident Reports
          {incidentReports.filter(r => r.status === 'pending').length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {incidentReports.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('census')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'census' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Census
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

      {activeTab === 'incidents' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Incident Reports</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedIncident(null)}
                className={`px-3 py-1.5 rounded-lg text-sm ${!selectedIncident ? 'bg-teal-600 text-white' : 'bg-slate-100'}`}
              >
                All ({incidentReports.length})
              </button>
              <button
                onClick={() => setSelectedIncident({ status: 'pending' })}
                className={`px-3 py-1.5 rounded-lg text-sm ${selectedIncident?.status === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-100'}`}
              >
                Pending ({incidentReports.filter(r => r.status === 'pending').length})
              </button>
              <button
                onClick={() => setSelectedIncident({ status: 'reviewed' })}
                className={`px-3 py-1.5 rounded-lg text-sm ${selectedIncident?.status === 'reviewed' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}
              >
                Reviewed ({incidentReports.filter(r => r.status === 'reviewed').length})
              </button>
              <button
                onClick={() => setSelectedIncident({ status: 'resolved' })}
                className={`px-3 py-1.5 rounded-lg text-sm ${selectedIncident?.status === 'resolved' ? 'bg-green-600 text-white' : 'bg-slate-100'}`}
              >
                Resolved ({incidentReports.filter(r => r.status === 'resolved').length})
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {(selectedIncident?.status 
              ? incidentReports.filter(r => r.status === selectedIncident.status) 
              : incidentReports).map((report) => (
              <div key={report.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        report.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        report.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </span>
                      <span className="text-sm text-slate-500">{report.incidentType.replace('-', ' ')}</span>
                    </div>
                    <p className="font-medium">{report.description}</p>
                    <div className="text-sm text-slate-500">
                      <span>Reported by: {report.reportedBy}</span>
                      <span className="mx-2">|</span>
                      <span>{report.incidentDate} at {report.incidentTime}</span>
                      <span className="mx-2">|</span>
                      <span>Location: {report.incidentLocation}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedIncident(report)}
                    className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700"
                  >
                    Review
                  </button>
                </div>
              </div>
            ))}
            {incidentReports.length === 0 && (
              <div className="card p-8 text-center text-slate-500">
                No incident reports found.
              </div>
            )}
          </div>
        </div>
      )}

      {selectedIncident && typeof selectedIncident === 'object' && !selectedIncident.status && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Review Incident Report</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Reported By</p>
                  <p className="font-medium">{selectedIncident.reportedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Department</p>
                  <p className="font-medium">{selectedIncident.reporterDepartment}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Date & Time</p>
                  <p className="font-medium">{selectedIncident.incidentDate} at {selectedIncident.incidentTime}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Type</p>
                  <p className="font-medium">{selectedIncident.incidentType.replace('-', ' ')}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">Location</p>
                  <p className="font-medium">{selectedIncident.incidentLocation}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">Description</p>
                  <p className="font-medium">{selectedIncident.description}</p>
                </div>
                {selectedIncident.personsInvolved && (
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500">Persons Involved</p>
                    <p className="font-medium">{selectedIncident.personsInvolved}</p>
                  </div>
                )}
                {selectedIncident.actionsTaken && (
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500">Actions Taken</p>
                    <p className="font-medium">{selectedIncident.actionsTaken}</p>
                  </div>
                )}
              </div>
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Review Notes</label>
                <textarea
                  id="reviewNotes"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  rows={3}
                  placeholder="Add review notes..."
                />
              </div>
            </div>
            <div className="p-6 border-t flex gap-2 justify-end">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const notes = (document.getElementById('reviewNotes') as HTMLTextAreaElement)?.value;
                  updateIncidentReport({ ...selectedIncident, status: 'reviewed', reviewedBy: 'Nursing Admin', reviewNotes: notes });
                  setSelectedIncident(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Mark as Reviewed
              </button>
              <button
                onClick={() => {
                  const notes = (document.getElementById('reviewNotes') as HTMLTextAreaElement)?.value;
                  updateIncidentReport({ ...selectedIncident, status: 'resolved', reviewedBy: 'Nursing Admin', reviewNotes: notes });
                  setSelectedIncident(null);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'census' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Hospital Census</h3>
            <p className="text-sm text-slate-500">Current date: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Outpatient (OPD)</h4>
                  <p className="text-xs text-slate-500">Department</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{censusData.opd.totalVisits}</p>
                  <p className="text-xs text-slate-500">Total Visits</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">{censusData.opd.waiting}</p>
                  <p className="text-xs text-slate-500">Waiting</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{censusData.opd.inTreatment}</p>
                  <p className="text-xs text-slate-500">In Treatment</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{censusData.opd.completed}</p>
                  <p className="text-xs text-slate-500">Completed</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Emergency Room (ER)</h4>
                  <p className="text-xs text-slate-500">Department</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{censusData.er.totalVisits}</p>
                  <p className="text-xs text-slate-500">Total Visits</p>
                </div>
                <div className="text-center p-3 bg-red-100 rounded-lg">
                  <p className="text-2xl font-bold text-red-700">{censusData.er.critical}</p>
                  <p className="text-xs text-slate-500">Critical</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{censusData.er.stable}</p>
                  <p className="text-xs text-slate-500">Stable</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">{censusData.er.waiting}</p>
                  <p className="text-xs text-slate-500">Waiting</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-slate-100 rounded-lg text-center">
                <p className="text-sm text-slate-600">
                  Mortality Rate: <span className="font-bold">{censusData.er.mortality}%</span>
                </p>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.5 20.5L3.5 13.5C2.12 12.12 2.12 9.88 3.5 8.5L8.5 3.5C9.88 2.12 12.12 2.12 13.5 3.5L20.5 10.5C21.88 11.88 21.88 14.12 20.5 15.5L15.5 20.5C14.12 21.88 11.88 21.88 10.5 20.5Z"></path>
                    <line x1="8.5" y1="8.5" x2="15.5" y2="15.5"></line>
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Pharmacy</h4>
                  <p className="text-xs text-slate-500">Department</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{censusData.pharmacy.totalPrescriptions}</p>
                  <p className="text-xs text-slate-500">Total Rx</p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">{censusData.pharmacy.pending}</p>
                  <p className="text-xs text-slate-500">Pending</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg col-span-2">
                  <p className="text-2xl font-bold text-green-600">{censusData.pharmacy.dispensed}</p>
                  <p className="text-xs text-slate-500">Dispensed</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 3h6v6l5 9H4l5-9V3z"></path>
                    <line x1="9" y1="3" x2="15" y2="3"></line>
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Laboratory</h4>
                  <p className="text-xs text-slate-500">Department</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">{censusData.lab.totalOrders}</p>
                  <p className="text-xs text-slate-500">Total Orders</p>
                </div>
                <div className="text-center p-3 bg-amber-100 rounded-lg">
                  <p className="text-2xl font-bold text-amber-700">{censusData.lab.pending}</p>
                  <p className="text-xs text-slate-500">Pending</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{censusData.lab.inProgress}</p>
                  <p className="text-xs text-slate-500">In Progress</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{censusData.lab.completed}</p>
                  <p className="text-xs text-slate-500">Completed</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Nursing Staff</h4>
                  <p className="text-xs text-slate-500">Utilization</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-teal-600">{censusData.nursing.totalStaff}</p>
                  <p className="text-xs text-slate-500">Total Staff</p>
                </div>
                <div className="text-center p-3 bg-green-100 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">{censusData.nursing.onDuty}</p>
                  <p className="text-xs text-slate-500">On Duty</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{censusData.nursing.available}</p>
                  <p className="text-xs text-slate-500">Available</p>
                </div>
                <div className="text-center p-3 bg-slate-100 rounded-lg">
                  <p className="text-2xl font-bold text-slate-600">{censusData.nursing.offDuty}</p>
                  <p className="text-xs text-slate-500">Off Duty</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-teal-50 rounded-lg text-center">
                <p className="text-sm text-teal-700">
                  Utilization: <span className="font-bold">{Math.round((censusData.nursing.onDuty / censusData.nursing.totalStaff) * 100)}%</span>
                </p>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Incident Reports</h4>
                  <p className="text-xs text-slate-500">Summary</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{censusData.incidents.total}</p>
                  <p className="text-xs text-slate-500">Total Reports</p>
                </div>
                <div className="text-center p-3 bg-amber-100 rounded-lg">
                  <p className="text-2xl font-bold text-amber-700">{censusData.incidents.pending}</p>
                  <p className="text-xs text-slate-500">Pending</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{censusData.incidents.reviewed}</p>
                  <p className="text-xs text-slate-500">Reviewed</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{censusData.incidents.resolved}</p>
                  <p className="text-xs text-slate-500">Resolved</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h4 className="font-semibold text-slate-800 mb-4">Department Summary</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Department</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Total</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Active</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Pending</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Completed</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Critical</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 px-4 text-sm font-medium">Outpatient (OPD)</td>
                    <td className="py-3 px-4 text-sm text-center">{censusData.opd.totalVisits}</td>
                    <td className="py-3 px-4 text-sm text-center">{censusData.opd.inTreatment}</td>
                    <td className="py-3 px-4 text-sm text-center">{censusData.opd.waiting}</td>
                    <td className="py-3 px-4 text-sm text-center">{censusData.opd.completed}</td>
                    <td className="py-3 px-4 text-sm text-center">-</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 px-4 text-sm font-medium">Emergency Room (ER)</td>
                    <td className="py-3 px-4 text-sm text-center">{censusData.er.totalVisits}</td>
                    <td className="py-3 px-4 text-sm text-center">{censusData.er.inTreatment + censusData.er.stable}</td>
                    <td className="py-3 px-4 text-sm text-center">{censusData.er.waiting}</td>
                    <td className="py-3 px-4 text-sm text-center">-</td>
                    <td className="py-3 px-4 text-sm text-center text-red-600 font-semibold">{censusData.er.critical}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 px-4 text-sm font-medium">Pharmacy</td>
                    <td className="py-3 px-4 text-sm text-center">{censusData.pharmacy.totalPrescriptions}</td>
                    <td className="py-3 px-4 text-sm text-center">{censusData.pharmacy.dispensed}</td>
                    <td className="py-3 px-4 text-sm text-center">{censusData.pharmacy.pending}</td>
                    <td className="py-3 px-4 text-sm text-center">-</td>
                    <td className="py-3 px-4 text-sm text-center">-</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 px-4 text-sm font-medium">Laboratory</td>
                    <td className="py-3 px-4 text-sm text-center">{censusData.lab.totalOrders}</td>
                    <td className="py-3 px-4 text-sm text-center">{censusData.lab.inProgress}</td>
                    <td className="py-3 px-4 text-sm text-center">{censusData.lab.pending}</td>
                    <td className="py-3 px-4 text-sm text-center">{censusData.lab.completed}</td>
                    <td className="py-3 px-4 text-sm text-center">-</td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <td className="py-3 px-4 text-sm font-bold">Total</td>
                    <td className="py-3 px-4 text-sm text-center font-bold">
                      {censusData.opd.totalVisits + censusData.er.totalVisits + censusData.pharmacy.totalPrescriptions + censusData.lab.totalOrders}
                    </td>
                    <td className="py-3 px-4 text-sm text-center font-bold">
                      {censusData.opd.inTreatment + censusData.er.inTreatment + censusData.er.stable + censusData.pharmacy.dispensed + censusData.lab.inProgress}
                    </td>
                    <td className="py-3 px-4 text-sm text-center font-bold">
                      {censusData.opd.waiting + censusData.er.waiting + censusData.pharmacy.pending + censusData.lab.pending}
                    </td>
                    <td className="py-3 px-4 text-sm text-center font-bold">
                      {censusData.opd.completed + censusData.lab.completed}
                    </td>
                    <td className="py-3 px-4 text-sm text-center font-bold text-red-600">{censusData.er.critical}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
