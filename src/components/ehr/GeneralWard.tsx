"use client";

import { useState } from "react";
import { useEHR } from "@/lib/ehr-context";
import { useAuth } from "@/lib/auth-context";
import { Patient, VitalSigns, VitalSignsEntry, NotesEntry, Prescription, WardBed, ShiftHandover, MedicationRound, IVFluidRecord, DailyRounding, WardIncident, Equipment, VisitorRecord, PainAssessment } from "@/lib/ehr-data";
import { VitalSignsChart } from "./VitalSignsChart";

const generateId = () => `GW-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

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
  const { patients, updatePatient, addActivity, addLabOrder, addPrescription, medications } = useEHR();
  const [activeTab, setActiveTab] = useState<'beds' | 'patients' | 'medications' | 'iv' | 'rounds' | 'incidents' | 'equipment' | 'handover' | 'pain'>('beds');
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

  const isDoctor = !!(user && 'role' in user && user.role === 'doctor');
  const isNurse = !!(user && 'role' in user && user.role === 'nurse');
  const isChargeNurse = !!(user && 'role' in user && user.role === 'charge-nurse');
  const isStaffNurse = !!(user && 'role' in user && user.role === 'staff-nurse');

  const wardPatients = patients.filter(p => p.department === 'general-ward');

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

  const handleDischarge = () => {
    if (!selectedPatient) return;
    const bedIndex = beds.findIndex(b => b.patientId === selectedPatient.id);
    if (bedIndex >= 0) {
      const newBeds = [...beds];
      newBeds[bedIndex] = { ...newBeds[bedIndex], status: 'cleaning', patientId: undefined, patientName: undefined };
      setBeds(newBeds);
    }
    const updatedPatient: Patient = { ...selectedPatient, status: 'discharged', wardStatus: 'discharged', department: 'opd' };
    updatePatient(updatedPatient);
    setSelectedPatient(null);
  };

  const handleTransfer = () => {
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
    setSelectedPatient(null);
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
    critical: wardPatients.filter(p => p.status === 'critical').length
  };

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

      <div className="grid grid-cols-4 gap-4">
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
              {wardPatients.map(patient => (
                <tr key={patient.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{patient.name}</p>
                    <p className="text-sm text-slate-500">{patient.age}y {patient.gender[0]}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-slate-100 rounded text-sm">{patient.roomNumber || 'N/A'}-{patient.bedNumber || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{patient.admissionDiagnosis || patient.diagnosis || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs capitalize">{patient.dietType || 'regular'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${patient.status === 'critical' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {patient.status === 'critical' ? 'Critical' : 'Stable'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedPatient(patient)} className="text-teal-600 hover:text-teal-700 text-sm font-medium">View</button>
                  </td>
                </tr>
              ))}
              {wardPatients.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No patients in General Ward</td></tr>
              )}
            </tbody>
          </table>
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
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{selectedPatient.name}</h3>
                <p className="text-slate-500">{selectedPatient.id} • {selectedPatient.age}y {selectedPatient.gender}</p>
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

              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowVitalsModal(true)} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Record Vitals</button>
                <button onClick={() => setShowProgressModal(true)} className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">Progress Notes</button>
                <button onClick={() => setShowPainModal(true)} className="px-3 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700">Pain Assessment</button>
                <button onClick={() => setShowVisitorModal(true)} className="px-3 py-2 bg-pink-600 text-white rounded-lg text-sm hover:bg-pink-700">Log Visitor</button>
                {isDoctor && (
                  <>
                    <button onClick={() => setShowPrescribeModal(true)} className="px-3 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700">Prescribe</button>
                    <button onClick={() => setShowLabOrderModal(true)} className="px-3 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700">Order Lab</button>
                    <button onClick={() => setShowRoundingModal(true)} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Daily Round</button>
                  </>
                )}
                {isNurse && (
                  <>
                    <button onClick={() => setShowIncidentModal(true)} className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Report Incident</button>
                  </>
                )}
                {(isChargeNurse || isNurse) && (
                  <>
                    <button onClick={handleTransfer} className="px-3 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700">Transfer Out</button>
                    <button onClick={handleDischarge} className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Discharge</button>
                  </>
                )}
              </div>
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
              <input type="text" placeholder="Admitting Physician" value={newAdmit.admittingPhysician} onChange={(e) => setNewAdmit({...newAdmit, admittingPhysician: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
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
    </div>
  );
}