"use client";

import { Patient } from "@/lib/ehr-data";
import { canRecordVitals, getWorkflowStatus, isAbnormalBP, isAbnormalHR, isAbnormalTemp, isAbnormalRR, isAbnormalSpO2, formatVitalTime, getWorkflowStatusLabel, getWorkflowStatusColor } from "./utils";

interface PatientDetailProps {
  patient: Patient;
  wardNurses: { id: string; name: string }[];
  onClose: () => void;
  onSaveVitals: () => void;
  onSaveProgress: () => void;
  onOrderLab: () => void;
  onPrescribe: () => void;
  onDischarge: () => void;
  onAddIV: () => void;
  onAddVisitor: () => void;
  onSavePainAssessment: () => void;
  onReportIncident: () => void;
  onSaveRounding: () => void;
  onUpdateNewVitals: (vitals: any) => void;
  newVitals: any;
  progressNote: string;
  setProgressNote: (v: string) => void;
  labTestName: string;
  setLabTestName: (v: string) => void;
  prescription: any;
  setPrescription: (v: any) => void;
  ivFluid: any;
  setIvFluid: (v: any) => void;
  visitor: any;
  setVisitor: (v: any) => void;
  painAssessment: any;
  setPainAssessment: (v: any) => void;
  incident: any;
  setIncident: (v: any) => void;
  rounding: any;
  setRounding: (v: any) => void;
  isChargeNurse: boolean;
  isStaffNurse: boolean;
  isDoctor: boolean;
}

export function PatientDetail({
  patient,
  onClose,
  isChargeNurse,
  isStaffNurse,
  isDoctor,
}: PatientDetailProps) {
  const canVitals = canRecordVitals(patient);
  const status = getWorkflowStatus(patient);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-slate-800">{patient.name}</h3>
          <p className="text-sm text-slate-500">{patient.id} • {patient.gender} • {patient.age} years</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm ${getWorkflowStatusColor(status)}`}>
            {getWorkflowStatusLabel(status)}
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-slate-700 mb-3">Patient Information</h4>
          <div className="space-y-2 text-sm">
            <p><span className="text-slate-500">Blood Type:</span> <span className="font-medium">{patient.bloodType}</span></p>
            <p><span className="text-slate-500">Allergies:</span> <span className="font-medium text-red-600">{patient.allergies.join(', ') || 'None'}</span></p>
            <p><span className="text-slate-500">Diagnosis:</span> <span className="font-medium">{patient.diagnosis || patient.chiefComplaint || '-'}</span></p>
            <p><span className="text-slate-500">Room/Bed:</span> <span className="font-medium">{patient.roomNumber ? `Room ${patient.roomNumber}` : '-'} {patient.bedNumber ? `/ Bed ${patient.bedNumber}` : ''}</span></p>
            <p><span className="text-slate-500">Admitting Physician:</span> <span className="font-medium">{patient.admittingPhysician || '-'}</span></p>
            <p><span className="text-slate-500">Assigned Nurse:</span> <span className="font-medium">{patient.assignedNurse || '-'}</span></p>
            {(isChargeNurse || isDoctor) && (
              <p><span className="text-slate-500">Diet:</span> <span className="font-medium">{patient.dietType || '-'}</span></p>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-slate-700 mb-3">Visit Timeline</h4>
          <div className="space-y-2 text-sm">
            <p><span className="text-slate-500">Admission:</span> <span className="font-medium">{patient.admissionDate ? new Date(patient.admissionDate).toLocaleString() : '-'}</span></p>
            {patient.admittedAt && (
              <p><span className="text-slate-500">Admitted to Ward:</span> <span className="font-medium">{new Date(patient.admittedAt).toLocaleString()}</span></p>
            )}
            <p><span className="text-slate-500">Last Updated:</span> <span className="font-medium">{patient.admissionDate ? new Date(patient.admissionDate).toLocaleString() : '-'}</span></p>
          </div>
        </div>
      </div>

      {patient.vitalSigns && (
        <div className="mt-6 p-4 border border-slate-200 rounded-lg">
          <h4 className="font-semibold mb-2">Current Vitals</h4>
          <div className="grid grid-cols-5 gap-2 text-center text-sm">
            <div>
              <p className="text-slate-500">BP</p>
              <p className={`font-medium ${isAbnormalBP(patient.vitalSigns.bloodPressure) ? 'text-red-600 font-bold' : ''}`}>
                {patient.vitalSigns.bloodPressure || '-'}
              </p>
            </div>
            <div>
              <p className="text-slate-500">HR</p>
              <p className={`font-medium ${isAbnormalHR(patient.vitalSigns.heartRate) ? 'text-red-600 font-bold' : ''}`}>
                {patient.vitalSigns.heartRate || '-'}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Temp</p>
              <p className={`font-medium ${isAbnormalTemp(patient.vitalSigns.temperature) ? 'text-red-600 font-bold' : ''}`}>
                {patient.vitalSigns.temperature || '-'}
              </p>
            </div>
            <div>
              <p className="text-slate-500">RR</p>
              <p className={`font-medium ${isAbnormalRR(patient.vitalSigns.respiratoryRate) ? 'text-red-600 font-bold' : ''}`}>
                {patient.vitalSigns.respiratoryRate || '-'}
              </p>
            </div>
            <div>
              <p className="text-slate-500">SpO2</p>
              <p className={`font-medium ${isAbnormalSpO2(patient.vitalSigns.oxygenSaturation) ? 'text-red-600 font-bold' : ''}`}>
                {patient.vitalSigns.oxygenSaturation || '-'}
              </p>
            </div>
          </div>
        </div>
      )}

      {patient.vitalSignsHistory && patient.vitalSignsHistory.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-slate-700 mb-2">Vital Signs History</h4>
          <div className="max-h-40 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="pb-2">Time</th>
                  <th className="pb-2">BP</th>
                  <th className="pb-2">HR</th>
                  <th className="pb-2">Temp</th>
                  <th className="pb-2">RR</th>
                  <th className="pb-2">SpO2</th>
                  <th className="pb-2">By</th>
                </tr>
              </thead>
              <tbody>
                {patient.vitalSignsHistory.slice(-5).reverse().map((v, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2">{formatVitalTime(v.timestamp)}</td>
                    <td>{v.vitals.bloodPressure}</td>
                    <td>{v.vitals.heartRate}</td>
                    <td>{v.vitals.temperature}°F</td>
                    <td>{v.vitals.respiratoryRate}</td>
                    <td>{v.vitals.oxygenSaturation}%</td>
                    <td className="text-slate-500">{v.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {patient.nurseNotes && (
        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
          <h4 className="font-medium text-slate-700 mb-1">Latest Nursing Notes</h4>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{patient.nurseNotes}</p>
        </div>
      )}

      {(isChargeNurse || isStaffNurse) && canVitals && (
        <div className="mt-6 flex gap-2 flex-wrap">
          <button onClick={() => {}} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
            Record Vitals
          </button>
          <button onClick={() => {}} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
            Progress Notes
          </button>
          <button onClick={() => {}} className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm hover:bg-pink-700">
            Log Visitor
          </button>
        </div>
      )}

      {!canVitals && (
        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <p className="text-sm text-slate-500 italic">
            Patient must be in &quot;Active&quot; status to record vitals and notes
          </p>
        </div>
      )}
    </div>
  );
}