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

function VitalCard({ 
  data, 
  label, 
  color, 
  bgColor,
  icon,
  unit, 
  getValue,
  normalRange 
}: {
  data: VitalSignsEntry[];
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  unit: string;
  getValue: (v: VitalSignsEntry) => number;
  normalRange: string;
}) {
  const [hoveredPoint, setHoveredPoint] = useState<{x: number, y: number, val: number, time: string} | null>(null);
  
  const values = data.map((d, i) => ({ x: i, y: getValue(d), entry: d })).filter(d => d.y > 0);
  const max = Math.max(...values.map(d => d.y), getValue(data[data.length - 1] as VitalSignsEntry) * 1.2 || 100);
  const min = Math.min(...values.map(d => d.y), 0);
  const range = max - min || 1;
  
  const width = 180;
  const height = 60;
  const padding = 10;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  
  const getX = (i: number) => padding + (i / (data.length - 1 || 1)) * chartW;
  const getY = (val: number) => height - padding - ((val - min) / range) * chartH;

  const latestValue = values.length > 0 ? values[values.length - 1].y : null;
  const isAbnormal = latestValue !== null && (
    (label === 'Heart Rate' && (latestValue < 60 || latestValue > 100)) ||
    (label === 'Systolic BP' && (latestValue < 90 || latestValue > 140)) ||
    (label === 'Temperature' && (latestValue < 36.1 || latestValue > 37.2)) ||
    (label === 'SpO2' && latestValue < 95) ||
    (label === 'Respiratory Rate' && (latestValue < 12 || latestValue > 20))
  );

  const points = values.map(d => ({ x: getX(d.x), y: getY(d.y), val: d.y, time: formatTime(d.entry.timestamp) }));
  const linePath = points.length > 1 ? points.map(p => `${p.x},${p.y}`).join(' ') : '';
  const areaPath = points.length > 1 
    ? `${padding},${height - padding} ${linePath} ${width - padding},${height - padding}`
    : '';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{icon}</span>
          <span className="text-xs font-medium text-slate-600">{label}</span>
        </div>
        <span className="text-xs text-slate-400">{normalRange}</span>
      </div>
      
      <div className="relative h-16" onMouseLeave={() => setHoveredPoint(null)}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          <defs>
            <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          <line x1={padding} y1={getY(max * 0.8)} x2={width - padding} y2={getY(max * 0.8)} stroke="#E2E8F0" strokeWidth="0.5" strokeDasharray="2,2" />
          <line x1={padding} y1={getY(max * 0.5)} x2={width - padding} y2={getY(max * 0.5)} stroke="#E2E8F0" strokeWidth="0.5" strokeDasharray="2,2" />
          
          {points.length > 1 && (
            <>
              <polygon points={areaPath} fill={`url(#gradient-${label})`} />
              <polyline fill="none" stroke={color} strokeWidth="2" points={linePath} />
            </>
          )}
          
          {points.map((p, i) => (
            <g key={i} className="cursor-pointer" onMouseEnter={() => setHoveredPoint(p)}>
              <circle cx={p.x} cy={p.y} r="3" fill={color} stroke="white" strokeWidth="1" />
            </g>
          ))}
        </svg>
        
        {hoveredPoint && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg z-10">
            <p className="font-semibold">{hoveredPoint.val}{unit}</p>
            <p className="text-slate-300 text-[10px]">{hoveredPoint.time}</p>
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between mt-1">
        <div>
          <p className={`text-lg font-bold ${isAbnormal ? 'text-red-600' : color}`}>
            {latestValue !== null ? `${latestValue}` : '-'}
          </p>
          <p className="text-[10px] text-slate-400">{unit}</p>
        </div>
        {values.length > 0 && (
          <p className="text-[10px] text-slate-400">{formatTime(values[values.length - 1].entry.timestamp)}</p>
        )}
      </div>
    </div>
  );
}

export function VitalSignsChart({ history }: VitalSignsChartProps) {
  const data = [...history].reverse();
  
  if (data.length < 1) return null;

  return (
    <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
      <VitalCard 
        data={data} 
        label="Heart Rate" 
        color="#EF4444" 
        bgColor="bg-red-50"
        icon="❤️"
        unit=" bpm"
        normalRange="60-100"
        getValue={(d) => d.vitals.heartRate || 0}
      />
      <VitalCard 
        data={data} 
        label="Systolic BP" 
        color="#3B82F6" 
        bgColor="bg-blue-50"
        icon="💉"
        unit=" mmHg"
        normalRange="90-140"
        getValue={(d) => getSystolic(d.vitals.bloodPressure)}
      />
      <VitalCard 
        data={data} 
        label="Diastolic BP" 
        color="#6366F1" 
        bgColor="bg-indigo-50"
        icon="💉"
        unit=" mmHg"
        normalRange="60-90"
        getValue={(d) => getDiastolic(d.vitals.bloodPressure)}
      />
      <VitalCard 
        data={data} 
        label="Temperature" 
        color="#F59E0B" 
        bgColor="bg-amber-50"
        icon="🌡️"
        unit=" °C"
        normalRange="36.1-37.2"
        getValue={(d) => d.vitals.temperature || 0}
      />
      <VitalCard 
        data={data} 
        label="SpO2" 
        color="#10B981" 
        bgColor="bg-emerald-50"
        icon="💧"
        unit=" %"
        normalRange="95-100"
        getValue={(d) => d.vitals.oxygenSaturation || 0}
      />
      <VitalCard 
        data={data} 
        label="Respiratory Rate" 
        color="#8B5CF6" 
        bgColor="bg-violet-50"
        icon="🫁"
        unit=" /min"
        normalRange="12-20"
        getValue={(d) => d.vitals.respiratoryRate || 0}
      />
    </div>
  );
}