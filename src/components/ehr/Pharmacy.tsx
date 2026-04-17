"use client";

import { useState } from "react";
import { useEHR } from "@/lib/ehr-context";
import { useToast } from "@/components/providers/ToastProvider";
import { Medication, Prescription, medicationClassifications, drugInteractions } from "@/lib/ehr-data";

const generateId = () => `A${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function Pharmacy() {
  const { addToast } = useToast();
  const { medications, prescriptions, patients, updatePrescription, addActivity, updateMedication } = useEHR();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'inventory' | 'prescriptions'>('prescriptions');
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [newStock, setNewStock] = useState(0);
  const [selectedClassification, setSelectedClassification] = useState<string>('all');
  const [dispenseWarning, setDispenseWarning] = useState<{ prescription: Prescription; message: string } | null>(null);
  const [showPartialDispense, setShowPartialDispense] = useState<Prescription | null>(null);
  const [partialQuantity, setPartialQuantity] = useState(1);

  const pendingPrescriptions = prescriptions.filter(p => p.status === 'pending' || p.status === 'partial');
  const dispensedPrescriptions = prescriptions.filter(p => p.status === 'dispensed');

  const getPatientSource = (patientId: string): string => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return 'OTHER';
    if (patient.department === 'opd' || patient.registrationSource === 'OPD' || patient.registrationSource === 'SELF_REGISTRATION') return 'OPD';
    if (patient.department === 'er') return 'ER';
    if (patient.department === 'general-ward') return 'WARD';
    return 'OTHER';
  };

  const filteredMeds = medications.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.classification.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClassification = selectedClassification === 'all' || m.classification === selectedClassification;
    return matchesSearch && matchesClassification;
  });

  const groupedMeds = medicationClassifications.reduce((acc, classification) => {
    const meds = filteredMeds.filter(m => m.classification === classification);
    if (meds.length > 0) {
      acc[classification] = meds;
    }
    return acc;
  }, {} as Record<string, Medication[]>);

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient?.name || 'Unknown';
  };

  const getPatientInfo = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return null;
    return {
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone
    };
  };

  const checkDrugInteractions = (medicationName: string, patientId: string) => {
    const patientPrescriptions = prescriptions.filter(
      rx => rx.patientId === patientId && rx.status === 'dispensed'
    );
    
    const interactions = [];
    for (const rx of patientPrescriptions) {
      const interaction = drugInteractions.find(
        di => (di.drugA === medicationName && di.drugB === rx.medication) ||
              (di.drugB === medicationName && di.drugA === rx.medication)
      );
      if (interaction) {
        interactions.push(interaction);
      }
    }
    return interactions;
  };

  const checkPatientAllergies = (medicationName: string, patientId: string): string | null => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient || !patient.allergies || patient.allergies.length === 0) return null;
    
    const allergyWarnings: string[] = [];
    const allergyLower = patient.allergies.map(a => a.toLowerCase());
    
    const medication = medications.find(m => m.name === medicationName);
    if (medication) {
      const category = medication.category.toLowerCase();
      if (allergyLower.some(a => category.includes(a) || a.includes(category))) {
        allergyWarnings.push(`Patient allergic to ${medication.category} medications`);
      }
      
      const classification = medication.classification.toLowerCase();
      if (allergyLower.some(a => classification.includes(a) || a.includes(classification))) {
        allergyWarnings.push(`Patient allergic to ${medication.classification} class`);
      }
      
      if (allergyLower.includes(medicationName.toLowerCase())) {
        allergyWarnings.push(`Patient explicitly allergic to ${medicationName}`);
      }
    }
    
    return allergyWarnings.length > 0 ? allergyWarnings.join('; ') : null;
  };

  const handleDispense = (prescription: Prescription) => {
    const medication = medications.find(m => m.name === prescription.medication);
    
    if (!medication) {
      setDispenseWarning({ prescription, message: 'Medication not found in inventory' });
      return;
    }
    
    if (medication.stock <= 0) {
      setDispenseWarning({ prescription, message: `Insufficient stock: ${medication.name} is out of stock` });
      return;
    }

    const allergyWarning = checkPatientAllergies(prescription.medication, prescription.patientId);
    if (allergyWarning) {
      setDispenseWarning({ 
        prescription, 
        message: `⚠ ALLERGY ALERT: ${allergyWarning}` 
      });
      return;
    }

    const interactions = checkDrugInteractions(prescription.medication, prescription.patientId);
    if (interactions.length > 0 && interactions.some(i => i.severity === 'severe')) {
      setDispenseWarning({ 
        prescription, 
        message: `Warning: ${interactions[0].description}` 
      });
      return;
    }

    updateMedication({ ...medication, stock: medication.stock - 1 });
    updatePrescription({ ...prescription, status: 'dispensed', dispensedQuantity: prescription.quantity || 1 });
    addActivity({
      id: generateId(),
      type: 'prescription',
      department: 'pharmacy',
      patientId: prescription.patientId,
      patientName: getPatientName(prescription.patientId),
      description: `Dispensed - ${prescription.medication}`,
      timestamp: new Date().toISOString()
    });
  };

  const handleForceDispense = () => {
    if (!dispenseWarning) return;
    const prescription = dispenseWarning.prescription;
    const medication = medications.find(m => m.name === prescription.medication);
    
    if (medication && medication.stock > 0) {
      updateMedication({ ...medication, stock: medication.stock - 1 });
      updatePrescription({ ...prescription, status: 'dispensed', dispensedQuantity: prescription.quantity || 1 });
      addActivity({
        id: generateId(),
        type: 'prescription',
        department: 'pharmacy',
        patientId: prescription.patientId,
        patientName: getPatientName(prescription.patientId),
        description: `Dispensed (override) - ${prescription.medication}`,
        timestamp: new Date().toISOString()
      });
    }
    setDispenseWarning(null);
  };

   const handlePartialDispense = () => {
     if (!showPartialDispense) return;
     const medication = medications.find(m => m.name === showPartialDispense.medication);
     if (!medication) { addToast('Medication not found', 'error'); return; }
     if (medication.stock < partialQuantity) { addToast('Insufficient stock', 'error'); return; }
    const newDispensed = (showPartialDispense.dispensedQuantity || 0) + partialQuantity;
    const total = showPartialDispense.quantity || 1;
    const newStatus = newDispensed >= total ? 'dispensed' : 'partial';
    updateMedication({ ...medication, stock: medication.stock - partialQuantity });
    updatePrescription({ ...showPartialDispense, status: newStatus, dispensedQuantity: newDispensed });
    setShowPartialDispense(null);
    setPartialQuantity(1);
  };

  const handleUpdateStock = (medication: Medication) => {
    updateMedication({ ...medication, stock: newStock });
    addActivity({
      id: generateId(),
      type: 'prescription',
      department: 'pharmacy',
      description: `Stock updated for ${medication.name}: ${newStock} ${medication.unit}`,
      timestamp: new Date().toISOString()
    });
    setEditingMed(null);
  };

  const lowStockMeds = medications.filter(m => m.stock < m.minStock);

  const getDosageFormIcon = (form: string) => {
    switch (form) {
      case 'tablet': return '💊';
      case 'capsule': return '💊';
      case 'syrup': return '🧴';
      case 'injection': return '💉';
      case 'cream': return '🧴';
      case 'drops': return '💧';
      case 'inhaler': return '🫁';
      case 'suppository': return '💊';
      default: return '💊';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pharmacy</h2>
          <p className="text-slate-500">Manage inventory and dispense medications</p>
        </div>
        {lowStockMeds.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span className="font-medium">{lowStockMeds.length} Low Stock Alert</span>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'prescriptions' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Doctor&apos;s Orders ({pendingPrescriptions.length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'inventory' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Inventory ({medications.length})
        </button>
      </div>

      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          <div className="card">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold">Pending Prescriptions</h3>
              <span className="badge badge-warning">{pendingPrescriptions.length} pending</span>
            </div>
            <div className="divide-y divide-slate-200">
              {pendingPrescriptions.map((rx) => {
                const patientInfo = getPatientInfo(rx.patientId);
                const medication = medications.find(m => m.name === rx.medication);
                return (
                  <div key={rx.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10.5 20.5L3.5 13.5C2.12 12.12 2.12 9.88 3.5 8.5L8.5 3.5C9.88 2.12 12.12 2.12 13.5 3.5L20.5 10.5C21.88 11.88 21.88 14.12 20.5 15.5L15.5 20.5C14.12 21.88 11.88 21.88 10.5 20.5Z"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold">{rx.medication}</p>
                        <p className="text-sm text-slate-500">
                          {rx.dosage} • {rx.frequency} • {rx.route || 'Oral'} • {rx.duration}
                        </p>
                        {medication && (
                          <p className={`text-xs ${medication.stock <= 0 ? 'text-red-600' : medication.stock < medication.minStock ? 'text-amber-600' : 'text-green-600'}`}>
                            Stock: {medication.stock} available
                          </p>
                        )}
                        {patientInfo && (
                          <div className="text-xs text-slate-400 mt-1">
                            Patient: {patientInfo.name} ({patientInfo.age}y {patientInfo.gender[0]}) • {patientInfo.phone}
                          </div>
                        )}
                        <p className="text-xs text-slate-400">Prescribed by: {rx.prescribedBy}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{rx.date}</span>
                      {rx.status === 'partial' && <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">Partial: {rx.dispensedQuantity || 0}/{rx.quantity || 1}</span>}
                      {getPatientSource(rx.patientId) === 'OPD' && medication && medication.stock > 0 && rx.status !== 'partial' && <button className="px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded hover:bg-amber-200" onClick={() => { setShowPartialDispense(rx); setPartialQuantity(1); }}>Partial</button>}
                      <button 
                        className={`btn ${medication && medication.stock <= 0 ? 'btn-disabled' : 'btn-primary'}`}
                        onClick={() => handleDispense(rx)}
                        disabled={medication && medication.stock <= 0}
                      >
                        {medication && medication.stock <= 0 ? 'Out of Stock' : rx.status === 'partial' ? 'Complete' : 'Dispense'}
                      </button>
                    </div>
                  </div>
                );
              })}
              {pendingPrescriptions.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  No pending prescriptions
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-500">Recently Dispensed</h3>
            </div>
            <div className="divide-y divide-slate-200">
              {dispensedPrescriptions.slice(0, 5).map((rx) => {
                const patientInfo = getPatientInfo(rx.patientId);
                return (
                  <div key={rx.id} className="p-4 flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold">{rx.medication}</p>
                        {patientInfo && (
                          <p className="text-sm text-slate-500">Patient: {patientInfo.name}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{rx.date}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {lowStockMeds.length > 0 && (
            <div className="card p-4 bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                </svg>
                <span className="font-semibold text-red-700">Low Stock Alert</span>
              </div>
              <p className="text-sm text-red-600">
                {lowStockMeds.map(m => m.name).join(', ')} need restocking
              </p>
            </div>
          )}

          <div className="card">
            <div className="p-4 border-b border-slate-200 flex items-center gap-4">
              <input
                type="text"
                placeholder="Search medications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 max-w-md"
              />
              <select
                value={selectedClassification}
                onChange={(e) => setSelectedClassification(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="all">All Classifications</option>
                {medicationClassifications.map((classification) => (
                  <option key={classification} value={classification}>{classification}</option>
                ))}
              </select>
            </div>
            
            <div className="p-4 space-y-6">
              {Object.entries(groupedMeds).map(([classification, meds]) => (
                <div key={classification}>
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    {classification}
                    <span className="text-sm font-normal text-slate-500">({meds.length} medications)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {meds.map((med) => (
                      <div 
                        key={med.id} 
                        className={`p-4 rounded-lg border ${med.stock < med.minStock ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span>{getDosageFormIcon(med.dosageForm)}</span>
                              <p className="font-semibold">{med.name}</p>
                            </div>
                            <p className="text-sm text-slate-500 capitalize">{med.dosageForm}</p>
                          </div>
                          <button 
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            onClick={() => {
                              setEditingMed(med);
                              setNewStock(med.stock);
                            }}
                          >
                            Edit
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div>
                            <p className={`text-lg font-bold ${med.stock < med.minStock ? 'text-red-600' : 'text-slate-800'}`}>
                              {med.stock}
                            </p>
                            <p className="text-xs text-slate-500">{med.unit}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-500">Min: {med.minStock}</p>
                            <p className="text-sm font-medium">${med.price.toFixed(2)}</p>
                          </div>
                        </div>
                        {med.stock < med.minStock && (
                          <div className="mt-2 text-xs text-red-600 font-medium">
                            ⚠️ Below minimum stock level
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(groupedMeds).length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  No medications found
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editingMed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingMed(null)}>
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Update Stock - {editingMed.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Classification</label>
                <p className="text-slate-600">{editingMed.classification}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dosage Form</label>
                <p className="text-slate-600 capitalize">{editingMed.dosageForm}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Stock</label>
                <p className="text-lg font-semibold">{editingMed.stock} {editingMed.unit}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Stock</label>
                <input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <button className="btn btn-primary flex-1" onClick={() => handleUpdateStock(editingMed)}>
                  Update
                </button>
                <button className="btn btn-secondary flex-1" onClick={() => setEditingMed(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {dispenseWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Warning</h3>
            </div>
            <p className="text-slate-600 mb-6">{dispenseWarning.message}</p>
            <div className="flex gap-3">
              <button 
                className="btn btn-secondary flex-1" 
                onClick={() => setDispenseWarning(null)}
              >
                Cancel
              </button>
              {!dispenseWarning.message.includes('Insufficient') && (
                <button 
                  className="btn btn-primary flex-1" 
                  onClick={handleForceDispense}
                >
                  Dispense Anyway
                </button>
              )}
            </div>
          </div>
        </div>
      )}

        {showPartialDispense && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
              <h3 className="text-lg font-semibold mb-4">Partial Dispense</h3>
              <p className="text-slate-600 mb-2">Medication: <strong>{showPartialDispense.medication}</strong></p>
              <p className="text-sm text-slate-500 mb-4">Prescribed: {showPartialDispense.quantity || 1} | Already dispensed: {showPartialDispense.dispensedQuantity || 0}</p>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Quantity to dispense</label>
                <input type="number" min={1} max={(showPartialDispense.quantity || 1) - (showPartialDispense.dispensedQuantity || 0)} value={partialQuantity} onChange={(e) => setPartialQuantity(parseInt(e.target.value) || 1)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="flex gap-3">
                <button className="btn btn-secondary flex-1" onClick={() => setShowPartialDispense(null)}>Cancel</button>
                <button className="btn btn-primary flex-1" onClick={handlePartialDispense}>Dispense {partialQuantity}</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
