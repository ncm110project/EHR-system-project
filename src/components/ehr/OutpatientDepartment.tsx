"use client";

import { useState } from "react";
import { useEHR } from "@/lib/ehr-context";
import { Patient } from "@/lib/ehr-data";

const generateId = () => `A${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const calculateWaitTime = (admissionDate: string, baseTime: number) => {
  const diff = baseTime - new Date(admissionDate).getTime();
  return Math.floor(diff / 60000);
};

export function OutpatientDepartment() {
  const { patients, prescriptions, labOrders, addPatient, addLabOrder, addPrescription, addActivity, updatePatient } = useEHR();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newPatient, setNewPatient] = useState({
    name: "", age: "", gender: "Male" as "Male" | "Female", phone: "", chiefComplaint: ""
  });
  const [renderTime] = useState(() => new Date('2026-03-14T10:30:00').getTime());

  const opdPatients = patients.filter(p => p.department === 'opd');
  const filteredPatients = opdPatients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getWaitTime = (admissionDate: string) => calculateWaitTime(admissionDate, renderTime);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting': return 'badge-warning';
      case 'in-treatment': return 'badge-info';
      case 'admitted': return 'badge-success';
      case 'discharged': return 'badge-neutral';
      default: return 'badge-neutral';
    }
  };

  const handleAddPatient = () => {
    if (!newPatient.name || !newPatient.age) return;
    
    const patient: Patient = {
      id: `P${String(patients.length + 1).padStart(3, '0')}`,
      name: newPatient.name,
      age: parseInt(newPatient.age),
      gender: newPatient.gender,
      dob: '1990-01-01',
      phone: newPatient.phone,
      address: '',
      bloodType: 'Unknown',
      allergies: [],
      status: 'waiting',
      department: 'opd',
      admissionDate: new Date().toISOString().split('T')[0],
      chiefComplaint: newPatient.chiefComplaint,
      vitalSigns: { bloodPressure: '-', heartRate: 0, temperature: 0, respiratoryRate: 0, oxygenSaturation: 0 }
    };
    
    addPatient(patient);
    addActivity({
      id: generateId(),
      type: 'admission',
      department: 'opd',
      patientId: patient.id,
      patientName: patient.name,
      description: `New patient registered - ${patient.chiefComplaint || 'General visit'}`,
      timestamp: new Date().toISOString()
    });
    setNewPatient({ name: "", age: "", gender: "Male", phone: "", chiefComplaint: "" });
    setShowAddForm(false);
  };

  const handleTransferToER = (patient: Patient) => {
    const updated = { ...patient, department: 'er' as const, status: 'critical' as const, triagePriority: 2 as const };
    updatePatient(updated);
    addActivity({
      id: generateId(),
      type: 'transfer',
      department: 'er',
      patientId: patient.id,
      patientName: patient.name,
      description: `Transferred from OPD to Emergency`,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Outpatient Department</h2>
          <p className="text-slate-500">Manage patient queue and consultations</p>
        </div>
        <button 
          className="btn btn-primary flex items-center gap-2"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Register Patient
        </button>
      </div>

      {showAddForm && (
        <div className="card p-6 animate-slide-in">
          <h3 className="text-lg font-semibold mb-4">New Patient Registration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Patient Name"
              value={newPatient.name}
              onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
              className="w-full"
            />
            <input
              type="number"
              placeholder="Age"
              value={newPatient.age}
              onChange={(e) => setNewPatient({...newPatient, age: e.target.value})}
              className="w-full"
            />
            <select
              value={newPatient.gender}
              onChange={(e) => setNewPatient({...newPatient, gender: e.target.value as "Male" | "Female"})}
              className="w-full"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <input
              type="tel"
              placeholder="Phone Number"
              value={newPatient.phone}
              onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
              className="w-full"
            />
            <input
              type="text"
              placeholder="Chief Complaint"
              value={newPatient.chiefComplaint}
              onChange={(e) => setNewPatient({...newPatient, chiefComplaint: e.target.value})}
              className="w-full lg:col-span-2"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn btn-primary" onClick={handleAddPatient}>Register</button>
            <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="p-4 border-b border-slate-200 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10"
            />
          </div>
          <div className="flex gap-2">
            <span className="badge badge-warning">{opdPatients.filter(p => p.status === 'waiting').length} Waiting</span>
            <span className="badge badge-info">{opdPatients.filter(p => p.status === 'in-treatment').length} In Treatment</span>
            <span className="badge badge-success">{opdPatients.filter(p => p.status === 'admitted').length} Admitted</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient Name</th>
              <th>Age/Gender</th>
              <th>Chief Complaint</th>
              <th>Status</th>
              <th>Wait Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((patient) => (
              <tr key={patient.id} className="cursor-pointer" onClick={() => setSelectedPatient(patient)}>
                <td className="font-mono text-sm">{patient.id}</td>
                <td className="font-medium">{patient.name}</td>
                <td>{patient.age}/{patient.gender[0]}</td>
                <td className="text-slate-600">{patient.chiefComplaint || '-'}</td>
                <td>
                  <span className={`badge ${getStatusBadge(patient.status)}`}>
                    {patient.status.replace('-', ' ')}
                  </span>
                </td>
                <td className="text-slate-500">~{getWaitTime(patient.admissionDate)} min</td>
                <td>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      onClick={() => setSelectedPatient(patient)}
                    >
                      View
                    </button>
                    {patient.status === 'waiting' && (
                      <button 
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        onClick={() => handleTransferToER(patient)}
                      >
                        Transfer to ER
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPatients.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No patients found in Outpatient Department
          </div>
        )}
      </div>

      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedPatient(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{selectedPatient.name}</h3>
                <p className="text-slate-500">{selectedPatient.id} • {selectedPatient.age} years • {selectedPatient.gender}</p>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-slate-400 hover:text-slate-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Blood Type</p>
                  <p className="font-semibold">{selectedPatient.bloodType}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-semibold">{selectedPatient.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Allergies</p>
                  <p className="font-semibold">{selectedPatient.allergies.join(', ') || 'None'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Admission Date</p>
                  <p className="font-semibold">{selectedPatient.admissionDate}</p>
                </div>
              </div>

              {selectedPatient.chiefComplaint && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Chief Complaint</p>
                  <p className="font-medium">{selectedPatient.chiefComplaint}</p>
                </div>
              )}

              {selectedPatient.diagnosis && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Diagnosis</p>
                  <p className="font-medium">{selectedPatient.diagnosis}</p>
                </div>
              )}

              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-semibold mb-3">Quick Actions</h4>
                <div className="flex gap-2 flex-wrap">
                  <button className="btn btn-primary">Start Consultation</button>
                  <button className="btn btn-secondary">Order Lab Test</button>
                  <button className="btn btn-secondary">Write Prescription</button>
                  <button className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">
                    Discharge
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
