"use client";

import { useState, useEffect } from "react";
import { useEHR } from "@/lib/ehr-context";
import { useAuth } from "@/lib/auth-context";
import { Patient } from "@/lib/ehr-data";

const generateId = () => `RC${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function RegistrationClerk() {
  const { patients, updatePatient, addActivity, loadPendingPatients } = useEHR();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'rejected'>('pending');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [visitType, setVisitType] = useState<'opd' | 'er'>('opd');

  useEffect(() => {
    loadPendingPatients();
  }, [loadPendingPatients]);

  const pendingRegistrations = patients.filter(p => !p.registrationStatus || p.registrationStatus === 'pending');
  const confirmedRegistrations = patients.filter(p => p.registrationStatus === 'confirmed');
  const rejectedRegistrations = patients.filter(p => p.registrationStatus === 'rejected');

  const getFilteredPatients = () => {
    switch (activeTab) {
      case 'pending': return pendingRegistrations;
      case 'confirmed': return confirmedRegistrations;
      case 'rejected': return rejectedRegistrations;
      default: return pendingRegistrations;
    }
  };

  const handleConfirmRegistration = (patient: Patient) => {
    const updatedPatient: Patient = {
      ...patient,
      registrationStatus: 'confirmed',
      department: visitType,
      status: 'waiting',
      workflowStatus: 'registered',
      admissionDate: new Date().toISOString()
    };
    updatePatient(updatedPatient);
    addActivity({
      id: generateId(),
      type: 'admission',
      department: visitType,
      patientId: patient.id,
      patientName: patient.name,
      description: `Registration confirmed - assigned to ${visitType.toUpperCase()} queue`,
      timestamp: new Date().toISOString()
    });
    setSelectedPatient(null);
  };

  const handleRejectRegistration = (patient: Patient) => {
    const updatedPatient: Patient = {
      ...patient,
      registrationStatus: 'rejected'
    };
    updatePatient(updatedPatient);
    addActivity({
      id: generateId(),
      type: 'admission',
      department: 'registration',
      patientId: patient.id,
      patientName: patient.name,
      description: `Registration rejected`,
      timestamp: new Date().toISOString()
    });
    setSelectedPatient(null);
  };

  const handleEditPatient = (patient: Patient, field: string, value: string) => {
    const updatedPatient: Patient = {
      ...patient,
      [field]: field === 'age' ? parseInt(value) || 0 : value
    };
    updatePatient(updatedPatient);
    setSelectedPatient(updatedPatient);
  };

  const filteredPatients = getFilteredPatients();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Patient Registration</h2>
          <p className="text-slate-500">Review and confirm patient registrations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-2xl font-bold text-amber-600">{pendingRegistrations.length}</p>
            </div>
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Confirmed Today</p>
              <p className="text-2xl font-bold text-green-600">{confirmedRegistrations.length}</p>
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
              <p className="text-sm text-slate-500">Total Patients</p>
              <p className="text-2xl font-bold text-slate-800">{patients.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Pending ({pendingRegistrations.length})
        </button>
        <button
          onClick={() => setActiveTab('confirmed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'confirmed' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Confirmed ({confirmedRegistrations.length})
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'rejected' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Rejected ({rejectedRegistrations.length})
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold">
            {activeTab === 'pending' ? 'Pending Registrations' : activeTab === 'confirmed' ? 'Confirmed Registrations' : 'Rejected Registrations'}
          </h3>
        </div>
        <div className="divide-y divide-slate-200">
          {filteredPatients.map((patient) => (
            <div 
              key={patient.id} 
              className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => setSelectedPatient(patient)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-semibold">
                    {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold">{patient.name}</p>
                    <p className="text-sm text-slate-500">
                      {patient.id} • {patient.age}y • {patient.gender}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{patient.chiefComplaint || 'No reason specified'}</p>
                  <p className="text-xs text-slate-500">
                    Submitted: {new Date(patient.admissionDate).toLocaleString()}
                  </p>
                </div>
              </div>
              {activeTab === 'pending' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPatient(patient);
                    }}
                    className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700"
                  >
                    Review & Confirm
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRejectRegistration(patient);
                    }}
                    className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
          {filteredPatients.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No {activeTab} registrations
            </div>
          )}
        </div>
      </div>

      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedPatient(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Patient Registration Details</h3>
                  <p className="text-slate-500">Review and edit patient information</p>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={selectedPatient.name}
                    onChange={(e) => handleEditPatient(selectedPatient, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    disabled={selectedPatient.registrationStatus === 'confirmed'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={selectedPatient.age}
                    onChange={(e) => handleEditPatient(selectedPatient, 'age', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    disabled={selectedPatient.registrationStatus === 'confirmed'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                  <select
                    value={selectedPatient.gender}
                    onChange={(e) => handleEditPatient(selectedPatient, 'gender', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    disabled={selectedPatient.registrationStatus === 'confirmed'}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={selectedPatient.phone}
                    onChange={(e) => handleEditPatient(selectedPatient, 'phone', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    disabled={selectedPatient.registrationStatus === 'confirmed'}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={selectedPatient.address}
                    onChange={(e) => handleEditPatient(selectedPatient, 'address', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    disabled={selectedPatient.registrationStatus === 'confirmed'}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Visit</label>
                  <textarea
                    value={selectedPatient.chiefComplaint || ''}
                    onChange={(e) => handleEditPatient(selectedPatient, 'chiefComplaint', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    rows={2}
                    disabled={selectedPatient.registrationStatus === 'confirmed'}
                  />
                </div>
              </div>

              {selectedPatient.allergies.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Allergies</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedPatient.allergies.map((allergy, idx) => (
                      <span key={idx} className="px-2 py-1 bg-red-100 text-red-700 text-sm rounded">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedPatient.notes && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Medical History / Notes</label>
                  <p className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">{selectedPatient.notes}</p>
                </div>
              )}

              {(!selectedPatient.registrationStatus || selectedPatient.registrationStatus === 'pending') && (
                <div className="border-t border-slate-200 pt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Assign to Department</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="visitType"
                        value="opd"
                        checked={visitType === 'opd'}
                        onChange={() => setVisitType('opd')}
                        className="w-4 h-4 text-teal-600"
                      />
                      <span className="text-sm">Outpatient (OPD)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="visitType"
                        value="er"
                        checked={visitType === 'er'}
                        onChange={() => setVisitType('er')}
                        className="w-4 h-4 text-teal-600"
                      />
                      <span className="text-sm">Emergency Room (ER)</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                {(!selectedPatient.registrationStatus || selectedPatient.registrationStatus === 'pending') && (
                  <>
                    <button
                      onClick={() => handleRejectRegistration(selectedPatient)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      Reject Registration
                    </button>
                    <button
                      onClick={() => handleConfirmRegistration(selectedPatient)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Confirm Registration
                    </button>
                  </>
                )}
                {selectedPatient.registrationStatus === 'confirmed' && (
                  <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                    ✓ Confirmed - Assigned to {selectedPatient.department.toUpperCase()}
                  </span>
                )}
                {selectedPatient.registrationStatus === 'rejected' && (
                  <span className="px-4 py-2 bg-red-100 text-red-700 rounded-lg">
                    ✗ Rejected
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
