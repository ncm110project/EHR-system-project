"use client";

import { useEHR } from "@/lib/ehr-context";

export function Dashboard() {
  const { patients, nurses, labOrders, prescriptions, activities, setCurrentDepartment } = useEHR();

  const stats = {
    totalPatients: patients.length,
    erCritical: patients.filter(p => p.department === 'er' && p.status === 'critical').length,
    erTotal: patients.filter(p => p.department === 'er').length,
    opdWaiting: patients.filter(p => p.department === 'opd' && p.status === 'waiting').length,
    opdTotal: patients.filter(p => p.department === 'opd').length,
    labPending: labOrders.filter(o => o.status === 'pending').length,
    labInProgress: labOrders.filter(o => o.status === 'in-progress').length,
    prescriptionsPending: prescriptions.filter(p => p.status === 'pending').length,
    nursesOnDuty: nurses.filter(n => n.status === 'on-duty').length,
    nursesAvailable: nurses.filter(n => n.status === 'available').length
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'admission':
        return <span className="text-blue-500">➕</span>;
      case 'discharge':
        return <span className="text-green-500">✅</span>;
      case 'transfer':
        return <span className="text-purple-500">↔️</span>;
      case 'lab-result':
        return <span className="text-amber-500">🧪</span>;
      case 'prescription':
        return <span className="text-pink-500">💊</span>;
      case 'triage':
        return <span className="text-red-500">🚨</span>;
      case 'nurse-assign':
        return <span className="text-teal-500">👩‍⚕️</span>;
      default:
        return <span className="text-slate-500">📋</span>;
    }
  };

  const getDepartmentLabel = (dept: string) => {
    switch (dept) {
      case 'opd': return 'Outpatient';
      case 'er': return 'Emergency';
      case 'pharmacy': return 'Pharmacy';
      case 'lab': return 'Laboratory';
      case 'nursing': return 'Nursing';
      default: return 'System';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Patients</p>
              <p className="text-3xl font-bold text-slate-800">{stats.totalPatients}</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Across all departments</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">ER Critical</p>
              <p className="text-3xl font-bold text-red-600">{stats.erCritical}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">{stats.erTotal} total in ER</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">OPD Waiting</p>
              <p className="text-3xl font-bold text-amber-600">{stats.opdWaiting}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">{stats.opdTotal} total in OPD</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Lab Pending</p>
              <p className="text-3xl font-bold text-blue-600">{stats.labPending + stats.labInProgress}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 3h6v6l5 9H4l5-9V3z"></path>
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">{stats.labInProgress} in progress</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Real-time Activity Feed</h3>
            <span className="status-dot stable"></span>
            <span className="text-xs text-slate-500">Live</span>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => activity.patientId && setCurrentDepartment(activity.department === 'er' ? 'er' : activity.department === 'opd' ? 'opd' : 'dashboard')}
              >
                <div className="text-xl">{getActivityIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge badge-info">{getDepartmentLabel(activity.department)}</span>
                    {activity.patientName && (
                      <span className="text-xs text-slate-500">{activity.patientName}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">{formatTime(activity.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Department Status</h3>
          <div className="space-y-4">
            <div 
              className="p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => setCurrentDepartment('opd')}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Outpatient</span>
                <span className="badge badge-success">{stats.opdTotal}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <span className="text-xs text-slate-500">{stats.opdWaiting} waiting</span>
              </div>
            </div>

            <div 
              className="p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => setCurrentDepartment('er')}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Emergency</span>
                <span className="badge badge-error">{stats.erCritical} critical</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: '40%' }}></div>
                </div>
                <span className="text-xs text-slate-500">{stats.erTotal} total</span>
              </div>
            </div>

            <div 
              className="p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => setCurrentDepartment('lab')}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Laboratory</span>
                <span className="badge badge-warning">{stats.labPending} pending</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '30%' }}></div>
                </div>
                <span className="text-xs text-slate-500">{stats.labInProgress} in progress</span>
              </div>
            </div>

            <div 
              className="p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => setCurrentDepartment('pharmacy')}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Pharmacy</span>
                <span className="badge badge-info">{stats.prescriptionsPending} rx</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '20%' }}></div>
                </div>
                <span className="text-xs text-slate-500">pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Nurse Staffing Overview</h3>
          <button 
            className="btn btn-primary"
            onClick={() => setCurrentDepartment('nursing')}
          >
            Manage Schedule
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-teal-50 rounded-lg">
            <p className="text-2xl font-bold text-teal-700">{stats.nursesOnDuty}</p>
            <p className="text-sm text-teal-600">On Duty</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-700">{stats.nursesAvailable}</p>
            <p className="text-sm text-blue-600">Available</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-700">{nurses.length}</p>
            <p className="text-sm text-slate-600">Total Staff</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-700">
              {nurses.filter(n => n.shift === 'morning').length}
            </p>
            <p className="text-sm text-amber-600">Morning Shift</p>
          </div>
        </div>
      </div>
    </div>
  );
}
