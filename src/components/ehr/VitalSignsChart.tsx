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
  
  const width = 400;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  
  const getX = (i: number) => padding.left + (i / (data.length - 1 || 1)) * chartW;
  const getY = (val: number) => padding.top + ((yMax - val) / range) * chartH;

  const latestValue = values.length > 0 ? values[values.length - 1].y : null;
  const isAbnormal = latestValue !== null && (
    (label === 'Heart Rate' && (latestValue < 60 || latestValue > 100)) ||
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
      
      <div className="relative h-44" onMouseLeave={() => setHoveredPoint(null)}>
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
                fontSize="11" 
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
              <circle cx={p.x} cy={p.y} r="5" fill={color} stroke="white" strokeWidth="1.5" />
            </g>
          ))}
          
          {points.map((p, i) => (
            <text 
              key={`label-${i}`}
              x={p.x} 
              y={height - 5} 
              fontSize="10" 
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

function BloodPressureCard({ data }: { data: VitalSignsEntry[] }) {
  const [hoveredPoint, setHoveredPoint] = useState<{x: number, y: number, sys: number, dia: number, time: string} | null>(null);
  
  const values = data.map((d, i) => ({ 
    x: i, 
    sys: getSystolic(d.vitals.bloodPressure), 
    dia: getDiastolic(d.vitals.bloodPressure),
    entry: d 
  })).filter(d => d.sys > 0 || d.dia > 0);
  
  const allValues = [...values.map(d => d.sys), ...values.map(d => d.dia)].filter(v => v > 0);
  const yMin = 40;
  const yMax = Math.max(...allValues, 160);
  const range = yMax - yMin;
  
  const width = 400;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  
  const getX = (i: number) => padding.left + (i / (data.length - 1 || 1)) * chartW;
  const getY = (val: number) => padding.top + ((yMax - val) / range) * chartH;

  const latestSys = values.length > 0 ? values[values.length - 1].sys : null;
  const latestDia = values.length > 0 ? values[values.length - 1].dia : null;
  const isAbnormalSys = latestSys !== null && (latestSys < 90 || latestSys > 140);
  const isAbnormalDia = latestDia !== null && (latestDia < 60 || latestDia > 90);

  const sysPoints = values.map(d => ({ x: getX(d.x), y: getY(d.sys), val: d.sys, time: formatTime(d.entry.timestamp) }));
  const diaPoints = values.map(d => ({ x: getX(d.x), y: getY(d.dia), val: d.dia, time: formatTime(d.entry.timestamp) }));
  
  const sysLinePath = sysPoints.length > 1 ? sysPoints.map(p => `${Math.round(p.x)},${Math.round(p.y)}`).join(' ') : '';
  const diaLinePath = diaPoints.length > 1 ? diaPoints.map(p => `${Math.round(p.x)},${Math.round(p.y)}`).join(' ') : '';

  const yAxisLabels = [yMax, (yMax + yMin) / 2, yMin];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">💉</span>
          <span className="text-sm font-semibold text-slate-700">Blood Pressure</span>
        </div>
        <span className="text-xs text-slate-400">90-140/60-90 mmHg</span>
      </div>
      
      <div className="relative h-44" onMouseLeave={() => setHoveredPoint(null)}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          <defs>
            <linearGradient id="sysGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="diaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.02" />
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
                fontSize="11" 
                fill="#94A3B8" 
                textAnchor="end"
              >
                {val}
              </text>
            </g>
          ))}
          
          {sysPoints.length > 1 && (
            <polyline fill="none" stroke="#3B82F6" strokeWidth="2" points={sysLinePath} strokeLinecap="round" strokeLinejoin="round" />
          )}
          {diaPoints.length > 1 && (
            <polyline fill="none" stroke="#8B5CF6" strokeWidth="2" points={diaLinePath} strokeLinecap="round" strokeLinejoin="round" />
          )}
          
          {sysPoints.map((p, i) => (
            <g key={`sys-${i}`} className="cursor-pointer" onMouseEnter={() => setHoveredPoint({ x: p.x, y: p.y, sys: p.val, dia: diaPoints[i]?.val || 0, time: p.time })}>
              <circle cx={p.x} cy={p.y} r="5" fill="#3B82F6" stroke="white" strokeWidth="1.5" />
            </g>
          ))}
          {diaPoints.map((p, i) => (
            <g key={`dia-${i}`} className="cursor-pointer" onMouseEnter={() => setHoveredPoint({ x: p.x, y: p.y, sys: sysPoints[i]?.val || 0, dia: p.val, time: p.time })}>
              <circle cx={p.x} cy={p.y} r="5" fill="#8B5CF6" stroke="white" strokeWidth="1.5" />
            </g>
          ))}
          
          {sysPoints.map((p, i) => (
            <text 
              key={`label-${i}`}
              x={p.x} 
              y={height - 5} 
              fontSize="10" 
              fill="#94A3B8" 
              textAnchor="middle"
            >
              {formatTimeShort(sysPoints[i].time)}
            </text>
          ))}
        </svg>
        
        {hoveredPoint && (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded shadow-lg z-10">
            <p className="font-semibold">{hoveredPoint.sys}/{hoveredPoint.dia} mmHg</p>
            <p className="text-slate-300 text-[10px]">{hoveredPoint.time}</p>
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between mt-2 pt-2 border-t border-slate-100">
        <div>
          <p className={`text-xl font-bold ${isAbnormalSys || isAbnormalDia ? 'text-red-600' : ''}`}>
            {latestSys !== null ? `${latestSys}/${latestDia}` : '-'}
          </p>
          <p className="text-xs text-slate-400">mmHg</p>
        </div>
        {values.length > 0 && (
          <p className="text-xs text-slate-400">{formatTime(values[values.length - 1].entry.timestamp)}</p>
        )}
      </div>
      <div className="flex gap-4 mt-2 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500"></span> Systolic</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-violet-500"></span> Diastolic</span>
      </div>
    </div>
  );
}

export function VitalSignsChart({ history }: VitalSignsChartProps) {
  const data = [...history].reverse();
  
  if (data.length < 1) return null;

  return (
    <div className="grid grid-cols-2 gap-4">
      <BloodPressureCard data={data} />
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