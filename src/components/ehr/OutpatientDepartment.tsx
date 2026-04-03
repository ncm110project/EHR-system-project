"use client";

import { useState } from "react";
import { useEHR } from "@/lib/ehr-context";
import { useAuth } from "@/lib/auth-context";
import { Patient, VitalSigns, LabOrder, Prescription, VitalSignsEntry, NotesEntry, DiagnosisEntry } from "@/lib/ehr-data";
import { PatientRecordPrint } from "./PatientRecordPrint";

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const commonLabTests = [
  { name: 'Complete Blood Count (CBC)', type: 'blood' as const },
  { name: 'Basic Metabolic Panel (BMP)', type: 'blood' as const },
  { name: 'Comprehensive Metabolic Panel (CMP)', type: 'blood' as const },
  { name: 'Lipid Panel', type: 'blood' as const },
  { name: 'Liver Function Tests (LFT)', type: 'blood' as const },
  { name: 'Thyroid Panel (TSH/T3/T4)', type: 'blood' as const },
  { name: 'Hemoglobin A1C', type: 'blood' as const },
  { name: 'Urinalysis', type: 'urine' as const },
  { name: 'Urine Culture', type: 'urine' as const },
  { name: 'Chest X-Ray', type: 'imaging' as const },
  { name: 'CT Scan Head', type: 'imaging' as const },
  { name: 'CT Scan Abdomen', type: 'imaging' as const },
  { name: 'MRI Brain', type: 'imaging' as const },
  { name: 'ECG/EKG', type: 'imaging' as const },
  { name: 'Blood Culture', type: 'pathology' as const },
];

export function OutpatientDepartment() {
  const { user } = useAuth();
  const { patients, medications, labOrders, prescriptions, addPatient, addLabOrder, addPrescription, addActivity, updatePatient } = useEHR();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newPatient, setNewPatient] = useState({
    name: "", age: "", gender: "Male" as "Male" | "Female", phone: "", chiefComplaint: ""
  });
  const [renderTime] = useState(() => new Date('2026-03-14T10:30:00').getTime());
  const [activeTab, setActiveTab] = useState<'queue' | 'ongoing' | 'completed'>('queue');
  const [showPrintPreview, setShowPrintPreview] = useState<Patient | null>(null);

  const isNurse = !!(user && 'role' in user && user.role === 'nurse');
  const isDoctor = !!(user && 'role' in user && user.role === 'doctor');

  const opdPatients = patients.filter(p => p.department === 'opd' && p.registrationStatus === 'confirmed');
  
  const getQueuePatients = () => {
    if (isNurse) {
      return opdPatients.filter(p => !p.workflowStatus || p.workflowStatus === 'registered');
    }
    if (isDoctor) {
      return opdPatients.filter(p => p.workflowStatus === 'nurse-completed');
    }
    return opdPatients;
  };

  const getOngoingPatients = () => {
    if (isNurse) {
      return opdPatients.filter(p => p.workflowStatus === 'nurse-pending');
    }
    if (isDoctor) {
      return opdPatients.filter(p => p.workflowStatus === 'doctor-pending');
    }
    return [];
  };

  const getCompletedPatients = () => {
    return opdPatients.filter(p => p.workflowStatus === 'doctor-completed');
  };

  const queuePatients = getQueuePatients();
  const ongoingPatients = getOngoingPatients();
  const completedPatients = getCompletedPatients();
  
  const getFilteredPatients = () => {
    let patientsToFilter: Patient[] = [];
    switch (activeTab) {
      case 'queue':
        patientsToFilter = queuePatients;
        break;
      case 'ongoing':
        patientsToFilter = ongoingPatients;
        break;
      case 'completed':
        patientsToFilter = completedPatients;
        break;
    }
    return patientsToFilter.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredPatients = getFilteredPatients();

  const getWaitTime = (admissionDate: string) => {
    const diff = renderTime - new Date(admissionDate).getTime();
    return Math.floor(diff / 60000);
  };

  const getStatusBadge = (workflowStatus?: string) => {
    switch (workflowStatus) {
      case 'registered': return 'badge-warning';
      case 'nurse-pending': return 'badge-info';
      case 'nurse-completed': return 'badge-info';
      case 'doctor-pending': return 'badge-warning';
      case 'doctor-completed': return 'badge-success';
      default: return 'badge-warning';
    }
  };

  const getWorkflowLabel = (workflowStatus?: string) => {
    switch (workflowStatus) {
      case 'registered': return 'New';
      case 'nurse-pending': return 'In Triage';
      case 'nurse-completed': return 'Pending Doctor';
      case 'doctor-pending': return 'In Consultation';
      case 'doctor-completed': return 'Completed';
      default: return 'Registered';
    }
  };

  const handleAddPatient = () => {
    if (!newPatient.name || !newPatient.age) return;
    
    const now = new Date().toISOString();
    const patient: Patient = {
      id: generateId(),
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
      admissionDate: now.split('T')[0],
      chiefComplaint: newPatient.chiefComplaint,
      workflowStatus: 'registered',
      vitalSigns: { bloodPressure: '-', heartRate: 0, temperature: 0, respiratoryRate: 0, oxygenSaturation: 0, recordedAt: now },
      vitalSignsHistory: [],
      notesHistory: [],
      diagnosisHistory: []
    };
    
    addPatient(patient);
    addActivity({
      id: generateId(),
      type: 'admission',
      department: 'opd',
      patientId: patient.id,
      patientName: patient.name,
      description: `New patient registered - ${patient.chiefComplaint || 'General visit'}`,
      timestamp: now
    });
    setNewPatient({ name: "", age: "", gender: "Male", phone: "", chiefComplaint: "" });
  };

  const handleSaveNurseNotes = (patient: Patient, vitals: VitalSigns, notes: string) => {
    const now = new Date().toISOString();
    const nurseName = user?.name || 'Nurse';
    
    const vitalsEntry: VitalSignsEntry = {
      vitals: { ...vitals, recordedAt: now },
      timestamp: now,
      recordedBy: nurseName
    };
    
    const notesEntry: NotesEntry = {
      notes,
      timestamp: now,
      recordedBy: nurseName
    };
    
    const updated = {
      ...patient,
      nurseVitals: vitals,
      nurseNotes: notes,
      vitalSigns: vitals,
      vitalSignsHistory: [...(patient.vitalSignsHistory || []), vitalsEntry],
      notesHistory: [...(patient.notesHistory || []), notesEntry],
      workflowStatus: 'nurse-completed' as const,
      status: 'in-treatment' as const
    };
    updatePatient(updated);
    addActivity({
      id: generateId(),
      type: 'nurse-assign',
      department: 'opd',
      patientId: patient.id,
      patientName: patient.name,
      description: `Nurse completed assessment - sent to doctor`,
      timestamp: now
    });
    setSelectedPatient(null);
  };

  const handleSendToDoctor = (patient: Patient) => {
    const now = new Date().toISOString();
    const updated = {
      ...patient,
      workflowStatus: 'nurse-completed' as const
    };
    updatePatient(updated);
    addActivity({
      id: generateId(),
      type: 'transfer',
      department: 'opd',
      patientId: patient.id,
      patientName: patient.name,
      description: `Sent to doctor for consultation`,
      timestamp: now
    });
  };

  const handleOrderLab = (patient: Patient, testName: string, testType: 'blood' | 'urine' | 'imaging' | 'pathology') => {
    const now = new Date().toISOString();
    const order: LabOrder = {
      id: generateId(),
      patientId: patient.id,
      testName,
      testType,
      status: 'pending',
      orderedBy: user?.name || 'Doctor',
      date: now.split('T')[0]
    };
    addLabOrder(order);
    addActivity({
      id: generateId(),
      type: 'lab-result',
      department: 'lab',
      patientId: patient.id,
      patientName: patient.name,
      description: `Lab test ordered: ${testName}`,
      timestamp: now
    });
  };

  const handlePrescribe = (patient: Patient, medication: string, dosage: string, frequency: string, duration: string) => {
    const now = new Date().toISOString();
    const rx: Prescription = {
      id: generateId(),
      patientId: patient.id,
      medication,
      dosage,
      frequency,
      duration,
      prescribedBy: user?.name || 'Doctor',
      status: 'pending',
      date: now.split('T')[0]
    };
    addPrescription(rx);
    addActivity({
      id: generateId(),
      type: 'prescription',
      department: 'pharmacy',
      patientId: patient.id,
      patientName: patient.name,
      description: `Prescription written: ${medication}`,
      timestamp: now
    });
  };

  const handleCompleteDoctorVisit = (patient: Patient, diagnosis: string) => {
    const now = new Date().toISOString();
    const doctorName = user?.name || 'Doctor';
    
    const diagnosisEntry: DiagnosisEntry = {
      diagnosis,
      timestamp: now,
      diagnosedBy: doctorName
    };
    
    const updated = {
      ...patient,
      diagnosis,
      diagnosisHistory: [...(patient.diagnosisHistory || []), diagnosisEntry],
      workflowStatus: 'doctor-completed' as const,
      status: 'admitted' as const,
      chartVerificationStatus: 'pending' as const
    };
    updatePatient(updated);
    setSelectedPatient(null);
  };

  const handleAddVitalsForCompleted = (patient: Patient, vitals: VitalSigns) => {
    const now = new Date().toISOString();
    const nurseName = user?.name || 'Medical Staff';
    
    const vitalsEntry: VitalSignsEntry = {
      vitals: { ...vitals, recordedAt: now },
      timestamp: now,
      recordedBy: nurseName
    };
    
    const updated = {
      ...patient,
      vitalSigns: { ...vitals, recordedAt: now },
      vitalSignsHistory: [...(patient.vitalSignsHistory || []), vitalsEntry]
    };
    updatePatient(updated);
    addActivity({
      id: generateId(),
      type: 'vitals' as const,
      department: 'opd' as const,
      patientId: patient.id,
      patientName: patient.name,
      description: `New vitals recorded: BP ${vitals.bloodPressure}, HR ${vitals.heartRate}`,
      timestamp: now
    });
  };

  const handleAddNotesForCompleted = (patient: Patient, notes: string) => {
    const now = new Date().toISOString();
    const staffName = user?.name || 'Medical Staff';
    
    const notesEntry: NotesEntry = {
      notes,
      timestamp: now,
      recordedBy: staffName
    };
    
    const updated = {
      ...patient,
      notesHistory: [...(patient.notesHistory || []), notesEntry]
    };
    updatePatient(updated);
    addActivity({
      id: generateId(),
      type: 'admission' as const,
      department: 'opd' as const,
      patientId: patient.id,
      patientName: patient.name,
      description: `New progress note added`,
      timestamp: now
    });
  };

  const handleAddDiagnosisForCompleted = (patient: Patient, diagnosis: string) => {
    const now = new Date().toISOString();
    const doctorName = user?.name || 'Doctor';
    
    const diagnosisEntry: DiagnosisEntry = {
      diagnosis,
      timestamp: now,
      diagnosedBy: doctorName
    };
    
    const updated = {
      ...patient,
      diagnosis: diagnosis,
      diagnosisHistory: [...(patient.diagnosisHistory || []), diagnosisEntry]
    };
    updatePatient(updated);
    addActivity({
      id: generateId(),
      type: 'admission' as const,
      department: 'opd' as const,
      patientId: patient.id,
      patientName: patient.name,
      description: `New diagnosis added: ${diagnosis}`,
      timestamp: now
    });
  };

  const handleReopenVisit = (patient: Patient) => {
    const now = new Date().toISOString();
    const updated = {
      ...patient,
      workflowStatus: 'registered' as const,
      status: 'waiting' as const,
      diagnosis: undefined,
      vitalSigns: { bloodPressure: '-', heartRate: 0, temperature: 0, respiratoryRate: 0, oxygenSaturation: 0, recordedAt: now },
      nurseVitals: undefined,
      nurseNotes: undefined
    };
    updatePatient(updated);
    addActivity({
      id: generateId(),
      type: 'admission' as const,
      department: 'opd' as const,
      patientId: patient.id,
      patientName: patient.name,
      description: `Patient visit reopened for follow-up - new chart started`,
      timestamp: now
    });
    setSelectedPatient(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {isNurse ? 'Outpatient - Nurse Station' : 'Outpatient - Doctor Office'}
          </h2>
          <p className="text-slate-500">
            {isNurse ? 'Review patient charts, record vitals and notes' : 'Consult patients and prescribe treatment'}
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'queue' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Patient Queue ({queuePatients.length})
        </button>
        <button
          onClick={() => setActiveTab('ongoing')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'ongoing' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Ongoing ({ongoingPatients.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'completed' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Completed ({completedPatients.length})
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search patients by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="text-sm text-slate-500 mt-2">
              Found {filteredPatients.length} patient(s) matching &quot;{searchTerm}&quot;
            </p>
          )}
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
              <tr key={patient.id}>
                <td className="font-mono text-sm">{patient.id}</td>
                <td className="font-medium">{patient.name}</td>
                <td>{patient.age}/{patient.gender[0]}</td>
                <td className="text-slate-600">{patient.chiefComplaint || '-'}</td>
                <td>
                  <span className={`badge ${getStatusBadge(patient.workflowStatus)}`}>
                    {getWorkflowLabel(patient.workflowStatus)}
                  </span>
                </td>
                <td className="text-slate-500">~{getWaitTime(patient.admissionDate)} min</td>
                <td>
                  <button 
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    onClick={() => setSelectedPatient(patient)}
                  >
                    {isNurse ? 'Open Chart' : 'Examine'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPatients.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No patients in queue
          </div>
        )}
      </div>

      {selectedPatient && (
        <PatientDetailModal 
          patient={selectedPatient}
          isNurse={isNurse}
          isDoctor={isDoctor}
          medications={medications}
          onClose={() => setSelectedPatient(null)}
          onSaveNurseNotes={handleSaveNurseNotes}
          onSendToDoctor={handleSendToDoctor}
          onOrderLab={handleOrderLab}
          onPrescribe={handlePrescribe}
          onCompleteVisit={handleCompleteDoctorVisit}
          onPrint={(p) => setShowPrintPreview(p)}
          onReopenVisit={handleReopenVisit}
          onAddVitals={handleAddVitalsForCompleted}
          onAddNotes={handleAddNotesForCompleted}
          onAddDiagnosis={handleAddDiagnosisForCompleted}
        />
      )}

      {showPrintPreview && (
        <PatientRecordPrint 
          patient={showPrintPreview} 
          onClose={() => setShowPrintPreview(null)} 
        />
      )}
    </div>
  );
}

function PatientDetailModal({ 
  patient, 
  isNurse, 
  isDoctor,
  medications,
  onClose, 
  onSaveNurseNotes,
  onSendToDoctor,
  onOrderLab,
  onPrescribe,
  onCompleteVisit,
  onPrint,
  onReopenVisit,
  onAddVitals,
  onAddNotes,
  onAddDiagnosis
}: { 
  patient: Patient;
  isNurse: boolean;
  isDoctor: boolean;
  medications: any[];
  onClose: () => void;
  onSaveNurseNotes: (patient: Patient, vitals: VitalSigns, notes: string) => void;
  onSendToDoctor: (patient: Patient) => void;
  onOrderLab: (patient: Patient, testName: string, testType: any) => void;
  onPrescribe: (patient: Patient, medication: string, dosage: string, frequency: string, duration: string) => void;
  onCompleteVisit: (patient: Patient, diagnosis: string) => void;
  onPrint: (patient: Patient) => void;
  onReopenVisit: (patient: Patient) => void;
  onAddVitals?: (patient: Patient, vitals: VitalSigns) => void;
  onAddNotes?: (patient: Patient, notes: string) => void;
  onAddDiagnosis?: (patient: Patient, diagnosis: string) => void;
}) {
  const [vitals, setVitals] = useState<VitalSigns>(patient.nurseVitals || {
    bloodPressure: '',
    heartRate: 0,
    temperature: 0,
    respiratoryRate: 0,
    oxygenSaturation: 0,
    recordedAt: new Date().toISOString()
  });
  const [notes, setNotes] = useState(patient.nurseNotes || '');
  const [showLabOrder, setShowLabOrder] = useState(false);
  const [showPrescribe, setShowPrescribe] = useState(false);
  const [labTestName, setLabTestName] = useState('');
  const [labTestType, setLabTestType] = useState<'blood' | 'urine' | 'imaging' | 'pathology'>('blood');
  const [prescription, setPrescription] = useState({ medication: '', dosage: '', frequency: 'OD', route: 'Oral', duration: '', instructions: '' });
  const [diagnosis, setDiagnosis] = useState(patient.diagnosis || '');
  const [showAddVitals, setShowAddVitals] = useState(false);
  const [showAddNotes, setShowAddNotes] = useState(false);
  const [showAddDiagnosis, setShowAddDiagnosis] = useState(false);
  const [newNotes, setNewNotes] = useState('');
  const [newDiagnosisInput, setNewDiagnosisInput] = useState('');

  const isCompleted = patient.workflowStatus === 'doctor-completed';
  const canAddNew = isCompleted && (onAddVitals || onAddNotes || onAddDiagnosis);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const handleSave = () => {
    if (isNurse) {
      onSaveNurseNotes(patient, vitals, notes);
    }
  };

  const handleAddVitals = () => {
    if (onAddVitals && vitals.bloodPressure && vitals.heartRate > 0) {
      onAddVitals(patient, vitals);
      setShowAddVitals(false);
      setVitals({
        bloodPressure: '',
        heartRate: 0,
        temperature: 0,
        respiratoryRate: 0,
        oxygenSaturation: 0,
        recordedAt: new Date().toISOString()
      });
    }
  };

  const handleAddNotes = () => {
    if (onAddNotes && newNotes.trim()) {
      onAddNotes(patient, newNotes);
      setShowAddNotes(false);
      setNewNotes('');
    }
  };

  const handleAddDiagnosis = () => {
    if (onAddDiagnosis && newDiagnosisInput.trim()) {
      onAddDiagnosis(patient, newDiagnosisInput);
      setShowAddDiagnosis(false);
      setNewDiagnosisInput('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">{patient.name}</h3>
            <p className="text-slate-500">{patient.id} • {patient.age} years • {patient.gender}</p>
          </div>
          {isCompleted && (
            <span className="badge badge-success">Completed - View Only</span>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
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
              <p className="font-semibold">{patient.bloodType}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Phone</p>
              <p className="font-semibold">{patient.phone}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Allergies</p>
              <p className="font-semibold">{patient.allergies?.join(', ') || 'None'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Chief Complaint</p>
              <p className="font-semibold">{patient.chiefComplaint || 'Not specified'}</p>
            </div>
          </div>

          {isNurse && patient.workflowStatus !== 'nurse-completed' && (
            <>
              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-semibold mb-3">Vital Signs</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">Blood Pressure</label>
                    <input
                      type="text"
                      placeholder="120/80"
                      value={vitals.bloodPressure}
                      onChange={(e) => setVitals({...vitals, bloodPressure: e.target.value})}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Heart Rate</label>
                    <input
                      type="number"
                      placeholder="72"
                      value={vitals.heartRate || ''}
                      onChange={(e) => setVitals({...vitals, heartRate: parseInt(e.target.value) || 0})}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Temperature (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="98.6"
                      value={vitals.temperature || ''}
                      onChange={(e) => setVitals({...vitals, temperature: parseFloat(e.target.value) || 0})}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Respiratory Rate</label>
                    <input
                      type="number"
                      placeholder="16"
                      value={vitals.respiratoryRate || ''}
                      onChange={(e) => setVitals({...vitals, respiratoryRate: parseInt(e.target.value) || 0})}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Oxygen Saturation (%)</label>
                    <input
                      type="number"
                      placeholder="98"
                      value={vitals.oxygenSaturation || ''}
                      onChange={(e) => setVitals({...vitals, oxygenSaturation: parseInt(e.target.value) || 0})}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-semibold mb-3">Nurse Notes</h4>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter assessment notes..."
                  className="w-full h-24"
                />
              </div>

              <button className="btn btn-primary w-full" onClick={handleSave}>
                Save Assessment & Send to Doctor
              </button>
            </>
          )}

          {(isDoctor || patient.workflowStatus === 'nurse-completed') && (
            <div className="border-t border-slate-200 pt-4">
              {patient.nurseVitals && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Nurse&apos;s Vitals Record</h4>
                  <div className="grid grid-cols-5 gap-2 text-sm">
                    <div className="p-2 bg-slate-50 rounded">
                      <p className="text-xs text-slate-500">BP</p>
                      <p className="font-medium">{patient.nurseVitals.bloodPressure || '-'}</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <p className="text-xs text-slate-500">HR</p>
                      <p className="font-medium">{patient.nurseVitals.heartRate || '-'}</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <p className="text-xs text-slate-500">Temp</p>
                      <p className="font-medium">{patient.nurseVitals.temperature || '-'}</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <p className="text-xs text-slate-500">RR</p>
                      <p className="font-medium">{patient.nurseVitals.respiratoryRate || '-'}</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <p className="text-xs text-slate-500">SpO2</p>
                      <p className="font-medium">{patient.nurseVitals.oxygenSaturation || '-'}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {patient.nurseNotes && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Nurse&apos;s Notes</h4>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">{patient.nurseNotes}</p>
                </div>
              )}
            </div>
          )}

          {isDoctor && patient.workflowStatus === 'nurse-completed' && (
            <>
              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-semibold mb-3">Doctor&apos;s Actions</h4>
                
                <div className="space-y-3">
                  <button 
                    className="w-full p-3 border border-slate-200 rounded-lg text-left hover:bg-slate-50"
                    onClick={() => setShowLabOrder(!showLabOrder)}
                  >
                    <span className="font-medium">Order Lab Test</span>
                    <p className="text-sm text-slate-500">Request blood work, imaging, etc.</p>
                  </button>
                  
                  {showLabOrder && (
                    <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                      <select 
                        value={labTestName}
                        onChange={(e) => {
                          const selectedTest = commonLabTests.find(t => t.name === e.target.value);
                          setLabTestName(e.target.value);
                          if (selectedTest) {
                            setLabTestType(selectedTest.type);
                          }
                        }}
                        className="w-full"
                      >
                        <option value="">Select Lab Test</option>
                        {commonLabTests.map((test) => (
                          <option key={test.name} value={test.name}>{test.name}</option>
                        ))}
                      </select>
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          if (labTestName) {
                            const selectedTest = commonLabTests.find(t => t.name === labTestName);
                            onOrderLab(patient, labTestName, selectedTest?.type || labTestType);
                            setShowLabOrder(false);
                            setLabTestName('');
                          }
                        }}
                      >
                        Submit Lab Order
                      </button>
                    </div>
                  )}

                  <button 
                    className="w-full p-3 border border-slate-200 rounded-lg text-left hover:bg-slate-50"
                    onClick={() => setShowPrescribe(!showPrescribe)}
                  >
                    <span className="font-medium">Write Prescription</span>
                    <p className="text-sm text-slate-500">Prescribe medication for patient</p>
                  </button>

                  {showPrescribe && (
                    <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                      <select 
                        value={prescription.medication}
                        onChange={(e) => setPrescription({...prescription, medication: e.target.value})}
                        className="w-full"
                      >
                        <option value="">Select Medication</option>
                        {medications.map(med => (
                          <option key={med.id} value={med.name}>
                            {med.name} ({med.stock} {med.unit} left) - {med.classification}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Dosage (e.g., 500mg)"
                        value={prescription.dosage}
                        onChange={(e) => setPrescription({...prescription, dosage: e.target.value})}
                        className="w-full"
                      />
                      <select
                        value={prescription.frequency}
                        onChange={(e) => setPrescription({...prescription, frequency: e.target.value})}
                        className="w-full"
                      >
                        <option value="">Select Frequency</option>
                        <option value="STAT">STAT (Immediately)</option>
                        <option value="OD">OD (Once daily)</option>
                        <option value="BID">BID (Twice daily)</option>
                        <option value="TID">TID (Three times daily)</option>
                        <option value="QID">QID (Four times daily)</option>
                        <option value="q4h">q4h (Every 4 hours)</option>
                        <option value="q6h">q6h (Every 6 hours)</option>
                        <option value="q8h">q8h (Every 8 hours)</option>
                        <option value="q12h">q12h (Every 12 hours)</option>
                        <option value="PRN">PRN (As needed)</option>
                      </select>
                      <select
                        value={prescription.route}
                        onChange={(e) => setPrescription({...prescription, route: e.target.value})}
                        className="w-full"
                      >
                        <option value="">Select Route</option>
                        <option value="Oral">Oral</option>
                        <option value="IV">IV (Intravenous)</option>
                        <option value="IM">IM (Intramuscular)</option>
                        <option value="Topical">Topical</option>
                        <option value="Rectal">Rectal</option>
                        <option value="Vaginal">Vaginal</option>
                        <option value="Sublingual">Sublingual</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Duration (e.g., 7 days)"
                        value={prescription.duration}
                        onChange={(e) => setPrescription({...prescription, duration: e.target.value})}
                        className="w-full"
                      />
                      <input
                        type="text"
                        placeholder="Instructions (optional)"
                        value={prescription.instructions}
                        onChange={(e) => setPrescription({...prescription, instructions: e.target.value})}
                        className="w-full"
                      />
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          if (prescription.medication && prescription.dosage) {
                            onPrescribe(patient, prescription.medication, prescription.dosage, prescription.frequency, prescription.duration);
                            setShowPrescribe(false);
                            setPrescription({ medication: '', dosage: '', frequency: 'OD', route: 'Oral', duration: '', instructions: '' });
                          }
                        }}
                      >
                        Submit Prescription
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h4 className="font-semibold mb-3">Diagnosis</h4>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Enter diagnosis..."
                  className="w-full h-24"
                />
                <button 
                  className="btn btn-primary w-full mt-3"
                  onClick={() => onCompleteVisit(patient, diagnosis)}
                >
                  Complete Visit
                </button>
              </div>
            </>
          )}

          {patient.workflowStatus === 'doctor-completed' && (
            <div className="border-t border-slate-200 pt-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-semibold text-green-800">Visit Completed - Chart is View Only</p>
                <p className="text-sm text-green-600 mt-1">To add new entries, use the buttons below</p>
              </div>

              {patient.diagnosis && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Current Diagnosis</h4>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p>{patient.diagnosis}</p>
                  </div>
                </div>
              )}

              {patient.diagnosisHistory && patient.diagnosisHistory.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Diagnosis History</h4>
                  <div className="space-y-2">
                    {patient.diagnosisHistory.map((entry, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm">{entry.diagnosis}</p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(entry.timestamp)} by {entry.diagnosedBy}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(patient.vitalSignsHistory && patient.vitalSignsHistory.length > 0) && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Vital Signs History</h4>
                  <div className="space-y-3">
                    {patient.vitalSignsHistory.map((entry, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                        <div className="grid grid-cols-5 gap-2 text-sm mb-1">
                          <div><span className="text-xs text-slate-500">BP:</span> {entry.vitals.bloodPressure}</div>
                          <div><span className="text-xs text-slate-500">HR:</span> {entry.vitals.heartRate}</div>
                          <div><span className="text-xs text-slate-500">Temp:</span> {entry.vitals.temperature}°F</div>
                          <div><span className="text-xs text-slate-500">RR:</span> {entry.vitals.respiratoryRate}</div>
                          <div><span className="text-xs text-slate-500">SpO2:</span> {entry.vitals.oxygenSaturation}%</div>
                        </div>
                        <p className="text-xs text-slate-500">
                          Recorded: {formatDateTime(entry.timestamp)} by {entry.recordedBy}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {patient.notesHistory && patient.notesHistory.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Notes History</h4>
                  <div className="space-y-2">
                    {patient.notesHistory.map((entry, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm">{entry.notes}</p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(entry.timestamp)} by {entry.recordedBy}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <button
                  onClick={() => setShowAddVitals(!showAddVitals)}
                  className="w-full p-3 border border-slate-200 rounded-lg text-left hover:bg-slate-50 flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                  <span className="font-medium">Add New Vital Signs</span>
                </button>
                {showAddVitals && (
                  <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-slate-500">Blood Pressure</label>
                        <input
                          type="text"
                          placeholder="120/80"
                          value={vitals.bloodPressure}
                          onChange={(e) => setVitals({...vitals, bloodPressure: e.target.value})}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Heart Rate</label>
                        <input
                          type="number"
                          placeholder="72"
                          value={vitals.heartRate || ''}
                          onChange={(e) => setVitals({...vitals, heartRate: parseInt(e.target.value) || 0})}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Temperature (°F)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="98.6"
                          value={vitals.temperature || ''}
                          onChange={(e) => setVitals({...vitals, temperature: parseFloat(e.target.value) || 0})}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Respiratory Rate</label>
                        <input
                          type="number"
                          placeholder="16"
                          value={vitals.respiratoryRate || ''}
                          onChange={(e) => setVitals({...vitals, respiratoryRate: parseInt(e.target.value) || 0})}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Oxygen Saturation (%)</label>
                        <input
                          type="number"
                          placeholder="98"
                          value={vitals.oxygenSaturation || ''}
                          onChange={(e) => setVitals({...vitals, oxygenSaturation: parseInt(e.target.value) || 0})}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <button className="btn btn-primary" onClick={handleAddVitals}>
                      Save New Vitals
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setShowAddNotes(!showAddNotes)}
                  className="w-full p-3 border border-slate-200 rounded-lg text-left hover:bg-slate-50 flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                  <span className="font-medium">Add New Progress Note</span>
                </button>
                {showAddNotes && (
                  <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                    <textarea
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="Enter new progress note..."
                      className="w-full h-24"
                    />
                    <button className="btn btn-primary" onClick={handleAddNotes}>
                      Save Note
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setShowAddDiagnosis(!showAddDiagnosis)}
                  className="w-full p-3 border border-slate-200 rounded-lg text-left hover:bg-slate-50 flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span className="font-medium">Add New Diagnosis</span>
                </button>
                {showAddDiagnosis && (
                  <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                    <textarea
                      value={newDiagnosisInput}
                      onChange={(e) => setNewDiagnosisInput(e.target.value)}
                      placeholder="Enter new diagnosis..."
                      className="w-full h-24"
                    />
                    <button className="btn btn-primary" onClick={handleAddDiagnosis}>
                      Save Diagnosis
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => onPrint(patient)}
                className="mt-4 w-full p-3 border border-slate-200 rounded-lg text-left hover:bg-slate-50 flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                <span className="font-medium">Print Patient Record</span>
              </button>
              {isNurse && (
                <button
                  onClick={() => onReopenVisit(patient)}
                  className="mt-2 w-full p-3 border border-blue-200 bg-blue-50 rounded-lg text-left hover:bg-blue-100 flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                    <path d="M21 3v5h-5"></path>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                    <path d="M3 21v-5h5"></path>
                  </svg>
                  <span className="font-medium text-blue-700">Reopen Visit (Follow-up)</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}