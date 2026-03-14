"use client";

import { useState } from "react";
import { useEHR } from "@/lib/ehr-context";
import { Medication, Prescription } from "@/lib/ehr-data";

const generateId = () => `A${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function Pharmacy() {
  const { medications, prescriptions, patients, updatePrescription, addActivity } = useEHR();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'inventory' | 'prescriptions'>('prescriptions');

  const filteredMeds = medications.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingPrescriptions = prescriptions.filter(p => p.status === 'pending');
  const dispensedPrescriptions = prescriptions.filter(p => p.status === 'dispensed');

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient?.name || 'Unknown';
  };

  const handleDispense = (prescription: Prescription) => {
    updatePrescription({ ...prescription, status: 'dispensed' });
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

  const lowStockMeds = medications.filter(m => m.stock < m.minStock);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pharmacy</h2>
          <p className="text-slate-500">Medication management and dispensing</p>
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
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'prescriptions' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Prescriptions ({pendingPrescriptions.length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'inventory' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
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
              {pendingPrescriptions.map((rx) => (
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
                        {rx.dosage} • {rx.frequency} • {rx.duration}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Patient: {getPatientName(rx.patientId)} • Dr. {rx.prescribedBy}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{rx.date}</span>
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleDispense(rx)}
                    >
                      Dispense
                    </button>
                  </div>
                </div>
              ))}
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
              {dispensedPrescriptions.slice(0, 5).map((rx) => (
                <div key={rx.id} className="p-4 flex items-center justify-between opacity-60">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">{rx.medication}</p>
                      <p className="text-sm text-slate-500">Patient: {getPatientName(rx.patientId)}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{rx.date}</span>
                </div>
              ))}
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
                {lowStockMeds.map(m => m.name).join(', ')} {' '}need restocking
              </p>
            </div>
          )}

          <div className="card">
            <div className="p-4 border-b border-slate-200">
              <input
                type="text"
                placeholder="Search medications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-md"
              />
            </div>
            <table>
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Min Stock</th>
                  <th>Unit</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeds.map((med) => (
                  <tr key={med.id}>
                    <td className="font-medium">{med.name}</td>
                    <td>
                      <span className="badge badge-info">{med.category}</span>
                    </td>
                    <td className={med.stock < med.minStock ? 'text-red-600 font-semibold' : ''}>
                      {med.stock}
                    </td>
                    <td>{med.minStock}</td>
                    <td>{med.unit}</td>
                    <td>${med.price.toFixed(2)}</td>
                    <td>
                      {med.stock < med.minStock ? (
                        <span className="badge badge-error">Low</span>
                      ) : (
                        <span className="badge badge-success">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
