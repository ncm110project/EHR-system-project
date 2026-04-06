"use client";

import { VitalSignsEntry } from "@/lib/ehr-data";

interface VitalSignsChartProps {
  history: VitalSignsEntry[];
}

const getSystolic = (bp: string | undefined): number => {
  if (!bp) return 0;
  const parts = bp.split('/');
  return parseInt(parts[0]) || 0;
};

const getDiastolic = (bp: string | undefined): number => {
  if (!bp) return 0;
  const parts = bp.split('/');
  return parseInt(parts[1]) || 0;
};

function MiniChart({ data, label, color, maxVal, unit, getValue }: {
  data: VitalSignsEntry[];
  label: string;
  color: string;
  maxVal: number;
  unit: string;
  getValue: (v: VitalSignsEntry) => number;
}) {
  const values = data.map((d, i) => ({ x: i, y: getValue(d) })).filter(d => d.y > 0);
  const max = Math.max(...values.map(d => d.y), maxVal * 0.8);
  
  const getY = (val: number) => 50 - (val / (max * 1.2)) * 45;
  
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-slate-600 mb-1 text-center">{label}</p>
      <div className="h-14 bg-slate-50 rounded relative">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <line x1="5" y1="5" x2="5" y2="45" stroke="#E2E8F0" strokeWidth="0.5" />
          <line x1="5" y1="45" x2="95" y2="45" stroke="#E2E8F0" strokeWidth="0.5" />
          {values.length > 1 && (
            <polyline
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              points={values.map(d => `${5 + (d.x / (data.length - 1 || 1)) * 90},${getY(d.y)}`).join(' ')}
            />
          )}
          {values.map((d, i) => (
            <circle key={i} cx={5 + (d.x / (data.length - 1 || 1)) * 90} cy={getY(d.y)} r="2" fill={color} />
          ))}
        </svg>
      </div>
      <p className="text-xs text-slate-500 text-center mt-1">
        {values.length > 0 ? `${values[values.length - 1].y}${unit}` : '-'}
      </p>
    </div>
  );
}

export function VitalSignsChart({ history }: VitalSignsChartProps) {
  const data = [...history].reverse();
  
  if (data.length < 1) return null;

  const bpValues = data.map(d => getSystolic(d.vitals.bloodPressure)).filter(v => v > 0);
  const maxBP = Math.max(...bpValues, 120);

  return (
    <div className="grid grid-cols-5 gap-2">
      <MiniChart 
        data={data} 
        label="Blood Pressure" 
        color="#8B5CF6" 
        maxVal={maxBP} 
        unit=" mmHg"
        getValue={(d) => getSystolic(d.vitals.bloodPressure)}
      />
      <MiniChart 
        data={data} 
        label="Diastolic" 
        color="#A78BFA" 
        maxVal={90} 
        unit=" mmHg"
        getValue={(d) => getDiastolic(d.vitals.bloodPressure)}
      />
      <MiniChart 
        data={data} 
        label="Pulse Rate" 
        color="#EF4444" 
        maxVal={100} 
        unit=" bpm"
        getValue={(d) => d.vitals.heartRate || 0}
      />
      <MiniChart 
        data={data} 
        label="Temperature" 
        color="#F59E0B" 
        maxVal={38} 
        unit=" °C"
        getValue={(d) => d.vitals.temperature || 0}
      />
      <MiniChart 
        data={data} 
        label="O2 Saturation" 
        color="#3B82F6" 
        maxVal={100} 
        unit="%"
        getValue={(d) => d.vitals.oxygenSaturation || 0}
      />
      <MiniChart 
        data={data} 
        label="Respiration" 
        color="#10B981" 
        maxVal={20} 
        unit="/min"
        getValue={(d) => d.vitals.respiratoryRate || 0}
      />
    </div>
  );
}