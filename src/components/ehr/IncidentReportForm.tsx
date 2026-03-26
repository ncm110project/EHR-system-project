"use client";

import { useState } from "react";
import { useEHR } from "@/lib/ehr-context";
import { useAuth } from "@/lib/auth-context";
import { IncidentReport } from "@/lib/ehr-data";

const incidentTypes = [
  { value: "patient-fall", label: "Patient Fall" },
  { value: "medication-error", label: "Medication Error" },
  { value: "equipment-failure", label: "Equipment Failure" },
  { value: "worker-injury", label: "Worker Injury" },
  { value: "near-miss", label: "Near Miss" },
  { value: "other", label: "Other" },
];

export function IncidentReportForm() {
  const { addIncidentReport } = useEHR();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    incidentDate: new Date().toISOString().split("T")[0],
    incidentTime: new Date().toTimeString().slice(0, 5),
    incidentType: "patient-fall" as IncidentReport["incidentType"],
    incidentLocation: "",
    description: "",
    personsInvolved: "",
    actionsTaken: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newReport: IncidentReport = {
      id: `IR${Date.now()}`,
      reportedBy: user?.name || "Unknown",
      reporterDepartment: user?.department || "dashboard",
      incidentDate: formData.incidentDate,
      incidentTime: formData.incidentTime,
      incidentType: formData.incidentType,
      incidentLocation: formData.incidentLocation,
      description: formData.description,
      personsInvolved: formData.personsInvolved,
      actionsTaken: formData.actionsTaken,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    addIncidentReport(newReport);
    setSubmitted(true);
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
            onClick={() => setSubmitted(false)}
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

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Incident Type *</label>
          <select
            required
            value={formData.incidentType}
            onChange={(e) => setFormData({ ...formData, incidentType: e.target.value as IncidentReport["incidentType"] })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            {incidentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Location of Incident *</label>
          <input
            type="text"
            required
            value={formData.incidentLocation}
            onChange={(e) => setFormData({ ...formData, incidentLocation: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="e.g., Room 203, Emergency Department, Pharmacy"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description of Incident *</label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            rows={4}
            placeholder="Describe what happened in detail..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Persons Involved</label>
          <input
            type="text"
            value={formData.personsInvolved}
            onChange={(e) => setFormData({ ...formData, personsInvolved: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="Names of individuals involved"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Actions Taken</label>
          <textarea
            value={formData.actionsTaken}
            onChange={(e) => setFormData({ ...formData, actionsTaken: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            rows={3}
            placeholder="Immediate actions taken after the incident..."
          />
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