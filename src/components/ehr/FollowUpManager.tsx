"use client";

import { useState, useMemo } from "react";
import { useEHR } from "@/lib/ehr-context";
import { useAuth } from "@/lib/auth-context";
import { Patient, FollowUp, Department } from "@/lib/ehr-data";

const generateId = () => `FU${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function FollowUpManager() {
  const { patients, addFollowUp, updateFollowUp } = useEHR();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [followUpForm, setFollowUpForm] = useState({
    date: "",
    time: "",
    department: "opd" as Department,
    reason: "",
    notes: ""
  });

  const allFollowUps = useMemo(() => {
    return patients.flatMap(p => 
      (p.followUps || []).map(f => ({ ...f, patientName: p.name }))
    ).sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }, [patients]);

  const upcomingFollowUps = allFollowUps.filter(f => 
    f.status === 'scheduled' && new Date(f.scheduledDate) >= new Date()
  );
  
  const overdueFollowUps = allFollowUps.filter(f => 
    f.status === 'scheduled' && new Date(f.scheduledDate) < new Date()
  );

  const completedFollowUps = allFollowUps.filter(f => f.status === 'completed');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !followUpForm.date || !followUpForm.time || !followUpForm.reason) return;

    const userName = user && 'name' in user ? user.name : 'Staff';
    const newFollowUp: FollowUp = {
      id: generateId(),
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      scheduledDate: followUpForm.date,
      scheduledTime: followUpForm.time,
      department: followUpForm.department,
      doctorName: userName,
      reason: followUpForm.reason,
      status: 'scheduled',
      notes: followUpForm.notes
    };

    addFollowUp(newFollowUp);
    setShowModal(false);
    setSelectedPatient(null);
    setFollowUpForm({ date: "", time: "", department: "opd", reason: "", notes: "" });
  };

  const handleComplete = (followUp: FollowUp) => {
    updateFollowUp({
      ...followUp,
      status: 'completed',
      completedAt: new Date().toISOString()
    });
  };

  const handleNoShow = (followUp: FollowUp) => {
    updateFollowUp({
      ...followUp,
      status: 'no-show'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-gray-100 text-gray-700';
      case 'no-show': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h3 className="font-semibold text-slate-800">Follow-up Management</h3>
          <p className="text-sm text-slate-500">{upcomingFollowUps.length} upcoming, {overdueFollowUps.length} overdue</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
        >
          Schedule Follow-up
        </button>
      </div>

      {overdueFollowUps.length > 0 && (
        <div className="p-4 bg-red-50 border-b border-red-100">
          <p className="text-sm font-medium text-red-700">
            ⚠️ {overdueFollowUps.length} overdue follow-up(s) require attention
          </p>
        </div>
      )}

      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {allFollowUps.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No follow-ups scheduled</p>
        ) : (
          <div className="space-y-3">
            {allFollowUps.slice(0, 20).map((followUp) => (
              <div key={followUp.id} className={`p-4 rounded-lg border ${
                followUp.status === 'scheduled' && new Date(followUp.scheduledDate) < new Date() 
                  ? 'border-red-200 bg-red-50' 
                  : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div>
                    <p className="font-medium text-slate-800">{followUp.patientName}</p>
                    <p className="text-sm text-slate-600">{followUp.reason}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                      <span>📅 {formatDate(followUp.scheduledDate)} at {followUp.scheduledTime}</span>
                      <span>🏥 {followUp.department}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(followUp.status)}`}>
                      {followUp.status}
                    </span>
                    {followUp.status === 'scheduled' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleComplete(followUp)}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleNoShow(followUp)}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          No Show
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Schedule Follow-up</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Patient</label>
                <select
                  required
                  value={selectedPatient?.id || ""}
                  onChange={(e) => {
                    const patient = patients.find(p => p.id === e.target.value);
                    setSelectedPatient(patient || null);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">Select patient</option>
                  {patients.filter(p => p.registrationStatus === 'confirmed').map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <select
                  value={followUpForm.department}
                  onChange={(e) => setFollowUpForm({...followUpForm, department: e.target.value as Department})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="opd">Outpatient Department</option>
                  <option value="er">Emergency Room</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={followUpForm.date}
                    onChange={(e) => setFollowUpForm({...followUpForm, date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                  <select
                    required
                    value={followUpForm.time}
                    onChange={(e) => setFollowUpForm({...followUpForm, time: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                <input
                  type="text"
                  required
                  value={followUpForm.reason}
                  onChange={(e) => setFollowUpForm({...followUpForm, reason: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Reason for follow-up"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={followUpForm.notes}
                  onChange={(e) => setFollowUpForm({...followUpForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  rows={2}
                  placeholder="Additional notes"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}