"use client";

import { useState } from "react";
import { useEHR } from "@/lib/ehr-context";
import { Nurse, ShiftType, Department } from "@/lib/ehr-data";
import { useAuth } from "@/lib/auth-context";

const generateId = () => `A${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

type TimePeriod = 'weekly' | 'monthly' | 'yearly';

export function NursingAdmin() {
  const { nurses, patients, updateNurse, addActivity, incidentReports, updateIncidentReport, prescriptions, labOrders } = useEHR();
  const { user } = useAuth();
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);
  const [activeTab, setActiveTab] = useState<'roster' | 'schedule' | 'incidents' | 'statistics'>('roster');
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');

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

  const filterByTimePeriod = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    switch (timePeriod) {
      case 'weekly':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      case 'monthly':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return date >= monthAgo;
      case 'yearly':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        return date >= yearAgo;
      default:
        return true;
    }
  };

  const filteredPatients = patients.filter(p => filterByTimePeriod(p.admissionDate));
  const filteredIncidents = incidentReports.filter(r => filterByTimePeriod(r.createdAt));

  const allergyNames = ['Peanuts', 'Tree Nuts', 'Shellfish', 'Fish', 'Eggs', 'Dairy', 'Soy', 'Gluten', 'Pollen', 'Latex', 'Dust Mites'];
  const allergyCounts = allergyNames.map(allergy => ({
    name: allergy,
    count: filteredPatients.filter(p => p.allergies.some(a => a.toLowerCase().includes(allergy.toLowerCase()))).length
  }));

  const conditionNames = ['Hypertension', 'Diabetes', 'Asthma', 'Heart Disease', 'Kidney Disease', 'Stroke', 'Cancer', 'Tuberculosis', 'Arthritis', 'Thyroid Disorder', 'Epilepsy', 'Chronic Lung Disease'];
  const conditionCounts = conditionNames.map(condition => ({
    name: condition,
    count: filteredPatients.filter(p => {
      const notes = p.notes || '';
      return notes.includes(condition);
    }).length
  }));

  const insuredCount = filteredPatients.filter(p => {
    const notes = p.notes || '';
    return notes.includes('Insurance:') && !notes.includes('Self Pay');
  }).length;
  const selfPayCount = filteredPatients.filter(p => {
    const notes = p.notes || '';
    return notes.includes('Self Pay');
  }).length;

  const incidentTypeCounts = {
    'patient-fall': filteredIncidents.filter(r => r.incidentType === 'patient-fall').length,
    'medication-error': filteredIncidents.filter(r => r.incidentType === 'medication-error').length,
    'equipment-failure': filteredIncidents.filter(r => r.incidentType === 'equipment-failure').length,
    'worker-injury': filteredIncidents.filter(r => r.incidentType === 'worker-injury').length,
    'near-miss': filteredIncidents.filter(r => r.incidentType === 'near-miss').length,
    'other': filteredIncidents.filter(r => r.incidentType === 'other').length,
  };

  const incidentByDept = {
    er: filteredIncidents.filter(r => r.reporterDepartment === 'er').length,
    opd: filteredIncidents.filter(r => r.reporterDepartment === 'opd').length,
    lab: filteredIncidents.filter(r => r.reporterDepartment === 'lab').length,
    pharmacy: filteredIncidents.filter(r => r.reporterDepartment === 'pharmacy').length,
    nursing: filteredIncidents.filter(r => r.reporterDepartment === 'nursing').length,
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
          onClick={() => setActiveTab('statistics')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'statistics' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Statistics
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

      {activeTab === 'statistics' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Hospital Statistics</h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">Filter by:</span>
              <div className="flex gap-2">
                {(['weekly', 'monthly', 'yearly'] as TimePeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimePeriod(period)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      timePeriod === period
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card p-6">
              <h4 className="font-semibold text-slate-800 mb-6">Outpatient Department (OPD)</h4>
              <div className="space-y-4">
                {[
                  { label: 'Total Visits', value: filteredPatients.filter(p => p.department === 'opd').length, color: 'bg-blue-500' },
                  { label: 'Waiting', value: filteredPatients.filter(p => p.department === 'opd' && p.status === 'waiting').length, color: 'bg-amber-500' },
                  { label: 'In Treatment', value: filteredPatients.filter(p => p.department === 'opd' && p.status === 'in-treatment').length, color: 'bg-blue-400' },
                  { label: 'Completed', value: filteredPatients.filter(p => p.department === 'opd' && p.status === 'discharged').length, color: 'bg-green-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">{item.label}</span>
                      <span className="text-sm font-semibold">{item.value}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-4">
                      <div className={`${item.color} h-4 rounded-full`} style={{ width: `${Math.max((item.value / Math.max(filteredPatients.filter(p => p.department === 'opd').length, 1)) * 100, 5)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h4 className="font-semibold text-slate-800 mb-6">Emergency Room (ER)</h4>
              <div className="space-y-4">
                {[
                  { label: 'Total Visits', value: filteredPatients.filter(p => p.department === 'er').length, color: 'bg-red-500' },
                  { label: 'Critical', value: filteredPatients.filter(p => p.department === 'er' && p.status === 'critical').length, color: 'bg-red-700' },
                  { label: 'Stable', value: filteredPatients.filter(p => p.department === 'er' && p.status === 'stable').length, color: 'bg-green-500' },
                  { label: 'Waiting', value: filteredPatients.filter(p => p.department === 'er' && p.status === 'waiting').length, color: 'bg-amber-500' },
                  { label: 'In Treatment', value: filteredPatients.filter(p => p.department === 'er' && p.status === 'in-treatment').length, color: 'bg-blue-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">{item.label}</span>
                      <span className="text-sm font-semibold">{item.value}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-4">
                      <div className={`${item.color} h-4 rounded-full`} style={{ width: `${Math.max((item.value / Math.max(filteredPatients.filter(p => p.department === 'er').length, 1)) * 100, 5)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-red-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-red-800">Mortality Rate</span>
                  <span className="text-xl font-bold text-red-600">{censusData.er.mortality}%</span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h4 className="font-semibold text-slate-800 mb-6">Pharmacy</h4>
              <div className="space-y-4">
                {[
                  { label: 'Total Prescriptions', value: filteredPatients.reduce((acc, p) => acc + (p.prescriptions?.length || 0), 0), color: 'bg-purple-500' },
                  { label: 'Pending', value: prescriptions.filter(p => p.status === 'pending').length, color: 'bg-amber-500' },
                  { label: 'Dispensed', value: prescriptions.filter(p => p.status === 'dispensed').length, color: 'bg-green-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">{item.label}</span>
                      <span className="text-sm font-semibold">{item.value}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-4">
                      <div className={`${item.color} h-4 rounded-full`} style={{ width: `${Math.max((item.value / Math.max(prescriptions.length, 1)) * 100, 5)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h4 className="font-semibold text-slate-800 mb-6">Laboratory</h4>
              <div className="space-y-4">
                {[
                  { label: 'Total Orders', value: filteredPatients.reduce((acc, p) => acc + (p.labOrders?.length || 0), 0), color: 'bg-amber-500' },
                  { label: 'Pending', value: labOrders.filter(o => o.status === 'pending').length, color: 'bg-amber-600' },
                  { label: 'In Progress', value: labOrders.filter(o => o.status === 'in-progress').length, color: 'bg-blue-500' },
                  { label: 'Completed', value: labOrders.filter(o => o.status === 'completed').length, color: 'bg-green-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">{item.label}</span>
                      <span className="text-sm font-semibold">{item.value}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-4">
                      <div className={`${item.color} h-4 rounded-full`} style={{ width: `${Math.max((item.value / Math.max(labOrders.length, 1)) * 100, 5)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h4 className="font-semibold text-slate-800 mb-6">Patient Registration - Allergy Distribution</h4>
            <div className="space-y-3">
              {allergyCounts.filter(a => a.count > 0).sort((a, b) => b.count - a.count).map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-600">{item.name}</span>
                    <span className="text-sm font-semibold">{item.count} patients</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-4">
                    <div className="bg-red-500 h-4 rounded-full" style={{ width: `${Math.max((item.count / Math.max(...allergyCounts.map(a => a.count), 1)) * 100, 5)}%` }}></div>
                  </div>
                </div>
              ))}
              {allergyCounts.filter(a => a.count > 0).length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No allergy data for selected period</p>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h4 className="font-semibold text-slate-800 mb-6">Patient Registration - Medical Conditions</h4>
            <div className="space-y-3">
              {conditionCounts.filter(c => c.count > 0).sort((a, b) => b.count - a.count).map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-600">{item.name}</span>
                    <span className="text-sm font-semibold">{item.count} patients</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-4">
                    <div className="bg-amber-500 h-4 rounded-full" style={{ width: `${Math.max((item.count / Math.max(...conditionCounts.map(c => c.count), 1)) * 100, 5)}%` }}></div>
                  </div>
                </div>
              ))}
              {conditionCounts.filter(c => c.count > 0).length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No medical condition data for selected period</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card p-6">
              <h4 className="font-semibold text-slate-800 mb-6">Patient Registration - Insurance Status</h4>
              <div className="space-y-4">
                {[
                  { label: 'Insured', value: insuredCount, color: 'bg-green-500' },
                  { label: 'Self-Pay', value: selfPayCount, color: 'bg-slate-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">{item.label}</span>
                      <span className="text-sm font-semibold">{item.value} patients</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-4">
                      <div className={`${item.color} h-4 rounded-full`} style={{ width: `${Math.max((item.value / Math.max(insuredCount + selfPayCount, 1)) * 100, 5)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{Math.round((insuredCount / Math.max(insuredCount + selfPayCount, 1)) * 100)}%</p>
                  <p className="text-xs text-slate-500">Insured Rate</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-600">{filteredPatients.length}</p>
                  <p className="text-xs text-slate-500">Total Patients</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h4 className="font-semibold text-slate-800 mb-6">Incident Reports - By Type</h4>
              <div className="space-y-4">
                {[
                  { label: 'Patient Fall', value: incidentTypeCounts['patient-fall'], color: 'bg-red-500' },
                  { label: 'Medication Error', value: incidentTypeCounts['medication-error'], color: 'bg-orange-500' },
                  { label: 'Equipment Failure', value: incidentTypeCounts['equipment-failure'], color: 'bg-amber-500' },
                  { label: 'Worker Injury', value: incidentTypeCounts['worker-injury'], color: 'bg-blue-500' },
                  { label: 'Near Miss', value: incidentTypeCounts['near-miss'], color: 'bg-yellow-500' },
                  { label: 'Other', value: incidentTypeCounts['other'], color: 'bg-slate-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">{item.label}</span>
                      <span className="text-sm font-semibold">{item.value}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-4">
                      <div className={`${item.color} h-4 rounded-full`} style={{ width: `${Math.max((item.value / Math.max(...Object.values(incidentTypeCounts), 1)) * 100, 5)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h4 className="font-semibold text-slate-800 mb-6">Incident Reports - By Department</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                {[
                  { label: 'Emergency Room', value: incidentByDept.er, color: 'bg-red-500' },
                  { label: 'Outpatient (OPD)', value: incidentByDept.opd, color: 'bg-blue-500' },
                  { label: 'Laboratory', value: incidentByDept.lab, color: 'bg-amber-500' },
                  { label: 'Pharmacy', value: incidentByDept.pharmacy, color: 'bg-purple-500' },
                  { label: 'Nursing Admin', value: incidentByDept.nursing, color: 'bg-teal-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600">{item.label}</span>
                      <span className="text-sm font-semibold">{item.value}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-4">
                      <div className={`${item.color} h-4 rounded-full`} style={{ width: `${Math.max((item.value / Math.max(...Object.values(incidentByDept), 1)) * 100, 5)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col justify-center">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <p className="text-3xl font-bold text-slate-800">{filteredIncidents.length}</p>
                    <p className="text-sm text-slate-500">Total Incidents</p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <p className="text-3xl font-bold text-amber-600">{filteredIncidents.filter(r => r.status === 'pending').length}</p>
                    <p className="text-sm text-slate-500">Pending Review</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">{filteredIncidents.filter(r => r.status === 'reviewed').length}</p>
                    <p className="text-sm text-slate-500">Reviewed</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{filteredIncidents.filter(r => r.status === 'resolved').length}</p>
                    <p className="text-sm text-slate-500">Resolved</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
