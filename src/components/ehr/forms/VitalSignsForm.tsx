"use client";

import { useState } from "react";

export type VitalSignsData = {
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSaturation: number;
};

const defaultVitals: VitalSignsData = {
  bloodPressure: "",
  heartRate: 0,
  temperature: 0,
  respiratoryRate: 0,
  oxygenSaturation: 0,
};

interface VitalSignsFormProps {
  initialValues?: Partial<VitalSignsData>;
  onSave: (vitals: VitalSignsData) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

export function VitalSignsForm({ initialValues, onSave, onCancel, readOnly }: VitalSignsFormProps) {
  const [vitals, setVitals] = useState<VitalSignsData>({ ...defaultVitals, ...initialValues });

  const handleChange = (key: keyof VitalSignsData, value: string | number) => {
    setVitals(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (vitals.bloodPressure && vitals.heartRate > 0) {
      onSave(vitals);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent";

  if (readOnly) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-slate-500">BP</p>
          <p className="font-medium text-sm">{vitals.bloodPressure || "-"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">HR</p>
          <p className="font-medium text-sm">{vitals.heartRate || "-"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Temp (°C)</p>
          <p className="font-medium text-sm">{vitals.temperature || "-"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">RR</p>
          <p className="font-medium text-sm">{vitals.respiratoryRate || "-"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">SpO₂</p>
          <p className="font-medium text-sm">{vitals.oxygenSaturation || "-"}%</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-slate-500">Blood Pressure</label>
          <input
            type="text"
            placeholder="120/80"
            value={vitals.bloodPressure}
            onChange={(e) => handleChange("bloodPressure", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">Heart Rate</label>
          <input
            type="number"
            placeholder="72"
            value={vitals.heartRate || ""}
            onChange={(e) => handleChange("heartRate", parseInt(e.target.value) || 0)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">Temperature (°C)</label>
          <input
            type="number"
            step="0.1"
            placeholder="36.5"
            value={vitals.temperature || ""}
            onChange={(e) => handleChange("temperature", parseFloat(e.target.value) || 0)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">Respiratory Rate</label>
          <input
            type="number"
            placeholder="16"
            value={vitals.respiratoryRate || ""}
            onChange={(e) => handleChange("respiratoryRate", parseInt(e.target.value) || 0)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">Oxygen Saturation (%)</label>
          <input
            type="number"
            placeholder="98"
            value={vitals.oxygenSaturation || ""}
            onChange={(e) => handleChange("oxygenSaturation", parseInt(e.target.value) || 0)}
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSubmit} className="btn btn-primary btn-sm">
          Save Vitals
        </button>
        {onCancel && (
          <button onClick={onCancel} className="btn btn-ghost btn-sm">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}