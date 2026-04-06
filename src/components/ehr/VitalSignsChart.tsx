"use client";

import { useState } from "react";
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

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const formatTimeShort = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

function VitalCard({ 
  data, 
  label, 
  color,
  icon,
  unit, 
  getValue,
  normalRange,
  yMin,
  yMax
}: {
  data: VitalSignsEntry[];
  label: string;
  color: string;
  icon: string;
  unit: string;
  getValue: (v: VitalSignsEntry) => number;
  normalRange: string;
  yMin: number;
  yMax: number;
}) {
  const [hoveredPoint, setHoveredPoint] = useState<{x: number, y: number, val: number, time: string} | null>(null);
  
  const values = data.map((d, i) => ({ x: i, y: getValue(d), entry: d })).filter(d => d.y > 0);
  const range = yMax - yMin;
  
  const width = 240;
  const height = 140;
  const padding = { top: 15, right: 15, bottom: 35, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  
  const getX = (i: number) => padding.left + (i / (data.length - 1 || 1)) * chartW;
  const getY = (val: number) => padding.top + ((yMax - val) / range) * chartH;

  const latestValue = values.length > 0 ? values[values.length - 1].y : null;
  const isAbnormal = latestValue !== null && (
    (label === 'Heart Rate' && (latestValue < 60 || latestValue > 100)) ||
    (label === 'Systolic BP' && (latestValue < 90 || latestValue > 140)) ||
    (label === 'Diastolic BP' && (latestValue < 60 || latestValue > 90)) ||
    (label === 'Temperature' && (latestValue < 36.1 || latestValue > 37.2)) ||
    (label === 'SpO2' && latestValue < 95) ||
    (label === 'Respiratory Rate' && (latestValue < 12 || latestValue > 20))
  );

  const points = values.map(d => ({ x: getX(d.x), y: getY(d.y), val: d.y, time: formatTime(d.entry.timestamp) }));
  const linePath = points.length > 1 ? points.map(p => `${Math.round(p.x)},${Math.round(p.y)}`).join(' ') : '';
  const areaPath = points.length > 1 
    ? `${padding.left},${height - padding.bottom} ${linePath} ${width - padding.right},${height - padding.bottom}`
    : '';

  const yAxisLabels = [yMax, (yMax + yMin) / 2, yMin];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-semibold text-slate-700">{label}</span>
        </div>
        <span className="text-xs text-slate-400">{normalRange}</span>
      </div>
      
      <div className="relative h-32" onMouseLeave={() => setHoveredPoint(null)}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          <defs>
            <linearGradient id={`gradient-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          
          {yAxisLabels.map((val, i) => (
            <g key={i}>
              <line 
                x1={padding.left} 
                y1={getY(val)} 
                x2={width - padding.right} 
                y2={getY(val)} 
                stroke="#E2E8F0" 
                strokeWidth="0.5" 
                strokeDasharray="3,3" 
              />
              <text 
                x={padding.left - 5} 
                y={getY(val) + 4} 
                fontSize="9" 
                fill="#94A3B8" 
                textAnchor="end"
              >
                {val}
              </text>
            </g>
          ))}
          
          {points.length > 1 && (
            <>
              <polygon points={areaPath} fill={`url(#gradient-${label.replace(/\s/g, '')})`} />
              <polyline fill="none" stroke={color} strokeWidth="2" points={linePath} strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}
          
          {points.map((p, i) => (
            <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredPoint(p)}>
              <circle cx={p.x} cy={p.y} r="4" fill={color} stroke="white" strokeWidth="1.5" />
            </g>
          ))}
          
          {points.map((p, i) => (
            <text 
              key={`label-${i}`}
              x={p.x} 
              y={height - 5} 
              fontSize="8" 
              fill="#94A3B8" 
              textAnchor="middle"
            >
              {formatTimeShort(points[i].time)}
            </text>
          ))}
        </svg>
        
        {hoveredPoint && (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded shadow-lg z-10">
            <p className="font-semibold">{hoveredPoint.val}{unit}</p>
            <p className="text-slate-300 text-[10px]">{hoveredPoint.time}</p>
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between mt-2 pt-2 border-t border-slate-100">
        <div>
          <p className={`text-xl font-bold ${isAbnormal ? 'text-red-600' : ''}`} style={{ color: isAbnormal ? undefined : color }}>
            {latestValue !== null ? `${latestValue}` : '-'}
          </p>
          <p className="text-xs text-slate-400">{unit}</p>
        </div>
        {values.length > 0 && (
          <p className="text-xs text-slate-400">{formatTime(values[values.length - 1].entry.timestamp)}</p>
        )}
      </div>
    </div>
  );
}

export function VitalSignsChart({ history }: VitalSignsChartProps) {
  const data = [...history].reverse();
  
  if (data.length < 1) return null;

  const bpSystolic = data.map(d => getSystolic(d.vitals.bloodPressure)).filter(v => v > 0);
  const bpDiastolic = data.map(d => getDiastolic(d.vitals.bloodPressure)).filter(v => v > 0);
  const maxSys = Math.max(...bpSystolic, 140);
  const maxDia = Math.max(...bpDiastolic, 90);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      <VitalCard 
        data={data} 
        label="Heart Rate" 
        color="#EF4444" 
        icon="❤️"
        unit=" bpm"
        normalRange="60-100"
        getValue={(d) => d.vitals.heartRate || 0}
        yMin={40}
        yMax={140}
      />
      <VitalCard 
        data={data} 
        label="Systolic BP" 
        color="#3B82F6" 
        icon="💉"
        unit=" mmHg"
        normalRange="90-140"
        getValue={(d) => getSystolic(d.vitals.bloodPressure)}
        yMin={60}
        yMax={maxSys + 20}
      />
      <VitalCard 
        data={data} 
        label="Diastolic BP" 
        color="#6366F1" 
        icon="💉"
        unit=" mmHg"
        normalRange="60-90"
        getValue={(d) => getDiastolic(d.vitals.bloodPressure)}
        yMin={40}
        yMax={maxDia + 10}
      />
      <VitalCard 
        data={data} 
        label="Temperature" 
        color="#F59E0B" 
        icon="🌡️"
        unit=" °C"
        normalRange="36.1-37.2"
        getValue={(d) => d.vitals.temperature || 0}
        yMin={35}
        yMax={40}
      />
      <VitalCard 
        data={data} 
        label="SpO2" 
        color="#10B981" 
        icon="💧"
        unit=" %"
        normalRange="95-100"
        getValue={(d) => d.vitals.oxygenSaturation || 0}
        yMin={90}
        yMax={100}
      />
      <VitalCard 
        data={data} 
        label="Respiratory Rate" 
        color="#8B5CF6" 
        icon="🫁"
        unit=" /min"
        normalRange="12-20"
        getValue={(d) => d.vitals.respiratoryRate || 0}
        yMin={8}
        yMax={28}
      />
    </div>
  );
}