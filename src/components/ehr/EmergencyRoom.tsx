"use client";

import { useState } from "react";
import { useEHR } from "@/lib/ehr-context";
import { Patient, TriagePriority } from "@/lib/ehr-data";

const generateId = () => `A${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function EmergencyRoom() {
  const { patients, updatePatient, addActivity, setCurrentDepartment } = useEHR();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const erPatients = patients.filter(p => p.department === 'er');
  const sortedByPriority = [...erPatients].sort((a, b) => (a.triagePriority || 5) - (b.triagePriority || 5));

  const getTriageClass = (priority?: TriagePriority) => {
    if (!priority) return '';
    return `triage-${priority}`;
  };

  const getTriageLabel = (priority?: TriagePriority) => {
    if (!priority) return 'Not Triaged';
    const labels: Record<TriagePriority, string> = {
      1: 'Resuscitation',
      2: 'Emergency',
      3: 'Urgent',
      4: 'Less Urgent',
      5: 'Non-Urgent'
    };
    return labels[priority];
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'critical': return 'critical';
      case 'in-treatment': return 'in-treatment';
      case 'stable': return 'stable';
      default: return 'waiting';
    }
  };

  const handleTriageChange = (patient: Patient, priority: TriagePriority) => {
    updatePatient({ ...patient, triagePriority: priority, status: priority <= 2 ? 'critical' : 'in-treatment' });
    addActivity({
      id: generateId(),
      type: 'triage',
      department: 'er',
      patientId: patient.id,
      patientName: patient.name,
      description: `Triaged as Priority ${priority} - ${getTriageLabel(priority)}`,
      timestamp: new Date().toISOString()
    });
  };

  const triageCounts = {
    1: erPatients.filter(p => p.triagePriority === 1).length,
    2: erPatients.filter(p => p.triagePriority === 2).length,
    3: erPatients.filter(p => p.triagePriority === 3).length,
    4: erPatients.filter(p => p.triagePriority === 4).length,
    5: erPatients.filter(p => p.triagePriority === 5).length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Emergency Room</h2>
          <p className="text-slate-500">Triage and critical patient management</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="status-dot critical"></span>
          <span className="text-sm font-medium text-red-600">Live Monitoring</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {([1, 2, 3, 4, 5] as TriagePriority[]).map((priority) => (
          <div 
            key={priority} 
            className={`card p-4 text-center cursor-pointer transition-all hover:scale-105 ${triageCounts[priority] > 0 ? 'ring-2 ring-offset-2 border-red-500' : ''}`}
          >
            <div className={`text-3xl font-bold ${getTriageClass(priority)} rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2`}>
              {triageCounts[priority]}
            </div>
            <p className="text-sm font-medium">Priority {priority}</p>
            <p className="text-xs text-slate-500">{getTriageLabel(priority)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold">Patient Queue (Sorted by Priority)</h3>
          </div>
          <div className="divide-y divide-slate-200">
            {sortedByPriority.map((patient) => (
              <div 
                key={patient.id} 
                className={`p-4 hover:bg-slate-50 transition-colors ${patient.triagePriority === 1 ? 'bg-red-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${getTriageClass(patient.triagePriority)}`}>
                      {patient.triagePriority || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{patient.name}</p>
                        <span className={`status-dot ${getStatusDot(patient.status)}`}></span>
                      </div>
                      <p className="text-sm text-slate-500">{patient.id} • {patient.age}y • {patient.gender}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{patient.chiefComplaint || 'No complaint recorded'}</p>
                    {patient.vitalSigns && patient.vitalSigns.bloodPressure !== '-' && (
                      <div className="flex gap-3 mt-1 text-xs text-slate-500">
                        <span>BP: {patient.vitalSigns.bloodPressure}</span>
                        <span>HR: {patient.vitalSigns.heartRate}</span>
                        <span>SpO2: {patient.vitalSigns.oxygenSaturation}%</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Update Triage:</span>
                    {([1, 2, 3, 4, 5] as TriagePriority[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => handleTriageChange(patient, p)}
                        className={`px-2 py-1 text-xs rounded ${patient.triagePriority === p ? getTriageClass(p) : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button 
                    className="btn btn-primary text-sm py-1"
                    onClick={() => setSelectedPatient(patient)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}

            {sortedByPriority.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No patients in Emergency Room
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-4">
            <h3 className="font-semibold mb-3">Critical Alerts</h3>
            {erPatients.filter(p => p.triagePriority === 1).length > 0 ? (
              <div className="space-y-2">
                {erPatients.filter(p => p.triagePriority === 1).map((patient) => (
                  <div key={patient.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="status-dot critical"></span>
                      <span className="font-medium text-red-700">{patient.name}</span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">{patient.chiefComplaint}</p>
                    <button 
                      className="text-xs text-red-700 underline mt-2"
                      onClick={() => setSelectedPatient(patient)}
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No critical patients at this time</p>
            )}
          </div>

          <div className="card p-4">
            <h3 className="font-semibold mb-3">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Total in ER</span>
                <span className="font-semibold">{erPatients.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">In Treatment</span>
                <span className="font-semibold">{erPatients.filter(p => p.status === 'in-treatment').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Stable</span>
                <span className="font-semibold">{erPatients.filter(p => p.status === 'stable').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Awaiting Triage</span>
                <span className="font-semibold">{erPatients.filter(p => !p.triagePriority).length}</span>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold mb-3">ER Beds</h3>
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4, 5, 6].map((bed) => {
                const patient = erPatients.find((p, idx) => idx === bed - 1);
                return (
                  <div 
                    key={bed}
                    className={`p-2 rounded-lg text-center text-sm ${patient ? 'bg-teal-50 border border-teal-200' : 'bg-slate-50'}`}
                  >
                    Bay {bed}
                    {patient && <p className="font-medium truncate">{patient.name}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedPatient(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 border-b border-slate-200 ${selectedPatient.triagePriority === 1 ? 'bg-red-50' : selectedPatient.triagePriority === 2 ? 'bg-orange-50' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{selectedPatient.name}</h3>
                  <p className="text-slate-500">{selectedPatient.id} • {selectedPatient.age} years • {selectedPatient.gender}</p>
                </div>
                <span className={`badge ${getTriageClass(selectedPatient.triagePriority)} px-4 py-2`}>
                  Priority {selectedPatient.triagePriority || '?'}
                </span>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Blood Type</p>
                  <p className="font-semibold">{selectedPatient.bloodType}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Allergies</p>
                  <p className="font-semibold">{selectedPatient.allergies.join(', ') || 'None'}</p>
                </div>
              </div>

              {selectedPatient.vitalSigns && (
                <div>
                  <h4 className="font-semibold mb-3">Vital Signs</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                      <p className="text-xs text-slate-500">BP</p>
                      <p className="font-semibold">{selectedPatient.vitalSigns.bloodPressure}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                      <p className="text-xs text-slate-500">HR</p>
                      <p className="font-semibold">{selectedPatient.vitalSigns.heartRate}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                      <p className="text-xs text-slate-500">Temp</p>
                      <p className="font-semibold">{selectedPatient.vitalSigns.temperature}°F</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                      <p className="text-xs text-slate-500">RR</p>
                      <p className="font-semibold">{selectedPatient.vitalSigns.respiratoryRate}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                      <p className="text-xs text-slate-500">SpO2</p>
                      <p className="font-semibold">{selectedPatient.vitalSigns.oxygenSaturation}%</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-semibold mb-3">Actions</h4>
                <div className="flex gap-2 flex-wrap">
                  <button className="btn btn-primary">Update Vitals</button>
                  <button className="btn btn-secondary">Order Lab</button>
                  <button className="btn btn-secondary">Prescribe</button>
                  <button 
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setSelectedPatient(null);
                      setCurrentDepartment('pharmacy');
                    }}
                  >
                    Transfer to Pharmacy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
