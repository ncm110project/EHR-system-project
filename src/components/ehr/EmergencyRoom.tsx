"use client";

import { useState } from "react";
import { useEHR } from "@/lib/ehr-context";
import { useAuth } from "@/lib/auth-context";
import { Patient, TriagePriority, VitalSigns, LabOrder, Prescription, VitalSignsEntry, NotesEntry, DiagnosisEntry, ALL_DIAGNOSES } from "@/lib/ehr-data";
import { DepartmentTransfer } from "./DepartmentTransfer";
import { VitalSignsChart } from "./VitalSignsChart";
import { ConfirmDialog } from "../providers/ConfirmDialog";
import { useToast } from "../providers/ToastProvider";

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
  eventNotes?: string;
  eta: string;
  priority: TriagePriority;
  ambulanceId: string;
  receivedAt: string;
  status: 'pending' | 'acknowledged' | 'arrived';
  source: 'emt' | 'walk-in';
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    oxygenSaturation?: number;
  };
  consciousness?: 'Alert' | 'Verbal' | 'Pain' | 'Unresponsive';
  esiLevel?: string;
  bedId?: number;
  reservedBy?: string;
  arrivalTime?: string;
}

export function EmergencyRoom() {
  const { user } = useAuth();
  const { patients, updatePatient, addActivity, setCurrentDepartment, medications, addLabOrder, addPrescription, labOrders, prescriptions, emtNotifications, addEmtNotification, updateEmtNotification } = useEHR();
  const { addToast } = useToast();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showDischargeConfirm, setShowDischargeConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'patients' | 'emt' | 'orders'>('patients');
  
  const isNurse = !!(user && 'role' in user && user.role === 'nurse');
  const isDoctor = !!(user && 'role' in user && user.role === 'doctor');
  const isChargeNurse = !!(user && 'role' in user && user.role === 'charge-nurse');

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

  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [showLabOrderForm, setShowLabOrderForm] = useState(false);
  const [showPrescribeForm, setShowPrescribeForm] = useState(false);
  const [showEmtForm, setShowEmtForm] = useState(false);
  const [erBeds, setErBeds] = useState<{id: number; status: 'available' | 'reserved' | 'occupied'; patientName?: string; notificationId?: string}[]>([
    { id: 1, status: 'available' },
    { id: 2, status: 'available' },
    { id: 3, status: 'available' },
    { id: 4, status: 'available' },
    { id: 5, status: 'available' },
    { id: 6, status: 'available' },
  ]);
  const [emtFormData, setEmtFormData] = useState({
    patientName: '',
    age: 0,
    gender: 'Male' as 'Male' | 'Female',
    chiefComplaint: '',
    eventNotes: '',
    ambulanceId: '',
    etaMinutes: 15,
    vitalsBpSystolic: 0,
    vitalsBpDiastolic: 0,
    vitalsHeartRate: 0,
    vitalsOxygenSaturation: 0,
    consciousness: 'Alert' as 'Alert' | 'Verbal' | 'Pain' | 'Unresponsive',
    esiLevel: '',
    bedId: 0
  });
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
  
  const [showNurseNotes, setShowNurseNotes] = useState(false);
  const [showPainAssessment, setShowPainAssessment] = useState(false);
  const [showFDARForm, setShowFDARForm] = useState(false);
  const [showDoctorOrders, setShowDoctorOrders] = useState(false);
  const [showDoctorNotes, setShowDoctorNotes] = useState(false);
  const [nurseNoteText, setNurseNoteText] = useState('');
  const [painFormData, setPainFormData] = useState({
    score: 0,
    location: '',
    locationOther: '',
    type: '',
    typeOther: ''
  });
  const [fdarFormData, setFdarFormData] = useState({
    focus: '',
    data: '',
    action: '',
    response: ''
  });
  const [doctorOrderData, setDoctorOrderData] = useState({
    order: '',
    priority: 'routine' as 'routine' | 'urgent' | 'stat',
    instructions: ''
  });
  const [doctorNoteText, setDoctorNoteText] = useState('');

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
    const notification = emtNotifications.find(n => n.id === notificationId);
    if (notification) {
      updateEmtNotification({ ...notification, status: 'acknowledged' });
    }
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
      esiLevel: notification.esiLevel,
      notes: notification.eventNotes ? `Event Notes: ${notification.eventNotes}` : undefined,
      vitalSigns: { 
        bloodPressure: notification.vitalSigns?.bloodPressure || '-', 
        heartRate: notification.vitalSigns?.heartRate || 0, 
        temperature: 0, 
        respiratoryRate: 0, 
        oxygenSaturation: notification.vitalSigns?.oxygenSaturation || 0, 
        recordedAt: new Date().toISOString() 
      }
    };
    updatePatient(newPatient);
    
    if (notification.bedId) {
      setErBeds(prev => prev.map(bed => 
        bed.id === notification.bedId 
          ? { ...bed, status: 'occupied', patientName: notification.patientName } 
          : bed
      ));
    }
    
    updateEmtNotification({ ...notification, status: 'arrived', arrivalTime: new Date().toISOString() });
    addActivity({
      id: generateId(),
      type: 'admission',
      department: 'er',
      patientId: newPatient.id,
      patientName: newPatient.name,
      description: `Patient arrived via ${notification.ambulanceId || 'EMT'}`,
      timestamp: new Date().toISOString()
    });
    addToast(`${notification.patientName} has arrived and registered`, "success");
  };

  const handleAddEmtCase = () => {
    if (!emtFormData.patientName || !emtFormData.chiefComplaint) {
      addToast("Please fill in patient name and chief complaint", "error");
      return;
    }
    const newEmt: EMTNotification = {
      id: generateId(),
      patientName: emtFormData.patientName,
      age: emtFormData.age,
      gender: emtFormData.gender,
      chiefComplaint: emtFormData.chiefComplaint,
      eventNotes: emtFormData.eventNotes,
      eta: `${emtFormData.etaMinutes} mins`,
      priority: emtFormData.esiLevel ? (parseInt(emtFormData.esiLevel.split('-')[1]) as TriagePriority) || 3 : 3,
      ambulanceId: emtFormData.ambulanceId || 'EMT-CALL',
      receivedAt: new Date().toISOString(),
      status: 'acknowledged',
      source: 'emt',
      vitalSigns: emtFormData.vitalsHeartRate || emtFormData.vitalsOxygenSaturation ? {
        bloodPressure: emtFormData.vitalsBpSystolic && emtFormData.vitalsBpDiastolic 
          ? `${emtFormData.vitalsBpSystolic}/${emtFormData.vitalsBpDiastolic}` 
          : undefined,
        heartRate: emtFormData.vitalsHeartRate || undefined,
        oxygenSaturation: emtFormData.vitalsOxygenSaturation || undefined
      } : undefined,
      consciousness: emtFormData.consciousness,
      esiLevel: emtFormData.esiLevel || undefined,
      bedId: emtFormData.bedId || undefined,
      reservedBy: user?.name
    };
    
    if (emtFormData.bedId) {
      setErBeds(prev => prev.map(bed => 
        bed.id === emtFormData.bedId 
          ? { ...bed, status: 'reserved', patientName: emtFormData.patientName, notificationId: newEmt.id } 
          : bed
      ));
    }
    
    addEmtNotification(newEmt);
    setShowEmtForm(false);
    setEmtFormData({
      patientName: '',
      age: 0,
      gender: 'Male',
      chiefComplaint: '',
      eventNotes: '',
      ambulanceId: '',
      etaMinutes: 15,
      vitalsBpSystolic: 0,
      vitalsBpDiastolic: 0,
      vitalsHeartRate: 0,
      vitalsOxygenSaturation: 0,
      consciousness: 'Alert',
      esiLevel: '',
      bedId: 0
    });
    addToast("EMT case logged successfully", "success");
  };

  const handleReleaseBed = (bedId: number) => {
    if (!isChargeNurse) return;
    setErBeds(prev => prev.map(bed => 
      bed.id === bedId 
        ? { ...bed, status: 'available', patientName: undefined, notificationId: undefined } 
        : bed
    ));
    addToast(`Bed ${bedId} released`, "success");
  };

  const handleAddNurseNote = (patient: Patient) => {
    if (!isNurse || !nurseNoteText.trim()) return;
    const now = new Date().toISOString();
    const noteEntry: NotesEntry = {
      notes: nurseNoteText,
      noteType: 'nurse',
      recordedBy: user?.name || 'ER Nurse',
      timestamp: now
    };
    updatePatient({
      ...patient,
      notesHistory: [...(patient.notesHistory || []), noteEntry]
    });
    addActivity({
      id: generateId(),
      type: 'notes',
      department: 'er',
      patientId: patient.id,
      patientName: patient.name,
      description: `Nurse note added`,
      timestamp: now
    });
    setNurseNoteText('');
    setShowNurseNotes(false);
    addToast("Nurse note saved", "success");
  };

  const handleAddPainAssessment = (patient: Patient) => {
    if (!isNurse) return;
    const now = new Date().toISOString();
    const painEntry = {
      painScore: painFormData.score,
      painLocation: painFormData.location === 'Other' ? painFormData.locationOther : painFormData.location,
      painType: painFormData.type === 'Other' ? painFormData.typeOther : painFormData.type,
      recordedBy: user?.name || 'ER Nurse',
      recordedAt: now
    };
    updatePatient({
      ...patient,
      vitalSigns: { ...patient.vitalSigns!, painScore: painFormData.score },
      vitalSignsHistory: [...(patient.vitalSignsHistory || []), {
        vitals: { ...patient.vitalSigns!, painScore: painFormData.score, recordedAt: now },
        timestamp: now,
        recordedBy: user?.name || 'ER Nurse'
      }]
    });
    addActivity({
      id: generateId(),
      type: 'notes',
      department: 'er',
      patientId: patient.id,
      patientName: patient.name,
      description: `Pain assessment: ${painFormData.score}/10, ${painFormData.location}, ${painFormData.type}`,
      timestamp: now
    });
    setPainFormData({ score: 0, location: '', locationOther: '', type: '', typeOther: '' });
    setShowPainAssessment(false);
    addToast("Pain assessment saved", "success");
  };

  const handleAddFDARNote = (patient: Patient) => {
    if (!isNurse || !fdarFormData.focus.trim()) return;
    const now = new Date().toISOString();
    const fdarEntry: NotesEntry = {
      notes: `F: ${fdarFormData.focus}\nD: ${fdarFormData.data}\nA: ${fdarFormData.action}\nR: ${fdarFormData.response}`,
      noteType: 'FDAR',
      recordedBy: user?.name || 'ER Nurse',
      timestamp: now
    };
    updatePatient({
      ...patient,
      nursingNotesHistory: [...(patient.nursingNotesHistory || []), fdarEntry],
      notesHistory: [...(patient.notesHistory || []), fdarEntry]
    });
    addActivity({
      id: generateId(),
      type: 'notes',
      department: 'er',
      patientId: patient.id,
      patientName: patient.name,
      description: `FDAR note added`,
      timestamp: now
    });
    setFdarFormData({ focus: '', data: '', action: '', response: '' });
    setShowFDARForm(false);
    addToast("FDAR note saved", "success");
  };

  const handleAddDoctorOrder = (patient: Patient) => {
    if (!isDoctor || !doctorOrderData.order.trim()) return;
    const now = new Date().toISOString();
    const orderEntry: NotesEntry = {
      notes: `ORDER: ${doctorOrderData.order}\nPriority: ${doctorOrderData.priority}\nInstructions: ${doctorOrderData.instructions || 'None'}`,
      noteType: 'order',
      recordedBy: user?.name || 'ER Doctor',
      timestamp: now
    };
    updatePatient({
      ...patient,
      notesHistory: [...(patient.notesHistory || []), orderEntry]
    });
    addActivity({
      id: generateId(),
      type: 'notes',
      department: 'er',
      patientId: patient.id,
      patientName: patient.name,
      description: `Doctor order: ${doctorOrderData.order}`,
      timestamp: now
    });
    setDoctorOrderData({ order: '', priority: 'routine', instructions: '' });
    setShowDoctorOrders(false);
    addToast("Doctor order added", "success");
  };

  const handleAddDoctorNote = (patient: Patient) => {
    if (!isDoctor || !doctorNoteText.trim()) return;
    const now = new Date().toISOString();
    const noteEntry: NotesEntry = {
      notes: doctorNoteText,
      noteType: 'doctor',
      recordedBy: user?.name || 'ER Doctor',
      timestamp: now
    };
    updatePatient({
      ...patient,
      notesHistory: [...(patient.notesHistory || []), noteEntry]
    });
    addActivity({
      id: generateId(),
      type: 'notes',
      department: 'er',
      patientId: patient.id,
      patientName: patient.name,
      description: `Doctor note added`,
      timestamp: now
    });
    setDoctorNoteText('');
    setShowDoctorNotes(false);
    addToast("Doctor note saved", "success");
  };

  const confirmDischarge = () => {
    if (!selectedPatient || !isDoctor) return;
    const now = new Date().toISOString();
    updatePatient({ ...selectedPatient, status: 'discharged' });
    addActivity({
      id: generateId(),
      type: 'discharge',
      department: 'er',
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      description: `Patient discharged from ER`,
      timestamp: now
    });
    addToast(`${selectedPatient.name} has been discharged from ER`, "success");
    setShowDischargeConfirm(false);
    setSelectedPatient(null);
  };

  const handleDischarge = (patient: Patient) => {
    if (!isDoctor) return;
    setSelectedPatient(patient);
    setShowDischargeConfirm(true);
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

  const handleAddDiagnosisForCompleted = (patient: Patient, diagnosis: string, diagnosisNotes?: string) => {
    const now = new Date().toISOString();
    const doctorName = user?.name || 'Doctor';
    
    const diagnosisEntry: DiagnosisEntry = {
      diagnosis,
      diagnosisNotes,
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

  const handleDiagnosisSearch = (query: string) => {
    setNewDiagnosisInput(query);
    if (query.length > 0) {
      const filtered = ALL_DIAGNOSES.filter(d => 
        d.toLowerCase().includes(query.toLowerCase())
      );
      setDiagnosisSuggestions(filtered);
      setShowDiagnosisSuggestions(true);
    } else {
      setShowDiagnosisSuggestions(false);
    }
  };

  const handleDiagnosisSelect = (diagnosis: string) => {
    setNewDiagnosisInput(diagnosis);
    setShowDiagnosisSuggestions(false);
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
  const [newDiagnosisNotes, setNewDiagnosisNotes] = useState('');
  const [diagnosisSuggestions, setDiagnosisSuggestions] = useState<string[]>([]);
  const [showDiagnosisSuggestions, setShowDiagnosisSuggestions] = useState(false);

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
            Emergency Room - {isChargeNurse ? 'Charge Nurse' : isNurse ? 'Nurse Station' : isDoctor ? 'Doctor Office' : 'ER'}
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
        {isNurse || isChargeNurse ? (
          <>
            <button
              onClick={() => setActiveTab('emt')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'emt' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Incoming EMT ({emtNotifications.filter(n => n.status !== 'arrived').length})
            </button>
            {isChargeNurse && (
              <button
                onClick={() => setShowEmtForm(true)}
                className="px-4 py-2 rounded-lg font-medium transition-colors bg-red-600 text-white hover:bg-red-700"
              >
                + Log EMT Call
              </button>
            )}
          </>
        ) : null}
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
                  {erBeds.map((bed) => {
                    const patient = erPatients.find((p, idx) => idx === bed.id - 1);
                    const reservedNotification = bed.notificationId ? emtNotifications.find(n => n.id === bed.notificationId) : null;
                    return (
                      <div 
                        key={bed.id}
                        className={`p-2 rounded-lg text-center text-sm ${
                          bed.status === 'available' ? 'bg-green-50 border border-green-200' :
                          bed.status === 'reserved' ? 'bg-yellow-50 border border-yellow-200' :
                          'bg-red-50 border border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">Bay {bed.id}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            bed.status === 'available' ? 'bg-green-200 text-green-800' :
                            bed.status === 'reserved' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-red-200 text-red-800'
                          }`}>
                            {bed.status}
                          </span>
                        </div>
                        {bed.status === 'occupied' && patient && (
                          <p className="font-medium truncate text-xs">{patient.name}</p>
                        )}
                        {bed.status === 'reserved' && bed.patientName && (
                          <div className="text-xs">
                            <p className="font-medium truncate">{bed.patientName}</p>
                            <p className="text-slate-500">Reserved</p>
                            {isChargeNurse && (
                              <button 
                                onClick={() => handleReleaseBed(bed.id)}
                                className="text-xs text-red-600 hover:underline mt-1"
                              >
                                Release
                              </button>
                            )}
                          </div>
                        )}
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
          <div className="bg-white rounded-xl max-w-5xl w-full mx-4 max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
              <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-4 mb-4">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Patient Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Patient ID</p>
                    <p className="font-semibold text-sm">{selectedPatient.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Age / Gender</p>
                    <p className="font-semibold text-sm">{selectedPatient.age} yrs / {selectedPatient.gender}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Blood Type</p>
                    <p className="font-semibold text-sm">{selectedPatient.bloodType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Status</p>
                    <p className="font-semibold text-sm capitalize">{selectedPatient.status}</p>
                  </div>
                  {selectedPatient.chiefComplaint && (
                    <div className="col-span-2 md:col-span-4">
                      <p className="text-xs text-slate-500">Chief Complaint</p>
                      <p className="font-semibold text-sm">{selectedPatient.chiefComplaint}</p>
                    </div>
                  )}
                  {selectedPatient.diagnosis && (
                    <div className="col-span-2 md:col-span-4">
                      <p className="text-xs text-slate-500">Current Diagnosis</p>
                      <p className="font-semibold text-sm">{selectedPatient.diagnosis}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-800 mb-3 border-b pb-2">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Full Name:</span><span className="font-medium">{selectedPatient.name}</span></div>
                    {selectedPatient.firstName && <div className="flex justify-between"><span className="text-slate-500">First Name:</span><span className="font-medium">{selectedPatient.firstName}</span></div>}
                    {selectedPatient.middleName && <div className="flex justify-between"><span className="text-slate-500">Middle Name:</span><span className="font-medium">{selectedPatient.middleName}</span></div>}
                    {selectedPatient.lastName && <div className="flex justify-between"><span className="text-slate-500">Last Name:</span><span className="font-medium">{selectedPatient.lastName}</span></div>}
                    <div className="flex justify-between"><span className="text-slate-500">Date of Birth:</span><span className="font-medium">{selectedPatient.dob || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Age:</span><span className="font-medium">{selectedPatient.age} years</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Sex:</span><span className="font-medium">{selectedPatient.gender}</span></div>
                    {selectedPatient.civilStatus && <div className="flex justify-between"><span className="text-slate-500">Civil Status:</span><span className="font-medium">{selectedPatient.civilStatus}</span></div>}
                    {selectedPatient.religion && <div className="flex justify-between"><span className="text-slate-500">Religion:</span><span className="font-medium">{selectedPatient.religion}</span></div>}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-800 mb-3 border-b pb-2">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Phone:</span><span className="font-medium">{selectedPatient.phone || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Email:</span><span className="font-medium">{selectedPatient.email || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Address:</span><span className="font-medium">{selectedPatient.address || '-'}</span></div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-800 mb-3 border-b pb-2">Emergency Contact</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Contact:</span><span className="font-medium">{selectedPatient.emergencyContact || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Phone:</span><span className="font-medium">{selectedPatient.emergencyPhone || '-'}</span></div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-800 mb-3 border-b pb-2">Medical Background</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-slate-500">Medical Conditions:</p>
                      <p className="font-medium">{(selectedPatient.medicalConditions || []).length > 0 ? selectedPatient.medicalConditions?.join(', ') : 'None recorded'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Allergies:</p>
                      <p className="font-medium">{(selectedPatient.allergies || []).length > 0 ? selectedPatient.allergies?.join(', ') : 'None'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Current Medications:</p>
                      <p className="font-medium">{selectedPatient.currentMedications || 'None recorded'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Past Surgeries:</p>
                      <p className="font-medium">{selectedPatient.pastSurgeries || 'None recorded'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-800 mb-3 border-b pb-2">Lifestyle Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Smoking:</span><span className="font-medium">{selectedPatient.smoking || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Alcohol Use:</span><span className="font-medium">{selectedPatient.alcoholUse || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Occupation:</span><span className="font-medium">{selectedPatient.occupation || '-'}</span></div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-800 mb-3 border-b pb-2">Insurance Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Insurance Status:</span><span className="font-medium">{selectedPatient.insuranceStatus ? 'Insured' : 'Self-Pay'}</span></div>
                    {selectedPatient.insuranceProvider && <div className="flex justify-between"><span className="text-slate-500">Provider:</span><span className="font-medium">{selectedPatient.insuranceProvider}</span></div>}
                    {selectedPatient.policyNumber && <div className="flex justify-between"><span className="text-slate-500">Policy #:</span><span className="font-medium">{selectedPatient.policyNumber}</span></div>}
                    {selectedPatient.memberId && <div className="flex justify-between"><span className="text-slate-500">Member ID:</span><span className="font-medium">{selectedPatient.memberId}</span></div>}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4 md:col-span-2">
                  <h4 className="font-semibold text-slate-800 mb-3 border-b pb-2">Triage Information</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">ESI Level</p>
                      <p className="font-semibold">{selectedPatient.esiLevel || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Department</p>
                      <p className="font-semibold capitalize">{selectedPatient.department}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Arrival Mode</p>
                      <p className="font-semibold capitalize">{selectedPatient.arrivalMode || 'Walk-in'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Triage Time</p>
                      <p className="font-semibold">{selectedPatient.triageTimestamp ? formatDateTime(selectedPatient.triageTimestamp) : selectedPatient.admissionDate || '-'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Triaged By</p>
                      <p className="font-semibold">{selectedPatient.triagedBy || 'Triage Nurse'}</p>
                    </div>
                    {selectedPatient.height && (
                      <div>
                        <p className="text-slate-500">Height</p>
                        <p className="font-semibold">{selectedPatient.height} cm</p>
                      </div>
                    )}
                    {selectedPatient.weight && (
                      <div>
                        <p className="text-slate-500">Weight</p>
                        <p className="font-semibold">{selectedPatient.weight} kg</p>
                      </div>
                    )}
                  </div>
                </div>
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
                </div>
              )}

              {selectedPatient.vitalSignsHistory && selectedPatient.vitalSignsHistory.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-3">Vital Signs Trends</h4>
                  <VitalSignsChart history={selectedPatient.vitalSignsHistory} />
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

              {(selectedPatient.notesHistory || selectedPatient.nursingNotesHistory) && (
                <div>
                  <h4 className="font-semibold mb-3">Clinical Notes</h4>
                  <div className="space-y-4">
                    {(selectedPatient.nursingNotesHistory || []).filter(n => n.noteType === 'FDAR').length > 0 && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h5 className="font-medium text-blue-800 mb-2">FDAR Notes</h5>
                        {selectedPatient.nursingNotesHistory?.filter(n => n.noteType === 'FDAR').map((entry, idx) => (
                          <div key={idx} className="border-b border-blue-100 pb-2 mb-2 last:border-0">
                            <p className="text-sm whitespace-pre-wrap">{entry.notes}</p>
                            <p className="text-xs text-blue-600">{formatDateTime(entry.timestamp || '')} by {entry.recordedBy} (Nurse)</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {(selectedPatient.notesHistory || []).filter(n => n.noteType === 'nurse').length > 0 && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <h5 className="font-medium text-green-800 mb-2">Nurse&apos;s Notes</h5>
                        {selectedPatient.notesHistory?.filter(n => n.noteType === 'nurse').map((entry, idx) => (
                          <div key={idx} className="border-b border-green-100 pb-2 mb-2 last:border-0">
                            <p className="text-sm">{entry.notes}</p>
                            <p className="text-xs text-green-600">{formatDateTime(entry.timestamp || '')} by {entry.recordedBy}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {(selectedPatient.notesHistory || []).filter(n => n.noteType === 'order').length > 0 && (
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <h5 className="font-medium text-purple-800 mb-2">Doctor&apos;s Orders</h5>
                        {selectedPatient.notesHistory?.filter(n => n.noteType === 'order').map((entry, idx) => (
                          <div key={idx} className="border-b border-purple-100 pb-2 mb-2 last:border-0">
                            <p className="text-sm whitespace-pre-wrap">{entry.notes}</p>
                            <p className="text-xs text-purple-600">{formatDateTime(entry.timestamp || '')} by {entry.recordedBy} (Doctor)</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {(selectedPatient.notesHistory || []).filter(n => n.noteType === 'doctor').length > 0 && (
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <h5 className="font-medium text-amber-800 mb-2">Doctor&apos;s Notes</h5>
                        {selectedPatient.notesHistory?.filter(n => n.noteType === 'doctor').map((entry, idx) => (
                          <div key={idx} className="border-b border-amber-100 pb-2 mb-2 last:border-0">
                            <p className="text-sm">{entry.notes}</p>
                            <p className="text-xs text-amber-600">{formatDateTime(entry.timestamp || '')} by {entry.recordedBy}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {(selectedPatient.notesHistory || []).filter(n => !n.noteType || n.noteType === 'progress').length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <h5 className="font-medium text-slate-800 mb-2">Other Notes</h5>
                        {selectedPatient.notesHistory?.filter(n => !n.noteType || n.noteType === 'progress').map((entry, idx) => (
                          <div key={idx} className="border-b border-slate-200 pb-2 mb-2 last:border-0">
                            <p className="text-sm">{entry.notes}</p>
                            <p className="text-xs text-slate-500">{formatDateTime(entry.timestamp || '')} by {entry.recordedBy}</p>
                          </div>
                        ))}
                      </div>
                    )}
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
                    {showAddVitals && selectedPatient.vitalSigns && selectedPatient.vitalSigns.bloodPressure && (
                      <div className="p-4 bg-slate-50 rounded-lg space-y-4">
                        {(() => {
                          const prev = selectedPatient.vitalSigns;
                          return (
                            <button 
                              onClick={() => setVitalsData({
                                bloodPressure: prev.bloodPressure || '',
                                heartRate: prev.heartRate || 0,
                                temperature: prev.temperature || 0,
                                respiratoryRate: prev.respiratoryRate || 0,
                                oxygenSaturation: prev.oxygenSaturation || 0,
                                recordedAt: new Date().toISOString()
                              })}
                              className="text-xs text-blue-600 underline hover:text-blue-800"
                            >
                              Copy from previous vitals
                            </button>
                          );
                        })()}
                        
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-medium text-slate-700">Blood Pressure</label>
                            <span className="text-xs text-slate-400">Normal: 90-140/60-90</span>
                          </div>
                          <input
                            type="text"
                            placeholder="e.g., 120/80"
                            value={vitalsData.bloodPressure}
                            onChange={(e) => setVitalsData({...vitalsData, bloodPressure: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-sm font-medium text-slate-700">Heart Rate</label>
                              <span className="text-xs text-slate-400">60-100</span>
                            </div>
                            <input
                              type="number"
                              placeholder="e.g., 72"
                              value={vitalsData.heartRate || ''}
                              onChange={(e) => setVitalsData({...vitalsData, heartRate: parseInt(e.target.value) || 0})}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-sm font-medium text-slate-700">Temperature (°C)</label>
                              <span className="text-xs text-slate-400">36.1-37.2</span>
                            </div>
                            <input
                              type="number"
                              step="0.1"
                              placeholder="e.g., 36.5"
                              value={vitalsData.temperature || ''}
                              onChange={(e) => setVitalsData({...vitalsData, temperature: parseFloat(e.target.value) || 0})}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-sm font-medium text-slate-700">Resp. Rate</label>
                              <span className="text-xs text-slate-400">12-20</span>
                            </div>
                            <input
                              type="number"
                              placeholder="e.g., 16"
                              value={vitalsData.respiratoryRate || ''}
                              onChange={(e) => setVitalsData({...vitalsData, respiratoryRate: parseInt(e.target.value) || 0})}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-sm font-medium text-slate-700">SpO2 (%)</label>
                              <span className="text-xs text-slate-400">95-100</span>
                            </div>
                            <input
                              type="number"
                              placeholder="e.g., 98"
                              value={vitalsData.oxygenSaturation || ''}
                              onChange={(e) => setVitalsData({...vitalsData, oxygenSaturation: parseInt(e.target.value) || 0})}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>
                        
                        <button 
                          className="btn btn-primary w-full"
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
                        <div className="relative">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Primary Diagnosis (Search)</label>
                          <input
                            type="text"
                            value={newDiagnosisInput}
                            onChange={(e) => handleDiagnosisSearch(e.target.value)}
                            onFocus={() => newDiagnosisInput && setShowDiagnosisSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowDiagnosisSuggestions(false), 200)}
                            placeholder="Type to search diagnosis..."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                          />
                          {showDiagnosisSuggestions && diagnosisSuggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {diagnosisSuggestions.map((suggestion, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleDiagnosisSelect(suggestion)}
                                  className="w-full px-3 py-2 text-left hover:bg-slate-50 text-sm"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosis Notes (Optional)</label>
                          <textarea
                            value={newDiagnosisNotes}
                            onChange={(e) => setNewDiagnosisNotes(e.target.value)}
                            placeholder="Detailed clinical explanation..."
                            className="w-full h-20 px-3 py-2 border border-slate-300 rounded-lg"
                          />
                        </div>
                        <button 
                          className="btn btn-primary"
                          onClick={() => {
                            if (newDiagnosisInput.trim()) {
                              handleAddDiagnosisForCompleted(selectedPatient, newDiagnosisInput, newDiagnosisNotes || undefined);
                              setShowAddDiagnosis(false);
                              setNewDiagnosisInput('');
                              setNewDiagnosisNotes('');
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

                        <button 
                          className="w-full p-3 border border-slate-200 rounded-lg text-left hover:bg-slate-50"
                          onClick={() => setShowNurseNotes(!showNurseNotes)}
                        >
                          <span className="font-medium">Add Nurse&apos;s Notes</span>
                          <p className="text-sm text-slate-500">Document observations and care</p>
                        </button>
                        {showNurseNotes && (
                          <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                            <textarea
                              value={nurseNoteText}
                              onChange={(e) => setNurseNoteText(e.target.value)}
                              placeholder="Enter nurse notes..."
                              className="w-full h-24 px-3 py-2 border border-slate-300 rounded-lg"
                            />
                            <button className="btn btn-primary" onClick={() => handleAddNurseNote(selectedPatient)}>
                              Save Nurse Note
                            </button>
                          </div>
                        )}

                        <button 
                          className="w-full p-3 border border-slate-200 rounded-lg text-left hover:bg-slate-50"
                          onClick={() => setShowPainAssessment(!showPainAssessment)}
                        >
                          <span className="font-medium">Pain Assessment</span>
                          <p className="text-sm text-slate-500">Record pain score and details</p>
                        </button>
                        {showPainAssessment && (
                          <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                            <div>
                              <label className="text-sm font-medium text-slate-700 mb-1">Pain Score (0-10)</label>
                              <div className="flex gap-1">
                                {[0,1,2,3,4,5,6,7,8,9,10].map(score => (
                                  <button
                                    key={score}
                                    type="button"
                                    onClick={() => setPainFormData({...painFormData, score})}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded border ${
                                      painFormData.score === score ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-600 border-slate-300'
                                    }`}
                                  >{score}</button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-700 mb-1">Pain Location</label>
                              <select value={painFormData.location} onChange={(e) => setPainFormData({...painFormData, location: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                                <option value="">Select location</option>
                                <option value="Head">Head</option>
                                <option value="Chest">Chest</option>
                                <option value="Abdomen">Abdomen</option>
                                <option value="Back">Back</option>
                                <option value="Arm">Arm</option>
                                <option value="Leg">Leg</option>
                                <option value="Other">Other</option>
                              </select>
                              {painFormData.location === 'Other' && (
                                <input type="text" value={painFormData.locationOther} onChange={(e) => setPainFormData({...painFormData, locationOther: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg mt-2" placeholder="Specify location" />
                              )}
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-700 mb-1">Pain Type</label>
                              <select value={painFormData.type} onChange={(e) => setPainFormData({...painFormData, type: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                                <option value="">Select type</option>
                                <option value="Sharp">Sharp</option>
                                <option value="Dull">Dull</option>
                                <option value="Throbbing">Throbbing</option>
                                <option value="Burning">Burning</option>
                                <option value="Other">Other</option>
                              </select>
                              {painFormData.type === 'Other' && (
                                <input type="text" value={painFormData.typeOther} onChange={(e) => setPainFormData({...painFormData, typeOther: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg mt-2" placeholder="Specify type" />
                              )}
                            </div>
                            <button className="btn btn-primary" onClick={() => handleAddPainAssessment(selectedPatient)}>
                              Save Pain Assessment
                            </button>
                          </div>
                        )}

                        <button 
                          className="w-full p-3 border border-slate-200 rounded-lg text-left hover:bg-slate-50"
                          onClick={() => setShowFDARForm(!showFDARForm)}
                        >
                          <span className="font-medium">FDAR Notes</span>
                          <p className="text-sm text-slate-500">Focus, Data, Action, Response</p>
                        </button>
                        {showFDARForm && (
                          <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                            <input type="text" value={fdarFormData.focus} onChange={(e) => setFdarFormData({...fdarFormData, focus: e.target.value})} placeholder="Focus (e.g., Pain management)" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                            <textarea value={fdarFormData.data} onChange={(e) => setFdarFormData({...fdarFormData, data: e.target.value})} placeholder="Data (Assessment findings)" className="w-full h-16 px-3 py-2 border border-slate-300 rounded-lg" />
                            <textarea value={fdarFormData.action} onChange={(e) => setFdarFormData({...fdarFormData, action: e.target.value})} placeholder="Action (Interventions performed)" className="w-full h-16 px-3 py-2 border border-slate-300 rounded-lg" />
                            <textarea value={fdarFormData.response} onChange={(e) => setFdarFormData({...fdarFormData, response: e.target.value})} placeholder="Response (Patient response)" className="w-full h-16 px-3 py-2 border border-slate-300 rounded-lg" />
                            <button className="btn btn-primary" onClick={() => handleAddFDARNote(selectedPatient)}>
                              Save FDAR Note
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
                          className="w-full p-3 border border-slate-200 rounded-lg text-left hover:bg-slate-50"
                          onClick={() => setShowDoctorOrders(!showDoctorOrders)}
                        >
                          <span className="font-medium">Doctor&apos;s Orders</span>
                          <p className="text-sm text-slate-500">Create orders for nurses</p>
                        </button>
                        {showDoctorOrders && (
                          <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                            <textarea
                              value={doctorOrderData.order}
                              onChange={(e) => setDoctorOrderData({...doctorOrderData, order: e.target.value})}
                              placeholder="Enter order details..."
                              className="w-full h-20 px-3 py-2 border border-slate-300 rounded-lg"
                            />
                            <select value={doctorOrderData.priority} onChange={(e) => setDoctorOrderData({...doctorOrderData, priority: e.target.value as any})} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                              <option value="routine">Routine</option>
                              <option value="urgent">Urgent</option>
                              <option value="stat">STAT</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Special instructions (e.g., oral, IV, PRN)"
                              value={doctorOrderData.instructions}
                              onChange={(e) => setDoctorOrderData({...doctorOrderData, instructions: e.target.value})}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                            <button className="btn btn-primary" onClick={() => handleAddDoctorOrder(selectedPatient)}>
                              Save Order
                            </button>
                          </div>
                        )}

                        <button 
                          className="w-full p-3 border border-slate-200 rounded-lg text-left hover:bg-slate-50"
                          onClick={() => setShowDoctorNotes(!showDoctorNotes)}
                        >
                          <span className="font-medium">Doctor&apos;s Notes</span>
                          <p className="text-sm text-slate-500">Add clinical notes</p>
                        </button>
                        {showDoctorNotes && (
                          <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                            <textarea
                              value={doctorNoteText}
                              onChange={(e) => setDoctorNoteText(e.target.value)}
                              placeholder="Enter doctor notes..."
                              className="w-full h-24 px-3 py-2 border border-slate-300 rounded-lg"
                            />
                            <button className="btn btn-primary" onClick={() => handleAddDoctorNote(selectedPatient)}>
                              Save Doctor Note
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

                        <button 
                          className="w-full p-3 bg-teal-50 border border-teal-200 rounded-lg text-left hover:bg-teal-100"
                          onClick={() => setShowTransfer(true)}
                        >
                          <span className="font-medium text-teal-700">Transfer Patient</span>
                          <p className="text-sm text-teal-600">Transfer to another department</p>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {showTransfer && selectedPatient && (
                <DepartmentTransfer 
                  patient={selectedPatient} 
                  onClose={() => setShowTransfer(false)} 
                />
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

      <ConfirmDialog
        isOpen={showDischargeConfirm}
        title="Confirm Discharge"
        message={`Are you sure you want to discharge ${selectedPatient?.name} from ER? This action cannot be undone.`}
        confirmLabel="Discharge"
        confirmVariant="danger"
        onConfirm={confirmDischarge}
        onCancel={() => setShowDischargeConfirm(false)}
      />

      {showEmtForm && isChargeNurse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Log EMT Incoming Call</h3>
              <button onClick={() => setShowEmtForm(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name</label>
                <input type="text" value={emtFormData.patientName} onChange={(e) => setEmtFormData({...emtFormData, patientName: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Name or Unknown" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                <input type="number" value={emtFormData.age || ''} onChange={(e) => setEmtFormData({...emtFormData, age: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Age" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sex</label>
                <select value={emtFormData.gender} onChange={(e) => setEmtFormData({...emtFormData, gender: e.target.value as 'Male' | 'Female'})} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ambulance ID</label>
                <input type="text" value={emtFormData.ambulanceId} onChange={(e) => setEmtFormData({...emtFormData, ambulanceId: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="AMB-XXX" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Chief Complaint <span className="text-red-500">*</span></label>
                <input type="text" value={emtFormData.chiefComplaint} onChange={(e) => setEmtFormData({...emtFormData, chiefComplaint: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Primary complaint" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Event Notes</label>
                <textarea value={emtFormData.eventNotes} onChange={(e) => setEmtFormData({...emtFormData, eventNotes: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg h-20" placeholder="What led to the emergency (e.g., MVA, collapsed at home)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ETA (minutes)</label>
                <input type="number" value={emtFormData.etaMinutes} onChange={(e) => setEmtFormData({...emtFormData, etaMinutes: parseInt(e.target.value) || 15})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ESI Level</label>
                <select value={emtFormData.esiLevel} onChange={(e) => setEmtFormData({...emtFormData, esiLevel: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                  <option value="">Select ESI</option>
                  <option value="ESI-1">ESI-1 (Resuscitation)</option>
                  <option value="ESI-2">ESI-2 (Emergency)</option>
                  <option value="ESI-3">ESI-3 (Urgent)</option>
                  <option value="ESI-4">ESI-4 (Less Urgent)</option>
                  <option value="ESI-5">ESI-5 (Non-Urgent)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Blood Pressure (Systolic)</label>
                <input type="number" value={emtFormData.vitalsBpSystolic || ''} onChange={(e) => setEmtFormData({...emtFormData, vitalsBpSystolic: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="120" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Blood Pressure (Diastolic)</label>
                <input type="number" value={emtFormData.vitalsBpDiastolic || ''} onChange={(e) => setEmtFormData({...emtFormData, vitalsBpDiastolic: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="80" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Heart Rate (bpm)</label>
                <input type="number" value={emtFormData.vitalsHeartRate || ''} onChange={(e) => setEmtFormData({...emtFormData, vitalsHeartRate: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="72" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SpO2 (%)</label>
                <input type="number" value={emtFormData.vitalsOxygenSaturation || ''} onChange={(e) => setEmtFormData({...emtFormData, vitalsOxygenSaturation: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="98" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Level of Consciousness</label>
                <select value={emtFormData.consciousness} onChange={(e) => setEmtFormData({...emtFormData, consciousness: e.target.value as 'Alert' | 'Verbal' | 'Pain' | 'Unresponsive'})} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                  <option value="Alert">Alert</option>
                  <option value="Verbal">Verbal</option>
                  <option value="Pain">Pain</option>
                  <option value="Unresponsive">Unresponsive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reserve Bed</label>
                <select value={emtFormData.bedId || ''} onChange={(e) => setEmtFormData({...emtFormData, bedId: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                  <option value="">No bed reservation</option>
                  {erBeds.filter(b => b.status === 'available').map(bed => (
                    <option key={bed.id} value={bed.id}>Bay {bed.id} - Available</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowEmtForm(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={handleAddEmtCase} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Log Case</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
