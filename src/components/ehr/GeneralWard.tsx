"use client";

import { useState } from "react";
import { useEHR } from "@/lib/ehr-context";
import { useAuth } from "@/lib/auth-context";
import { Patient, VitalSigns, VitalSignsEntry, NotesEntry, Prescription } from "@/lib/ehr-data";

const generateId = () => `GW-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function GeneralWard() {
  const { user } = useAuth();
  const { patients, updatePatient, addActivity, addLabOrder, addPrescription, medications } = useEHR();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'admitted' | 'discharged' | 'transferred'>('admitted');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showPrescribeModal, setShowPrescribeModal] = useState(false);
  const [showLabOrderModal, setShowLabOrderModal] = useState(false);

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
  const [newAdmit, setNewAdmit] = useState({
    roomNumber: "",
    bedNumber: "",
    admittingPhysician: "",
    admissionDiagnosis: ""
  });

  const isDoctor = !!(user && 'role' in user && user.role === 'doctor');
  const isNurse = !!(user && 'role' in user && user.role === 'nurse');

  const wardPatients = patients.filter(p => p.department === 'general-ward' && p.registrationStatus === 'confirmed');
  
  const getFilteredPatients = () => {
    if (!searchTerm) return wardPatients;
    return wardPatients.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleAdmitPatient = () => {
    if (!selectedPatient || !newAdmit.roomNumber || !newAdmit.bedNumber) return;
    
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
      type: 'admission',
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
    addActivity({
      id: generateId(),
      type: 'vitals',
      department: 'general-ward',
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      description: `Vital signs recorded`,
      timestamp: new Date().toISOString()
    });
    
    setShowVitalsModal(false);
    setNewVitals({
      bloodPressure: "",
      heartRate: 0,
      temperature: 0,
      respiratoryRate: 0,
      oxygenSaturation: 0,
      recordedAt: new Date().toISOString()
    });
  };

  const handleSaveProgress = () => {
    if (!selectedPatient || !progressNote) return;
    
    const noteEntry: NotesEntry = {
      id: generateId(),
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
    addActivity({
      id: generateId(),
      type: 'notes',
      department: 'general-ward',
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      description: `Progress note added`,
      timestamp: new Date().toISOString()
    });
    
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
    
    addActivity({
      id: generateId(),
      type: 'lab-order',
      department: 'general-ward',
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      description: `Lab order: ${labTestName}`,
      timestamp: new Date().toISOString()
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
    
    addActivity({
      id: generateId(),
      type: 'prescription',
      department: 'general-ward',
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      description: `Prescribed: ${prescription.medication}`,
      timestamp: new Date().toISOString()
    });
    
    setShowPrescribeModal(false);
    setPrescription({ medication: "", dosage: "", frequency: "OD", duration: "", instructions: "" });
  };

  const handleDischarge = () => {
    if (!selectedPatient) return;
    
    const updatedPatient: Patient = {
      ...selectedPatient,
      status: 'discharged',
      wardStatus: 'discharged',
      department: 'opd'
    };
    
    updatePatient(updatedPatient);
    addActivity({
      id: generateId(),
      type: 'discharge',
      department: 'general-ward',
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      description: `Discharged from General Ward`,
      timestamp: new Date().toISOString()
    });
    
    setSelectedPatient(null);
  };

  const stats = {
    admitted: wardPatients.filter(p => p.wardStatus === 'admitted').length,
    discharged: wardPatients.filter(p => p.wardStatus === 'discharged').length,
    critical: wardPatients.filter(p => p.status === 'critical').length
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">General Ward</h2>
          <p className="text-slate-500">Bedside nursing & patient management</p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-600">Admitted</p>
            <p className="text-xl font-bold text-blue-800">{stats.admitted}</p>
          </div>
          <div className="px-4 py-2 bg-green-100 rounded-lg">
            <p className="text-sm text-green-600">Discharged</p>
            <p className="text-xl font-bold text-green-800">{stats.discharged}</p>
          </div>
          <div className="px-4 py-2 bg-red-100 rounded-lg">
            <p className="text-sm text-red-600">Critical</p>
            <p className="text-xl font-bold text-red-800">{stats.critical}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by patient name, room number, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Patient</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Room/Bed</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Diagnosis</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Admitting Dr.</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Vitals</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {getFilteredPatients().map((patient) => (
              <tr key={patient.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-800">{patient.name}</p>
                    <p className="text-sm text-slate-500">{patient.id} • {patient.age}y {patient.gender[0]}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-slate-100 rounded text-sm">
                    {patient.roomNumber || 'N/A'}-{patient.bedNumber || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {patient.admissionDiagnosis || patient.diagnosis || patient.chiefComplaint || 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {patient.admittingPhysician || 'N/A'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    patient.status === 'critical' ? 'bg-red-100 text-red-700' :
                    patient.wardStatus === 'admitted' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {patient.status === 'critical' ? 'Critical' : patient.wardStatus || 'Admitted'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {patient.vitalSigns ? (
                    <div className="text-xs text-slate-600">
                      <p>BP: {patient.vitalSigns.bloodPressure || '-'}</p>
                      <p>HR: {patient.vitalSigns.heartRate || '-'}</p>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">No vitals</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedPatient(patient)}
                    className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {getFilteredPatients().length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No patients in General Ward
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedPatient(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedPatient.name}</h3>
                  <p className="text-slate-500">{selectedPatient.id} • {selectedPatient.age}y {selectedPatient.gender}</p>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Room/Bed</p>
                  <p className="font-medium">{selectedPatient.roomNumber || 'N/A'}/{selectedPatient.bedNumber || 'N/A'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Admitting Physician</p>
                  <p className="font-medium">{selectedPatient.admittingPhysician || 'N/A'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Admission Diagnosis</p>
                  <p className="font-medium">{selectedPatient.admissionDiagnosis || 'N/A'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Ward Status</p>
                  <p className="font-medium capitalize">{selectedPatient.wardStatus || 'admitted'}</p>
                </div>
              </div>

              {selectedPatient.vitalSigns && (
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold mb-3">Current Vitals</h4>
                  <div className="grid grid-cols-5 gap-4 text-center">
                    <div>
                      <p className="text-xs text-slate-500">BP</p>
                      <p className="font-medium">{selectedPatient.vitalSigns.bloodPressure || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">HR</p>
                      <p className="font-medium">{selectedPatient.vitalSigns.heartRate || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Temp</p>
                      <p className="font-medium">{selectedPatient.vitalSigns.temperature || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">RR</p>
                      <p className="font-medium">{selectedPatient.vitalSigns.respiratoryRate || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">SpO2</p>
                      <p className="font-medium">{selectedPatient.vitalSigns.oxygenSaturation || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowVitalsModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Record Vitals
                </button>
                <button
                  onClick={() => setShowProgressModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Progress Notes
                </button>
                {isDoctor && (
                  <>
                    <button
                      onClick={() => setShowPrescribeModal(true)}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    >
                      Prescribe
                    </button>
                    <button
                      onClick={() => setShowLabOrderModal(true)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      Order Lab
                    </button>
                  </>
                )}
                {isNurse && (
                  <button
                    onClick={handleDischarge}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Discharge Patient
                  </button>
                )}
              </div>

              {selectedPatient.nursingNotesHistory && selectedPatient.nursingNotesHistory.length > 0 && (
                <div className="p-4 border border-slate-200 rounded-lg">
                  <h4 className="font-semibold mb-3">Nursing Notes History</h4>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {selectedPatient.nursingNotesHistory?.slice().reverse().map((note, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded">
                        <p className="text-sm">{note.content || note.notes || ''}</p>
                        <p className="text-xs text-slate-400 mt-1">{note.recordedBy} • {note.recordedAt || note.timestamp ? new Date(note.recordedAt || note.timestamp!).toLocaleString() : 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showVitalsModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Record Vitals - {selectedPatient.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Blood Pressure</label>
                <input
                  type="text"
                  placeholder="120/80"
                  value={newVitals.bloodPressure}
                  onChange={(e) => setNewVitals({...newVitals, bloodPressure: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Heart Rate</label>
                  <input
                    type="number"
                    placeholder="72"
                    value={newVitals.heartRate || ''}
                    onChange={(e) => setNewVitals({...newVitals, heartRate: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="36.5"
                    value={newVitals.temperature || ''}
                    onChange={(e) => setNewVitals({...newVitals, temperature: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Resp. Rate</label>
                  <input
                    type="number"
                    placeholder="16"
                    value={newVitals.respiratoryRate || ''}
                    onChange={(e) => setNewVitals({...newVitals, respiratoryRate: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    placeholder="98"
                    value={newVitals.oxygenSaturation || ''}
                    onChange={(e) => setNewVitals({...newVitals, oxygenSaturation: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowVitalsModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveVitals}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Vitals
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProgressModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Progress Note - {selectedPatient.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  placeholder="Enter nursing progress notes..."
                  className="w-full h-32 px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowProgressModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProgress}
                  disabled={!progressNote}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPrescribeModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Prescribe Medication - {selectedPatient.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Medication</label>
                <select
                  value={prescription.medication}
                  onChange={(e) => setPrescription({...prescription, medication: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Select Medication</option>
                  {medications.map((med) => (
                    <option key={med.id} value={med.name}>{med.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dosage</label>
                  <input
                    type="text"
                    placeholder="500mg"
                    value={prescription.dosage}
                    onChange={(e) => setPrescription({...prescription, dosage: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                  <select
                    value={prescription.frequency}
                    onChange={(e) => setPrescription({...prescription, frequency: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="OD">Once Daily</option>
                    <option value="BD">Twice Daily</option>
                    <option value="TDS">Three Times Daily</option>
                    <option value="QID">Four Times Daily</option>
                    <option value="PRN">As Needed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                <input
                  type="text"
                  placeholder="7 days"
                  value={prescription.duration}
                  onChange={(e) => setPrescription({...prescription, duration: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Instructions</label>
                <input
                  type="text"
                  placeholder="Take after meals"
                  value={prescription.instructions}
                  onChange={(e) => setPrescription({...prescription, instructions: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowPrescribeModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePrescribe}
                  disabled={!prescription.medication}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                  Prescribe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLabOrderModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Order Lab Test - {selectedPatient.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lab Test</label>
                <select
                  value={labTestName}
                  onChange={(e) => setLabTestName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">Select Lab Test</option>
                  <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
                  <option value="Blood Glucose (Fasting)">Blood Glucose (Fasting)</option>
                  <option value="Creatinine">Creatinine</option>
                  <option value="Sodium">Sodium</option>
                  <option value="Potassium">Potassium</option>
                  <option value="AST (SGOT)">AST (SGOT)</option>
                  <option value="ALT (SGPT)">ALT (SGPT)</option>
                  <option value="Lipid Profile">Lipid Profile</option>
                  <option value="Urinalysis">Urinalysis</option>
                  <option value="Blood Culture">Blood Culture</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowLabOrderModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOrderLab}
                  disabled={!labTestName}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  Order Lab
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}