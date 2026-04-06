"use client";

import { useState } from "react";
import { VitalSignsEntry } from "@/lib/ehr-data";

interface VitalSignsChartProps {
  history: VitalSignsEntry[];
}

type ChartView = 'cardio' | 'respiratory';

export function VitalSignsChart({ history }: VitalSignsChartProps) {
  const [view, setView] = useState<ChartView>('cardio');
  const data = [...history].reverse();
  
  if (data.length < 2) return null;

  const getSystolic = (bp: string | undefined): number => {
    if (!bp) return 0;
    const parts = bp.split('/');
    return parseInt(parts[0]) || 0;
  };

  const getHRData = () => data.map((d, i) => ({ x: i, y: d.vitals.heartRate || 0 })).filter(d => d.y > 0);
  const getBPData = () => data.map((d, i) => ({ x: i, y: getSystolic(d.vitals.bloodPressure) })).filter(d => d.y > 0);
  const getTempData = () => data.map((d, i) => ({ x: i, y: d.vitals.temperature || 0 })).filter(d => d.y > 0);
  const getRRData = () => data.map((d, i) => ({ x: i, y: d.vitals.respiratoryRate || 0 })).filter(d => d.y > 0);
  const getSpO2Data = () => data.map((d, i) => ({ x: i, y: d.vitals.oxygenSaturation || 0 })).filter(d => d.y > 0);

  const maxHR = Math.max(...getHRData().map(d => d.y), 100);
  const maxBP = Math.max(...getBPData().map(d => d.y), 120);
  const maxTemp = Math.max(...getTempData().map(d => d.y), 38);
  const maxRR = Math.max(...getRRData().map(d => d.y), 20);
  const maxSpO2 = Math.max(...getSpO2Data().map(d => d.y), 100);

  const getY = (val: number, max: number, height: number) => height - (val / max) * height;

  const formatLabel = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const labels = data.map(d => formatLabel(d.timestamp));

  const renderCardioChart = () => (
    <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <line x1="40" y1="10" x2="40" y2="90" stroke="#E2E8F0" strokeWidth="1" />
      <line x1="40" y1="90" x2="380" y2="90" stroke="#E2E8F0" strokeWidth="1" />

      {labels.map((label, i) => {
        const x = 40 + (i / (data.length - 1)) * 340;
        return (
          <g key={i}>
            <line x1={x} y1="90" x2={x} y2="95" stroke="#E2E8F0" strokeWidth="1" />
            <text x={x} y="106" fontSize="7" fill="#64748B" textAnchor="middle">{label}</text>
          </g>
        );
      })}

      {getHRData().length > 1 && (
        <g>
          <polyline
            fill="none"
            stroke="#EF4444"
            strokeWidth="2"
            points={getHRData().map(d => `${40 + (d.x / (data.length - 1)) * 340},${getY(d.y, maxHR * 1.2, 80)}`).join(' ')}
          />
          {getHRData().map((d, i) => (
            <circle key={i} cx={40 + (d.x / (data.length - 1)) * 340} cy={getY(d.y, maxHR * 1.2, 80)} r="2.5" fill="#EF4444" />
          ))}
        </g>
      )}

      {getBPData().length > 1 && (
        <g>
          <polyline
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="2"
            points={getBPData().map(d => `${40 + (d.x / (data.length - 1)) * 340},${getY(d.y, maxBP * 1.2, 80)}`).join(' ')}
          />
          {getBPData().map((d, i) => (
            <circle key={i} cx={40 + (d.x / (data.length - 1)) * 340} cy={getY(d.y, maxBP * 1.2, 80)} r="2.5" fill="#8B5CF6" />
          ))}
        </g>
      )}

      <text x="5" y="25" fontSize="7" fill="#EF4444">HR</text>
      <text x="5" y="65" fontSize="7" fill="#8B5CF6">BP(sys)</text>
    </svg>
  );

  const renderRespiratoryChart = () => (
    <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <line x1="40" y1="10" x2="40" y2="90" stroke="#E2E8F0" strokeWidth="1" />
      <line x1="40" y1="90" x2="380" y2="90" stroke="#E2E8F0" strokeWidth="1" />

      {labels.map((label, i) => {
        const x = 40 + (i / (data.length - 1)) * 340;
        return (
          <g key={i}>
            <line x1={x} y1="90" x2={x} y2="95" stroke="#E2E8F0" strokeWidth="1" />
            <text x={x} y="106" fontSize="7" fill="#64748B" textAnchor="middle">{label}</text>
          </g>
        );
      })}

      {getTempData().length > 1 && (
        <g>
          <polyline
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2"
            points={getTempData().map(d => `${40 + (d.x / (data.length - 1)) * 340},${getY(d.y, maxTemp * 1.1, 80)}`).join(' ')}
          />
          {getTempData().map((d, i) => (
            <circle key={i} cx={40 + (d.x / (data.length - 1)) * 340} cy={getY(d.y, maxTemp * 1.1, 80)} r="2.5" fill="#F59E0B" />
          ))}
        </g>
      )}

      {getRRData().length > 1 && (
        <g>
          <polyline
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
            points={getRRData().map(d => `${40 + (d.x / (data.length - 1)) * 340},${getY(d.y, maxRR * 1.3, 80)}`).join(' ')}
          />
          {getRRData().map((d, i) => (
            <circle key={i} cx={40 + (d.x / (data.length - 1)) * 340} cy={getY(d.y, maxRR * 1.3, 80)} r="2.5" fill="#10B981" />
          ))}
        </g>
      )}

      {getSpO2Data().length > 1 && (
        <g>
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            points={getSpO2Data().map(d => `${40 + (d.x / (data.length - 1)) * 340},${getY(d.y, 105, 80)}`).join(' ')}
          />
          {getSpO2Data().map((d, i) => (
            <circle key={i} cx={40 + (d.x / (data.length - 1)) * 340} cy={getY(d.y, 105, 80)} r="2.5" fill="#3B82F6" />
          ))}
        </g>
      )}

      <text x="5" y="25" fontSize="7" fill="#F59E0B">Temp</text>
      <text x="5" y="50" fontSize="7" fill="#10B981">RR</text>
      <text x="5" y="75" fontSize="7" fill="#3B82F6">SpO2</text>
    </svg>
  );

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setView('cardio')}
          className={`px-2 py-1 text-xs rounded ${view === 'cardio' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Cardio (HR, BP)
        </button>
        <button
          onClick={() => setView('respiratory')}
          className={`px-2 py-1 text-xs rounded ${view === 'respiratory' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Respiratory (Temp, RR, SpO2)
        </button>
      </div>
      
      {view === 'cardio' ? renderCardioChart() : renderRespiratoryChart()}

      <div className="flex gap-3 mt-1 text-xs flex-wrap">
        {view === 'cardio' ? (
          <>
            <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-red-500"></span> Heart Rate (bpm)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-violet-500"></span> Blood Pressure Systolic (mmHg)</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-amber-500"></span> Temperature (°C)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-emerald-500"></span> Respiratory Rate (/min)</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-blue-500"></span> SpO2 (%)</span>
          </>
        )}
      </div>
    </div>
  );
}