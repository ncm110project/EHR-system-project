"use client";

import { useState } from "react";
import { useEHR } from "@/lib/ehr-context";
import { useAuth } from "@/lib/auth-context";
import { Patient, TriagePriority, VitalSigns, LabOrder, Prescription, VitalSignsEntry, NotesEntry, DiagnosisEntry } from "@/lib/ehr-data";

const generateId = () => `A${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

interface LabTestCategory {
  category: string;
  tests: { name: string; type: 'blood' | 'urine' | 'stool' | 'microbiology' | 'serology' | 'special' }[];
}

const labTestsByCategory: LabTestCategory[] = [
  {
    category: 'Hematology',
    tests: [
      { name: 'Complete Blood Count (CBC)', type: 'blood' },
      { name: 'Hemoglobin & Hematocrit', type: 'blood' },
      { name: 'Platelet Count', type: 'blood' },
      { name: 'Erythrocyte Sedimentation Rate (ESR)', type: 'blood' },
      { name: 'Peripheral Blood Smear', type: 'blood' },
      { name: 'Reticulocyte Count', type: 'blood' },
      { name: 'Prothrombin Time (PT)', type: 'blood' },
      { name: 'Activated Partial Thromboplastin Time (aPTT)', type: 'blood' },
      { name: 'INR', type: 'blood' },
    ]
  },
  {
    category: 'Clinical Chemistry',
    tests: [
      { name: 'Blood Glucose (Fasting)', type: 'blood' },
      { name: 'Blood Glucose (Random)', type: 'blood' },
      { name: 'HbA1c', type: 'blood' },
      { name: 'Blood Urea Nitrogen (BUN)', type: 'blood' },
      { name: 'Creatinine', type: 'blood' },
      { name: 'Uric Acid', type: 'blood' },
      { name: 'Total Cholesterol', type: 'blood' },
      { name: 'HDL', type: 'blood' },
      { name: 'LDL', type: 'blood' },
      { name: 'Triglycerides', type: 'blood' },
      { name: 'Sodium', type: 'blood' },
      { name: 'Potassium', type: 'blood' },
      { name: 'Chloride', type: 'blood' },
      { name: 'Calcium', type: 'blood' },
      { name: 'AST (SGOT)', type: 'blood' },
      { name: 'ALT (SGPT)', type: 'blood' },
      { name: 'Alkaline Phosphatase', type: 'blood' },
      { name: 'Bilirubin', type: 'blood' },
      { name: 'Total Protein', type: 'blood' },
      { name: 'Albumin', type: 'blood' },
    ]
  },
  {
    category: 'Urinalysis',
    tests: [
      { name: 'Routine Urinalysis', type: 'urine' },
      { name: 'Urine Microscopy', type: 'urine' },
    ]
  },
  {
    category: 'Stool Examination',
    tests: [
      { name: 'Fecalysis', type: 'stool' },
      { name: 'Occult Blood Test', type: 'stool' },
      { name: 'Stool Culture', type: 'stool' },
    ]
  },
  {
    category: 'Microbiology',
    tests: [
      { name: 'Blood Culture', type: 'blood' },
      { name: 'Urine Culture', type: 'urine' },
      { name: 'Sputum Culture', type: 'special' },
      { name: 'Wound Culture', type: 'special' },
      { name: 'Culture & Sensitivity Testing', type: 'special' },
    ]
  },
  {
    category: 'Serology / Immunology',
    tests: [
      { name: 'Pregnancy Test (hCG)', type: 'special' },
      { name: 'Dengue NS1', type: 'serology' },
      { name: 'Dengue IgG', type: 'serology' },
      { name: 'Dengue IgM', type: 'serology' },
      { name: 'COVID-19 Test', type: 'serology' },
      { name: 'HIV Test', type: 'serology' },
      { name: 'Hepatitis A', type: 'serology' },
      { name: 'Hepatitis B', type: 'serology' },
      { name: 'Hepatitis C', type: 'serology' },
      { name: 'C-Reactive Protein (CRP)', type: 'blood' },
      { name: 'Rheumatoid Factor (RF)', type: 'serology' },
      { name: 'Antinuclear Antibody (ANA)', type: 'serology' },
    ]
  },
  {
    category: 'Endocrinology',
    tests: [
      { name: 'TSH', type: 'blood' },
      { name: 'T3', type: 'blood' },
      { name: 'T4', type: 'blood' },
      { name: 'Insulin Levels', type: 'blood' },
      { name: 'Cortisol', type: 'blood' },
    ]
  },
  {
    category: 'Blood Bank / Transfusion',
    tests: [
      { name: 'Blood Typing (ABO/Rh)', type: 'blood' },
      { name: 'Crossmatching', type: 'blood' },
      { name: 'Antibody Screening', type: 'blood' },
    ]
  },
  {
    category: 'Toxicology',
    tests: [
      { name: 'Drug Screening Test', type: 'special' },
      { name: 'Alcohol Level', type: 'blood' },
    ]
  },
  {
    category: 'Arterial Blood Gas (ABG)',
    tests: [
      { name: 'ABG - pH', type: 'blood' },
      { name: 'ABG - pCO2', type: 'blood' },
      { name: 'ABG - pO2', type: 'blood' },
      { name: 'ABG - HCO3', type: 'blood' },
      { name: 'Oxygen Saturation', type: 'blood' },
    ]
  },
  {
    category: 'Special Tests',
    tests: [
      { name: 'PSA', type: 'special' },
      { name: 'AFP', type: 'special' },
      { name: 'CA-125', type: 'special' },
      { name: 'Vitamin D', type: 'blood' },
      { name: 'Vitamin B12', type: 'blood' },
    ]
  },
];

const allLabTests = labTestsByCategory.flatMap(cat => cat.tests);

interface EMTNotification {
  id: string;
  patientName: string;
  age: number;
  gender: string;
  chiefComplaint: string;
  eta: string;
  priority: TriagePriority;
  ambulanceId: string;
  receivedAt: string;
  status: 'pending' | 'acknowledged' | 'arrived';
}

export function EmergencyRoom() {
  const { user } = useAuth();
  const { patients, updatePatient, addActivity, setCurrentDepartment, medications, addLabOrder, addPrescription, labOrders, prescriptions } = useEHR();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<'patients' | 'emt' | 'orders'>('patients');
  
  const isNurse = !!(user && 'role' in user && user.role === 'nurse');
  const isDoctor = !!(user && 'role' in user && user.role === 'doctor');

  const erPatients = patients.filter(p => p.department === 'er');
  const sortedByPriority = [...erPatients].sort((a, b) => (a.triagePriority || 5) - (b.triagePriority || 5));

  const erLabOrders = labOrders.filter(o => {
    const patient = patients.find(p => p.id === o.patientId);
    return patient?.department === 'er';
  });

  const erPrescriptions = prescriptions.filter(rx => {
    const patient = patients.find(p => p.id === rx.patientId);
    return patient?.department === 'er';
  });

  const [emtNotifications, setEmtNotifications] = useState<EMTNotification[]>([
    {
      id: 'EMT001',
      patientName: 'Unknown Male',
      age: 45,
      gender: 'Male',
      chiefComplaint: 'Chest pain, difficulty breathing',
      eta: '5 mins',
      priority: 2,
      ambulanceId: 'AMB-201',
      receivedAt: new Date().toISOString(),
      status: 'pending'
    }
  ]);

  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [showLabOrderForm, setShowLabOrderForm] = useState(false);
  const [showPrescribeForm, setShowPrescribeForm] = useState(false);
  const [vitalsData, setVitalsData] = useState<VitalSigns>({
    bloodPressure: '',
    heartRate: 0,
    temperature: 0,
    respiratoryRate: 0,
    oxygenSaturation: 0,
    recordedAt: new Date().toISOString()
  });
  const [selectedLabTest, setSelectedLabTest] = useState('');
  const [prescriptionData, setPrescriptionData] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    duration: ''
  });

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
    if (!isNurse) return;
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

  const handleUpdateVitals = (patient: Patient) => {
    if (!isNurse) return;
    const now = new Date().toISOString();
    const nurseName = user?.name || 'ER Nurse';
    
    const vitalsEntry: VitalSignsEntry = {
      vitals: { ...vitalsData, recordedAt: now },
      timestamp: now,
      recordedBy: nurseName
    };
    
    updatePatient({ 
      ...patient, 
      vitalSigns: { ...vitalsData, recordedAt: now },
      vitalSignsHistory: [...(patient.vitalSignsHistory || []), vitalsEntry]
    });
    addActivity({
      id: generateId(),
      type: 'vitals',
      department: 'er',
      patientId: patient.id,
      patientName: patient.name,
      description: `Vitals updated: BP ${vitalsData.bloodPressure}, HR ${vitalsData.heartRate}`,
      timestamp: now
    });
    setShowVitalsForm(false);
    setVitalsData({ bloodPressure: '', heartRate: 0, temperature: 0, respiratoryRate: 0, oxygenSaturation: 0, recordedAt: now });
  };

  const handleOrderLab = (patient: Patient, testName: string, testType: 'blood' | 'urine' | 'imaging' | 'pathology') => {
    if (!isDoctor) return;
    const order: LabOrder = {
      id: generateId(),
      patientId: patient.id,
      testName,
      testType,
      status: 'pending',
      orderedBy: user?.name || 'ER Doctor',
      date: new Date().toISOString().split('T')[0]
    };
    addLabOrder(order);
    addActivity({
      id: generateId(),
      type: 'lab-result',
      department: 'lab',
      patientId: patient.id,
      patientName: patient.name,
      description: `ER Lab test ordered: ${testName}`,
      timestamp: new Date().toISOString()
    });
    setShowLabOrderForm(false);
    setSelectedLabTest('');
  };

  const handlePrescribe = (patient: Patient) => {
    if (!isDoctor) return;
    if (!prescriptionData.medication || !prescriptionData.dosage) return;
    const rx: Prescription = {
      id: generateId(),
      patientId: patient.id,
      medication: prescriptionData.medication,
      dosage: prescriptionData.dosage,
      frequency: prescriptionData.frequency,
      duration: prescriptionData.duration,
      prescribedBy: user?.name || 'ER Doctor',
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    };
    addPrescription(rx);
    addActivity({
      id: generateId(),
      type: 'prescription',
      department: 'pharmacy',
      patientId: patient.id,
      patientName: patient.name,
      description: `ER Prescription: ${prescriptionData.medication}`,
      timestamp: new Date().toISOString()
    });
    setShowPrescribeForm(false);
    setPrescriptionData({ medication: '', dosage: '', frequency: '', duration: '' });
  };

  const handleAcknowledgeEMT = (notificationId: string) => {
    if (!isNurse) return;
    setEmtNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, status: 'acknowledged' as const } : n
    ));
    addActivity({
      id: generateId(),
      type: 'admission',
      department: 'er',
      description: `EMT notification acknowledged: ${emtNotifications.find(n => n.id === notificationId)?.ambulanceId}`,
      timestamp: new Date().toISOString()
    });
  };

  const handlePatientArrival = (notification: EMTNotification) => {
    if (!isNurse) return;
    const newPatient: Patient = {
      id: generateId(),
      name: notification.patientName,
      age: notification.age,
      gender: notification.gender as 'Male' | 'Female',
      dob: '',
      phone: '',
      address: '',
      bloodType: 'Unknown',
      allergies: [],
      status: notification.priority <= 2 ? 'critical' : 'in-treatment',
      department: 'er',
      admissionDate: new Date().toISOString(),
      triagePriority: notification.priority,
      chiefComplaint: notification.chiefComplaint,
      vitalSigns: { bloodPressure: '-', heartRate: 0, temperature: 0, respiratoryRate: 0, oxygenSaturation: 0, recordedAt: new Date().toISOString() }
    };
    updatePatient(newPatient);
    setEmtNotifications(prev => prev.map(n => 
      n.id === notification.id ? { ...n, status: 'arrived' as const } : n
    ));
    addActivity({
      id: generateId(),
      type: 'admission',
      department: 'er',
      patientId: newPatient.id,
      patientName: newPatient.name,
      description: `Patient arrived via ${notification.ambulanceId}`,
      timestamp: new Date().toISOString()
    });
  };

  const handleDischarge = (patient: Patient) => {
    if (!isDoctor) return;
    const now = new Date().toISOString();
    updatePatient({ ...patient, status: 'discharged' });
    addActivity({
      id: generateId(),
      type: 'discharge',
      department: 'er',
      patientId: patient.id,
      patientName: patient.name,
      description: `Patient discharged from ER`,
      timestamp: now
    });
    setSelectedPatient(null);
  };

  const handleAddVitalsForCompleted = (patient: Patient, vitals: VitalSigns) => {
    const now = new Date().toISOString();
    const staffName = user?.name || 'Medical Staff';
    
    const vitalsEntry: VitalSignsEntry = {
      vitals: { ...vitals, recordedAt: now },
      timestamp: now,
      recordedBy: staffName
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
      department: 'er' as const,
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
      department: 'er' as const,
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
      department: 'er' as const,
      patientId: patient.id,
      patientName: patient.name,
      description: `New diagnosis added: ${diagnosis}`,
      timestamp: now
    });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const isCompleted = selectedPatient?.status === 'discharged' || selectedPatient?.status === 'admitted';

  const [showAddVitals, setShowAddVitals] = useState(false);
  const [showAddNotes, setShowAddNotes] = useState(false);
  const [showAddDiagnosis, setShowAddDiagnosis] = useState(false);
  const [newNotes, setNewNotes] = useState('');
  const [newDiagnosisInput, setNewDiagnosisInput] = useState('');

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
          <h2 className="text-2xl font-bold text-slate-800">
            Emergency Room - {isNurse ? 'Nurse Station' : isDoctor ? 'Doctor Office' : 'ER'}
          </h2>
          <p className="text-slate-500">
            {isNurse ? 'Triage, vitals, and patient monitoring' : isDoctor ? 'Diagnose, order tests, and treatment' : 'Emergency department management'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="status-dot critical"></span>
          <span className="text-sm font-medium text-red-600">Live Monitoring</span>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab('patients')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'patients' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Patient Queue ({erPatients.length})
        </button>
        {isNurse && (
          <button
            onClick={() => setActiveTab('emt')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'emt' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            EMT Notifications ({emtNotifications.filter(n => n.status === 'pending').length})
          </button>
        )}
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'orders' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Orders ({erLabOrders.filter(o => o.status === 'pending').length + erPrescriptions.filter(rx => rx.status === 'pending').length})
        </button>
      </div>

      {activeTab === 'patients' && (
        <>
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
                      {isNurse && (
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
                      )}
                      {isDoctor && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Priority: {patient.triagePriority || 'N/A'}</span>
                        </div>
                      )}
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
        </>
      )}

      {activeTab === 'emt' && isNurse && (
        <div className="card">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold">EMT/Ambulance Notifications</h3>
          </div>
          <div className="divide-y divide-slate-200">
            {emtNotifications.map((notification) => (
              <div key={notification.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${notification.priority <= 2 ? 'badge-error' : notification.priority <= 3 ? 'badge-warning' : 'badge-info'}`}>
                        Priority {notification.priority}
                      </span>
                      <span className="font-semibold">{notification.ambulanceId}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        notification.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        notification.status === 'acknowledged' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {notification.status}
                      </span>
                    </div>
                    <p className="text-sm mt-1">
                      <span className="font-medium">{notification.patientName}</span> • {notification.age}y • {notification.gender}
                    </p>
                    <p className="text-sm text-slate-600">{notification.chiefComplaint}</p>
                    <p className="text-xs text-slate-500 mt-1">ETA: {notification.eta}</p>
                  </div>
                  <div className="flex gap-2">
                    {notification.status === 'pending' && (
                      <button 
                        className="btn btn-primary text-sm"
                        onClick={() => handleAcknowledgeEMT(notification.id)}
                      >
                        Acknowledge
                      </button>
                    )}
                    {notification.status === 'acknowledged' && (
                      <button 
                        className="btn btn-success text-sm"
                        onClick={() => handlePatientArrival(notification)}
                      >
                        Patient Arrived
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {emtNotifications.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No incoming EMT notifications
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold">Lab Orders</h3>
            </div>
            <div className="divide-y divide-slate-200">
              {erLabOrders.map((order) => (
                <div key={order.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{order.testName}</p>
                      <p className="text-sm text-slate-500">Patient: {patients.find(p => p.id === order.patientId)?.name}</p>
                      <p className="text-xs text-slate-400">Ordered by: {order.orderedBy}</p>
                    </div>
                    <span className={`badge ${order.status === 'pending' ? 'badge-warning' : order.status === 'in-progress' ? 'badge-info' : 'badge-success'}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
              {erLabOrders.length === 0 && (
                <div className="p-8 text-center text-slate-500">No lab orders</div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold">Prescriptions</h3>
            </div>
            <div className="divide-y divide-slate-200">
              {erPrescriptions.map((rx) => (
                <div key={rx.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{rx.medication}</p>
                      <p className="text-sm text-slate-500">{rx.dosage} • {rx.frequency} • {rx.duration}</p>
                      <p className="text-sm text-slate-500">Patient: {patients.find(p => p.id === rx.patientId)?.name}</p>
                    </div>
                    <span className={`badge ${rx.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>
                      {rx.status}
                    </span>
                  </div>
                </div>
              ))}
              {erPrescriptions.length === 0 && (
                <div className="p-8 text-center text-slate-500">No prescriptions</div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedPatient(null)}>
          <div className="bg-white rounded-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className={`p-6 border-b border-slate-200 ${selectedPatient.triagePriority === 1 ? 'bg-red-50' : selectedPatient.triagePriority === 2 ? 'bg-orange-50' : 'bg-white'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{selectedPatient.name}</h3>
                  <p className="text-slate-500">{selectedPatient.id} • {selectedPatient.age} years • {selectedPatient.gender}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${getTriageClass(selectedPatient.triagePriority)} px-4 py-2`}>
                    Priority {selectedPatient.triagePriority || '?'}
                  </span>
                  {isCompleted && (
                    <span className="badge badge-success">Discharged</span>
                  )}
                </div>
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
                <div>
                  <p className="text-sm text-slate-500">Chief Complaint</p>
                  <p className="font-semibold">{selectedPatient.chiefComplaint || 'Not recorded'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <p className="font-semibold capitalize">{selectedPatient.status}</p>
                </div>
                {selectedPatient.diagnosis && (
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500">Diagnosis</p>
                    <p className="font-semibold">{selectedPatient.diagnosis}</p>
                  </div>
                )}
              </div>

              {selectedPatient.vitalSigns && (
                <div>
                  <h4 className="font-semibold mb-3">Current Vital Signs</h4>
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
                  <p className="text-xs text-slate-500 mt-2">
                    Recorded: {formatDateTime(selectedPatient.vitalSigns.recordedAt)}
                  </p>
                </div>
              )}

              {(selectedPatient.vitalSignsHistory && selectedPatient.vitalSignsHistory.length > 0) && (
                <div>
                  <h4 className="font-semibold mb-3">Vital Signs History</h4>
                  <div className="space-y-3">
                    {selectedPatient.vitalSignsHistory.map((entry, idx) => (
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

              {selectedPatient.diagnosisHistory && selectedPatient.diagnosisHistory.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Diagnosis History</h4>
                  <div className="space-y-2">
                    {selectedPatient.diagnosisHistory.map((entry, idx) => (
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

              {selectedPatient.notesHistory && selectedPatient.notesHistory.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Notes History</h4>
                  <div className="space-y-2">
                    {selectedPatient.notesHistory.map((entry, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm">{entry.notes}</p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(entry.timestamp || '')} by {entry.recordedBy}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isCompleted ? (
                <div className="border-t border-slate-200 pt-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <p className="font-semibold text-blue-800">Patient Discharged - Chart is View Only</p>
                    <p className="text-sm text-blue-600 mt-1">To add new entries, use the buttons below</p>
                  </div>
                  
                  <div className="space-y-2">
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
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Blood Pressure (e.g., 120/80)"
                            value={vitalsData.bloodPressure}
                            onChange={(e) => setVitalsData({...vitalsData, bloodPressure: e.target.value})}
                            className="px-3 py-2 border border-slate-300 rounded-lg"
                          />
                          <input
                            type="number"
                            placeholder="Heart Rate (e.g., 72)"
                            value={vitalsData.heartRate || ''}
                            onChange={(e) => setVitalsData({...vitalsData, heartRate: parseInt(e.target.value) || 0})}
                            className="px-3 py-2 border border-slate-300 rounded-lg"
                          />
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Temperature (e.g., 98.6)"
                            value={vitalsData.temperature || ''}
                            onChange={(e) => setVitalsData({...vitalsData, temperature: parseFloat(e.target.value) || 0})}
                            className="px-3 py-2 border border-slate-300 rounded-lg"
                          />
                          <input
                            type="number"
                            placeholder="Respiratory Rate (e.g., 16)"
                            value={vitalsData.respiratoryRate || ''}
                            onChange={(e) => setVitalsData({...vitalsData, respiratoryRate: parseInt(e.target.value) || 0})}
                            className="px-3 py-2 border border-slate-300 rounded-lg"
                          />
                          <input
                            type="number"
                            placeholder="SpO2 (e.g., 98)"
                            value={vitalsData.oxygenSaturation || ''}
                            onChange={(e) => setVitalsData({...vitalsData, oxygenSaturation: parseInt(e.target.value) || 0})}
                            className="px-3 py-2 border border-slate-300 rounded-lg"
                          />
                        </div>
                        <button 
                          className="btn btn-primary"
                          onClick={() => {
                            if (vitalsData.bloodPressure && vitalsData.heartRate > 0) {
                              handleAddVitalsForCompleted(selectedPatient, vitalsData);
                              setShowAddVitals(false);
                              setVitalsData({ bloodPressure: '', heartRate: 0, temperature: 0, respiratoryRate: 0, oxygenSaturation: 0, recordedAt: new Date().toISOString() });
                            }
                          }}
                        >
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
                      </svg>
                      <span className="font-medium">Add New Progress Note</span>
                    </button>
                    {showAddNotes && (
                      <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                        <textarea
                          value={newNotes}
                          onChange={(e) => setNewNotes(e.target.value)}
                          placeholder="Enter new progress note..."
                          className="w-full h-24 px-3 py-2 border border-slate-300 rounded-lg"
                        />
                        <button 
                          className="btn btn-primary"
                          onClick={() => {
                            if (newNotes.trim()) {
                              handleAddNotesForCompleted(selectedPatient, newNotes);
                              setShowAddNotes(false);
                              setNewNotes('');
                            }
                          }}
                        >
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
                          className="w-full h-24 px-3 py-2 border border-slate-300 rounded-lg"
                        />
                        <button 
                          className="btn btn-primary"
                          onClick={() => {
                            if (newDiagnosisInput.trim()) {
                              handleAddDiagnosisForCompleted(selectedPatient, newDiagnosisInput);
                              setShowAddDiagnosis(false);
                              setNewDiagnosisInput('');
                            }
                          }}
                        >
                          Save Diagnosis
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border-t border-slate-200 pt-4">
                  <h4 className="font-semibold mb-3">Actions</h4>
                  <div className="space-y-3">
                    {isNurse && (
                      <>
                        <button 
                          className="w-full p-3 border border-slate-200 rounded-lg text-left hover:bg-slate-50"
                          onClick={() => setShowVitalsForm(!showVitalsForm)}
                        >
                          <span className="font-medium">Record Vitals</span>
                          <p className="text-sm text-slate-500">Update patient vital signs</p>
                        </button>
                        
                        {showVitalsForm && (
                          <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="Blood Pressure (e.g., 120/80)"
                                value={vitalsData.bloodPressure}
                                onChange={(e) => setVitalsData({...vitalsData, bloodPressure: e.target.value})}
                                className="px-3 py-2 border border-slate-300 rounded-lg"
                              />
                              <input
                                type="number"
                                placeholder="Heart Rate (e.g., 72)"
                                value={vitalsData.heartRate || ''}
                                onChange={(e) => setVitalsData({...vitalsData, heartRate: parseInt(e.target.value) || 0})}
                                className="px-3 py-2 border border-slate-300 rounded-lg"
                              />
                              <input
                                type="number"
                                step="0.1"
                                placeholder="Temperature (e.g., 98.6)"
                                value={vitalsData.temperature || ''}
                                onChange={(e) => setVitalsData({...vitalsData, temperature: parseFloat(e.target.value) || 0})}
                                className="px-3 py-2 border border-slate-300 rounded-lg"
                              />
                              <input
                                type="number"
                                placeholder="Respiratory Rate (e.g., 16)"
                                value={vitalsData.respiratoryRate || ''}
                                onChange={(e) => setVitalsData({...vitalsData, respiratoryRate: parseInt(e.target.value) || 0})}
                                className="px-3 py-2 border border-slate-300 rounded-lg"
                              />
                              <input
                                type="number"
                                placeholder="SpO2 (e.g., 98)"
                                value={vitalsData.oxygenSaturation || ''}
                                onChange={(e) => setVitalsData({...vitalsData, oxygenSaturation: parseInt(e.target.value) || 0})}
                                className="px-3 py-2 border border-slate-300 rounded-lg"
                              />
                            </div>
                            <button 
                              className="btn btn-primary"
                              onClick={() => handleUpdateVitals(selectedPatient)}
                            >
                              Save Vitals
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {isDoctor && (
                      <>
                        <button 
                          className="w-full p-3 border border-slate-200 rounded-lg text-left hover:bg-slate-50"
                          onClick={() => setShowLabOrderForm(!showLabOrderForm)}
                        >
                          <span className="font-medium">Order Lab Test</span>
                          <p className="text-sm text-slate-500">Request blood work, imaging, etc.</p>
                        </button>
                        
                        {showLabOrderForm && (
                          <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                            <select 
                              value={selectedLabTest}
                              onChange={(e) => setSelectedLabTest(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            >
                              <option value="">Select Lab Test</option>
                              {allLabTests.map((test: { name: string; type: string }) => (
                                <option key={test.name} value={test.name}>{test.name}</option>
                              ))}
                            </select>
                            <button 
                              className="btn btn-primary"
                              onClick={() => {
                                if (selectedLabTest) {
                                  const test = allLabTests.find((t: { name: string; type: string }) => t.name === selectedLabTest);
                                  if (test) {
                                    handleOrderLab(selectedPatient, test.name, test.type as any);
                                  }
                                }
                              }}
                            >
                              Submit Lab Order
                            </button>
                          </div>
                        )}

                        <button 
                          className="w-full p-3 border border-slate-200 rounded-lg text-left hover:bg-slate-50"
                          onClick={() => setShowPrescribeForm(!showPrescribeForm)}
                        >
                          <span className="font-medium">Write Prescription</span>
                          <p className="text-sm text-slate-500">Prescribe medication</p>
                        </button>

                        {showPrescribeForm && (
                          <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                            <select 
                              value={prescriptionData.medication}
                              onChange={(e) => setPrescriptionData({...prescriptionData, medication: e.target.value})}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            >
                              <option value="">Select Medication</option>
                              {medications.map(med => (
                                <option key={med.id} value={med.name}>
                                  {med.name} ({med.stock} {med.unit} left)
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="Dosage (e.g., 500mg)"
                              value={prescriptionData.dosage}
                              onChange={(e) => setPrescriptionData({...prescriptionData, dosage: e.target.value})}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                            <input
                              type="text"
                              placeholder="Frequency (e.g., 3x daily)"
                              value={prescriptionData.frequency}
                              onChange={(e) => setPrescriptionData({...prescriptionData, frequency: e.target.value})}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                            <input
                              type="text"
                              placeholder="Duration (e.g., 7 days)"
                              value={prescriptionData.duration}
                              onChange={(e) => setPrescriptionData({...prescriptionData, duration: e.target.value})}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                            <button 
                              className="btn btn-primary"
                              onClick={() => handlePrescribe(selectedPatient)}
                            >
                              Submit Prescription
                            </button>
                          </div>
                        )}

                        <button 
                          className="w-full p-3 bg-green-50 border border-green-200 rounded-lg text-left hover:bg-green-100"
                          onClick={() => handleDischarge(selectedPatient)}
                        >
                          <span className="font-medium text-green-700">Discharge Patient</span>
                          <p className="text-sm text-green-600">Complete treatment and discharge</p>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button 
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                  onClick={() => setSelectedPatient(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
