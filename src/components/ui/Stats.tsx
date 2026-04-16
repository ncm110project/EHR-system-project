"use client";

import { useMemo } from 'react';

interface DashboardStats {
  totalPatients: number;
  admitted: number;
  discharged: number;
  pending: number;
  critical: number;
  averageStay: number;
}

interface DepartmentStatsProps {
  patients: any[];
  activities?: any[];
  type: 'opd' | 'er' | 'general-ward' | 'triage' | 'pharmacy' | 'lab';
}

export function useDepartmentStats(patients: any[], type: DepartmentStatsProps['type']) {
  return useMemo(() => {
    const deptPatients = patients.filter(p => p.department === type);
    
    const stats: DashboardStats = {
      totalPatients: deptPatients.length,
      admitted: deptPatients.filter(p => p.status === 'admitted' || p.status === 'active').length,
      discharged: deptPatients.filter(p => p.status === 'discharged').length,
      pending: deptPatients.filter(p => p.status === 'waiting' || p.status === 'pending').length,
      critical: deptPatients.filter(p => p.status === 'critical').length,
      averageStay: 0 // Would need admission dates to calculate
    };

    return stats;
  }, [patients, type]);
}

export function DepartmentStatsCard({ title, value, icon, color = 'teal' }: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: 'teal' | 'blue' | 'red' | 'green' | 'yellow' | 'purple';
}) {
  const colors = {
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200'
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg">{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm font-medium opacity-80">{title}</p>
        </div>
      </div>
    </div>
  );
}

export function StatRow({ label, value, trend }: { label: string; value: string | number; trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-sm font-medium ${
        trend === 'up' ? 'text-green-600' :
        trend === 'down' ? 'text-red-600' :
        'text-slate-800'
      }`}>
        {value}
      </span>
    </div>
  );
}

export function QuickStatsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {children}
    </div>
  );
}