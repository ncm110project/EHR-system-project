"use client";

import { useState } from "react";
import { useEHR } from "@/lib/ehr-context";
import { useAuth } from "@/lib/auth-context";
import { Patient, VitalSigns, VitalSignsEntry, NotesEntry, Prescription, WardBed, ShiftHandover, MedicationRound, IVFluidRecord, DailyRounding, WardIncident, Equipment, VisitorRecord, PainAssessment, mockUsers, NurseTask, MedicationOrder } from "@/lib/ehr-data";
import { VitalSignsChart } from "./VitalSignsChart";
import { ConfirmDialog } from "../providers/ConfirmDialog";
import { useToast } from "../providers/ToastProvider";

const generateId = () => `GW-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const wardDoctors = mockUsers.filter(u => u.role === 'doctor' && u.department === 'general-ward');
const wardNurses = mockUsers.filter(u => (u.role === 'staff-nurse' || u.role === 'nurse') && u.department === 'general-ward');

const isAbnormalBP = (bp: string | undefined): boolean => {
  if (!bp) return false;
  const parts = bp.split('/');
  if (parts.length !== 2) return false;
  const systolic = parseInt(parts[0]);
  return systolic < 90 || systolic > 140;
};

const isAbnormalHR = (hr: number | undefined): boolean => {
  return hr !== undefined && (hr < 60 || hr > 100);
};

const isAbnormalTemp = (temp: number | undefined): boolean => {
  return temp !== undefined && (temp < 36.1 || temp > 37.2);
};

const isAbnormalRR = (rr: number | undefined): boolean => {
  return rr !== undefined && (rr < 12 || rr > 20);
};

const isAbnormalSpO2 = (spo2: number | undefined): boolean => {
  return spo2 !== undefined && spo2 < 95;
};

const formatVitalTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

type WardWorkflowStatus = 'pending_admission' | 'pending_transfer' | 'admitted' | 'active' | 'transferred' | 'discharged';

const getWorkflowStatus = (patient: Patient): WardWorkflowStatus => {
  return patient.wardWorkflowStatus || 'pending_admission';
};

const canAssignBed = (patient: Patient): boolean => {
  const status = getWorkflowStatus(patient);
  return status === 'pending_admission' || status === 'pending_transfer';
};

const canRecordVitals = (patient: Patient): boolean => {
  const status = getWorkflowStatus(patient);
  return status === 'active';
};

const canDischarge = (patient: Patient): boolean => {
  const status = getWorkflowStatus(patient);
  return status === 'active';
};

const getWorkflowStatusLabel = (status: WardWorkflowStatus): string => {
  const labels: Record<WardWorkflowStatus, string> = {
    pending_admission: 'Pending Admission',
    pending_transfer: 'Pending Transfer',
    admitted: 'Admitted',
    active: 'Active',
    transferred: 'Transferred',
    discharged: 'Discharged'
  };
  return labels[status];
};

const getWorkflowStatusColor = (status: WardWorkflowStatus): string => {
  const colors: Record<WardWorkflowStatus, string> = {
    pending_admission: 'bg-yellow-100 text-yellow-800',
    pending_transfer: 'bg-orange-100 text-orange-800',
    admitted: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    transferred: 'bg-purple-100 text-purple-800',
    discharged: 'bg-gray-100 text-gray-800'
  };
  return colors[status];
};

const initialBeds: WardBed[] = [
  { id: 'B001', roomNumber: '101', bedNumber: 'A', status: 'available' },
  { id: 'B002', roomNumber: '101', bedNumber: 'B', status: 'available' },
  { id: 'B003', roomNumber: '102', bedNumber: 'A', status: 'available' },
  { id: 'B004', roomNumber: '102', bedNumber: 'B', status: 'available' },
  { id: 'B005', roomNumber: '103', bedNumber: 'A', status: 'available' },
  { id: 'B006', roomNumber: '103', bedNumber: 'B', status: 'available' },
  { id: 'B007', roomNumber: '104', bedNumber: 'A', status: 'available' },
  { id: 'B008', roomNumber: '104', bedNumber: 'B', status: 'available' },
  { id: 'B009', roomNumber: '105', bedNumber: 'A', status: 'available' },
  { id: 'B010', roomNumber: '105', bedNumber: 'B', status: 'available' },
];

const mockEquipment: Equipment[] = [
  { id: 'E001', name: 'Cardiac Monitor #1', type: 'monitor', status: 'available' },
  { id: 'E002', name: 'Cardiac Monitor #2', type: 'monitor', status: 'available' },
  { id: 'E003', name: 'IV Pump #1', type: 'pump', status: 'available' },
  { id: 'E004', name: 'IV Pump #2', type: 'pump', status: 'available' },
  { id: 'E005', name: 'Ventilator #1', type: 'ventilator', status: 'available' },
];

export function GeneralWard() {
  const { user } = useAuth();
  const { patients, updatePatient, addActivity, addLabOrder, addPrescription, medications, nurseTasks, medicationOrders, addNurseTask, updateNurseTask, addMedicationOrder } = useEHR();
  const { addToast } = useToast();
  const [showDischargeConfirm, setShowDischargeConfirm] = useState(false);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'beds' | 'patients' | 'medications' | 'tasks' | 'iv' | 'rounds' | 'incidents' | 'equipment' | 'handover' | 'pain'>('beds');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [beds, setBeds] = useState<WardBed[]>(initialBeds);
  const [medicationRounds, setMedicationRounds] = useState<MedicationRound[]>([]);
  const [ivFluids, setIvFluids] = useState<IVFluidRecord[]>([]);
  const [dailyRoundings, setDailyRoundings] = useState<DailyRounding[]>([]);
  const [incidents, setIncidents] = useState<WardIncident[]>([]);
  const [equipment] = useState<Equipment[]>(mockEquipment);
  const [handovers, setHandovers] = useState<ShiftHandover[]>([]);
  const [painAssessments, setPainAssessments] = useState<PainAssessment[]>([]);
  
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showPrescribeModal, setShowPrescribeModal] = useState(false);
  const [showLabOrderModal, setShowLabOrderModal] = useState(false);
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showRoundingModal, setShowRoundingModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [showPainModal, setShowPainModal] = useState(false);
  const [showNurseAssignModal, setShowNurseAssignModal] = useState(false);
  const [showMedicationOrderModal, setShowMedicationOrderModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCarePlanModal, setShowCarePlanModal] = useState(false);
  const [showDischargeSummaryModal, setShowDischargeSummaryModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [carePlan, setCarePlan] = useState({ problems: "", goals: "", interventions: "" });

  const [newVitals, setNewVitals] = useState<VitalSigns>({
    bloodPressure: "",
    heartRate: 0,
    temperature: 0,
    respiratoryRate: 0,
    oxygenSaturation: 0,
    recordedAt: new Date().toISOString()
  });

  const [progressNote, setProgressNote] = useState("");
  const [prescription, setPrescription] = useState({ medication: "", dosage: "", frequency: "OD", duration: "", instructions: "" });
  const [labTestName, setLabTestName] = useState("");
  const [newAdmit, setNewAdmit] = useState({ roomNumber: "", bedNumber: "", admittingPhysician: "", admissionDiagnosis: "" });
  const [handover, setHandover] = useState({ patientSummary: "", criticalNotes: "" });
  const [rounding, setRounding] = useState({ assessment: "", plan: "", complications: "" });
  const [incident, setIncident] = useState({ type: 'fall' as const, description: "", severity: 'low' as const });
  const [visitor, setVisitor] = useState({ visitorName: "", relation: "" });
  const [ivFluid, setIvFluid] = useState({ fluidName: "", volume: 1000, rate: 100 });
  const [selectedNurseForAssign, setSelectedNurseForAssign] = useState("");
  const [medicationOrderForm, setMedicationOrderForm] = useState({
    medication: "",
    dosage: "",
    frequency: "",
    route: "oral" as "oral" | "iv" | "im" | "sc" | "topical" | "inhalation" | "rectal",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    doctorSignature: "",
    instructions: ""
  });
  const [newTask, setNewTask] = useState({
    taskType: "medication" as "medication" | "vitals" | "wound-care" | "feeding" | "observations" | "other",
    description: "",
    scheduledTime: ""
  });
  const [assignNurseForTask, setAssignNurseForTask] = useState("");

  const isDoctor = !!(user && 'role' in user && user.role === 'doctor');
  const isNurse = !!(user && 'role' in user && user.role === 'nurse');
  const isChargeNurse = !!(user && 'role' in user && user.role === 'charge-nurse');
  const isStaffNurse = !!(user && 'role' in user && user.role === 'staff-nurse');

  const wardPatients = patients.filter(p => p.department === 'general-ward');

  const pendingAdmissionPatients = wardPatients.filter(p => getWorkflowStatus(p) === 'pending_admission');
  const pendingTransferPatients = wardPatients.filter(p => getWorkflowStatus(p) === 'pending_transfer');
  const admittedPatients = wardPatients.filter(p => getWorkflowStatus(p) === 'admitted');
  const activePatients = wardPatients.filter(p => getWorkflowStatus(p) === 'active');
  const dischargedPatients = wardPatients.filter(p => getWorkflowStatus(p) === 'discharged');

  const pendingPatients = [...pendingAdmissionPatients, ...pendingTransferPatients];
  const currentPatients = [...admittedPatients, ...activePatients];

  const handleAdmitPatient = () => {
    if (!selectedPatient || !newAdmit.roomNumber || !newAdmit.bedNumber) return;
    
    const bedIndex = beds.findIndex(b => b.roomNumber === newAdmit.roomNumber && b.bedNumber === newAdmit.bedNumber);
    if (bedIndex >= 0) {
      const newBeds = [...beds];
      newBeds[bedIndex] = { ...newBeds[bedIndex], status: 'occupied', patientId: selectedPatient.id, patientName: selectedPatient.name };
      setBeds(newBeds);
    }
    
    const updatedPatient: Patient = {
      ...selectedPatient,
      department: 'general-ward',
      status: 'admitted',
      roomNumber: newAdmit.roomNumber,
      bedNumber: newAdmit.bedNumber,
      admittingPhysician: newAdmit.admittingPhysician || user?.name,
      admissionDiagnosis: newAdmit.admissionDiagnosis || selectedPatient.chiefComplaint,
      wardStatus: 'admitted',
      wardWorkflowStatus: 'admitted',
      bedAssignedAt: new Date().toISOString(),
      admittedAt: new Date().toISOString(),
      wardNurse: isNurse ? user?.name : undefined
    };
    
    updatePatient(updatedPatient);
    addActivity({
      id: generateId(),
      type: 'ward-admit',
      department: 'general-ward',
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      description: `Admitted to General Ward - Room ${newAdmit.roomNumber}, Bed ${newAdmit.bedNumber}`,
      timestamp: new Date().toISOString()
    });
    
    setShowAdmitModal(false);
    setSelectedPatient(null);
    setNewAdmit({ roomNumber: "", bedNumber: "", admittingPhysician: "", admissionDiagnosis: "" });
  };

  const handleSaveVitals = () => {
    if (!selectedPatient) return;
    const vitalsEntry: VitalSignsEntry = {
      vitals: newVitals,
      recordedBy: user?.name || 'Unknown',
      timestamp: new Date().toISOString()
    };
    const updatedPatient: Patient = {
      ...selectedPatient,
      vitalSigns: newVitals,
      vitalSignsHistory: [...(selectedPatient.vitalSignsHistory || []), vitalsEntry]
    };
    updatePatient(updatedPatient);
    setShowVitalsModal(false);
    setNewVitals({ bloodPressure: "", heartRate: 0, temperature: 0, respiratoryRate: 0, oxygenSaturation: 0, recordedAt: new Date().toISOString() });
  };

  const handleSaveProgress = () => {
    if (!selectedPatient || !progressNote) return;
    const noteEntry: NotesEntry = {
      content: progressNote,
      recordedBy: user?.name || 'Unknown',
      recordedAt: new Date().toISOString()
    };
    const updatedPatient: Patient = {
      ...selectedPatient,
      nursingNotes: progressNote,
      nursingNotesHistory: [...(selectedPatient.nursingNotesHistory || []), noteEntry]
    };
    updatePatient(updatedPatient);
    setShowProgressModal(false);
    setProgressNote("");
  };

  const handleOrderLab = () => {
    if (!selectedPatient || !labTestName) return;
    addLabOrder({
      id: generateId(),
      patientId: selectedPatient.id,
      testName: labTestName,
      testType: 'blood',
      status: 'pending',
      orderedBy: user?.name || 'Unknown',
      date: new Date().toISOString().split('T')[0]
    });
    setShowLabOrderModal(false);
    setLabTestName("");
  };

  const handlePrescribe = () => {
    if (!selectedPatient || !prescription.medication) return;
    addPrescription({
      id: generateId(),
      patientId: selectedPatient.id,
      medication: prescription.medication,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
      duration: prescription.duration,
      instructions: prescription.instructions,
      prescribedBy: user?.name || 'Unknown',
      status: 'active',
      prescribedAt: new Date().toISOString()
    });
    const newRound: MedicationRound = {
      id: generateId(),
      patientId: selectedPatient.id,
      medication: prescription.medication,
      dosage: prescription.dosage,
      scheduledTime: new Date().toISOString(),
      status: 'pending'
    };
    setMedicationRounds([...medicationRounds, newRound]);
    setShowPrescribeModal(false);
    setPrescription({ medication: "", dosage: "", frequency: "OD", duration: "", instructions: "" });
  };

  const confirmDischarge = () => {
    if (!selectedPatient || !canDischarge(selectedPatient)) return;
    const bedIndex = beds.findIndex(b => b.patientId === selectedPatient.id);
    if (bedIndex >= 0) {
      const newBeds = [...beds];
      newBeds[bedIndex] = { ...newBeds[bedIndex], status: 'cleaning', patientId: undefined, patientName: undefined };
      setBeds(newBeds);
    }
    const updatedPatient: Patient = { 
      ...selectedPatient, 
      status: 'discharged', 
      wardStatus: 'discharged', 
      wardWorkflowStatus: 'discharged',
      dischargedAt: new Date().toISOString(),
      department: 'opd' 
    };
    updatePatient(updatedPatient);
    addActivity({
      id: generateId(),
      type: 'discharge',
      department: 'general-ward',
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      description: `Patient discharged from General Ward`,
      timestamp: new Date().toISOString()
    });
    addToast(`${selectedPatient.name} has been discharged successfully`, "success");
    setShowDischargeConfirm(false);
    setSelectedPatient(null);
  };

  const handleDischarge = () => {
    if (!selectedPatient || !canDischarge(selectedPatient)) return;
    setShowDischargeConfirm(true);
  };

  const confirmTransfer = () => {
    if (!selectedPatient) return;
    const bedIndex = beds.findIndex(b => b.patientId === selectedPatient.id);
    if (bedIndex >= 0) {
      const newBeds = [...beds];
      newBeds[bedIndex] = { ...newBeds[bedIndex], status: 'cleaning', patientId: undefined, patientName: undefined };
      setBeds(newBeds);
    }
    const updatedPatient: Patient = { ...selectedPatient, status: 'in-treatment', wardStatus: 'transferred-out', department: 'opd' };
    updatePatient(updatedPatient);
    addActivity({
      id: generateId(),
      type: 'transfer',
      department: 'general-ward',
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      description: `Transferred out of General Ward`,
      timestamp: new Date().toISOString()
    });
    addToast(`${selectedPatient.name} has been transferred successfully`, "success");
    setShowTransferConfirm(false);
    setSelectedPatient(null);
  };

  const handleTransfer = () => {
    if (!selectedPatient) return;
    setShowTransferConfirm(true);
  };

  const handleSaveHandover = () => {
    if (!handover.patientSummary) return;
    const newHandover: ShiftHandover = {
      id: generateId(),
      date: new Date().toISOString().split('T')[0],
      shiftType: 'morning',
      nurseOutgoing: user?.name || 'Unknown',
      nurseIncoming: '',
      patientSummary: handover.patientSummary,
      criticalNotes: handover.criticalNotes,
      timestamp: new Date().toISOString()
    };
    setHandovers([...handovers, newHandover]);
    addToast("Shift handover saved successfully", "success");
    setShowHandoverModal(false);
    setHandover({ patientSummary: "", criticalNotes: "" });
  };

  const handleSaveRounding = () => {
    if (!selectedPatient || !rounding.assessment) return;
    const newRounding: DailyRounding = {
      id: generateId(),
      patientId: selectedPatient.id,
      date: new Date().toISOString().split('T')[0],
      doctorName: user?.name || 'Unknown',
      assessment: rounding.assessment,
      plan: rounding.plan,
      complications: rounding.complications,
      timestamp: new Date().toISOString()
    };
    setDailyRoundings([...dailyRoundings, newRounding]);
    setShowRoundingModal(false);
    setRounding({ assessment: "", plan: "", complications: "" });
  };

  const handleReportIncident = () => {
    if (!selectedPatient || !incident.description) return;
    const newIncident: WardIncident = {
      id: generateId(),
      patientId: selectedPatient.id,
      type: incident.type,
      description: incident.description,
      severity: incident.severity,
      reportedBy: user?.name || 'Unknown',
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    setIncidents([...incidents, newIncident]);
    setShowIncidentModal(false);
    setIncident({ type: 'fall', description: "", severity: 'low' });
  };

  const handleAssignNurse = () => {
    if (!selectedPatient || !selectedNurseForAssign) return;
    const nurse = wardNurses.find(n => n.id === selectedNurseForAssign);
    if (!nurse) return;
    
    const updatedPatient: Patient = {
      ...selectedPatient,
      assignedNurse: nurse.name,
      assignedNurseId: nurse.id
    };
    updatePatient(updatedPatient);
    addActivity({
      id: generateId(),
      type: 'nurse-assign',
      department: 'general-ward',
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      description: `Assigned to nurse ${nurse.name}`,
      timestamp: new Date().toISOString()
    });
    setShowNurseAssignModal(false);
    setSelectedNurseForAssign("");
  };

  const handleCreateMedicationOrder = () => {
    if (!selectedPatient || !medicationOrderForm.medication || !medicationOrderForm.dosage || !medicationOrderForm.doctorSignature) return;
    
    const order: MedicationOrder = {
      id: generateId(),
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      medication: medicationOrderForm.medication,
      dosage: medicationOrderForm.dosage,
      frequency: medicationOrderForm.frequency,
      route: medicationOrderForm.route,
      startDate: medicationOrderForm.startDate,
      endDate: medicationOrderForm.endDate || undefined,
      orderedBy: user?.name || 'Unknown',
      doctorSignature: medicationOrderForm.doctorSignature,
      instructions: medicationOrderForm.instructions,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    addMedicationOrder(order);
    
    const task: NurseTask = {
      id: generateId(),
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      taskType: 'medication',
      description: `Administer ${medicationOrderForm.medication} ${medicationOrderForm.dosage} - ${medicationOrderForm.frequency} (${medicationOrderForm.route})`,
      scheduledTime: new Date().toISOString(),
      status: 'pending',
      assignedBy: user?.name || 'Unknown',
      createdAt: new Date().toISOString()
    };
    addNurseTask(task);
    
    addActivity({
      id: generateId(),
      type: 'medication-order',
      department: 'general-ward',
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      description: `Medication order: ${medicationOrderForm.medication} ${medicationOrderForm.dosage} - Signed by ${medicationOrderForm.doctorSignature}`,
      timestamp: new Date().toISOString()
    });
    
    setShowMedicationOrderModal(false);
    setMedicationOrderForm({
      medication: "",
      dosage: "",
      frequency: "",
      route: "oral",
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      doctorSignature: "",
      instructions: ""
    });
  };

  const handleCreateTask = () => {
    if (!selectedPatient || !newTask.description || !newTask.scheduledTime) return;
    
    const task: NurseTask = {
      id: generateId(),
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      nurseId: assignNurseForTask || undefined,
      nurseName: assignNurseForTask ? wardNurses.find(n => n.id === assignNurseForTask)?.name : undefined,
      taskType: newTask.taskType,
      description: newTask.description,
      scheduledTime: newTask.scheduledTime,
      status: 'pending',
      assignedBy: user?.name || 'Unknown',
      createdAt: new Date().toISOString()
    };
    addNurseTask(task);
    
    addActivity({
      id: generateId(),
      type: 'task-created',
      department: 'general-ward',
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      description: `Task created: ${newTask.taskType} - ${newTask.description}`,
      timestamp: new Date().toISOString()
    });
    
    setShowTaskModal(false);
    setNewTask({ taskType: "medication", description: "", scheduledTime: "" });
    setAssignNurseForTask("");
  };

  const handleCompleteTask = (task: NurseTask) => {
    const updatedTask: NurseTask = {
      ...task,
      status: 'completed',
      completedAt: new Date().toISOString()
    };
    updateNurseTask(updatedTask);
    
    addActivity({
      id: generateId(),
      type: 'task-completed',
      department: 'general-ward',
      patientId: task.patientId,
      patientName: task.patientName,
      description: `Task completed: ${task.taskType} - ${task.description}`,
      timestamp: new Date().toISOString()
    });
  };

  const getAbnormalVitalsAlert = (patient: Patient) => {
    if (!patient.vitalSigns) return null;
    const vitals = patient.vitalSigns;
    const alerts: string[] = [];
    
    if (isAbnormalBP(vitals.bloodPressure)) alerts.push("BP");
    if (isAbnormalHR(vitals.heartRate)) alerts.push("HR");
    if (isAbnormalTemp(vitals.temperature)) alerts.push("Temp");
    if (isAbnormalRR(vitals.respiratoryRate)) alerts.push("RR");
    if (isAbnormalSpO2(vitals.oxygenSaturation)) alerts.push("SpO2");
    
    if (alerts.length > 0) {
      return {
        type: 'vitals-alert' as const,
        title: 'Abnormal Vitals',
        message: `Abnormal readings: ${alerts.join(', ')}`
      };
    }
    return null;
  };

  const pendingTasks = nurseTasks.filter(t => t.status === 'pending');
  const myTasks = nurseTasks.filter(t => t.nurseName === user?.name && t.status === 'pending');
  const activeMedOrders = medicationOrders.filter(o => o.status === 'pending' || o.status === 'active');

  const handleAddIV = () => {
    if (!selectedPatient || !ivFluid.fluidName) return;
    const newIV: IVFluidRecord = {
      id: generateId(),
      patientId: selectedPatient.id,
      fluidName: ivFluid.fluidName,
      volume: ivFluid.volume,
      startTime: new Date().toISOString(),
      rate: ivFluid.rate,
      remaining: ivFluid.volume,
      status: 'running'
    };
    setIvFluids([...ivFluids, newIV]);
    setIvFluid({ fluidName: "", volume: 1000, rate: 100 });
  };

  const handleAddVisitor = () => {
    if (!selectedPatient || !visitor.visitorName) return;
    const newVisitor: VisitorRecord = {
      id: generateId(),
      patientId: selectedPatient.id,
      visitorName: visitor.visitorName,
      relation: visitor.relation,
      checkIn: new Date().toISOString()
    };
    const updatedPatient: Patient = {
      ...selectedPatient,
      visitorLog: [...(selectedPatient.visitorLog || []), newVisitor]
    };
    updatePatient(updatedPatient);
    setShowVisitorModal(false);
    setVisitor({ visitorName: "", relation: "" });
  };

  const [painAssessment, setPainAssessment] = useState({ painScore: 0, painLocation: "", painType: 'dull' as const, interventions: "" });

  const handleSavePainAssessment = () => {
    if (!selectedPatient) return;
    const newPain: PainAssessment = {
      id: generateId(),
      patientId: selectedPatient.id,
      painScore: painAssessment.painScore,
      painLocation: painAssessment.painLocation,
      painType: painAssessment.painType,
      painScale: 'numeric',
      interventions: painAssessment.interventions,
      assessedBy: user?.name || 'Unknown',
      timestamp: new Date().toISOString()
    };
    setPainAssessments([...painAssessments, newPain]);
    setShowPainModal(false);
    setPainAssessment({ painScore: 0, painLocation: "", painType: 'dull', interventions: "" });
  };

  const stats = {
    totalBeds: beds.length,
    occupied: beds.filter(b => b.status === 'occupied').length,
    available: beds.filter(b => b.status === 'available').length,
    critical: wardPatients.filter(p => p.status === 'critical').length,
    averageStay: 3,
    turnoverRate: 10
  };

  const filteredPatients = wardPatients.filter(p => {
    const matchesSearch = searchQuery === "" || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || getWorkflowStatus(p) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {isChargeNurse ? 'General Ward - Charge Nurse' : isStaffNurse ? 'General Ward - Staff Nurse' : isDoctor ? 'General Ward - Doctor' : 'General Ward'}
          </h2>
          <p className="text-slate-500">
            {isChargeNurse ? 'Patient flow & bed management' : isStaffNurse ? 'Patient care & documentation' : isDoctor ? 'Patient treatment & orders' : 'Bedside nursing & patient management'}
          </p>
        </div>
        <div className="flex gap-3">
          {isChargeNurse && (
            <>
              <button onClick={() => setShowHandoverModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Shift Handover
              </button>
              <button onClick={() => setShowAdmitModal(true)} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                Admit Patient
              </button>
            </>
          )}
          {isStaffNurse && (
            <button onClick={() => setShowHandoverModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              Shift Handover
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4">
        <div className="px-4 py-3 bg-blue-100 rounded-lg">
          <p className="text-sm text-blue-600">Total Beds</p>
          <p className="text-2xl font-bold text-blue-800">{stats.totalBeds}</p>
        </div>
        <div className="px-4 py-3 bg-green-100 rounded-lg">
          <p className="text-sm text-green-600">Available</p>
          <p className="text-2xl font-bold text-green-800">{stats.available}</p>
        </div>
        <div className="px-4 py-3 bg-amber-100 rounded-lg">
          <p className="text-sm text-amber-600">Occupied</p>
          <p className="text-2xl font-bold text-amber-800">{stats.occupied}</p>
        </div>
        <div className="px-4 py-3 bg-red-100 rounded-lg">
          <p className="text-sm text-red-600">Critical</p>
          <p className="text-2xl font-bold text-red-800">{stats.critical}</p>
        </div>
        <div className="px-4 py-3 bg-purple-100 rounded-lg">
          <p className="text-sm text-purple-600">Avg Stay (days)</p>
          <p className="text-2xl font-bold text-purple-800">{stats.averageStay}</p>
        </div>
        <div className="px-4 py-3 bg-cyan-100 rounded-lg">
          <p className="text-sm text-cyan-600">Turnover %</p>
          <p className="text-2xl font-bold text-cyan-800">{stats.turnoverRate}%</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {(isChargeNurse ? [
          { id: 'beds', label: 'Bed Grid' },
          { id: 'patients', label: 'All Patients' },
          { id: 'incidents', label: 'Incidents' },
          { id: 'equipment', label: 'Equipment' },
          { id: 'handover', label: 'Handover Log' },
        ] : isStaffNurse ? [
          { id: 'patients', label: 'My Patients' },
          { id: 'medications', label: 'Medication Rounds' },
          { id: 'iv', label: 'IV Fluids' },
          { id: 'pain', label: 'Pain Assessment' },
          { id: 'incidents', label: 'Incidents' },
          { id: 'handover', label: 'Handover Log' },
        ] : isDoctor ? [
          { id: 'patients', label: 'Patients' },
          { id: 'rounds', label: 'Daily Rounds' },
          { id: 'incidents', label: 'Incidents' },
          { id: 'handover', label: 'Handover Log' },
        ] : [
          { id: 'beds', label: 'Bed Grid' },
          { id: 'patients', label: 'Patients' },
          { id: 'pain', label: 'Pain Assessment' },
          { id: 'tasks', label: 'Tasks' },
          { id: 'medications', label: 'Medication Rounds' },
          { id: 'iv', label: 'IV Fluids' },
          { id: 'rounds', label: 'Daily Rounds' },
          { id: 'incidents', label: 'Incidents' },
          { id: 'equipment', label: 'Equipment' },
          { id: 'handover', label: 'Handover Log' },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-medium transition-colors ${activeTab === tab.id ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-600 hover:text-slate-800'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'beds' && (
        <div className="grid grid-cols-5 gap-4">
          {beds.map(bed => (
            <div key={bed.id} className={`p-4 rounded-lg border-2 ${bed.status === 'occupied' ? 'bg-amber-50 border-amber-300' : bed.status === 'available' ? 'bg-green-50 border-green-300' : bed.status === 'cleaning' ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-300'}`}>
              <p className="font-semibold text-slate-800">Room {bed.roomNumber}</p>
              <p className="text-sm text-slate-600">Bed {bed.bedNumber}</p>
              <p className={`text-xs mt-2 capitalize ${bed.status === 'occupied' ? 'text-amber-600' : 'text-green-600'}`}>{bed.status}</p>
              {bed.patientName && <p className="text-sm font-medium text-slate-700 mt-1 truncate">{bed.patientName}</p>}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'patients' && (
        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by patient name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Status</option>
              <option value="pending_admission">Pending Admission</option>
              <option value="pending_transfer">Pending Transfer</option>
              <option value="admitted">Admitted</option>
              <option value="active">Active</option>
              <option value="discharged">Discharged</option>
            </select>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Patient</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Room/Bed</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Diagnosis</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Diet</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pendingPatients.length > 0 && (
                <>
                  <tr className="bg-yellow-50">
                    <td colSpan={6} className="px-4 py-2 font-medium text-yellow-800">Pending Admission/Transfer ({pendingPatients.length})</td>
                  </tr>
                  {pendingPatients.map(patient => (
                    <tr key={patient.id} className="hover:bg-yellow-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{patient.name}</p>
                        <p className="text-sm text-slate-500">{patient.age}y {patient.gender[0]}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-slate-100 rounded text-sm">Not Assigned</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{patient.admissionDiagnosis || patient.diagnosis || patient.chiefComplaint || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-slate-100 rounded text-xs capitalize">{patient.dietType || 'regular'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getWorkflowStatusColor(getWorkflowStatus(patient))}`}>
                          {getWorkflowStatusLabel(getWorkflowStatus(patient))}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isChargeNurse && canAssignBed(patient) && (
                          <button onClick={() => { setSelectedPatient(patient); setShowAdmitModal(true); }} className="text-blue-600 hover:text-blue-700 text-sm font-medium mr-2">Assign Bed</button>
                        )}
                        <button onClick={() => setSelectedPatient(patient)} className="text-teal-600 hover:text-teal-700 text-sm font-medium">View</button>
                      </td>
                    </tr>
                  ))}
                </>
              )}
              {currentPatients.map(patient => {
                  const vitalsAlert = getAbnormalVitalsAlert(patient);
                  return (
                <tr key={patient.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{patient.name}</p>
                    <p className="text-sm text-slate-500">{patient.age}y {patient.gender[0]}</p>
                    {patient.assignedNurse && <p className="text-xs text-teal-600">Nurse: {patient.assignedNurse}</p>}
                    {vitalsAlert && <p className="text-xs text-red-600 font-medium">⚠️ Abnormal Vitals</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-slate-100 rounded text-sm">{patient.roomNumber || 'N/A'}-{patient.bedNumber || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{patient.admissionDiagnosis || patient.diagnosis || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs capitalize">{patient.dietType || 'regular'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getWorkflowStatusColor(getWorkflowStatus(patient))}`}>
                      {getWorkflowStatusLabel(getWorkflowStatus(patient))}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedPatient(patient)} className="text-teal-600 hover:text-teal-700 text-sm font-medium">View</button>
                  </td>
                </tr>
                  );
                })}
              {wardPatients.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No patients in General Ward</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {activeTab === 'pain' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h3 className="font-semibold mb-4">Pain Assessment Records</h3>
          {painAssessments.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No pain assessments recorded</p>
          ) : (
            <div className="space-y-3">
              {painAssessments.map((assessment, idx) => (
                <div key={idx} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Patient: {patients.find(p => p.id === assessment.patientId)?.name || 'Unknown'}</p>
                      <p className="text-sm text-slate-600">Pain Score: <span className="font-bold text-orange-600">{assessment.painScore}/10</span> {assessment.painScore >= 7 ? '⚠️ Severe' : assessment.painScore >= 4 ? '⚡ Moderate' : '✓ Mild'}</p>
                      {assessment.painLocation && <p className="text-sm text-slate-600">Location: {assessment.painLocation}</p>}
                      {assessment.painType && <p className="text-sm text-slate-600">Type: {assessment.painType}</p>}
                      {assessment.interventions && <p className="text-sm text-slate-600">Interventions: {assessment.interventions}</p>}
                    </div>
                    <div className="text-right text-sm text-slate-500">
                      <p>{assessment.assessedBy}</p>
                      <p>{new Date(assessment.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'medications' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h3 className="font-semibold mb-4">Medication Rounds</h3>
          {medicationRounds.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No medications scheduled</p>
          ) : (
            <div className="space-y-3">
              {medicationRounds.map((round, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium">{round.medication} - {round.dosage}</p>
                    <p className="text-sm text-slate-500">Patient: {patients.find(p => p.id === round.patientId)?.name || 'Unknown'}</p>
                  </div>
                  <div className="flex gap-2">
                    {round.status === 'pending' && (
                      <>
                        <button onClick={() => {
                          const updated = [...medicationRounds];
                          updated[idx].status = 'given';
                          updated[idx].administeredTime = new Date().toISOString();
                          updated[idx].administeredBy = user?.name;
                          setMedicationRounds(updated);
                        }} className="px-3 py-1 bg-green-600 text-white text-sm rounded">Given</button>
                        <button onClick={() => {
                          const updated = [...medicationRounds];
                          updated[idx].status = 'missed';
                          setMedicationRounds(updated);
                        }} className="px-3 py-1 bg-red-600 text-white text-sm rounded">Missed</button>
                      </>
                    )}
                    <span className={`px-2 py-1 rounded text-xs ${round.status === 'given' ? 'bg-green-100 text-green-700' : round.status === 'missed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {round.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h3 className="font-semibold mb-4">Nurse Tasks</h3>
          {(isChargeNurse || isDoctor) && pendingTasks.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-600 mb-2">All Pending Tasks ({pendingTasks.length})</h4>
              <div className="space-y-2">
                {pendingTasks.map(task => (
                  <div key={task.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">{task.taskType.replace('-', ' ').toUpperCase()}</p>
                      <p className="text-sm text-slate-600">{task.description}</p>
                      <p className="text-xs text-slate-500">Patient: {task.patientName} • Scheduled: {new Date(task.scheduledTime).toLocaleString()}</p>
                      {task.nurseName && <p className="text-xs text-blue-600">Assigned to: {task.nurseName}</p>}
                    </div>
                    {isNurse && (
                      <button onClick={() => handleCompleteTask(task)} className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">Complete</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {isStaffNurse && myTasks.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-600 mb-2">My Tasks ({myTasks.length})</h4>
              <div className="space-y-2">
                {myTasks.map(task => (
                  <div key={task.id} className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">{task.taskType.replace('-', ' ').toUpperCase()}</p>
                      <p className="text-sm text-slate-600">{task.description}</p>
                      <p className="text-xs text-slate-500">Scheduled: {new Date(task.scheduledTime).toLocaleString()}</p>
                    </div>
                    <button onClick={() => handleCompleteTask(task)} className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">Complete</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {medicationOrders.filter(o => o.status !== 'completed').length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-slate-600 mb-2">Active Medication Orders ({medicationOrders.filter(o => o.status !== 'completed').length})</h4>
              <div className="space-y-2">
                {medicationOrders.filter(o => o.status !== 'completed').map(order => (
                  <div key={order.id} className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
                    <p className="font-medium">{order.medication} {order.dosage}</p>
                    <p className="text-sm text-slate-600">{order.frequency} - {order.route}</p>
                    <p className="text-xs text-slate-500">Patient: {order.patientName} • Ordered by: {order.orderedBy}</p>
                    <p className="text-xs text-slate-400">Signed by: {order.doctorSignature}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {pendingTasks.length === 0 && (isStaffNurse ? myTasks.length === 0 : true) && medicationOrders.filter(o => o.status !== 'completed').length === 0 && (
            <p className="text-slate-500 text-center py-8">No pending tasks</p>
          )}
        </div>
      )}

      {activeTab === 'iv' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h3 className="font-semibold mb-4">IV Fluid Monitoring</h3>
          <div className="space-y-3">
            {ivFluids.map((iv, idx) => (
              <div key={idx} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{iv.fluidName}</p>
                    <p className="text-sm text-blue-600">Rate: {iv.rate} ml/hr | Remaining: {iv.remaining} ml</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${iv.status === 'running' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{iv.status}</span>
                </div>
              </div>
            ))}
            {ivFluids.length === 0 && <p className="text-slate-500 text-center py-8">No IV fluids running</p>}
          </div>
        </div>
      )}

      {activeTab === 'rounds' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h3 className="font-semibold mb-4">Daily Doctor Rounding</h3>
          <div className="space-y-3">
            {dailyRoundings.map((round, idx) => (
              <div key={idx} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="font-medium">{round.doctorName} - {round.date}</p>
                <p className="text-sm text-slate-600 mt-1">Assessment: {round.assessment}</p>
                <p className="text-sm text-slate-600">Plan: {round.plan}</p>
              </div>
            ))}
            {dailyRoundings.length === 0 && <p className="text-slate-500 text-center py-8">No rounding notes yet</p>}
          </div>
        </div>
      )}

      {activeTab === 'incidents' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h3 className="font-semibold mb-4">Incident Reports</h3>
          <div className="space-y-3">
            {incidents.map((inc, idx) => (
              <div key={idx} className={`p-4 border rounded-lg ${inc.severity === 'high' ? 'bg-red-50 border-red-200' : inc.severity === 'medium' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium capitalize">{inc.type.replace('-', ' ')}</p>
                    <p className="text-sm text-slate-600">{inc.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${inc.severity === 'high' ? 'bg-red-200 text-red-700' : inc.severity === 'medium' ? 'bg-amber-200 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>{inc.severity}</span>
                </div>
              </div>
            ))}
            {incidents.length === 0 && <p className="text-slate-500 text-center py-8">No incidents reported</p>}
          </div>
        </div>
      )}

      {activeTab === 'equipment' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h3 className="font-semibold mb-4">Ward Equipment</h3>
          <div className="grid grid-cols-3 gap-4">
            {equipment.map(eq => (
              <div key={eq.id} className={`p-4 border rounded-lg ${eq.status === 'available' ? 'bg-green-50 border-green-200' : eq.status === 'in-use' ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                <p className="font-medium">{eq.name}</p>
                <p className="text-sm text-slate-500 capitalize">{eq.type}</p>
                <span className={`text-xs capitalize ${eq.status === 'available' ? 'text-green-600' : eq.status === 'in-use' ? 'text-amber-600' : 'text-gray-600'}`}>{eq.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'handover' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h3 className="font-semibold mb-4">Shift Handover Log</h3>
          <div className="space-y-3">
            {handovers.map((handover, idx) => (
              <div key={idx} className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <p className="font-medium">{handover.date} - {handover.shiftType} shift</p>
                <p className="text-sm text-slate-600">From: {handover.nurseOutgoing}</p>
                <p className="text-sm text-slate-600 mt-2">{handover.patientSummary}</p>
                {handover.criticalNotes && <p className="text-sm text-red-600 mt-1">Critical: {handover.criticalNotes}</p>}
              </div>
            ))}
            {handovers.length === 0 && <p className="text-slate-500 text-center py-8">No handover records</p>}
          </div>
        </div>
      )}

      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedPatient(null)}>
          <div className="bg-white rounded-xl max-w-5xl w-full mx-4 max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedPatient.name}</h3>
                <p className="text-slate-500">{selectedPatient.id} • {selectedPatient.age}y {selectedPatient.gender}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {isDoctor && (
                  <>
                    <button onClick={() => setShowPrescribeModal(true)} className="px-3 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700">Prescribe</button>
                    <button onClick={() => setShowMedicationOrderModal(true)} className="px-3 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700">Medication Order</button>
                    <button onClick={() => setShowLabOrderModal(true)} className="px-3 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700">Order Lab</button>
                    <button onClick={() => setShowRoundingModal(true)} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Daily Round</button>
                  </>
                )}
                {isChargeNurse && (
                  <>
                    <button onClick={() => setShowNurseAssignModal(true)} className="px-3 py-2 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-700">Assign Nurse</button>
                    <button onClick={() => setShowTaskModal(true)} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Create Task</button>
                  </>
                )}
                {isNurse && (
                  <>
                    <button onClick={() => setShowIncidentModal(true)} className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Report Incident</button>
                    <button onClick={() => setShowCarePlanModal(true)} className="px-3 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700">Care Plan</button>
                    <button onClick={() => setShowTimelineModal(true)} className="px-3 py-2 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-700">Timeline</button>
                  </>
                )}
                {isChargeNurse && selectedPatient && getWorkflowStatus(selectedPatient) === 'discharged' && (
                  <button onClick={() => setShowDischargeSummaryModal(true)} className="px-3 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700">Discharge Summary</button>
                )}
                {(isChargeNurse || isNurse) && (
                  <>
                    <button onClick={handleTransfer} className="px-3 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700">Transfer Out</button>
                    <button 
                      onClick={handleDischarge} 
                      disabled={!canDischarge(selectedPatient)}
                      className={`px-3 py-2 rounded-lg text-sm hover:bg-red-700 ${canDischarge(selectedPatient) ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    >
                      Discharge
                    </button>
                  </>
                )}
                {isStaffNurse && getWorkflowStatus(selectedPatient) === 'admitted' && (
                  <button 
                    onClick={() => {
                      const updatedPatient: Patient = {
                        ...selectedPatient,
                        wardWorkflowStatus: 'active',
                        activatedAt: new Date().toISOString()
                      };
                      updatePatient(updatedPatient);
                      addActivity({
                        id: generateId(),
                        type: 'ward-admit',
                        department: 'general-ward',
                        patientId: selectedPatient.id,
                        patientName: selectedPatient.name,
                        description: 'Patient activated - admission handoff complete',
                        timestamp: new Date().toISOString()
                      });
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                  >
                    Complete Admission Handoff
                  </button>
                )}
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg"><p className="text-sm text-slate-500">Room/Bed</p><p className="font-medium">{selectedPatient.roomNumber}/{selectedPatient.bedNumber}</p></div>
                <div className="p-3 bg-slate-50 rounded-lg"><p className="text-sm text-slate-500">Diagnosis</p><p className="font-medium">{selectedPatient.admissionDiagnosis || 'N/A'}</p></div>
                <div className="p-3 bg-slate-50 rounded-lg"><p className="text-sm text-slate-500">Diet</p><p className="font-medium capitalize">{selectedPatient.dietType || 'regular'}</p></div>
                <div className="p-3 bg-slate-50 rounded-lg"><p className="text-sm text-slate-500">Admitting Dr.</p><p className="font-medium">{selectedPatient.admittingPhysician || 'N/A'}</p></div>
              </div>

              <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                {canRecordVitals(selectedPatient) ? (
                  <>
                    <button onClick={() => setShowVitalsModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Record Vitals</button>
                    <button onClick={() => setShowProgressModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">Progress Notes</button>
                    <button onClick={() => setShowPainModal(true)} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700">Pain Assessment</button>
                    <button onClick={() => setShowVisitorModal(true)} className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm hover:bg-pink-700">Log Visitor</button>
                  </>
                ) : (
                  <div className="text-sm text-slate-500 italic">
                    Patient must be in &quot;Active&quot; status to record vitals and notes
                  </div>
                )}
              </div>

              {selectedPatient.vitalSigns && (
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold mb-2">Current Vitals</h4>
                  <div className="grid grid-cols-5 gap-2 text-center text-sm">
                    <div><p className="text-slate-500">BP</p><p className={`font-medium ${isAbnormalBP(selectedPatient.vitalSigns.bloodPressure) ? 'text-red-600 font-bold' : ''}`}>{selectedPatient.vitalSigns.bloodPressure || '-'}</p></div>
                    <div><p className="text-slate-500">HR</p><p className={`font-medium ${isAbnormalHR(selectedPatient.vitalSigns.heartRate) ? 'text-red-600 font-bold' : ''}`}>{selectedPatient.vitalSigns.heartRate || '-'}</p></div>
                    <div><p className="text-slate-500">Temp</p><p className={`font-medium ${isAbnormalTemp(selectedPatient.vitalSigns.temperature) ? 'text-red-600 font-bold' : ''}`}>{selectedPatient.vitalSigns.temperature || '-'}</p></div>
                    <div><p className="text-slate-500">RR</p><p className={`font-medium ${isAbnormalRR(selectedPatient.vitalSigns.respiratoryRate) ? 'text-red-600 font-bold' : ''}`}>{selectedPatient.vitalSigns.respiratoryRate || '-'}</p></div>
                    <div><p className="text-slate-500">SpO2</p><p className={`font-medium ${isAbnormalSpO2(selectedPatient.vitalSigns.oxygenSaturation) ? 'text-red-600 font-bold' : ''}`}>{selectedPatient.vitalSigns.oxygenSaturation || '-'}</p></div>
                  </div>
                  {selectedPatient.vitalSigns.recordedAt && (
                    <p className="text-xs text-slate-400 mt-2">Recorded: {formatVitalTime(selectedPatient.vitalSigns.recordedAt)}</p>
                  )}
                </div>
              )}

              {selectedPatient.vitalSignsHistory && selectedPatient.vitalSignsHistory.length > 0 && (
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold mb-3">Vital Signs Trends</h4>
                  <div className="h-40">
                    <VitalSignsChart history={selectedPatient.vitalSignsHistory} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showVitalsModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-lg w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Record Vitals - {selectedPatient.name}</h3>
            
            {selectedPatient.vitalSigns && (() => {
              const prev = selectedPatient.vitalSigns;
              return prev.bloodPressure ? (
                <button 
                  onClick={() => setNewVitals({
                    bloodPressure: prev.bloodPressure || '',
                    heartRate: prev.heartRate || 0,
                    temperature: prev.temperature || 0,
                    respiratoryRate: prev.respiratoryRate || 0,
                    oxygenSaturation: prev.oxygenSaturation || 0,
                    recordedAt: new Date().toISOString()
                  })}
                  className="text-xs text-blue-600 underline mb-3 hover:text-blue-800"
                >
                  Copy from previous vitals
                </button>
              ) : null;
            })()}

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-700">Blood Pressure (Systolic/Diastolic)</label>
                  <span className="text-xs text-slate-400">Normal: 90-140/60-90</span>
                </div>
                <input 
                  type="text" 
                  placeholder="e.g., 120/80" 
                  value={newVitals.bloodPressure} 
                  onChange={(e) => setNewVitals({...newVitals, bloodPressure: e.target.value})} 
                  className={`w-full px-3 py-2 border rounded-lg ${isAbnormalBP(newVitals.bloodPressure) ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} 
                />
                {isAbnormalBP(newVitals.bloodPressure) && (
                  <p className="text-xs text-red-600 mt-1">Warning: Outside normal range (90-140/60-90)</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-slate-700">Heart Rate (bpm)</label>
                    <span className="text-xs text-slate-400">Normal: 60-100</span>
                  </div>
                  <input 
                    type="number" 
                    placeholder="e.g., 72" 
                    value={newVitals.heartRate || ''} 
                    onChange={(e) => setNewVitals({...newVitals, heartRate: parseInt(e.target.value) || 0})} 
                    className={`w-full px-3 py-2 border rounded-lg ${isAbnormalHR(newVitals.heartRate) ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} 
                  />
                  {isAbnormalHR(newVitals.heartRate) && (
                    <p className="text-xs text-red-600 mt-1">Warning: Outside normal range (60-100 bpm)</p>
                  )}
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-slate-700">Temperature (°C)</label>
                    <span className="text-xs text-slate-400">Normal: 36.1-37.2</span>
                  </div>
                  <input 
                    type="number" 
                    step="0.1" 
                    placeholder="e.g., 36.5" 
                    value={newVitals.temperature || ''} 
                    onChange={(e) => setNewVitals({...newVitals, temperature: parseFloat(e.target.value) || 0})} 
                    className={`w-full px-3 py-2 border rounded-lg ${isAbnormalTemp(newVitals.temperature) ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} 
                  />
                  {isAbnormalTemp(newVitals.temperature) && (
                    <p className="text-xs text-red-600 mt-1">Warning: Outside normal range (36.1-37.2°C)</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-slate-700">Respiratory Rate (/min)</label>
                    <span className="text-xs text-slate-400">Normal: 12-20</span>
                  </div>
                  <input 
                    type="number" 
                    placeholder="e.g., 16" 
                    value={newVitals.respiratoryRate || ''} 
                    onChange={(e) => setNewVitals({...newVitals, respiratoryRate: parseInt(e.target.value) || 0})} 
                    className={`w-full px-3 py-2 border rounded-lg ${isAbnormalRR(newVitals.respiratoryRate) ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} 
                  />
                  {isAbnormalRR(newVitals.respiratoryRate) && (
                    <p className="text-xs text-red-600 mt-1">Warning: Outside normal range (12-20/min)</p>
                  )}
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-slate-700">SpO2 (%)</label>
                    <span className="text-xs text-slate-400">Normal: 95-100</span>
                  </div>
                  <input 
                    type="number" 
                    placeholder="e.g., 98" 
                    value={newVitals.oxygenSaturation || ''} 
                    onChange={(e) => setNewVitals({...newVitals, oxygenSaturation: parseInt(e.target.value) || 0})} 
                    className={`w-full px-3 py-2 border rounded-lg ${isAbnormalSpO2(newVitals.oxygenSaturation) ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} 
                  />
                  {isAbnormalSpO2(newVitals.oxygenSaturation) && (
                    <p className="text-xs text-red-600 mt-1">Warning: Below normal range (95-100%)</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button onClick={() => setShowVitalsModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={handleSaveVitals} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Vitals</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProgressModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Progress Note - {selectedPatient.name}</h3>
            <textarea value={progressNote} onChange={(e) => setProgressNote(e.target.value)} placeholder="Enter nursing notes..." className="w-full h-32 px-3 py-2 border rounded-lg" />
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowProgressModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleSaveProgress} disabled={!progressNote} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">Save</button>
            </div>
          </div>
        </div>
      )}

      {showPrescribeModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Prescribe - {selectedPatient.name}</h3>
            <div className="space-y-3">
              <select value={prescription.medication} onChange={(e) => setPrescription({...prescription, medication: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select Medication</option>
                {medications.map((med) => <option key={med.id} value={med.name}>{med.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Dosage" value={prescription.dosage} onChange={(e) => setPrescription({...prescription, dosage: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                <select value={prescription.frequency} onChange={(e) => setPrescription({...prescription, frequency: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="OD">OD</option><option value="BD">BD</option><option value="TDS">TDS</option><option value="QID">QID</option><option value="PRN">PRN</option>
                </select>
              </div>
              <input type="text" placeholder="Duration (e.g., 7 days)" value={prescription.duration} onChange={(e) => setPrescription({...prescription, duration: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <input type="text" placeholder="Instructions" value={prescription.instructions} onChange={(e) => setPrescription({...prescription, instructions: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <div className="flex gap-3 pt-3">
                <button onClick={() => setShowPrescribeModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={handlePrescribe} disabled={!prescription.medication} className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">Prescribe</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLabOrderModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Order Lab - {selectedPatient.name}</h3>
            <select value={labTestName} onChange={(e) => setLabTestName(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="">Select Lab Test</option>
              <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
              <option value="Blood Glucose (Fasting)">Blood Glucose (Fasting)</option>
              <option value="Creatinine">Creatinine</option>
              <option value="Sodium">Sodium</option>
              <option value="Potassium">Potassium</option>
            </select>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowLabOrderModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleOrderLab} disabled={!labTestName} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50">Order</button>
            </div>
          </div>
        </div>
      )}

      {showAdmitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Admit Patient to General Ward</h3>
            <div className="space-y-3">
              <select value={newAdmit.roomNumber} onChange={(e) => setNewAdmit({...newAdmit, roomNumber: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select Room</option>
                {[...new Set(beds.filter(b => b.status === 'available').map(b => b.roomNumber))].map(r => <option key={r} value={r}>Room {r}</option>)}
              </select>
              <select value={newAdmit.bedNumber} onChange={(e) => setNewAdmit({...newAdmit, bedNumber: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select Bed</option>
                {beds.filter(b => b.status === 'available' && b.roomNumber === newAdmit.roomNumber).map(b => <option key={b.bedNumber} value={b.bedNumber}>Bed {b.bedNumber}</option>)}
              </select>
              <select value={newAdmit.admittingPhysician} onChange={(e) => setNewAdmit({...newAdmit, admittingPhysician: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select Admitting Doctor</option>
                {wardDoctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
              <input type="text" placeholder="Admission Diagnosis" value={newAdmit.admissionDiagnosis} onChange={(e) => setNewAdmit({...newAdmit, admissionDiagnosis: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <div className="flex gap-3 pt-3">
                <button onClick={() => setShowAdmitModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={handleAdmitPatient} disabled={!newAdmit.roomNumber || !newAdmit.bedNumber} className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">Admit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHandoverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Shift Handover</h3>
            <div className="space-y-3">
              <textarea value={handover.patientSummary} onChange={(e) => setHandover({...handover, patientSummary: e.target.value})} placeholder="Patient summary..." className="w-full h-24 px-3 py-2 border rounded-lg" />
              <textarea value={handover.criticalNotes} onChange={(e) => setHandover({...handover, criticalNotes: e.target.value})} placeholder="Critical notes (if any)..." className="w-full h-20 px-3 py-2 border rounded-lg" />
              <div className="flex gap-3 pt-3">
                <button onClick={() => setShowHandoverModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={handleSaveHandover} disabled={!handover.patientSummary} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRoundingModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Daily Rounding - {selectedPatient.name}</h3>
            <div className="space-y-3">
              <textarea value={rounding.assessment} onChange={(e) => setRounding({...rounding, assessment: e.target.value})} placeholder="Assessment..." className="w-full h-20 px-3 py-2 border rounded-lg" />
              <textarea value={rounding.plan} onChange={(e) => setRounding({...rounding, plan: e.target.value})} placeholder="Plan..." className="w-full h-20 px-3 py-2 border rounded-lg" />
              <textarea value={rounding.complications} onChange={(e) => setRounding({...rounding, complications: e.target.value})} placeholder="Complications (optional)..." className="w-full h-16 px-3 py-2 border rounded-lg" />
              <div className="flex gap-3 pt-3">
                <button onClick={() => setShowRoundingModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={handleSaveRounding} disabled={!rounding.assessment} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showIncidentModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Report Incident - {selectedPatient.name}</h3>
            <div className="space-y-3">
              <select value={incident.type} onChange={(e) => setIncident({...incident, type: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg">
                <option value="fall">Fall</option>
                <option value="infection">Infection</option>
                <option value="medication-error">Medication Error</option>
                <option value="equipment-failure">Equipment Failure</option>
                <option value="other">Other</option>
              </select>
              <textarea value={incident.description} onChange={(e) => setIncident({...incident, description: e.target.value})} placeholder="Description..." className="w-full h-24 px-3 py-2 border rounded-lg" />
              <select value={incident.severity} onChange={(e) => setIncident({...incident, severity: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <div className="flex gap-3 pt-3">
                <button onClick={() => setShowIncidentModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={handleReportIncident} disabled={!incident.description} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">Report</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showVisitorModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Log Visitor - {selectedPatient.name}</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Visitor Name" value={visitor.visitorName} onChange={(e) => setVisitor({...visitor, visitorName: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <input type="text" placeholder="Relationship (e.g., Spouse, Child)" value={visitor.relation} onChange={(e) => setVisitor({...visitor, relation: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <div className="flex gap-3 pt-3">
                <button onClick={() => setShowVisitorModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={handleAddVisitor} disabled={!visitor.visitorName} className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50">Log In</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPainModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Pain Assessment - {selectedPatient.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pain Score (0-10)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="range" 
                    min="0" 
                    max="10" 
                    value={painAssessment.painScore} 
                    onChange={(e) => setPainAssessment({...painAssessment, painScore: parseInt(e.target.value)})}
                    className="flex-1"
                  />
                  <span className={`px-3 py-1 rounded font-bold ${painAssessment.painScore >= 7 ? 'bg-red-100 text-red-700' : painAssessment.painScore >= 4 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                    {painAssessment.painScore}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>No Pain</span>
                  <span>Severe</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pain Location</label>
                <input type="text" placeholder="e.g., Abdomen, Back" value={painAssessment.painLocation} onChange={(e) => setPainAssessment({...painAssessment, painLocation: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pain Type</label>
                <select value={painAssessment.painType} onChange={(e) => setPainAssessment({...painAssessment, painType: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="sharp">Sharp</option>
                  <option value="dull">Dull</option>
                  <option value="burning">Burning</option>
                  <option value="aching">Aching</option>
                  <option value="throbbing">Throbbing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Interventions Given</label>
                <textarea placeholder="e.g., Given pain medication, applied cold compress" value={painAssessment.interventions} onChange={(e) => setPainAssessment({...painAssessment, interventions: e.target.value})} className="w-full h-20 px-3 py-2 border rounded-lg" />
              </div>
              <div className="flex gap-3 pt-3">
                <button onClick={() => setShowPainModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={handleSavePainAssessment} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Save Assessment</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNurseAssignModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Assign Nurse to {selectedPatient.name}</h3>
            <div className="space-y-3">
              <select value={selectedNurseForAssign} onChange={(e) => setSelectedNurseForAssign(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select Nurse</option>
                {wardNurses.map(nurse => (
                  <option key={nurse.id} value={nurse.id}>{nurse.name}</option>
                ))}
              </select>
              <div className="flex gap-3 pt-3">
                <button onClick={() => setShowNurseAssignModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={handleAssignNurse} disabled={!selectedNurseForAssign} className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50">Assign</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMedicationOrderModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Medication Order - {selectedPatient.name}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Medication Name *</label>
                <input type="text" placeholder="e.g., Amoxicillin" value={medicationOrderForm.medication} onChange={(e) => setMedicationOrderForm({...medicationOrderForm, medication: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dosage *</label>
                  <input type="text" placeholder="e.g., 500mg" value={medicationOrderForm.dosage} onChange={(e) => setMedicationOrderForm({...medicationOrderForm, dosage: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                  <input type="text" placeholder="e.g., 3x daily" value={medicationOrderForm.frequency} onChange={(e) => setMedicationOrderForm({...medicationOrderForm, frequency: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Route *</label>
                <select value={medicationOrderForm.route} onChange={(e) => setMedicationOrderForm({...medicationOrderForm, route: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="oral">Oral</option>
                  <option value="iv">IV</option>
                  <option value="im">IM (Intramuscular)</option>
                  <option value="sc">SC (Subcutaneous)</option>
                  <option value="topical">Topical</option>
                  <option value="inhalation">Inhalation</option>
                  <option value="rectal">Rectal</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input type="date" value={medicationOrderForm.startDate} onChange={(e) => setMedicationOrderForm({...medicationOrderForm, startDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date (optional)</label>
                  <input type="date" value={medicationOrderForm.endDate} onChange={(e) => setMedicationOrderForm({...medicationOrderForm, endDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Doctor Signature *</label>
                <input type="text" placeholder="Your name as signature" value={medicationOrderForm.doctorSignature} onChange={(e) => setMedicationOrderForm({...medicationOrderForm, doctorSignature: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Instructions (optional)</label>
                <textarea placeholder="e.g., Take with food, avoid alcohol" value={medicationOrderForm.instructions} onChange={(e) => setMedicationOrderForm({...medicationOrderForm, instructions: e.target.value})} className="w-full h-20 px-3 py-2 border rounded-lg" />
              </div>
              <div className="flex gap-3 pt-3">
                <button onClick={() => setShowMedicationOrderModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={handleCreateMedicationOrder} disabled={!medicationOrderForm.medication || !medicationOrderForm.dosage || !medicationOrderForm.doctorSignature} className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50">Submit Order</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTaskModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Create Task for {selectedPatient.name}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Type</label>
                <select value={newTask.taskType} onChange={(e) => setNewTask({...newTask, taskType: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="medication">Medication</option>
                  <option value="vitals">Vital Signs</option>
                  <option value="wound-care">Wound Care</option>
                  <option value="feeding">Feeding</option>
                  <option value="observations">Observations</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                <textarea placeholder="Task description..." value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} className="w-full h-20 px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Time *</label>
                <input type="datetime-local" value={newTask.scheduledTime} onChange={(e) => setNewTask({...newTask, scheduledTime: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign to Nurse (optional)</label>
                <select value={assignNurseForTask} onChange={(e) => setAssignNurseForTask(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Unassigned</option>
                  {wardNurses.map(nurse => (
                    <option key={nurse.id} value={nurse.id}>{nurse.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-3">
                <button onClick={() => setShowTaskModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={handleCreateTask} disabled={!newTask.description || !newTask.scheduledTime} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Create Task</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDischargeConfirm}
        title="Confirm Discharge"
        message={`Are you sure you want to discharge ${selectedPatient?.name}? This action cannot be undone.`}
        confirmLabel="Discharge"
        confirmVariant="danger"
        onConfirm={confirmDischarge}
        onCancel={() => setShowDischargeConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showTransferConfirm}
        title="Confirm Transfer"
        message={`Are you sure you want to transfer ${selectedPatient?.name} to another department? This action cannot be undone.`}
        confirmLabel="Transfer"
        confirmVariant="warning"
        onConfirm={confirmTransfer}
        onCancel={() => setShowTransferConfirm(false)}
      />

      {showCarePlanModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-lg w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Care Plan - {selectedPatient.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Problems/Issues</label>
                <textarea
                  value={carePlan.problems}
                  onChange={(e) => setCarePlan({...carePlan, problems: e.target.value})}
                  placeholder="List patient problems and nursing diagnoses..."
                  className="w-full h-24 px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Goals</label>
                <textarea
                  value={carePlan.goals}
                  onChange={(e) => setCarePlan({...carePlan, goals: e.target.value})}
                  placeholder="Set measurable goals and expected outcomes..."
                  className="w-full h-24 px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Interventions</label>
                <textarea
                  value={carePlan.interventions}
                  onChange={(e) => setCarePlan({...carePlan, interventions: e.target.value})}
                  placeholder="List nursing interventions and actions..."
                  className="w-full h-24 px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button onClick={() => { setShowCarePlanModal(false); setCarePlan({ problems: "", goals: "", interventions: "" }); }} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={() => { addToast("Care plan saved successfully", "success"); setShowCarePlanModal(false); }} className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">Save Care Plan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDischargeSummaryModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Discharge Summary</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                  Print
                </button>
                <button onClick={() => setShowDischargeSummaryModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Close</button>
              </div>
            </div>
            <div className="p-6 print:p-0">
              <div className="text-center mb-6 border-b-2 border-slate-800 pb-4">
                <h1 className="text-2xl font-bold">MedConnect Hospital</h1>
                <p className="text-slate-600">Discharge Summary - General Ward</p>
              </div>
              
              <div className="mb-4">
                <h4 className="font-bold border-b border-slate-300 pb-2 mb-2">PATIENT INFORMATION</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><span className="text-slate-500">Name:</span> <span className="font-medium">{selectedPatient.name}</span></p>
                  <p><span className="text-slate-500">Age/Gender:</span> <span className="font-medium">{selectedPatient.age} years / {selectedPatient.gender}</span></p>
                  <p><span className="text-slate-500">Patient ID:</span> <span className="font-medium">{selectedPatient.id}</span></p>
                  <p><span className="text-slate-500">Blood Type:</span> <span className="font-medium">{selectedPatient.bloodType}</span></p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-bold border-b border-slate-300 pb-2 mb-2">ADMISSION DETAILS</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><span className="text-slate-500">Admission Date:</span> <span className="font-medium">{selectedPatient.admissionDate ? new Date(selectedPatient.admissionDate).toLocaleDateString() : 'N/A'}</span></p>
                  <p><span className="text-slate-500">Discharge Date:</span> <span className="font-medium">{selectedPatient.dischargedAt ? new Date(selectedPatient.dischargedAt).toLocaleDateString() : 'N/A'}</span></p>
                  <p><span className="text-slate-500">Room/Bed:</span> <span className="font-medium">{selectedPatient.roomNumber || 'N/A'} / {selectedPatient.bedNumber || 'N/A'}</span></p>
                  <p><span className="text-slate-500">Admitting Physician:</span> <span className="font-medium">{selectedPatient.admittingPhysician || 'N/A'}</span></p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-bold border-b border-slate-300 pb-2 mb-2">DIAGNOSIS</h4>
                <p className="text-sm">{selectedPatient.diagnosis || selectedPatient.admissionDiagnosis || selectedPatient.chiefComplaint || 'No diagnosis recorded'}</p>
              </div>

              {selectedPatient.vitalSigns && (
                <div className="mb-4">
                  <h4 className="font-bold border-b border-slate-300 pb-2 mb-2">DISCHARGE VITALS</h4>
                  <div className="grid grid-cols-5 gap-2 text-sm text-center">
                    <div className="p-2 bg-slate-50 rounded"><p className="text-slate-500">BP</p><p className="font-medium">{selectedPatient.vitalSigns.bloodPressure}</p></div>
                    <div className="p-2 bg-slate-50 rounded"><p className="text-slate-500">HR</p><p className="font-medium">{selectedPatient.vitalSigns.heartRate} bpm</p></div>
                    <div className="p-2 bg-slate-50 rounded"><p className="text-slate-500">Temp</p><p className="font-medium">{selectedPatient.vitalSigns.temperature}°F</p></div>
                    <div className="p-2 bg-slate-50 rounded"><p className="text-slate-500">RR</p><p className="font-medium">{selectedPatient.vitalSigns.respiratoryRate}/min</p></div>
                    <div className="p-2 bg-slate-50 rounded"><p className="text-slate-500">SpO2</p><p className="font-medium">{selectedPatient.vitalSigns.oxygenSaturation}%</p></div>
                  </div>
                </div>
              )}

              {selectedPatient.prescriptions && selectedPatient.prescriptions.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-bold border-b border-slate-300 pb-2 mb-2">DISCHARGE MEDICATIONS</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2">Medication</th>
                        <th className="text-left py-2">Dosage</th>
                        <th className="text-left py-2">Frequency</th>
                        <th className="text-left py-2">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPatient.prescriptions.map((rx, idx) => (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="py-2">{rx.medication}</td>
                          <td className="py-2">{rx.dosage}</td>
                          <td className="py-2">{rx.frequency}</td>
                          <td className="py-2">{rx.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mb-4">
                <h4 className="font-bold border-b border-slate-300 pb-2 mb-2">DISCHARGE INSTRUCTIONS</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Follow up with your physician in 1 week</li>
                  <li>Take medications as prescribed</li>
                  <li>Return to hospital if symptoms worsen</li>
                  <li>Keep wound dry and clean</li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-300 text-center text-xs text-slate-500">
                <p>Generated from MedConnect EHR System</p>
                <p>Printed on: {new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTimelineModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">Patient Timeline - {selectedPatient.name}</h3>
              <button onClick={() => setShowTimelineModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <div className="p-4">
              {(() => {
                const timeline: { time: string; event: string; details: string; type: string }[] = [];
                
                if (selectedPatient.admissionDate) {
                  timeline.push({ time: selectedPatient.admissionDate, event: 'Admission', details: `Admitted to ${selectedPatient.department}`, type: 'admission' });
                }
                if (selectedPatient.admittedAt) {
                  timeline.push({ time: selectedPatient.admittedAt, event: 'Ward Admission', details: `Room ${selectedPatient.roomNumber}, Bed ${selectedPatient.bedNumber}`, type: 'ward' });
                }
                if (selectedPatient.activatedAt) {
                  timeline.push({ time: selectedPatient.activatedAt, event: 'Status Changed', details: 'Patient activated for full care', type: 'status' });
                }
                if (selectedPatient.assignedNurse) {
                  timeline.push({ time: new Date().toISOString(), event: 'Nurse Assigned', details: `Assigned to ${selectedPatient.assignedNurse}`, type: 'nurse' });
                }
                if (selectedPatient.vitalSigns?.recordedAt) {
                  timeline.push({ time: selectedPatient.vitalSigns.recordedAt, event: 'Vitals Recorded', details: `BP: ${selectedPatient.vitalSigns.bloodPressure}, HR: ${selectedPatient.vitalSigns.heartRate}`, type: 'vitals' });
                }
                if (selectedPatient.vitalSignsHistory) {
                  selectedPatient.vitalSignsHistory.slice().reverse().forEach((v, i) => {
                    if (i > 0) timeline.push({ time: v.timestamp, event: 'Vital Signs', details: `Recorded by ${v.recordedBy}`, type: 'vitals' });
                  });
                }
                if (selectedPatient.nurseNotes) {
                  timeline.push({ time: new Date().toISOString(), event: 'Nursing Notes', details: selectedPatient.nurseNotes.substring(0, 100) + '...', type: 'notes' });
                }
                if (selectedPatient.prescriptions) {
                  selectedPatient.prescriptions.forEach(rx => {
                    timeline.push({ time: rx.prescribedAt || new Date().toISOString(), event: 'Medication Prescribed', details: `${rx.medication} ${rx.dosage} - ${rx.frequency}`, type: 'medication' });
                  });
                }
                if (selectedPatient.dischargedAt) {
                  timeline.push({ time: selectedPatient.dischargedAt, event: 'Discharge', details: 'Patient discharged from General Ward', type: 'discharge' });
                }
                if (selectedPatient.transferHistory) {
                  selectedPatient.transferHistory.forEach(t => {
                    timeline.push({ time: t.transferredAt, event: 'Transfer', details: `From ${t.fromDepartment} to ${t.toDepartment}: ${t.reason}`, type: 'transfer' });
                  });
                }

                timeline.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

                const getTypeColor = (type: string) => {
                  switch (type) {
                    case 'admission': return 'bg-blue-100 border-blue-500';
                    case 'ward': return 'bg-green-100 border-green-500';
                    case 'status': return 'bg-purple-100 border-purple-500';
                    case 'nurse': return 'bg-cyan-100 border-cyan-500';
                    case 'vitals': return 'bg-red-100 border-red-500';
                    case 'notes': return 'bg-yellow-100 border-yellow-500';
                    case 'medication': return 'bg-teal-100 border-teal-500';
                    case 'discharge': return 'bg-gray-100 border-gray-500';
                    case 'transfer': return 'bg-orange-100 border-orange-500';
                    default: return 'bg-slate-100 border-slate-500';
                  }
                };

                const getTypeIcon = (type: string) => {
                  switch (type) {
                    case 'admission': return '🏥';
                    case 'ward': return '🛏️';
                    case 'status': return '📊';
                    case 'nurse': return '👩‍⚕️';
                    case 'vitals': return '❤️';
                    case 'notes': return '📝';
                    case 'medication': return '💊';
                    case 'discharge': return '🚪';
                    case 'transfer': return '🔄';
                    default: return '📌';
                  }
                };

                if (timeline.length === 0) {
                  return <p className="text-slate-500 text-center py-8">No timeline events recorded yet</p>;
                }

                return (
                  <div className="space-y-3">
                    {timeline.map((item, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border-l-4 ${getTypeColor(item.type)}`}>
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{getTypeIcon(item.type)}</span>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <p className="font-medium text-slate-800">{item.event}</p>
                              <p className="text-xs text-slate-500">{new Date(item.time).toLocaleString()}</p>
                            </div>
                            <p className="text-sm text-slate-600 mt-1">{item.details}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}