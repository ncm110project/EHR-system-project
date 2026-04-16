"use client";

import { useMemo } from 'react';

interface VitalEntry {
  timestamp: string;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
}

interface VitalSignsChartProps {
  vitals: VitalEntry[];
  showBP?: boolean;
  showHR?: boolean;
  showTemp?: boolean;
  showRR?: boolean;
  showSpO2?: boolean;
}

function parseBP(bp: string): { systolic: number; diastolic: number } | null {
  if (!bp) return null;
  const parts = bp.split('/');
  if (parts.length !== 2) return null;
  const systolic = parseInt(parts[0]);
  const diastolic = parseInt(parts[1]);
  if (isNaN(systolic) || isNaN(diastolic)) return null;
  return { systolic, diastolic };
}

function normalizeTime(timestamp: string, index: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function VitalSignsChart({ 
  vitals, 
  showBP = true, 
  showHR = true,
  showTemp = true,
  showRR = false,
  showSpO2 = false
}: VitalSignsChartProps) {
  const chartData = useMemo(() => {
    if (!vitals || vitals.length === 0) return null;
    
    return vitals.map((v, i) => ({
      time: normalizeTime(v.timestamp, i),
      bp: parseBP(v.bloodPressure || ''),
      hr: v.heartRate,
      temp: v.temperature,
      rr: v.respiratoryRate,
      spo2: v.oxygenSaturation,
    }));
  }, [vitals]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <svg className="w-12 h-12 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p>No vital signs recorded yet</p>
      </div>
    );
  }

  // Find ranges for scaling
  const hrValues = chartData.filter(d => d.hr).map(d => d.hr!);
  const tempValues = chartData.filter(d => d.temp).map(d => d.temp!);
  
  const hrMin = Math.min(...hrValues, 50);
  const hrMax = Math.max(...hrValues, 120);
  const tempMin = Math.min(...tempValues, 35);
  const tempMax = Math.max(...tempValues, 40);

  const scaleY = (value: number, min: number, max: number, height: number) => {
    const range = max - min;
    return height - ((value - min) / range) * height;
  };

  const hrHeight = 100;
  const tempHeight = 80;
  const chartWidth = 100 / (chartData.length - 1 || 1);

  return (
    <div className="space-y-4">
      {/* Blood Pressure */}
      {showBP && (
        <div>
          <h4 className="text-sm font-medium text-slate-600 mb-2">Blood Pressure (mmHg)</h4>
          <div className="h-24 bg-slate-50 rounded-lg relative overflow-hidden">
            {chartData.map((d, i) => {
              if (!d.bp) return null;
              const systolicY = scaleY(d.bp.systolic, 80, 180, 90);
              const diastolicY = scaleY(d.bp.diastolic, 50, 120, 90);
              return (
                <div key={i} className="absolute bottom-0" style={{ left: `${i * chartWidth}%`, width: `${chartWidth}%` }}>
                  <div 
                    className="absolute bg-blue-400 rounded-sm" 
                    style={{ 
                      bottom: `${diastolicY}px`, 
                      height: `${systolicY - diastolicY}px`, 
                      left: '20%', 
                      width: '60%' 
                    }} 
                  />
                </div>
              );
            })}
            <div className="absolute top-0 left-0 text-xs text-slate-400 p-1">180</div>
            <div className="absolute bottom-0 left-0 text-xs text-slate-400 p-1">80</div>
          </div>
        </div>
      )}

      {/* Heart Rate */}
      {showHR && (
        <div>
          <h4 className="text-sm font-medium text-slate-600 mb-2">Heart Rate (bpm)</h4>
          <div className="h-24 bg-slate-50 rounded-lg relative overflow-hidden">
            <svg className="w-full h-full">
              {chartData.map((d, i) => {
                if (!d.hr) return null;
                const y = scaleY(d.hr, hrMin, hrMax, 90);
                const x = i * chartWidth + chartWidth / 2;
                return (
                  <circle 
                    key={i} 
                    cx={`${x}%`} 
                    cy={`${y}px`} 
                    r="4" 
                    className="fill-red-500" 
                  />
                );
              })}
              {chartData.filter(d => d.hr).length > 1 && (
                <polyline
                  points={chartData
                    .filter(d => d.hr)
                    .map((d, i) => {
                      const y = scaleY(d.hr!, hrMin, hrMax, 90);
                      const x = i * chartWidth + chartWidth / 2;
                      return `${x}%,${y}px`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                />
              )}
            </svg>
            <div className="absolute top-0 left-0 text-xs text-slate-400 p-1">{hrMax}</div>
            <div className="absolute bottom-0 left-0 text-xs text-slate-400 p-1">{hrMin}</div>
          </div>
        </div>
      )}

      {/* Temperature */}
      {showTemp && (
        <div>
          <h4 className="text-sm font-medium text-slate-600 mb-2">Temperature (°C)</h4>
          <div className="h-20 bg-slate-50 rounded-lg relative overflow-hidden">
            <svg className="w-full h-full">
              {chartData.map((d, i) => {
                if (!d.temp) return null;
                const y = scaleY(d.temp, tempMin, tempMax, 70);
                const x = i * chartWidth + chartWidth / 2;
                return (
                  <circle 
                    key={i} 
                    cx={`${x}%`} 
                    cy={`${y}px`} 
                    r="3" 
                    className="fill-orange-500" 
                  />
                );
              })}
              {chartData.filter(d => d.temp).length > 1 && (
                <polyline
                  points={chartData
                    .filter(d => d.temp)
                    .map((d, i) => {
                      const y = scaleY(d.temp!, tempMin, tempMax, 70);
                      const x = i * chartWidth + chartWidth / 2;
                      return `${x}%,${y}px`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2"
                />
              )}
            </svg>
            {/* Normal range indicator */}
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-green-300 opacity-50" style={{ transform: 'translateY(-50%)' }} />
          </div>
        </div>
      )}

      {/* Time labels */}
      <div className="flex justify-between text-xs text-slate-400">
        {chartData.map((d, i) => (
          <span key={i}>{d.time}</span>
        ))}
      </div>
    </div>
  );
}