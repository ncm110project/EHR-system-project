"use client";

import { useState } from "react";
import { useEHR } from "@/lib/ehr-context";
import { useAuth } from "@/lib/auth-context";

export function DepartmentStatistics() {
  const { patients, activities, prescriptions, labOrders } = useEHR();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');

  const userDept = user && 'department' in user ? user.department : 'opd';
  
  const deptPatients = patients.filter(p => p.department === userDept);
  const deptActivities = activities.filter(a => a.department === userDept);

  const completedPatients = deptPatients.filter(p => p.workflowStatus === 'doctor-completed');
  const waitingPatients = deptPatients.filter(p => p.status === 'waiting' || !p.workflowStatus);
  const inTreatmentPatients = deptPatients.filter(p => p.status === 'in-treatment');

  const avgWaitTime = 22;

  const pendingPrescriptions = prescriptions.filter(p => p.status === 'pending');
  const pendingLabOrders = labOrders.filter(l => l.status !== 'completed');

  const statsCards = [
    {
      title: 'Total Patients',
      value: deptPatients.length,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'bg-blue-500'
    },
    {
      title: 'Waiting',
      value: waitingPatients.length,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-amber-500'
    },
    {
      title: 'In Treatment',
      value: inTreatmentPatients.length,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-teal-500'
    },
    {
      title: 'Completed Today',
      value: completedPatients.length,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      color: 'bg-green-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-800">Department Statistics</h2>
        <div className="flex gap-2">
          {(['today', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                dateRange === range
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-slate-500">{stat.title}</p>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <h3 className="font-medium text-slate-800 mb-4">Average Wait Times</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Registration to Triage</span>
              <span className="font-medium text-slate-800">{avgWaitTime} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Triage to Doctor</span>
              <span className="font-medium text-slate-800">{avgWaitTime + 10} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Total Visit Time</span>
              <span className="font-medium text-slate-800">{avgWaitTime * 2 + 20} min</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
          <h3 className="font-medium text-slate-800 mb-4">Pending Tasks</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Pending Prescriptions</span>
              <span className="font-medium text-slate-800">{pendingPrescriptions.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Pending Lab Orders</span>
              <span className="font-medium text-slate-800">{pendingLabOrders.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Recent Activities</span>
              <span className="font-medium text-slate-800">{deptActivities.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-200">
        <h3 className="font-medium text-slate-800 mb-4">Recent Activities</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {deptActivities.slice(0, 10).map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
              <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-slate-800">{activity.description}</p>
                <p className="text-xs text-slate-500">{activity.timestamp}</p>
              </div>
              {activity.patientName && (
                <span className="text-xs text-teal-600">{activity.patientName}</span>
              )}
            </div>
          ))}
          {deptActivities.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">No recent activities</p>
          )}
        </div>
      </div>
    </div>
  );
}