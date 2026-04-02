"use client";

import { useState } from "react";
import { useEHR } from "@/lib/ehr-context";
import { useAuth } from "@/lib/auth-context";
import { 
  IncidentReport, 
  IncidentType, 
  IncidentLocation, 
  SeverityLevel, 
  IncidentOutcome,
  StaffRole,
  ContributingFactor,
  ActionTaken,
  Patient
} from "@/lib/ehr-data";

const incidentTypes: { value: IncidentType; label: string }[] = [
  { value: "medication-error", label: "Medication Error" },
  { value: "patient-fall", label: "Patient Fall" },
  { value: "equipment-failure", label: "Equipment Failure" },
  { value: "needle-stick-injury", label: "Needle Stick Injury" },
  { value: "misidentification", label: "Misidentification" },
  { value: "documentation-error", label: "Documentation Error" },
  { value: "delay-in-treatment", label: "Delay in Treatment" },
  { value: "adverse-drug-reaction", label: "Adverse Drug Reaction" },
  { value: "infection-control-issue", label: "Infection Control Issue" },
  { value: "other", label: "Other" },
];

const incidentLocations: { value: IncidentLocation; label: string }[] = [
  { value: "er", label: "Emergency Room (ER)" },
  { value: "opd", label: "Outpatient Department (OPD)" },
  { value: "laboratory", label: "Laboratory" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "ward", label: "Ward / Inpatient Room" },
  { value: "icu", label: "ICU" },
  { value: "operating-room", label: "Operating Room" },
  { value: "waiting-area", label: "Waiting Area" },
  { value: "other", label: "Other" },
];

const severityLevels: { value: SeverityLevel; label: string }[] = [
  { value: "near-miss", label: "Near Miss (no harm)" },
  { value: "mild", label: "Mild (no treatment needed)" },
  { value: "moderate", label: "Moderate (requires intervention)" },
  { value: "severe", label: "Severe (life-threatening)" },
  { value: "sentinel-event", label: "Sentinel Event (death or major harm)" },
];

const outcomes: { value: IncidentOutcome; label: string }[] = [
  { value: "no-harm", label: "No harm" },
  { value: "minor-injury", label: "Minor injury" },
  { value: "temporary-harm", label: "Temporary harm" },
  { value: "permanent-harm", label: "Permanent harm" },
  { value: "death", label: "Death" },
  { value: "unknown", label: "Unknown" },
];

const staffRoles: { value: StaffRole; label: string }[] = [
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "lab-technician", label: "Lab Technician" },
  { value: "registration-clerk", label: "Registration Clerk" },
  { value: "other", label: "Other" },
];

const contributingFactors: { value: ContributingFactor; label: string }[] = [
  { value: "human-error", label: "Human error" },
  { value: "equipment-malfunction", label: "Equipment malfunction" },
  { value: "communication-failure", label: "Communication failure" },
  { value: "high-workload", label: "High workload" },
  { value: "lack-of-training", label: "Lack of training" },
  { value: "system-process-failure", label: "System/process failure" },
  { value: "environmental-factors", label: "Environmental factors" },
  { value: "other", label: "Other" },
];

const actionsTakenList: { value: ActionTaken; label: string }[] = [
  { value: "notified-doctor", label: "Notified doctor" },
  { value: "provided-first-aid", label: "Provided first aid" },
  { value: "stopped-medication", label: "Stopped medication" },
  { value: "replaced-equipment", label: "Replaced equipment" },
  { value: "escalated-to-supervisor", label: "Escalated to supervisor" },
  { value: "no-action-needed", label: "No action needed" },
];

export function IncidentReportForm() {
  const { addIncidentReport, patients } = useEHR();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    incidentDate: new Date().toISOString().split("T")[0],
    incidentTime: new Date().toTimeString().slice(0, 5),
    incidentType: "medication-error" as IncidentType,
    location: "er" as IncidentLocation,
    severity: "near-miss" as SeverityLevel,
    patientId: "" as string,
    patientName: "" as string,
    staffRoles: [] as StaffRole[],
    contributingFactors: [] as ContributingFactor[],
    actionsTaken: [] as ActionTaken[],
    additionalActionsTaken: "",
    outcome: "no-harm" as IncidentOutcome,
    description: "",
  });

  const handleCheckboxChange = <T extends string>(
    field: T[],
    value: string,
    setter: (values: T[]) => void
  ) => {
    const newValues = field.includes(value as T)
      ? field.filter((v) => v !== value)
      : [...field, value as T];
    setter(newValues);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedPatient = patients.find(p => p.id === formData.patientId);
    
    const newReport: IncidentReport = {
      id: `IR${Date.now()}`,
      reportedBy: user?.name || "Unknown",
      reporterDepartment: user?.department || "dashboard",
      incidentDate: formData.incidentDate,
      incidentTime: formData.incidentTime,
      incidentType: formData.incidentType,
      location: formData.location,
      severity: formData.severity,
      patientId: formData.patientId || undefined,
      patientName: selectedPatient?.name || undefined,
      staffRoles: formData.staffRoles,
      contributingFactors: formData.contributingFactors,
      actionsTaken: formData.actionsTaken,
      additionalActionsTaken: formData.additionalActionsTaken || undefined,
      outcome: formData.outcome,
      description: formData.description,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    addIncidentReport(newReport);
    setSubmitted(true);
  };

  const resetForm = () => {
    setFormData({
      incidentDate: new Date().toISOString().split("T")[0],
      incidentTime: new Date().toTimeString().slice(0, 5),
      incidentType: "medication-error",
      location: "er",
      severity: "near-miss",
      patientId: "",
      patientName: "",
      staffRoles: [],
      contributingFactors: [],
      actionsTaken: [],
      additionalActionsTaken: "",
      outcome: "no-harm",
      description: "",
    });
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">Incident Report Submitted</h3>
          <p className="text-green-700 mb-4">
            Your report has been sent to Nursing Administration for review.
          </p>
          <button
            onClick={resetForm}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Submit Another Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6 text-slate-800">Incident Report Form</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Incident Type */}
        <div className="bg-slate-50 p-4 rounded-lg">
          <h3 className="font-medium text-slate-800 mb-4">1. Incident Type</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Incident Type *</label>
            <select
              required
              value={formData.incidentType}
              onChange={(e) => setFormData({ ...formData, incidentType: e.target.value as IncidentType })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {incidentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 2: Location */}
        <div className="bg-slate-50 p-4 rounded-lg">
          <h3 className="font-medium text-slate-800 mb-4">2. Location</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location of Incident *</label>
            <select
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value as IncidentLocation })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {incidentLocations.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 3: Severity Level */}
        <div className="bg-slate-50 p-4 rounded-lg">
          <h3 className="font-medium text-slate-800 mb-4">3. Severity Level</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Severity Level *</label>
            <select
              required
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value as SeverityLevel })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {severityLevels.map((sev) => (
                <option key={sev.value} value={sev.value}>
                  {sev.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 4: Date and Time */}
        <div className="bg-slate-50 p-4 rounded-lg">
          <h3 className="font-medium text-slate-800 mb-4">4. Date and Time</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date of Incident *</label>
              <input
                type="date"
                required
                value={formData.incidentDate}
                onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Time of Incident *</label>
              <input
                type="time"
                required
                value={formData.incidentTime}
                onChange={(e) => setFormData({ ...formData, incidentTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Patient Involved */}
        <div className="bg-slate-50 p-4 rounded-lg">
          <h3 className="font-medium text-slate-800 mb-4">5. Patient Involved (Optional)</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Patient</label>
            <select
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value, patientName: "" })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">No patient involved</option>
              {patients.filter(p => p.department === 'opd' || p.department === 'er').map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} ({patient.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 6: Staff Involved */}
        <div className="bg-slate-50 p-4 rounded-lg">
          <h3 className="font-medium text-slate-800 mb-4">6. Staff Involved</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {staffRoles.map((role) => (
              <label key={role.value} className="flex items-center gap-2 p-2 border border-slate-200 rounded hover:bg-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.staffRoles.includes(role.value)}
                  onChange={() => handleCheckboxChange(formData.staffRoles, role.value, (v) => setFormData({ ...formData, staffRoles: v }))}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <span className="text-sm">{role.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Section 7: Contributing Factors */}
        <div className="bg-slate-50 p-4 rounded-lg">
          <h3 className="font-medium text-slate-800 mb-4">7. Contributing Factors</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {contributingFactors.map((factor) => (
              <label key={factor.value} className="flex items-center gap-2 p-2 border border-slate-200 rounded hover:bg-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.contributingFactors.includes(factor.value)}
                  onChange={() => handleCheckboxChange(formData.contributingFactors, factor.value, (v) => setFormData({ ...formData, contributingFactors: v }))}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <span className="text-sm">{factor.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Section 8: Immediate Actions Taken */}
        <div className="bg-slate-50 p-4 rounded-lg">
          <h3 className="font-medium text-slate-800 mb-4">8. Immediate Actions Taken</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {actionsTakenList.map((action) => (
              <label key={action.value} className="flex items-center gap-2 p-2 border border-slate-200 rounded hover:bg-slate-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.actionsTaken.includes(action.value)}
                  onChange={() => handleCheckboxChange(formData.actionsTaken, action.value, (v) => setFormData({ ...formData, actionsTaken: v }))}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <span className="text-sm">{action.label}</span>
              </label>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Additional Notes (Optional)</label>
            <textarea
              value={formData.additionalActionsTaken}
              onChange={(e) => setFormData({ ...formData, additionalActionsTaken: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              rows={2}
              placeholder="Any additional actions taken..."
            />
          </div>
        </div>

        {/* Section 9: Outcome */}
        <div className="bg-slate-50 p-4 rounded-lg">
          <h3 className="font-medium text-slate-800 mb-4">9. Outcome</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Patient Outcome *</label>
            <select
              required
              value={formData.outcome}
              onChange={(e) => setFormData({ ...formData, outcome: e.target.value as IncidentOutcome })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {outcomes.map((outcome) => (
                <option key={outcome.value} value={outcome.value}>
                  {outcome.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 10: Description */}
        <div className="bg-slate-50 p-4 rounded-lg">
          <h3 className="font-medium text-slate-800 mb-4">10. Description of Incident</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Brief Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              rows={3}
              maxLength={500}
              placeholder="Briefly describe what happened (max 500 characters)..."
            />
            <p className="text-xs text-slate-500 mt-1">{formData.description.length}/500 characters</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="px-6 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 focus:ring-4 focus:ring-teal-200"
          >
            Submit Report
          </button>
        </div>
      </form>
    </div>
  );
}