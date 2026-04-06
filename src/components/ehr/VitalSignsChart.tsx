"use client";

import { VitalSignsEntry } from "@/lib/ehr-data";

interface VitalSignsChartProps {
  history: VitalSignsEntry[];
}

export function VitalSignsChart({ history }: VitalSignsChartProps) {
  const data = [...history].reverse();
  
  if (data.length < 2) return null;

  const getHRData = () => data.map((d, i) => ({ x: i, y: d.vitals.heartRate || 0 })).filter(d => d.y > 0);
  const getTempData = () => data.map((d, i) => ({ x: i, y: d.vitals.temperature || 0 })).filter(d => d.y > 0);
  const getSpO2Data = () => data.map((d, i) => ({ x: i, y: d.vitals.oxygenSaturation || 0 })).filter(d => d.y > 0);

  const maxHR = Math.max(...getHRData().map(d => d.y), 100);
  const maxTemp = Math.max(...getTempData().map(d => d.y), 38);
  const maxSpO2 = Math.max(...getSpO2Data().map(d => d.y), 100);

  const getY = (val: number, max: number, height: number) => height - (val / max) * height;

  const formatLabel = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const labels = data.map(d => formatLabel(d.timestamp));

  return (
    <div className="w-full">
      <svg viewBox="0 0 400 140" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="spo2Gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line x1="30" y1="10" x2="30" y2="110" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="30" y1="110" x2="380" y2="110" stroke="#E2E8F0" strokeWidth="1" />

        {labels.map((label, i) => {
          const x = 30 + (i / (data.length - 1)) * 350;
          return (
            <g key={i}>
              <line x1={x} y1="110" x2={x} y2="115" stroke="#E2E8F0" strokeWidth="1" />
              <text x={x} y="128" fontSize="8" fill="#64748B" textAnchor="middle">{label}</text>
            </g>
          );
        })}

        {getHRData().length > 1 && (
          <g>
            <polyline
              fill="none"
              stroke="#EF4444"
              strokeWidth="2"
              points={getHRData().map(d => `${30 + (d.x / (data.length - 1)) * 350},${getY(d.y, maxHR * 1.2, 100)}`).join(' ')}
            />
            {getHRData().map((d, i) => (
              <circle key={i} cx={30 + (d.x / (data.length - 1)) * 350} cy={getY(d.y, maxHR * 1.2, 100)} r="3" fill="#EF4444" />
            ))}
          </g>
        )}

        {getTempData().length > 1 && (
          <g>
            <polyline
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2"
              points={getTempData().map(d => `${30 + (d.x / (data.length - 1)) * 350},${getY(d.y, maxTemp * 1.1, 100)}`).join(' ')}
            />
            {getTempData().map((d, i) => (
              <circle key={i} cx={30 + (d.x / (data.length - 1)) * 350} cy={getY(d.y, maxTemp * 1.1, 100)} r="3" fill="#F59E0B" />
            ))}
          </g>
        )}

        {getSpO2Data().length > 1 && (
          <g>
            <polyline
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              points={getSpO2Data().map(d => `${30 + (d.x / (data.length - 1)) * 350},${getY(d.y, 105, 100)}`).join(' ')}
            />
            {getSpO2Data().map((d, i) => (
              <circle key={i} cx={30 + (d.x / (data.length - 1)) * 350} cy={getY(d.y, 105, 100)} r="3" fill="#3B82F6" />
            ))}
          </g>
        )}

        <text x="5" y="20" fontSize="8" fill="#EF4444">HR</text>
        <text x="5" y="60" fontSize="8" fill="#F59E0B">Temp</text>
        <text x="5" y="100" fontSize="8" fill="#3B82F6">SpO2</text>
      </svg>
      <div className="flex gap-4 mt-2 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500"></span> Heart Rate (bpm)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500"></span> Temperature (°C)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500"></span> SpO2 (%)</span>
      </div>
    </div>
  );
}