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
  const { patients, updatePatient, addActivity, medications, addPatient } = useEHR();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showTriageForm, setShowTriageForm] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    firstName: "", middleName: "", lastName: "",
    dob: "", age: 0,
    civilStatus: "Single", religion: "", religionOther: "",
    phone: "", email: "", streetAddress: "", city: "", province: "",
    emergencyName: "", emergencyRelationship: "", emergencyPhone: "",
    hypertension: false, diabetes: false, asthma: false, heartDisease: false,
    kidneyDisease: false, stroke: false, tuberculosis: false, cancer: false,
    arthritis: false, thyroidDisorder: false, conditionsOther: false,
    conditionsOtherText: "",
    allergyPenicillin: false, allergySulfa: false, allergyAspirin: false, allergyNsaids: false,
    allergySeafood: false, allergyNuts: false, allergyEggs: false, allergyMilk: false,
    allergyDust: false, allergyPollen: false, allergiesOther: false,
    allergiesOtherText: "",
    currentMedications: "", pastSurgeries: "",
    smoking: "Non-smoker", alcoholUse: "None", occupation: "",
    hasInsurance: false, insuranceProvider: "", policyNumber: "", memberId: "",
    gender: "Male" as "Male" | "Female",
    height: 0, weight: 0, chiefComplaint: "",
    bloodType: "Unknown",
    vitalsBpSystolic: 0, vitalsBpDiastolic: 0, vitalsHeartRate: 0,
    vitalsTemperature: 0, vitalsOxygenSaturation: 0, vitalsRespiratoryRate: 0,
    vitalsPainScore: 0
  });
  
  const isNurse = !!(user && 'role' in user && user.role === 'nurse');

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    if (birthDate > today) return 0;
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const pendingTriagePatients = patients.filter(p => 
    p.department === 'triage' && p.triageStatus !== 'triaged'
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

  const handleRegisterPatient = () => {
    if (!newPatientForm.firstName || !newPatientForm.lastName || !newPatientForm.dob || !newPatientForm.phone) return;
    const now = new Date().toISOString();
    const calculatedAge = calculateAge(newPatientForm.dob);
    
    const medicalConditions: string[] = [];
    if (newPatientForm.hypertension) medicalConditions.push("Hypertension");
    if (newPatientForm.diabetes) medicalConditions.push("Diabetes");
    if (newPatientForm.asthma) medicalConditions.push("Asthma");
    if (newPatientForm.heartDisease) medicalConditions.push("Heart Disease");
    if (newPatientForm.kidneyDisease) medicalConditions.push("Kidney Disease");
    if (newPatientForm.stroke) medicalConditions.push("Stroke");
    if (newPatientForm.tuberculosis) medicalConditions.push("Tuberculosis");
    if (newPatientForm.cancer) medicalConditions.push("Cancer");
    if (newPatientForm.arthritis) medicalConditions.push("Arthritis");
    if (newPatientForm.thyroidDisorder) medicalConditions.push("Thyroid Disorder");
    if (newPatientForm.conditionsOther) medicalConditions.push(newPatientForm.conditionsOtherText || "Other");

    const allergiesList: string[] = [];
    if (newPatientForm.allergyPenicillin) allergiesList.push("Penicillin");
    if (newPatientForm.allergySulfa) allergiesList.push("Sulfa Drugs");
    if (newPatientForm.allergyAspirin) allergiesList.push("Aspirin");
    if (newPatientForm.allergyNsaids) allergiesList.push("NSAIDs");
    if (newPatientForm.allergySeafood) allergiesList.push("Seafood");
    if (newPatientForm.allergyNuts) allergiesList.push("Nuts");
    if (newPatientForm.allergyEggs) allergiesList.push("Eggs");
    if (newPatientForm.allergyMilk) allergiesList.push("Milk");
    if (newPatientForm.allergyDust) allergiesList.push("Dust");
    if (newPatientForm.allergyPollen) allergiesList.push("Pollen");
    if (newPatientForm.allergiesOther) allergiesList.push(newPatientForm.allergiesOtherText || "Other");

    const fullName = `${newPatientForm.firstName} ${newPatientForm.middleName} ${newPatientForm.lastName}`.trim();
    
    const patient: Patient = {
      id: generateId(),
      name: fullName,
      age: calculatedAge,
      gender: newPatientForm.gender,
      dob: newPatientForm.dob,
      phone: newPatientForm.phone,
      address: `${newPatientForm.streetAddress}, ${newPatientForm.city}, ${newPatientForm.province}`.trim(),
      bloodType: newPatientForm.bloodType,
      allergies: allergiesList,
      status: 'waiting',
      department: 'triage',
      triageStatus: 'pending',
      registrationStatus: 'pending',
      admissionDate: now.split('T')[0],
      chiefComplaint: newPatientForm.chiefComplaint,
      workflowStatus: 'registered',
      registrationSource: 'TRIAGE',
      height: newPatientForm.height || undefined,
      weight: newPatientForm.weight || undefined,
      religion: newPatientForm.religion === 'Other' ? newPatientForm.religionOther : newPatientForm.religion,
      email: newPatientForm.email,
      emergencyContact: `${newPatientForm.emergencyName} (${newPatientForm.emergencyRelationship}) - ${newPatientForm.emergencyPhone}`,
      emergencyPhone: newPatientForm.emergencyPhone,
      vitalSigns: { 
        bloodPressure: newPatientForm.vitalsBpSystolic && newPatientForm.vitalsBpDiastolic 
          ? `${newPatientForm.vitalsBpSystolic}/${newPatientForm.vitalsBpDiastolic}` 
          : '-', 
        heartRate: newPatientForm.vitalsHeartRate, 
        temperature: newPatientForm.vitalsTemperature, 
        respiratoryRate: newPatientForm.vitalsRespiratoryRate, 
        oxygenSaturation: newPatientForm.vitalsOxygenSaturation,
        painScore: newPatientForm.vitalsPainScore,
        recordedAt: now 
      },
      vitalSignsHistory: [{
        vitals: {
          bloodPressure: newPatientForm.vitalsBpSystolic && newPatientForm.vitalsBpDiastolic 
            ? `${newPatientForm.vitalsBpSystolic}/${newPatientForm.vitalsBpDiastolic}` 
            : '-',
          heartRate: newPatientForm.vitalsHeartRate,
          temperature: newPatientForm.vitalsTemperature,
          respiratoryRate: newPatientForm.vitalsRespiratoryRate,
          oxygenSaturation: newPatientForm.vitalsOxygenSaturation,
          painScore: newPatientForm.vitalsPainScore,
          recordedAt: now
        },
        timestamp: now,
        recordedBy: user?.name || 'Triage Nurse'
      }],
      notesHistory: [],
      diagnosisHistory: []
    };
    addPatient(patient);
    addActivity({
      id: generateId(),
      type: 'admission',
      department: 'triage',
      patientId: patient.id,
      patientName: patient.name,
      description: `Patient registered at Triage - ${patient.chiefComplaint || 'Walk-in'}`,
      timestamp: now
    });
    setShowRegistrationForm(false);
    setNewPatientForm({
      firstName: "", middleName: "", lastName: "",
      dob: "", age: 0,
      civilStatus: "Single", religion: "", religionOther: "",
      phone: "", email: "", streetAddress: "", city: "", province: "",
      emergencyName: "", emergencyRelationship: "", emergencyPhone: "",
      hypertension: false, diabetes: false, asthma: false, heartDisease: false,
      kidneyDisease: false, stroke: false, tuberculosis: false, cancer: false,
      arthritis: false, thyroidDisorder: false, conditionsOther: false,
      conditionsOtherText: "",
      allergyPenicillin: false, allergySulfa: false, allergyAspirin: false, allergyNsaids: false,
      allergySeafood: false, allergyNuts: false, allergyEggs: false, allergyMilk: false,
      allergyDust: false, allergyPollen: false, allergiesOther: false,
      allergiesOtherText: "",
      currentMedications: "", pastSurgeries: "",
      smoking: "Non-smoker", alcoholUse: "None", occupation: "",
      hasInsurance: false, insuranceProvider: "", policyNumber: "", memberId: "",
      gender: "Male",
      height: 0, weight: 0, chiefComplaint: "",
      bloodType: "Unknown",
      vitalsBpSystolic: 0, vitalsBpDiastolic: 0, vitalsHeartRate: 0,
      vitalsTemperature: 0, vitalsOxygenSaturation: 0, vitalsRespiratoryRate: 0,
      vitalsPainScore: 0
    });
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
          {isNurse && (
            <button 
              onClick={() => setShowRegistrationForm(true)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              + New Patient Registration
            </button>
          )}
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

      {showRegistrationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">New Patient Registration (Triage)</h3>
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h4 className="font-medium text-slate-800 mb-3 pb-2 border-b">Personal Information</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">First Name *</label>
                    <input type="text" value={newPatientForm.firstName} onChange={(e) => setNewPatientForm({...newPatientForm, firstName: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="First Name" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Middle Name</label>
                    <input type="text" value={newPatientForm.middleName} onChange={(e) => setNewPatientForm({...newPatientForm, middleName: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="Middle Name" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Last Name *</label>
                    <input type="text" value={newPatientForm.lastName} onChange={(e) => setNewPatientForm({...newPatientForm, lastName: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="Last Name" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Date of Birth *</label>
                    <input type="date" value={newPatientForm.dob} onChange={(e) => setNewPatientForm({...newPatientForm, dob: e.target.value, age: calculateAge(e.target.value)})} className="w-full px-2 py-1.5 border rounded text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Age</label>
                    <input type="number" value={newPatientForm.age || ''} onChange={(e) => setNewPatientForm({...newPatientForm, age: parseInt(e.target.value) || 0})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="Age" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Sex</label>
                    <select value={newPatientForm.gender} onChange={(e) => setNewPatientForm({...newPatientForm, gender: e.target.value as "Male" | "Female"})} className="w-full px-2 py-1.5 border rounded text-sm">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Civil Status</label>
                    <select value={newPatientForm.civilStatus} onChange={(e) => setNewPatientForm({...newPatientForm, civilStatus: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm">
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Separated">Separated</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Annulled">Annulled</option>
                      <option value="Cohabiting">Cohabiting</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Religion</label>
                    <select value={newPatientForm.religion} onChange={(e) => setNewPatientForm({...newPatientForm, religion: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm">
                      <option value="">Select Religion</option>
                      <option value="Roman Catholic">Roman Catholic</option>
                      <option value="Islam">Islam</option>
                      <option value="Iglesia ni Cristo">Iglesia ni Cristo</option>
                      <option value="Protestant">Protestant/Christian</option>
                      <option value="Born Again Christian">Born Again Christian</option>
                      <option value="Seventh-day Adventist">Seventh-day Adventist</option>
                      <option value="Jehovah's Witness">Jehovah&apos;s Witness</option>
                      <option value="Buddhism">Buddhism</option>
                      <option value="Hinduism">Hinduism</option>
                      <option value="None">None</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                {newPatientForm.religion === 'Other' && (
                  <div className="mt-2">
                    <input type="text" value={newPatientForm.religionOther} onChange={(e) => setNewPatientForm({...newPatientForm, religionOther: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="Specify religion" />
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="font-medium text-slate-800 mb-3 pb-2 border-b">Contact Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number *</label>
                    <input type="text" value={newPatientForm.phone} onChange={(e) => setNewPatientForm({...newPatientForm, phone: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="Phone" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                    <input type="email" value={newPatientForm.email} onChange={(e) => setNewPatientForm({...newPatientForm, email: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="Email" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Home Address</label>
                  <input type="text" value={newPatientForm.streetAddress} onChange={(e) => setNewPatientForm({...newPatientForm, streetAddress: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="Street Address" />
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <input type="text" value={newPatientForm.city} onChange={(e) => setNewPatientForm({...newPatientForm, city: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="City" />
                    <input type="text" value={newPatientForm.province} onChange={(e) => setNewPatientForm({...newPatientForm, province: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="Province" />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h4 className="font-medium text-slate-800 mb-3 pb-2 border-b">Emergency Contact</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Contact Name</label>
                    <input type="text" value={newPatientForm.emergencyName} onChange={(e) => setNewPatientForm({...newPatientForm, emergencyName: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="Full Name" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Relationship</label>
                    <select value={newPatientForm.emergencyRelationship} onChange={(e) => setNewPatientForm({...newPatientForm, emergencyRelationship: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm">
                      <option value="">Select</option>
                      <option value="Parent">Parent</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Child">Child</option>
                      <option value="Relative">Relative</option>
                      <option value="Friend">Friend</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
                  <input type="text" value={newPatientForm.emergencyPhone} onChange={(e) => setNewPatientForm({...newPatientForm, emergencyPhone: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="Emergency Contact Phone" />
                </div>
              </div>

              {/* Medical Background */}
              <div>
                <h4 className="font-medium text-slate-800 mb-3 pb-2 border-b">Medical Background</h4>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-slate-600 mb-2">Medical Conditions</label>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <label className="flex items-center gap-1"><input type="checkbox" checked={newPatientForm.hypertension} onChange={(e) => setNewPatientForm({...newPatientForm, hypertension: e.target.checked})} /> Hypertension</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={newPatientForm.diabetes} onChange={(e) => setNewPatientForm({...newPatientForm, diabetes: e.target.checked})} /> Diabetes</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={newPatientForm.asthma} onChange={(e) => setNewPatientForm({...newPatientForm, asthma: e.target.checked})} /> Asthma</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={newPatientForm.heartDisease} onChange={(e) => setNewPatientForm({...newPatientForm, heartDisease: e.target.checked})} /> Heart Disease</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={newPatientForm.kidneyDisease} onChange={(e) => setNewPatientForm({...newPatientForm, kidneyDisease: e.target.checked})} /> Kidney Disease</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={newPatientForm.stroke} onChange={(e) => setNewPatientForm({...newPatientForm, stroke: e.target.checked})} /> Stroke</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={newPatientForm.tuberculosis} onChange={(e) => setNewPatientForm({...newPatientForm, tuberculosis: e.target.checked})} /> TB</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={newPatientForm.cancer} onChange={(e) => setNewPatientForm({...newPatientForm, cancer: e.target.checked})} /> Cancer</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={newPatientForm.arthritis} onChange={(e) => setNewPatientForm({...newPatientForm, arthritis: e.target.checked})} /> Arthritis</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={newPatientForm.thyroidDisorder} onChange={(e) => setNewPatientForm({...newPatientForm, thyroidDisorder: e.target.checked})} /> Thyroid Disorder</label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={newPatientForm.conditionsOther} onChange={(e) => setNewPatientForm({...newPatientForm, conditionsOther: e.target.checked})} />
                      Other
                    </label>
                  </div>
                  {newPatientForm.conditionsOther && (
                    <div className="mt-2">
                      <input type="text" value={newPatientForm.conditionsOtherText} onChange={(e) => setNewPatientForm({...newPatientForm, conditionsOtherText: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="Specify other condition(s)" />
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-slate-600 mb-2">Allergies</label>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <label className="flex items-center gap-1"><input type="checkbox" checked={newPatientForm.allergyPenicillin} onChange={(e) => setNewPatientForm({...newPatientForm, allergyPenicillin: e.target.checked})} /> Penicillin</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={newPatientForm.allergySulfa} onChange={(e) => setNewPatientForm({...newPatientForm, allergySulfa: e.target.checked})} /> Sulfa</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={newPatientForm.allergyAspirin} onChange={(e) => setNewPatientForm({...newPatientForm, allergyAspirin: e.target.checked})} /> Aspirin</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={newPatientForm.allergyNsaids} onChange={(e) => setNewPatientForm({...newPatientForm, allergyNsaids: e.target.checked})} /> NSAIDs</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={newPatientForm.allergySeafood} onChange={(e) => setNewPatientForm({...newPatientForm, allergySeafood: e.target.checked})} /> Seafood</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={newPatientForm.allergyNuts} onChange={(e) => setNewPatientForm({...newPatientForm, allergyNuts: e.target.checked})} /> Nuts</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={newPatientForm.allergyEggs} onChange={(e) => setNewPatientForm({...newPatientForm, allergyEggs: e.target.checked})} /> Eggs</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={newPatientForm.allergyMilk} onChange={(e) => setNewPatientForm({...newPatientForm, allergyMilk: e.target.checked})} /> Milk</label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={newPatientForm.allergiesOther} onChange={(e) => setNewPatientForm({...newPatientForm, allergiesOther: e.target.checked})} />
                      Other
                    </label>
                  </div>
                  {newPatientForm.allergiesOther && (
                    <div className="mt-2">
                      <input type="text" value={newPatientForm.allergiesOtherText} onChange={(e) => setNewPatientForm({...newPatientForm, allergiesOtherText: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="Specify other allergen(s)" />
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Current Medications</label>
                  <textarea value={newPatientForm.currentMedications} onChange={(e) => setNewPatientForm({...newPatientForm, currentMedications: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm h-16" placeholder="List current medications" />
                </div>
              </div>

              {/* Vital Signs */}
              <div>
                <h4 className="font-medium text-slate-800 mb-3 pb-2 border-b">Vital Signs</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">BP Systolic (mmHg)</label>
                    <input type="number" value={newPatientForm.vitalsBpSystolic || ''} onChange={(e) => setNewPatientForm({...newPatientForm, vitalsBpSystolic: parseInt(e.target.value) || 0})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="e.g., 120" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">BP Diastolic (mmHg)</label>
                    <input type="number" value={newPatientForm.vitalsBpDiastolic || ''} onChange={(e) => setNewPatientForm({...newPatientForm, vitalsBpDiastolic: parseInt(e.target.value) || 0})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="e.g., 80" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Heart Rate (bpm)</label>
                    <input type="number" value={newPatientForm.vitalsHeartRate || ''} onChange={(e) => setNewPatientForm({...newPatientForm, vitalsHeartRate: parseInt(e.target.value) || 0})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="e.g., 72" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Temperature (°C)</label>
                    <input type="number" step="0.1" value={newPatientForm.vitalsTemperature || ''} onChange={(e) => setNewPatientForm({...newPatientForm, vitalsTemperature: parseFloat(e.target.value) || 0})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="e.g., 36.5" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">SpO2 (%)</label>
                    <input type="number" min="0" max="100" value={newPatientForm.vitalsOxygenSaturation || ''} onChange={(e) => setNewPatientForm({...newPatientForm, vitalsOxygenSaturation: parseInt(e.target.value) || 0})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="e.g., 98" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Resp. Rate (breaths/min)</label>
                    <input type="number" value={newPatientForm.vitalsRespiratoryRate || ''} onChange={(e) => setNewPatientForm({...newPatientForm, vitalsRespiratoryRate: parseInt(e.target.value) || 0})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="e.g., 16" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Pain Score (0-10)</label>
                    <input type="number" min="0" max="10" value={newPatientForm.vitalsPainScore || ''} onChange={(e) => setNewPatientForm({...newPatientForm, vitalsPainScore: parseInt(e.target.value) || 0})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="0-10" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Height (cm)</label>
                    <input type="number" value={newPatientForm.height || ''} onChange={(e) => setNewPatientForm({...newPatientForm, height: parseFloat(e.target.value) || 0})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="e.g., 170" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Weight (kg)</label>
                    <input type="number" value={newPatientForm.weight || ''} onChange={(e) => setNewPatientForm({...newPatientForm, weight: parseFloat(e.target.value) || 0})} className="w-full px-2 py-1.5 border rounded text-sm" placeholder="e.g., 70" />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Chief Complaint / Reason for Visit</label>
                  <textarea value={newPatientForm.chiefComplaint} onChange={(e) => setNewPatientForm({...newPatientForm, chiefComplaint: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm h-20" placeholder="Describe the patient's condition..." />
                </div>
              </div>

              {/* Insurance */}
              <div>
                <h4 className="font-medium text-slate-800 mb-3 pb-2 border-b">Insurance Information</h4>
                <div className="flex items-center gap-2 mb-3">
                  <input type="checkbox" checked={newPatientForm.hasInsurance} onChange={(e) => setNewPatientForm({...newPatientForm, hasInsurance: e.target.checked})} />
                  <span className="text-sm">With Insurance</span>
                </div>
                {newPatientForm.hasInsurance && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Provider</label>
                      <select value={newPatientForm.insuranceProvider} onChange={(e) => setNewPatientForm({...newPatientForm, insuranceProvider: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm">
                        <option value="">Select</option>
                        <option value="PhilHealth">PhilHealth</option>
                        <option value="Maxicare">Maxicare</option>
                        <option value="Medicard">Medicard</option>
                        <option value="Intellicare">Intellicare</option>
                        <option value="Cocolife">Cocolife Healthcare</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Policy Number</label>
                      <input type="text" value={newPatientForm.policyNumber} onChange={(e) => setNewPatientForm({...newPatientForm, policyNumber: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Member ID</label>
                      <input type="text" value={newPatientForm.memberId} onChange={(e) => setNewPatientForm({...newPatientForm, memberId: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowRegistrationForm(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={handleRegisterPatient} disabled={!newPatientForm.firstName || !newPatientForm.lastName || !newPatientForm.dob || !newPatientForm.phone} className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                  Register Patient
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}