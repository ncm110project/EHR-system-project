"use client";

import { Patient } from "@/lib/ehr-data";
import { getWorkflowStatus, getWorkflowStatusLabel, getWorkflowStatusColor, canAssignBed, canRecordVitals, canDischarge } from "./utils";

interface PatientListProps {
  patients: Patient[];
  pendingPatients: Patient[];
  wardPatients: Patient[];
  isChargeNurse: boolean;
  isStaffNurse: boolean;
  isDoctor: boolean;
  onSelectPatient: (patient: Patient) => void;
  onAdmitPatient: (patient: Patient) => void;
  onAssignNurse: (patient: Patient) => void;
  onTransferPatient: (patient: Patient) => void;
  onDischargePatient: (patient: Patient) => void;
  onViewVitals: (patient: Patient) => void;
}

export function PatientList({
  patients,
  pendingPatients,
  wardPatients,
  isChargeNurse,
  isStaffNurse,
  isDoctor,
  onSelectPatient,
  onAdmitPatient,
  onAssignNurse,
  onTransferPatient,
  onDischargePatient,
  onViewVitals
}: PatientListProps) {
  return (
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
                <td colSpan={6} className="px-4 py-2 font-medium text-yellow-800">
                  Pending Admission/Transfer ({pendingPatients.length})
                </td>
              </tr>
              {pendingPatients.map(patient => (
                <tr key={patient.id} className="hover:bg-yellow-25">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-800">{patient.name}</p>
                      <p className="text-xs text-slate-500">{patient.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">-</td>
                  <td className="px-4 py-3 text-slate-600">{patient.diagnosis || patient.chiefComplaint || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{patient.dietType || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getWorkflowStatusColor(getWorkflowStatus(patient))}`}>
                      {getWorkflowStatusLabel(getWorkflowStatus(patient))}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {isChargeNurse && canAssignBed(patient) && (
                        <button
                          onClick={() => onAdmitPatient(patient)}
                          className="px-2 py-1 text-xs bg-teal-100 text-teal-700 rounded hover:bg-teal-200"
                        >
                          Admit
                        </button>
                      )}
                      {isChargeNurse && (
                        <button
                          onClick={() => onTransferPatient(patient)}
                          className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                        >
                          Transfer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </>
          )}
          {wardPatients.length > 0 && (
            <>
              <tr className="bg-green-50">
                <td colSpan={6} className="px-4 py-2 font-medium text-green-800">
                  Admitted Patients ({wardPatients.length})
                </td>
              </tr>
              {wardPatients.map(patient => (
                <tr key={patient.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-800">{patient.name}</p>
                      <p className="text-xs text-slate-500">{patient.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {patient.roomNumber ? `Room ${patient.roomNumber}` : '-'} {patient.bedNumber ? `/ Bed ${patient.bedNumber}` : ''}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{patient.diagnosis || patient.chiefComplaint || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{patient.dietType || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getWorkflowStatusColor(getWorkflowStatus(patient))}`}>
                      {getWorkflowStatusLabel(getWorkflowStatus(patient))}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => onSelectPatient(patient)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        View
                      </button>
                      {(isChargeNurse || isStaffNurse) && canRecordVitals(patient) && (
                        <button
                          onClick={() => onViewVitals(patient)}
                          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Vitals
                        </button>
                      )}
                      {isChargeNurse && (
                        <button
                          onClick={() => onAssignNurse(patient)}
                          className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                        >
                          Assign Nurse
                        </button>
                      )}
                      {isChargeNurse && canDischarge(patient) && (
                        <button
                          onClick={() => onDischargePatient(patient)}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Discharge
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </>
          )}
          {pendingPatients.length === 0 && wardPatients.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                No patients found in General Ward
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}