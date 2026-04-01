"use client";

import { Patient } from "@/lib/ehr-data";

interface PatientRecordPrintProps {
  patient: Patient;
  onClose: () => void;
}

export function PatientRecordPrint({ patient, onClose }: PatientRecordPrintProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between print:hidden">
          <h3 className="text-lg font-semibold">Patient Record - Print Preview</h3>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-8 print:p-0">
          <div className="text-center mb-8 border-b-2 border-slate-800 pb-4">
            <h1 className="text-2xl font-bold">MedConnect Hospital</h1>
            <p className="text-slate-600">Electronic Health Record System</p>
            <p className="text-sm text-slate-500 mt-2">Patient Medical Record</p>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4">PATIENT INFORMATION</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Patient ID</p>
                <p className="font-semibold">{patient.id}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Full Name</p>
                <p className="font-semibold">{patient.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Age</p>
                <p className="font-semibold">{patient.age} years</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Gender</p>
                <p className="font-semibold">{patient.gender}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Date of Birth</p>
                <p className="font-semibold">{patient.dob || 'Not recorded'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Blood Type</p>
                <p className="font-semibold">{patient.bloodType}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Phone</p>
                <p className="font-semibold">{patient.phone || 'Not recorded'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Address</p>
                <p className="font-semibold">{patient.address || 'Not recorded'}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4">ALLERGIES</h2>
            {patient.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map((allergy, idx) => (
                  <span key={idx} className="px-3 py-1 border border-red-300 text-red-700 rounded">
                    {allergy}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No known allergies</p>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4">VITAL SIGNS</h2>
            {patient.vitalSigns ? (
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center p-3 bg-slate-50 rounded">
                  <p className="text-xs text-slate-500">Blood Pressure</p>
                  <p className="font-semibold">{patient.vitalSigns.bloodPressure}</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded">
                  <p className="text-xs text-slate-500">Heart Rate</p>
                  <p className="font-semibold">{patient.vitalSigns.heartRate} bpm</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded">
                  <p className="text-xs text-slate-500">Temperature</p>
                  <p className="font-semibold">{patient.vitalSigns.temperature}°F</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded">
                  <p className="text-xs text-slate-500">Resp. Rate</p>
                  <p className="font-semibold">{patient.vitalSigns.respiratoryRate}/min</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded">
                  <p className="text-xs text-slate-500">SpO2</p>
                  <p className="font-semibold">{patient.vitalSigns.oxygenSaturation}%</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500">No vital signs recorded</p>
            )}
          </div>

          {patient.nurseNotes && (
            <div className="mb-6">
              <h2 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4">NURSE NOTES</h2>
              <p className="p-3 bg-slate-50 rounded whitespace-pre-wrap">{patient.nurseNotes}</p>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4">DIAGNOSIS</h2>
            <p className="p-3 bg-slate-50 rounded">{patient.diagnosis || 'No diagnosis recorded'}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4">CHIEF COMPLAINT</h2>
            <p className="p-3 bg-slate-50 rounded">{patient.chiefComplaint || 'No complaint recorded'}</p>
          </div>

          {patient.prescriptions && patient.prescriptions.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4">MEDICATIONS</h2>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 text-sm font-semibold">Medication</th>
                    <th className="text-left py-2 text-sm font-semibold">Dosage</th>
                    <th className="text-left py-2 text-sm font-semibold">Frequency</th>
                    <th className="text-left py-2 text-sm font-semibold">Duration</th>
                    <th className="text-left py-2 text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.prescriptions.map((rx, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-2">{rx.medication}</td>
                      <td className="py-2">{rx.dosage}</td>
                      <td className="py-2">{rx.frequency}</td>
                      <td className="py-2">{rx.duration}</td>
                      <td className="py-2 capitalize">{rx.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {patient.labOrders && patient.labOrders.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4">LAB RESULTS</h2>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 text-sm font-semibold">Test Name</th>
                    <th className="text-left py-2 text-sm font-semibold">Type</th>
                    <th className="text-left py-2 text-sm font-semibold">Date</th>
                    <th className="text-left py-2 text-sm font-semibold">Status</th>
                    <th className="text-left py-2 text-sm font-semibold">Results</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.labOrders.map((order, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-2">{order.testName}</td>
                      <td className="py-2 capitalize">{order.testType}</td>
                      <td className="py-2">{order.date}</td>
                      <td className="py-2 capitalize">{order.status}</td>
                      <td className="py-2">{order.results || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-slate-300">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-slate-500">Admission Date</p>
                <p className="font-semibold">{new Date(patient.admissionDate).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Department</p>
                <p className="font-semibold uppercase">{patient.department}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-300 text-center text-xs text-slate-500">
            <p>This document is generated from MedConnect EHR System</p>
            <p>Printed on: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
