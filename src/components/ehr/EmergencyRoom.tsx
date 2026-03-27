"use client";

import { useState } from "react";
import { useEHR } from "@/lib/ehr-context";
import { useAuth } from "@/lib/auth-context";
import { Patient, TriagePriority, VitalSigns, LabOrder, Prescription } from "@/lib/ehr-data";

const generateId = () => `A${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

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
  
  const isNurse = user?.role === 'nurse';
  const isDoctor = user?.role === 'doctor';

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
    oxygenSaturation: 0
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
    updatePatient({ ...patient, vitalSigns: vitalsData });
    addActivity({
      id: generateId(),
      type: 'vitals',
      department: 'er',
      patientId: patient.id,
      patientName: patient.name,
      description: `Vitals updated: BP ${vitalsData.bloodPressure}, HR ${vitalsData.heartRate}`,
      timestamp: new Date().toISOString()
    });
    setShowVitalsForm(false);
    setVitalsData({ bloodPressure: '', heartRate: 0, temperature: 0, respiratoryRate: 0, oxygenSaturation: 0 });
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
      vitalSigns: { bloodPressure: '-', heartRate: 0, temperature: 0, respiratoryRate: 0, oxygenSaturation: 0 }
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
    updatePatient({ ...patient, status: 'discharged' });
    addActivity({
      id: generateId(),
      type: 'discharge',
      department: 'er',
      patientId: patient.id,
      patientName: patient.name,
      description: `Patient discharged from ER`,
      timestamp: new Date().toISOString()
    });
    setSelectedPatient(null);
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
                <div>
                  <p className="text-sm text-slate-500">Chief Complaint</p>
                  <p className="font-semibold">{selectedPatient.chiefComplaint || 'Not recorded'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <p className="font-semibold capitalize">{selectedPatient.status}</p>
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
                            {commonLabTests.map((test) => (
                              <option key={test.name} value={test.name}>{test.name}</option>
                            ))}
                          </select>
                          <button 
                            className="btn btn-primary"
                            onClick={() => {
                              if (selectedLabTest) {
                                const test = commonLabTests.find(t => t.name === selectedLabTest);
                                if (test) {
                                  handleOrderLab(selectedPatient, test.name, test.type);
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
