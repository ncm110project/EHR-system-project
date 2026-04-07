"use client";

import { useState } from "react";
import { useEHR } from "@/lib/ehr-context";
import { useAuth } from "@/lib/auth-context";
import { Patient, TriagePriority, VitalSigns } from "@/lib/ehr-data";

const generateId = () => `A${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const triageCategories = [
  { id: 'cardiac', label: 'Cardiac / Chest Pain' },
  { id: 'respiratory', label: 'Respiratory / Breathing' },
  { id: 'neurological', label: 'Neurological / Consciousness' },
  { id: 'trauma', label: 'Trauma / Injury' },
  { id: 'gi', label: 'GI / Abdominal' },
  { id: 'musculoskeletal', label: 'Musculoskeletal / Pain' },
  { id: 'psychiatric', label: 'Psychiatric / Mental Health' },
  { id: 'obgyn', label: 'OB/GYN' },
  { id: 'pediatric', label: 'Pediatric' },
  { id: 'other', label: 'Other' },
];

export function TriageDepartment() {
  const { user } = useAuth();
  const { patients, updatePatient, addActivity, medications } = useEHR();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showTriageForm, setShowTriageForm] = useState(false);
  
  const isNurse = !!(user && 'role' in user && user.role === 'nurse');

  const pendingTriagePatients = patients.filter(p => 
    p.department === 'registration' && p.triageStatus !== 'triaged'
  );
  
  const triagedPatients = patients.filter(p => 
    p.triageStatus === 'triaged'
  );

  const sortedByArrival = [...pendingTriagePatients].sort((a, b) => 
    new Date(a.admissionDate).getTime() - new Date(b.admissionDate).getTime()
  );

  const [triageForm, setTriageForm] = useState({
    category: '',
    chiefComplaint: '',
    painScore: 5,
    bloodPressure: '',
    heartRate: 0,
    temperature: 0,
    respiratoryRate: 0,
    oxygenSaturation: 0,
    priority: undefined as TriagePriority | undefined,
    destination: '' as 'er' | 'opd' | 'discharge' | '',
    name: '',
    age: 0,
    gender: 'Male' as 'Male' | 'Female',
    phone: '',
    address: ''
  });

  const [isEditingDemographics, setIsEditingDemographics] = useState(false);

  const resetTriageForm = () => {
    setTriageForm({
      category: '',
      chiefComplaint: '',
      painScore: 5,
      bloodPressure: '',
      heartRate: 0,
      temperature: 0,
      respiratoryRate: 0,
      oxygenSaturation: 0,
      priority: undefined,
      destination: '',
      name: '',
      age: 0,
      gender: 'Male',
      phone: '',
      address: ''
    });
    setIsEditingDemographics(false);
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowTriageForm(true);
    setTriageForm({
      category: '',
      chiefComplaint: patient.chiefComplaint || '',
      painScore: 5,
      bloodPressure: '',
      heartRate: 0,
      temperature: 0,
      respiratoryRate: 0,
      oxygenSaturation: 0,
      priority: undefined,
      destination: '',
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      address: patient.address
    });
    setIsEditingDemographics(false);
  };

  const handleSubmitTriage = () => {
    if (!selectedPatient || !triageForm.priority || !triageForm.destination) return;

    const now = new Date().toISOString();
    const nurseName = user?.name || 'Triage Nurse';

    const vitals: VitalSigns = {
      bloodPressure: triageForm.bloodPressure || '-',
      heartRate: triageForm.heartRate,
      temperature: triageForm.temperature,
      respiratoryRate: triageForm.respiratoryRate,
      oxygenSaturation: triageForm.oxygenSaturation,
      recordedAt: now
    };

    const updatedPatient: Patient = {
      ...selectedPatient,
      name: triageForm.name || selectedPatient.name,
      age: triageForm.age || selectedPatient.age,
      gender: triageForm.gender || selectedPatient.gender,
      phone: triageForm.phone || selectedPatient.phone,
      address: triageForm.address || selectedPatient.address,
      triageStatus: 'triaged',
      triagePriority: triageForm.priority,
      chiefComplaint: triageForm.chiefComplaint || selectedPatient.chiefComplaint || '',
      vitalSigns: vitals,
      status: triageForm.priority <= 2 ? 'critical' : 'waiting'
    };

    updatePatient(updatedPatient);

    if (triageForm.destination === 'er') {
      updatePatient({ ...updatedPatient, department: 'er' });
    } else if (triageForm.destination === 'opd') {
      updatePatient({ ...updatedPatient, department: 'opd' });
    } else if (triageForm.destination === 'discharge') {
      updatePatient({ ...updatedPatient, department: 'opd', status: 'discharged' });
    }

    addActivity({
      id: generateId(),
      type: 'triage',
      department: 'triage',
      patientId: selectedPatient.id,
      patientName: triageForm.name || selectedPatient.name,
      description: `Triaged: Priority ${triageForm.priority} - ${triageForm.destination.toUpperCase()} - Pain: ${triageForm.painScore}/10`,
      timestamp: now
    });

    setShowTriageForm(false);
    setSelectedPatient(null);
    resetTriageForm();
  };

  const autoAssignPriority = () => {
    const pain = triageForm.painScore;
    const bp = triageForm.bloodPressure;
    const hr = triageForm.heartRate;
    const spo2 = triageForm.oxygenSaturation;
    const temp = triageForm.temperature;

    let priority: TriagePriority;
    let destination: 'er' | 'opd' | 'discharge' = 'opd';

    if (bp && (parseInt(bp.split('/')[0]) < 90 || parseInt(bp.split('/')[0]) > 200)) {
      priority = 1;
      destination = 'er';
    } else if (spo2 < 90 || hr > 120 || hr < 50) {
      priority = 1;
      destination = 'er';
    } else if (temp > 39 || temp < 35) {
      priority = 2;
      destination = 'er';
    } else if (pain >= 8) {
      priority = 2;
      destination = 'er';
    } else if (pain >= 5) {
      priority = 3;
      destination = 'opd';
    } else {
      priority = 4;
      destination = 'opd';
    }

    setTriageForm({ ...triageForm, priority, destination });
  };

  const getPriorityColor = (priority?: number) => {
    if (!priority) return 'bg-slate-100';
    switch (priority) {
      case 1: return 'bg-red-600';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-green-500';
      case 5: return 'bg-blue-500';
      default: return 'bg-slate-100';
    }
  };

  const getPriorityLabel = (priority?: number) => {
    if (!priority) return 'Not Assigned';
    const labels: Record<number, string> = {
      1: 'Resuscitation',
      2: 'Emergency',
      3: 'Urgent',
      4: 'Less Urgent',
      5: 'Non-Urgent'
    };
    return labels[priority] || 'Unknown';
  };

  const getWaitTime = (admissionDate: string) => {
    const now = new Date();
    const arrival = new Date(admissionDate);
    const diff = now.getTime() - arrival.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Triage Station</h2>
          <p className="text-slate-500">Assess patients and assign priority</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="text-amber-700 font-semibold">{pendingTriagePatients.length}</span>
            <span className="text-amber-600 ml-1">Pending Triage</span>
          </div>
          <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-green-700 font-semibold">{triagedPatients.length}</span>
            <span className="text-green-600 ml-1">Triaged Today</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="p-4 border-b border-slate-200 bg-amber-50">
              <h3 className="font-semibold text-amber-800">Pending Triage Queue</h3>
            </div>
            <div className="divide-y divide-slate-200">
              {sortedByArrival.length > 0 ? (
                sortedByArrival.map((patient) => (
                  <div key={patient.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                          <span className="text-slate-600 font-bold">
                            {patient.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold">{patient.name}</p>
                          <p className="text-sm text-slate-500">
                            {patient.age}y • {patient.gender} • {patient.id}
                          </p>
                          <p className="text-xs text-slate-400">
                            Arrived: {getWaitTime(patient.admissionDate)} ago
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-700">
                          {patient.chiefComplaint || 'No complaint'}
                        </p>
                        <button 
                          className="mt-2 btn btn-primary text-sm"
                          onClick={() => handleSelectPatient(patient)}
                        >
                          Start Triage
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  No patients pending triage
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="font-semibold mb-3">Triage Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Avg Wait Time</span>
                <span className="font-semibold text-slate-800">
                  {pendingTriagePatients.length > 0 
                    ? `${Math.floor(pendingTriagePatients.length * 3)} min`
                    : '0 min'}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '30%' }}></div>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold mb-3">Priority Legend</h3>
            <div className="space-y-2">
              {[
                { p: 1, label: 'Resuscitation', color: 'bg-red-600' },
                { p: 2, label: 'Emergency', color: 'bg-orange-500' },
                { p: 3, label: 'Urgent', color: 'bg-yellow-500' },
                { p: 4, label: 'Less Urgent', color: 'bg-green-500' },
                { p: 5, label: 'Non-Urgent', color: 'bg-blue-500' },
              ].map(({ p, label, color }) => (
                <div key={p} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${color}`}></div>
                  <span className="text-sm">Priority {p}: {label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full p-2 text-left text-sm bg-red-50 text-red-700 rounded hover:bg-red-100">
                🔔 Code Blue Alert
              </button>
              <button className="w-full p-2 text-left text-sm bg-orange-50 text-orange-700 rounded hover:bg-orange-100">
                🚨 Mass Casualty
              </button>
            </div>
          </div>
        </div>
      </div>

      {showTriageForm && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[95vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold">Triage Assessment</h3>
              <p className="text-slate-500">{selectedPatient.name} • {selectedPatient.age}y • {selectedPatient.gender}</p>
            </div>
            <div className="p-6 space-y-6">
              {!isEditingDemographics ? (
                <div className="p-4 bg-slate-50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium">{triageForm.name}</p>
                    <p className="text-sm text-slate-500">{triageForm.age}y • {triageForm.gender} • {triageForm.phone}</p>
                    <p className="text-xs text-slate-400">{triageForm.address}</p>
                  </div>
                  <button
                    onClick={() => setIsEditingDemographics(true)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    ✏️ Edit
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                  <h4 className="font-medium text-slate-700">Patient Demographics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={triageForm.name}
                        onChange={(e) => setTriageForm({ ...triageForm, name: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Age</label>
                      <input
                        type="number"
                        value={triageForm.age || ''}
                        onChange={(e) => setTriageForm({ ...triageForm, age: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Gender</label>
                      <select
                        value={triageForm.gender}
                        onChange={(e) => setTriageForm({ ...triageForm, gender: e.target.value as 'Male' | 'Female' })}
                        className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Phone</label>
                      <input
                        type="text"
                        value={triageForm.phone}
                        onChange={(e) => setTriageForm({ ...triageForm, phone: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-slate-500 mb-1">Address</label>
                      <input
                        type="text"
                        value={triageForm.address}
                        onChange={(e) => setTriageForm({ ...triageForm, address: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditingDemographics(false)}
                    className="text-sm text-slate-600 hover:text-slate-800"
                  >
                    Done editing
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Chief Complaint Category</label>
                <select
                  value={triageForm.category}
                  onChange={(e) => setTriageForm({ ...triageForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Select Category</option>
                  {triageCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Chief Complaint Details</label>
                <textarea
                  value={triageForm.chiefComplaint}
                  onChange={(e) => setTriageForm({ ...triageForm, chiefComplaint: e.target.value })}
                  placeholder="Describe patient's main complaint..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Pain Score: <span className={`font-bold ${triageForm.painScore >= 7 ? 'text-red-600' : triageForm.painScore >= 4 ? 'text-orange-500' : 'text-green-600'}`}>
                    {triageForm.painScore}/10
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={triageForm.painScore}
                  onChange={(e) => setTriageForm({ ...triageForm, painScore: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>No Pain</span>
                  <span>Severe Pain</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-semibold mb-3">Vital Signs</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Blood Pressure</label>
                    <input
                      type="text"
                      placeholder="e.g., 120/80"
                      value={triageForm.bloodPressure}
                      onChange={(e) => setTriageForm({ ...triageForm, bloodPressure: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Heart Rate (bpm)</label>
                    <input
                      type="number"
                      placeholder="e.g., 72"
                      value={triageForm.heartRate || ''}
                      onChange={(e) => setTriageForm({ ...triageForm, heartRate: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Temperature (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 36.5"
                      value={triageForm.temperature || ''}
                      onChange={(e) => setTriageForm({ ...triageForm, temperature: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Respiratory Rate</label>
                    <input
                      type="number"
                      placeholder="e.g., 16"
                      value={triageForm.respiratoryRate || ''}
                      onChange={(e) => setTriageForm({ ...triageForm, respiratoryRate: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-slate-500 mb-1">SpO2 (%)</label>
                    <input
                      type="number"
                      placeholder="e.g., 98"
                      value={triageForm.oxygenSaturation || ''}
                      onChange={(e) => setTriageForm({ ...triageForm, oxygenSaturation: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <button
                  onClick={autoAssignPriority}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  ⚡ Auto-assign Priority based on vitals
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ESI Priority</label>
                  <select
                    value={triageForm.priority || ''}
                    onChange={(e) => setTriageForm({ ...triageForm, priority: parseInt(e.target.value) as TriagePriority })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Select Priority</option>
                    {[1, 2, 3, 4, 5].map(p => (
                      <option key={p} value={p}>
                        Priority {p} - {getPriorityLabel(p)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Destination</label>
                  <select
                    value={triageForm.destination}
                    onChange={(e) => setTriageForm({ ...triageForm, destination: e.target.value as 'er' | 'opd' | 'discharge' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="">Select Destination</option>
                    <option value="er">🚑 Emergency Room</option>
                    <option value="opd">🏥 Outpatient Department</option>
                    <option value="discharge">🏠 Discharge / Home</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowTriageForm(false); setSelectedPatient(null); resetTriageForm(); }}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitTriage}
                  disabled={!triageForm.priority || !triageForm.destination}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Triage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}