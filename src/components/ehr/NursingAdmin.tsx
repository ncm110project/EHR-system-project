"use client";

import { useState, useMemo, useCallback } from "react";
import { useEHR } from "@/lib/ehr-context";
import { Nurse, ShiftType, Department } from "@/lib/ehr-data";
import { useAuth } from "@/lib/auth-context";
import { FollowUpManager } from "./FollowUpManager";

const generateId = () => `A${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

type TimePeriod = 'weekly' | 'monthly' | 'yearly';

const getMonthName = (month: number) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month];
};

const getFullMonthName = (month: number) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month];
};

const getWeekLabel = (weekIndex: number) => {
  return `Week ${weekIndex + 1}`;
};

const getWeeksInMonth = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const firstDayOfWeek = firstDay.getDay();
  const weeks = Math.ceil((daysInMonth + firstDayOfWeek) / 7);
  return weeks;
};

export function NursingAdmin() {
  const { nurses, patients, updateNurse, addActivity, incidentReports, updateIncidentReport, prescriptions, labOrders, updatePatient, appointments, updateAppointment, addNotification } = useEHR();
  const { user } = useAuth();
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);
  const [activeTab, setActiveTab] = useState<'roster' | 'schedule' | 'incidents' | 'census' | 'patients' | 'followups' | 'appointments'>('roster');
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Census dashboard filters
  const [censusDepartmentFilter, setCensusDepartmentFilter] = useState<'all' | 'er' | 'opd' | 'triage' | 'general-ward'>('all');
  const [censusEsiFilter, setCensusEsiFilter] = useState<'all' | 'critical' | 'stable'>('all');
  const [censusDateRange, setCensusDateRange] = useState<'today' | 'week' | 'month' | 'year'>('month');

  const pendingAppointments = appointments.filter(a => a.status === 'pending');

  const pendingVerificationCharts = patients.filter(p => 
    p.workflowStatus === 'doctor-completed' && p.chartVerificationStatus === 'pending'
  );

  const verifiedCharts = patients.filter(p => 
    p.chartVerificationStatus === 'verified'
  );

  const allPatients = patients;

  const getFilteredPatients = () => {
    if (!searchTerm) return allPatients;
    return allPatients.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredPendingCharts = () => {
    if (!searchTerm) return pendingVerificationCharts;
    return pendingVerificationCharts.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Census filtered patients based on filters
  const getCensusFilteredPatients = useCallback(() => {
    let filtered = [...patients];
    
    if (censusDepartmentFilter !== 'all') {
      filtered = filtered.filter(p => p.department === censusDepartmentFilter);
    }
    
    if (censusEsiFilter === 'critical') {
      filtered = filtered.filter(p => p.esiLevel === 'ESI-1' || p.esiLevel === 'ESI-2');
    } else if (censusEsiFilter === 'stable') {
      filtered = filtered.filter(p => p.esiLevel === 'ESI-3' || p.esiLevel === 'ESI-4' || p.esiLevel === 'ESI-5' || !p.esiLevel);
    }
    
    const now = new Date();
    if (censusDateRange === 'today') {
      const today = now.toISOString().split('T')[0];
      filtered = filtered.filter(p => p.admissionDate === today);
    } else if (censusDateRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(p => new Date(p.admissionDate) >= weekAgo);
    } else if (censusDateRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(p => new Date(p.admissionDate) >= monthAgo);
    }
    
    return filtered;
  }, [patients, censusDepartmentFilter, censusEsiFilter, censusDateRange]);

  const censusPatients = getCensusFilteredPatients();

  const handleVerifyChart = (patient: any) => {
    const now = new Date().toISOString();
    const updated = {
      ...patient,
      chartVerificationStatus: 'verified' as const,
      verifiedBy: user?.name || 'Nursing Admin',
      verifiedAt: now
    };
    updatePatient(updated);
    addActivity({
      id: generateId(),
      type: 'admission',
      department: 'nursing',
      patientId: patient.id,
      patientName: patient.name,
      description: `Chart verified by Nursing Admin`,
      timestamp: now
    });
    setSelectedPatient(null);
  };

  const handleRejectChart = (patient: any, reason: string) => {
    const now = new Date().toISOString();
    const updated = {
      ...patient,
      chartVerificationStatus: 'rejected' as const,
      verifiedBy: user?.name || 'Nursing Admin',
      verifiedAt: now
    };
    updatePatient(updated);
    addActivity({
      id: generateId(),
      type: 'admission',
      department: 'nursing',
      patientId: patient.id,
      patientName: patient.name,
      description: `Chart rejected: ${reason}`,
      timestamp: now
    });
    setSelectedPatient(null);
  };

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    patients.forEach(p => years.add(new Date(p.admissionDate).getFullYear()));
    incidentReports.forEach(r => years.add(new Date(r.createdAt).getFullYear()));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [patients, incidentReports]);

  const availableMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i);
  }, []);

  const availableWeeks = useMemo(() => {
    return getWeeksInMonth(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const shifts: ShiftType[] = ['morning', 'afternoon', 'night'];

  const nursesByDepartment = {
    er: nurses.filter(n => n.department === 'er'),
    opd: nurses.filter(n => n.department === 'opd'),
    lab: nurses.filter(n => n.department === 'lab'),
    pharmacy: nurses.filter(n => n.department === 'pharmacy'),
    nursing: nurses.filter(n => n.department === 'nursing'),
  };

  const getShiftColor = (shift: ShiftType) => {
    switch (shift) {
      case 'morning': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'afternoon': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'night': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    }
  };

  const handleShiftChange = (nurseId: string, day: string, shift: ShiftType) => {
    const nurse = nurses.find(n => n.id === nurseId);
    if (nurse) {
      updateNurse({ ...nurse, shift });
      addActivity({
        id: generateId(),
        type: 'nurse-assign',
        department: 'nursing',
        description: `Shift updated for ${nurse.name}: ${shift} on ${day}`,
        timestamp: new Date().toISOString()
      });
    }
  };

  const getDepartmentLabel = (dept: Department) => {
    switch (dept) {
      case 'er': return 'Emergency';
      case 'opd': return 'Outpatient';
      case 'lab': return 'Laboratory';
      case 'pharmacy': return 'Pharmacy';
      case 'nursing': return 'Nursing Admin';
      default: return dept;
    }
  };

  const censusData = {
    opd: {
      totalVisits: patients.filter(p => p.department === 'opd').length,
      waiting: patients.filter(p => p.department === 'opd' && p.status === 'waiting').length,
      inTreatment: patients.filter(p => p.department === 'opd' && p.status === 'in-treatment').length,
      completed: patients.filter(p => p.department === 'opd' && p.status === 'discharged').length,
    },
    er: {
      totalVisits: patients.filter(p => p.department === 'er').length,
      critical: patients.filter(p => p.department === 'er' && p.status === 'critical').length,
      stable: patients.filter(p => p.department === 'er' && p.status === 'stable').length,
      waiting: patients.filter(p => p.department === 'er' && p.status === 'waiting').length,
      inTreatment: patients.filter(p => p.department === 'er' && p.status === 'in-treatment').length,
      mortality: 0,
    },
    pharmacy: {
      totalPrescriptions: prescriptions.length,
      pending: prescriptions.filter(p => p.status === 'pending').length,
      dispensed: prescriptions.filter(p => p.status === 'dispensed').length,
    },
    lab: {
      totalOrders: labOrders.length,
      pending: labOrders.filter(o => o.status === 'pending').length,
      inProgress: labOrders.filter(o => o.status === 'in-progress').length,
      completed: labOrders.filter(o => o.status === 'completed').length,
    },
    nursing: {
      totalStaff: nurses.length,
      onDuty: nurses.filter(n => n.status === 'on-duty').length,
      available: nurses.filter(n => n.status === 'available').length,
      offDuty: nurses.filter(n => n.status === 'off-duty').length,
    },
    incidents: {
      total: incidentReports.length,
      pending: incidentReports.filter(r => r.status === 'pending').length,
      reviewed: incidentReports.filter(r => r.status === 'reviewed').length,
      resolved: incidentReports.filter(r => r.status === 'resolved').length,
    }
  };

  const filterByTimePeriod = (dateStr: string) => {
    const date = new Date(dateStr);
    switch (timePeriod) {
      case 'yearly':
        return date.getFullYear() === selectedYear;
      case 'monthly':
        return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth;
      case 'weekly': {
        const monthStart = new Date(selectedYear, selectedMonth, 1);
        const startDay = monthStart.getDay() || 7;
        const weekStart = new Date(selectedYear, selectedMonth, selectedWeek * 7 + (startDay <= 1 ? 1 : 9 - startDay));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        return date >= weekStart && date < weekEnd;
      }
      default:
        return true;
    }
  };

  const filteredPatients = patients.filter(p => filterByTimePeriod(p.admissionDate));
  const filteredIncidents = incidentReports.filter(r => filterByTimePeriod(r.createdAt));

  const allergyNames = ['Peanuts', 'Tree Nuts', 'Shellfish', 'Fish', 'Eggs', 'Dairy', 'Soy', 'Gluten', 'Pollen', 'Latex', 'Dust Mites'];
  const allergyCounts = allergyNames.map(allergy => ({
    name: allergy,
    count: filteredPatients.filter(p => p.allergies.some(a => a.toLowerCase().includes(allergy.toLowerCase()))).length
  }));

  const conditionNames = ['Hypertension', 'Diabetes', 'Asthma', 'Heart Disease', 'Kidney Disease', 'Stroke', 'Cancer', 'Tuberculosis', 'Arthritis', 'Thyroid Disorder', 'Epilepsy', 'Chronic Lung Disease'];
  const conditionCounts = conditionNames.map(condition => ({
    name: condition,
    count: filteredPatients.filter(p => {
      const notes = p.notes || '';
      return notes.includes(condition);
    }).length
  }));

  const insuredCount = filteredPatients.filter(p => {
    const notes = p.notes || '';
    return notes.includes('Insurance:') && !notes.includes('Self Pay');
  }).length;
  const selfPayCount = filteredPatients.filter(p => {
    const notes = p.notes || '';
    return notes.includes('Self Pay');
  }).length;

  const incidentTypeCounts = {
    'patient-fall': filteredIncidents.filter(r => r.incidentType === 'patient-fall').length,
    'medication-error': filteredIncidents.filter(r => r.incidentType === 'medication-error').length,
    'equipment-failure': filteredIncidents.filter(r => r.incidentType === 'equipment-failure').length,
    'needle-stick-injury': filteredIncidents.filter(r => r.incidentType === 'needle-stick-injury').length,
    'misidentification': filteredIncidents.filter(r => r.incidentType === 'misidentification').length,
    'documentation-error': filteredIncidents.filter(r => r.incidentType === 'documentation-error').length,
    'delay-in-treatment': filteredIncidents.filter(r => r.incidentType === 'delay-in-treatment').length,
    'adverse-drug-reaction': filteredIncidents.filter(r => r.incidentType === 'adverse-drug-reaction').length,
    'infection-control-issue': filteredIncidents.filter(r => r.incidentType === 'infection-control-issue').length,
    'other': filteredIncidents.filter(r => r.incidentType === 'other').length,
  };

  const incidentByDept = {
    er: filteredIncidents.filter(r => r.location === 'er').length,
    opd: filteredIncidents.filter(r => r.location === 'opd').length,
    lab: filteredIncidents.filter(r => r.location === 'laboratory').length,
    pharmacy: filteredIncidents.filter(r => r.location === 'pharmacy').length,
    ward: filteredIncidents.filter(r => r.location === 'ward').length,
    icu: filteredIncidents.filter(r => r.location === 'icu').length,
  };

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month];
  };

  const generateTimelineData = () => {
    const patientTimeline: { label: string; count: number }[] = [];
    const incidentTimeline: { label: string; count: number }[] = [];
    const allergyTimeline: { label: string; count: number }[] = [];
    const conditionTimeline: { label: string; count: number }[] = [];

    if (timePeriod === 'yearly') {
      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(selectedYear, i, 1);
        const monthEnd = new Date(selectedYear, i + 1, 0);

        const patientCount = patients.filter(p => {
          const d = new Date(p.admissionDate);
          return d >= monthStart && d <= monthEnd;
        }).length;

        const incidentCount = incidentReports.filter(r => {
          const d = new Date(r.createdAt);
          return d >= monthStart && d <= monthEnd;
        }).length;

        const allergyCount = patients.filter(p => {
          const d = new Date(p.admissionDate);
          return d >= monthStart && d <= monthEnd && p.allergies.length > 0;
        }).length;

        const conditionCount = patients.filter(p => {
          const d = new Date(p.admissionDate);
          const notes = p.notes || '';
          return d >= monthStart && d <= monthEnd && (notes.includes('Hypertension') || notes.includes('Diabetes') || notes.includes('Asthma') || notes.includes('Heart Disease') || notes.includes('Kidney Disease'));
        }).length;

        patientTimeline.push({ label: getMonthName(i), count: patientCount });
        incidentTimeline.push({ label: getMonthName(i), count: incidentCount });
        allergyTimeline.push({ label: getMonthName(i), count: allergyCount });
        conditionTimeline.push({ label: getMonthName(i), count: conditionCount });
      }
    } else if (timePeriod === 'monthly') {
      const weeksInMonth = getWeeksInMonth(selectedYear, selectedMonth);
      for (let i = 0; i < weeksInMonth; i++) {
        const monthStart = new Date(selectedYear, selectedMonth, 1);
        const startDay = monthStart.getDay() || 7;
        const weekStart = new Date(selectedYear, selectedMonth, i * 7 + (startDay <= 1 ? 1 : 9 - startDay));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const patientCount = patients.filter(p => {
          const d = new Date(p.admissionDate);
          return d >= weekStart && d < weekEnd;
        }).length;

        const incidentCount = incidentReports.filter(r => {
          const d = new Date(r.createdAt);
          return d >= weekStart && d < weekEnd;
        }).length;

        const allergyCount = patients.filter(p => {
          const d = new Date(p.admissionDate);
          return d >= weekStart && d < weekEnd && p.allergies.length > 0;
        }).length;

        const conditionCount = patients.filter(p => {
          const d = new Date(p.admissionDate);
          const notes = p.notes || '';
          return d >= weekStart && d < weekEnd && (notes.includes('Hypertension') || notes.includes('Diabetes') || notes.includes('Asthma') || notes.includes('Heart Disease') || notes.includes('Kidney Disease'));
        }).length;

        patientTimeline.push({ label: getWeekLabel(i), count: patientCount });
        incidentTimeline.push({ label: getWeekLabel(i), count: incidentCount });
        allergyTimeline.push({ label: getWeekLabel(i), count: allergyCount });
        conditionTimeline.push({ label: getWeekLabel(i), count: conditionCount });
      }
    } else {
      const daysInWeek = 7;
      const monthStart = new Date(selectedYear, selectedMonth, 1);
      const startDay = monthStart.getDay() || 7;
      const weekStart = new Date(selectedYear, selectedMonth, selectedWeek * 7 + (startDay <= 1 ? 1 : 9 - startDay));

      for (let i = 0; i < daysInWeek; i++) {
        const dayStart = new Date(weekStart);
        dayStart.setDate(dayStart.getDate() + i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const patientCount = patients.filter(p => {
          const d = new Date(p.admissionDate);
          return d >= dayStart && d < dayEnd;
        }).length;

        const incidentCount = incidentReports.filter(r => {
          const d = new Date(r.createdAt);
          return d >= dayStart && d < dayEnd;
        }).length;

        const allergyCount = patients.filter(p => {
          const d = new Date(p.admissionDate);
          return d >= dayStart && d < dayEnd && p.allergies.length > 0;
        }).length;

        const conditionCount = patients.filter(p => {
          const d = new Date(p.admissionDate);
          const notes = p.notes || '';
          return d >= dayStart && d < dayEnd && (notes.includes('Hypertension') || notes.includes('Diabetes') || notes.includes('Asthma') || notes.includes('Heart Disease') || notes.includes('Kidney Disease'));
        }).length;

        const dayLabel = dayStart.toLocaleDateString('en-US', { weekday: 'short' });
        patientTimeline.push({ label: dayLabel, count: patientCount });
        incidentTimeline.push({ label: dayLabel, count: incidentCount });
        allergyTimeline.push({ label: dayLabel, count: allergyCount });
        conditionTimeline.push({ label: dayLabel, count: conditionCount });
      }
    }

    return { patientTimeline, incidentTimeline, allergyTimeline, conditionTimeline };
  };

  const timelineData = generateTimelineData();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Nursing Administration</h2>
          <p className="text-slate-500">Staff management and scheduling</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Nurses</p>
              <p className="text-2xl font-bold">{nurses.length}</p>
            </div>
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">On Duty</p>
              <p className="text-2xl font-bold text-green-600">{nurses.filter(n => n.status === 'on-duty').length}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Available</p>
              <p className="text-2xl font-bold text-blue-600">{nurses.filter(n => n.status === 'available').length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Off Duty</p>
              <p className="text-2xl font-bold text-slate-400">{nurses.filter(n => n.status === 'off-duty').length}</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'roster' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Staff Roster
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'schedule' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Schedule
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'incidents' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Incident Reports
          {incidentReports.filter(r => r.status === 'pending').length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {incidentReports.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('census')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'census' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Census
        </button>
        <button
          onClick={() => setActiveTab('patients')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'patients' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Patients
          <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
            {patients.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('followups')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'followups' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Follow-ups
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'appointments' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          Appointments {pendingAppointments.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{pendingAppointments.length}</span>
          )}
        </button>
      </div>

      {activeTab === 'roster' && (
        <div className="space-y-6">
          {Object.entries(nursesByDepartment).map(([dept, deptNurses]) => (
            <div key={dept} className="card">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold">{getDepartmentLabel(dept as Department)} ({deptNurses.length})</h3>
              </div>
              <div className="divide-y divide-slate-200">
                {deptNurses.map((nurse) => (
                  <div 
                    key={nurse.id} 
                    className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelectedNurse(nurse)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-semibold">
                        {nurse.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium">{nurse.name}</p>
                        <p className="text-sm text-slate-500">{nurse.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className={`badge ${nurse.status === 'on-duty' ? 'badge-success' : nurse.status === 'available' ? 'badge-info' : 'badge-neutral'}`}>
                          {nurse.status}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">Shift: {nurse.shift}</p>
                      </div>
                      <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="card overflow-x-auto">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold">Weekly Shift Schedule</h3>
          </div>
          <table className="min-w-[800px]">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white">Nurse</th>
                {days.map(day => (
                  <th key={day} className="text-center">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nurses.map((nurse) => (
                <tr key={nurse.id}>
                  <td className="sticky left-0 bg-white font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 text-xs font-semibold">
                        {nurse.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span>{nurse.name}</span>
                    </div>
                  </td>
                  {days.map((day) => (
                    <td key={day} className="text-center">
                      <select
                        value={nurse.shift}
                        onChange={(e) => handleShiftChange(nurse.id, day, e.target.value as ShiftType)}
                        className={`px-2 py-1 text-sm rounded border ${getShiftColor(nurse.shift)} bg-transparent`}
                      >
                        {shifts.map(shift => (
                          <option key={shift} value={shift} className="bg-white">
                            {shift.charAt(0).toUpperCase() + shift.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedNurse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedNurse(null)}>
          <div className="bg-white rounded-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 text-xl font-semibold">
                  {selectedNurse.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedNurse.name}</h3>
                  <p className="text-slate-500">{getDepartmentLabel(selectedNurse.department)}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium">{selectedNurse.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-medium">{selectedNurse.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Current Shift</p>
                  <span className={`badge ${getShiftColor(selectedNurse.shift)}`}>
                    {selectedNurse.shift.charAt(0).toUpperCase() + selectedNurse.shift.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <span className={`badge ${selectedNurse.status === 'on-duty' ? 'badge-success' : selectedNurse.status === 'available' ? 'badge-info' : 'badge-neutral'}`}>
                    {selectedNurse.status}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">Assigned Patients</p>
                <p className="text-2xl font-bold">{selectedNurse.assignedPatients}</p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-2 justify-end">
              <button className="btn btn-secondary" onClick={() => setSelectedNurse(null)}>Close</button>
              <button className="btn btn-primary">Edit Profile</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'incidents' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Incident Reports</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedIncident(null)}
                className={`px-3 py-1.5 rounded-lg text-sm ${!selectedIncident ? 'bg-teal-600 text-white' : 'bg-slate-100'}`}
              >
                All ({incidentReports.length})
              </button>
              <button
                onClick={() => setSelectedIncident({ status: 'pending' })}
                className={`px-3 py-1.5 rounded-lg text-sm ${selectedIncident?.status === 'pending' ? 'bg-amber-600 text-white' : 'bg-slate-100'}`}
              >
                Pending ({incidentReports.filter(r => r.status === 'pending').length})
              </button>
              <button
                onClick={() => setSelectedIncident({ status: 'reviewed' })}
                className={`px-3 py-1.5 rounded-lg text-sm ${selectedIncident?.status === 'reviewed' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}
              >
                Reviewed ({incidentReports.filter(r => r.status === 'reviewed').length})
              </button>
              <button
                onClick={() => setSelectedIncident({ status: 'resolved' })}
                className={`px-3 py-1.5 rounded-lg text-sm ${selectedIncident?.status === 'resolved' ? 'bg-green-600 text-white' : 'bg-slate-100'}`}
              >
                Resolved ({incidentReports.filter(r => r.status === 'resolved').length})
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {(selectedIncident?.status 
              ? incidentReports.filter(r => r.status === selectedIncident.status) 
              : incidentReports).map((report) => (
              <div key={report.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        report.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        report.status === 'reviewed' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </span>
                      <span className="text-sm text-slate-500">{report.incidentType.replace('-', ' ')}</span>
                    </div>
                    <p className="font-medium">{report.description}</p>
                    <div className="text-sm text-slate-500">
                      <span>Reported by: {report.reportedBy}</span>
                      <span className="mx-2">|</span>
                      <span>{report.incidentDate} at {report.incidentTime}</span>
                      <span className="mx-2">|</span>
                      <span>Location: {report.location}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedIncident(report)}
                    className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700"
                  >
                    Review
                  </button>
                </div>
              </div>
            ))}
            {incidentReports.length === 0 && (
              <div className="card p-8 text-center text-slate-500">
                No incident reports found.
              </div>
            )}
          </div>
        </div>
      )}

      {selectedIncident && typeof selectedIncident === 'object' && !selectedIncident.status && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Review Incident Report</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Reported By</p>
                  <p className="font-medium">{selectedIncident.reportedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Department</p>
                  <p className="font-medium">{selectedIncident.reporterDepartment}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Date & Time</p>
                  <p className="font-medium">{selectedIncident.incidentDate} at {selectedIncident.incidentTime}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Type</p>
                  <p className="font-medium">{selectedIncident.incidentType.replace('-', ' ')}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">Location</p>
                  <p className="font-medium">{selectedIncident.location}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Severity</p>
                  <p className="font-medium">{selectedIncident.severity}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Outcome</p>
                  <p className="font-medium">{selectedIncident.outcome}</p>
                </div>
                {selectedIncident.patientName && (
                  <div>
                    <p className="text-sm text-slate-500">Patient Involved</p>
                    <p className="font-medium">{selectedIncident.patientName}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">Staff Roles</p>
                  <p className="font-medium">{selectedIncident.staffRoles?.join(', ') || 'None'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">Contributing Factors</p>
                  <p className="font-medium">{selectedIncident.contributingFactors?.join(', ') || 'None'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">Actions Taken</p>
                  <p className="font-medium">{selectedIncident.actionsTaken?.join(', ') || 'None'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">Description</p>
                  <p className="font-medium">{selectedIncident.description}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Review Notes</label>
                <textarea
                  id="reviewNotes"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  rows={3}
                  placeholder="Add review notes..."
                />
              </div>
            </div>
            <div className="p-6 border-t flex gap-2 justify-end">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const notes = (document.getElementById('reviewNotes') as HTMLTextAreaElement)?.value;
                  updateIncidentReport({ ...selectedIncident, status: 'reviewed', reviewedBy: 'Nursing Admin', reviewNotes: notes });
                  setSelectedIncident(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Mark as Reviewed
              </button>
              <button
                onClick={() => {
                  const notes = (document.getElementById('reviewNotes') as HTMLTextAreaElement)?.value;
                  updateIncidentReport({ ...selectedIncident, status: 'resolved', reviewedBy: 'Nursing Admin', reviewNotes: notes });
                  setSelectedIncident(null);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'census' && (
        <div className="space-y-8">
          {/* FILTERS */}
          <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Department:</span>
              <select
                value={censusDepartmentFilter}
                onChange={(e) => setCensusDepartmentFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg text-sm border border-slate-300 bg-white"
              >
                <option value="all">All Departments</option>
                <option value="er">Emergency Room</option>
                <option value="opd">Outpatient</option>
                <option value="triage">Triage</option>
                <option value="general-ward">General Ward</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">ESI Level:</span>
              <select
                value={censusEsiFilter}
                onChange={(e) => setCensusEsiFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg text-sm border border-slate-300 bg-white"
              >
                <option value="all">All Levels</option>
                <option value="critical">Critical (ESI 1-2)</option>
                <option value="stable">Stable (ESI 3-5)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Date Range:</span>
              <select
                value={censusDateRange}
                onChange={(e) => setCensusDateRange(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg text-sm border border-slate-300 bg-white"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>

          {/* TOP SECTION: HOSPITAL SNAPSHOT (CARDS ONLY) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <p className="text-3xl font-bold text-blue-600">{censusPatients.length}</p>
              <p className="text-sm text-slate-600 font-medium">Total Patients</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <p className="text-3xl font-bold text-green-600">{censusPatients.filter(p => p.status === 'in-treatment' || p.status === 'admitted').length}</p>
              <p className="text-sm text-slate-600 font-medium">Admissions</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
              <p className="text-3xl font-bold text-amber-600">{censusPatients.filter(p => p.status === 'discharged').length}</p>
              <p className="text-sm text-slate-600 font-medium">Discharges</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <p className="text-3xl font-bold text-purple-600">{censusPatients.filter(p => p.registrationSource === 'TRIAGE').length}</p>
              <p className="text-sm text-slate-600 font-medium">Transfers</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
              <p className="text-3xl font-bold text-red-600">{censusPatients.filter(p => p.esiLevel === 'ESI-1' || p.esiLevel === 'ESI-2').length}</p>
              <p className="text-sm text-slate-600 font-medium">Critical (ESI 1-2)</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg border border-teal-200">
              <p className="text-3xl font-bold text-teal-600">{censusPatients.filter(p => p.esiLevel === 'ESI-3' || p.esiLevel === 'ESI-4' || p.esiLevel === 'ESI-5' || !p.esiLevel).length}</p>
              <p className="text-sm text-slate-600 font-medium">Stable (ESI 3-5)</p>
            </div>
          </div>

          {/* ROW 1: ESI Levels + Chief Complaints */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h4 className="font-semibold text-slate-800 mb-4">ESI Level Distribution</h4>
              <div className="space-y-3">
                {[
                  { level: 'ESI-1', label: 'Resuscitation', count: censusPatients.filter(p => p.esiLevel === 'ESI-1').length, color: 'bg-red-600' },
                  { level: 'ESI-2', label: 'Emergency', count: censusPatients.filter(p => p.esiLevel === 'ESI-2').length, color: 'bg-orange-500' },
                  { level: 'ESI-3', label: 'Urgent', count: censusPatients.filter(p => p.esiLevel === 'ESI-3').length, color: 'bg-yellow-500' },
                  { level: 'ESI-4', label: 'Less Urgent', count: censusPatients.filter(p => p.esiLevel === 'ESI-4').length, color: 'bg-green-500' },
                  { level: 'ESI-5', label: 'Non-Urgent', count: censusPatients.filter(p => p.esiLevel === 'ESI-5').length, color: 'bg-blue-500' },
                ].map((item) => {
                  const maxCount = Math.max(censusPatients.filter(p => p.esiLevel).length, 1);
                  return (
                    <div key={item.level}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-slate-600">{item.level} - {item.label}</span>
                        <span className="text-sm font-semibold">{item.count}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-4">
                        <div className={`${item.color} h-4 rounded-full`} style={{ width: `${Math.max((item.count / maxCount) * 100, 5)}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card p-6">
              <h4 className="font-semibold text-slate-800 mb-4">Top Chief Complaints</h4>
              <div className="space-y-3">
                {(() => {
                  const complaints = censusPatients.reduce((acc, p) => {
                    const complaint = p.chiefComplaint || 'Unknown';
                    acc[complaint] = (acc[complaint] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                  const topComplaints = Object.entries(complaints)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8);
                  const maxCount = topComplaints[0]?.[1] || 1;
                  return topComplaints.map(([complaint, count]) => (
                    <div key={complaint}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-slate-600 truncate max-w-[200px]">{complaint}</span>
                        <span className="text-sm font-semibold">{count}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-4">
                        <div className="bg-indigo-500 h-4 rounded-full" style={{ width: `${Math.max((count / maxCount) * 100, 5)}%` }}></div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          {/* ROW 2: Age Group + Sex Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h4 className="font-semibold text-slate-800 mb-4">Age Group Distribution</h4>
              <div className="space-y-3">
                {[
                  { group: '0-17', count: censusPatients.filter(p => p.age < 18).length },
                  { group: '18-35', count: censusPatients.filter(p => p.age >= 18 && p.age <= 35).length },
                  { group: '36-60', count: censusPatients.filter(p => p.age > 35 && p.age <= 60).length },
                  { group: '60+', count: censusPatients.filter(p => p.age > 60).length },
                ].map((item) => {
                  const maxCount = Math.max(censusPatients.length, 1);
                  return (
                    <div key={item.group}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-slate-600">{item.group} years</span>
                        <span className="text-sm font-semibold">{item.count}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-4">
                        <div className="bg-violet-500 h-4 rounded-full" style={{ width: `${Math.max((item.count / maxCount) * 100, 5)}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="card p-6">
              <h4 className="font-semibold text-slate-800 mb-4">Sex Distribution</h4>
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {(() => {
                      const maleCount = censusPatients.filter(p => p.gender === 'Male').length;
                      const femaleCount = censusPatients.filter(p => p.gender === 'Female').length;
                      const total = maleCount + femaleCount || 1;
                      const malePct = maleCount / total * 100;
                      const femalePct = femaleCount / total * 100;
                      const circumference = 2 * Math.PI * 40;
                      const maleOffset = circumference * (1 - malePct / 100);
                      return (
                        <>
                          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3B82F6" strokeWidth="20" strokeDasharray={`${circumference * malePct / 100} ${circumference}`} transform="rotate(-90 50 50)" />
                          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#EC4899" strokeWidth="20" strokeDasharray={`${circumference * femalePct / 100} ${circumference}`} strokeDashoffset={`-${circumference * malePct / 100}`} transform="rotate(-90 50 50)" />
                        </>
                      );
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold">{censusPatients.length}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Male: {censusPatients.filter(p => p.gender === 'Male').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                  <span className="text-sm">Female: {censusPatients.filter(p => p.gender === 'Female').length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 3: Medical Conditions + Diagnoses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h4 className="font-semibold text-slate-800 mb-4">Top Medical Conditions</h4>
              <div className="space-y-3">
                {(() => {
                  const conditions = censusPatients.reduce((acc, p) => {
                    (p.medicalConditions || []).forEach(condition => {
                      acc[condition] = (acc[condition] || 0) + 1;
                    });
                    return acc;
                  }, {} as Record<string, number>);
                  const topConditions = Object.entries(conditions)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8);
                  const maxCount = topConditions[0]?.[1] || 1;
                  return topConditions.length > 0 ? topConditions.map(([condition, count]) => (
                    <div key={condition}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-slate-600">{condition}</span>
                        <span className="text-sm font-semibold">{count}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-4">
                        <div className="bg-purple-500 h-4 rounded-full" style={{ width: `${Math.max((count / maxCount) * 100, 5)}%` }}></div>
                      </div>
                    </div>
                  )) : <p className="text-sm text-slate-500">No medical conditions recorded</p>;
                })()}
              </div>
            </div>
            <div className="card p-6">
              <h4 className="font-semibold text-slate-800 mb-4">Top Diagnoses</h4>
              <div className="space-y-3">
                {(() => {
                  const diagnoses = censusPatients.reduce((acc, p) => {
                    (p.diagnosisHistory || []).forEach(d => {
                      if (d.diagnosis) {
                        acc[d.diagnosis] = (acc[d.diagnosis] || 0) + 1;
                      }
                    });
                    if (p.diagnosis) {
                      acc[p.diagnosis] = (acc[p.diagnosis] || 0) + 1;
                    }
                    return acc;
                  }, {} as Record<string, number>);
                  const topDiagnoses = Object.entries(diagnoses)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8);
                  const maxCount = topDiagnoses[0]?.[1] || 1;
                  return topDiagnoses.length > 0 ? topDiagnoses.map(([diagnosis, count]) => (
                    <div key={diagnosis}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-slate-600 truncate max-w-[200px]">{diagnosis}</span>
                        <span className="text-sm font-semibold">{count}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-4">
                        <div className="bg-teal-500 h-4 rounded-full" style={{ width: `${Math.max((count / maxCount) * 100, 5)}%` }}></div>
                      </div>
                    </div>
                  )) : <p className="text-sm text-slate-500">No diagnoses recorded</p>;
                })()}
              </div>
            </div>
          </div>

          {/* ROW 4: Disposition + Department Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h4 className="font-semibold text-slate-800 mb-4">Patient Disposition</h4>
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {(() => {
                      const discharged = censusPatients.filter(p => p.status === 'discharged').length;
                      const admitted = censusPatients.filter(p => p.status === 'admitted' || p.status === 'in-treatment').length;
                      const waiting = censusPatients.filter(p => p.status === 'waiting').length;
                      const total = discharged + admitted + waiting || 1;
                      const dischargedPct = discharged / total * 100;
                      const admittedPct = admitted / total * 100;
                      const circumference = 2 * Math.PI * 40;
                      return (
                        <>
                          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10B981" strokeWidth="20" strokeDasharray={`${circumference * dischargedPct / 100} ${circumference}`} transform="rotate(-90 50 50)" />
                          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#8B5CF6" strokeWidth="20" strokeDasharray={`${circumference * admittedPct / 100} ${circumference}`} strokeDashoffset={`-${circumference * dischargedPct / 100}`} transform="rotate(-90 50 50)" />
                          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F59E0B" strokeWidth="20" strokeDasharray={`${circumference * (100 - dischargedPct - admittedPct) / 100} ${circumference}`} strokeDashoffset={`-${circumference * (dischargedPct + admittedPct) / 100}`} transform="rotate(-90 50 50)" />
                        </>
                      );
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold">{censusPatients.length}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-sm">Discharged: {censusPatients.filter(p => p.status === 'discharged').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                  <span className="text-sm">Admitted: {censusPatients.filter(p => p.status === 'admitted' || p.status === 'in-treatment').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-sm">Waiting: {censusPatients.filter(p => p.status === 'waiting').length}</span>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <h4 className="font-semibold text-slate-800 mb-4">Department Status</h4>
              <div className="space-y-4">
                {[
                  { dept: 'er', label: 'Emergency Room', total: 20, color: 'bg-red-500' },
                  { dept: 'opd', label: 'Outpatient', total: 50, color: 'bg-blue-500' },
                  { dept: 'triage', label: 'Triage', total: 15, color: 'bg-amber-500' },
                  { dept: 'general-ward', label: 'General Ward', total: 40, color: 'bg-purple-500' },
                ].map((dept) => {
                  const count = censusPatients.filter(p => p.department === dept.dept).length;
                  const pct = Math.round((count / dept.total) * 100);
                  return (
                    <div key={dept.dept}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-slate-600">{dept.label}</span>
                        <span className="text-sm font-semibold">{count}/{dept.total} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-4">
                        <div className={`${dept.color} h-4 rounded-full`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BOTTOM: Bed Occupancy */}
          <div className="card p-6">
            <h4 className="font-semibold text-slate-800 mb-4">Bed Occupancy</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { dept: 'General Ward', occupied: 32, total: 40 },
                { dept: 'ER Beds', occupied: 15, total: 20 },
              ].map((bed) => {
                const pct = Math.round((bed.occupied / bed.total) * 100);
                const statusColor = pct >= 90 ? 'text-red-600' : pct >= 70 ? 'text-amber-600' : 'text-green-600';
                return (
                  <div key={bed.dept} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-slate-700">{bed.dept}</span>
                      <span className={`font-bold ${statusColor}`}>{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
                      <div className={`h-3 rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }}></div>
                    </div>
                    <p className="text-xs text-slate-500">{bed.occupied} / {bed.total} beds occupied</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

        {activeTab === 'patients' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card p-4">
                <p className="text-sm text-slate-500">Total Patients</p>
                <p className="text-2xl font-bold">{patients.length}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-slate-500">OPD</p>
                <p className="text-2xl font-bold">{patients.filter(p => p.department === 'opd').length}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-slate-500">ER</p>
                <p className="text-2xl font-bold">{patients.filter(p => p.department === 'er').length}</p>
              </div>
              <div className="card p-4">
                <p className="text-sm text-slate-500">Pending Verification</p>
                <p className="text-2xl font-bold text-amber-600">{pendingVerificationCharts.length}</p>
              </div>
            </div>

            <div className="card">
              <div className="p-4 border-b border-slate-200">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search patients by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>
                {searchTerm && (
                  <p className="text-sm text-slate-500 mt-2">
                    Found {getFilteredPatients().length} patient(s) matching &quot;{searchTerm}&quot;
                  </p>
                )}
              </div>
              <div className="divide-y divide-slate-200 max-h-[500px] overflow-y-auto">
                {getFilteredPatients().map((patient) => (
                  <div 
                    key={patient.id} 
                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-semibold">
                          {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold">{patient.name}</p>
                          <p className="text-sm text-slate-500">{patient.id} - {patient.age}y - {patient.gender}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`badge ${
                          patient.department === 'opd' ? 'badge-info' : 
                          patient.department === 'er' ? 'badge-warning' : 'badge-neutral'
                        }`}>
                          {patient.department.toUpperCase()}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">
                          {patient.chartVerificationStatus === 'verified' && 'Verified'}
                          {patient.chartVerificationStatus === 'pending' && 'Pending'}
                          {patient.chartVerificationStatus === 'rejected' && 'Rejected'}
                          {!patient.chartVerificationStatus && 'In Progress'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {getFilteredPatients().length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    {searchTerm ? 'No patients found matching your search' : 'No patients'}
                  </div>
                )}
              </div>
            </div>

            {selectedPatient && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedPatient(null)}>
                <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{selectedPatient.name}</h3>
                        <p className="text-slate-500">{selectedPatient.id}</p>
                      </div>
                      <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Age/Gender</p>
                        <p className="font-medium">{selectedPatient.age} years / {selectedPatient.gender}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Department</p>
                        <p className="font-medium">{selectedPatient.department.toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Status</p>
                        <p className="font-medium capitalize">{selectedPatient.status}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Admission Date</p>
                        <p className="font-medium">{selectedPatient.admissionDate}</p>
                      </div>
                    </div>

                    {selectedPatient.chiefComplaint && (
                      <div>
                        <p className="text-sm text-slate-500">Chief Complaint</p>
                        <p className="p-3 bg-slate-50 rounded-lg">{selectedPatient.chiefComplaint}</p>
                      </div>
                    )}

                    {selectedPatient.diagnosis && (
                      <div>
                        <p className="text-sm text-slate-500">Diagnosis</p>
                        <p className="p-3 bg-slate-50 rounded-lg">{selectedPatient.diagnosis}</p>
                      </div>
                    )}

                    {selectedPatient.chartVerificationStatus && (
                      <div>
                        <p className="text-sm text-slate-500">Verification Status</p>
                        <span className={`badge ${
                          selectedPatient.chartVerificationStatus === 'verified' ? 'badge-success' :
                          selectedPatient.chartVerificationStatus === 'pending' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {selectedPatient.chartVerificationStatus.toUpperCase()}
                        </span>
                        {selectedPatient.verifiedBy && (
                          <p className="text-xs text-slate-500 mt-1">
                            By {selectedPatient.verifiedBy} on {selectedPatient.verifiedAt ? new Date(selectedPatient.verifiedAt).toLocaleDateString() : 'N/A'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )}
          </div>
        )}

        {activeTab === 'followups' && (
          <FollowUpManager />
        )}

        {activeTab === 'appointments' && (
          <div className="card">
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">Appointment Management</h2>
              <p className="text-sm text-slate-500">Review and confirm patient appointments</p>
            </div>
            <div className="p-4">
              {pendingAppointments.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No pending appointments to review</p>
              ) : (
                <div className="space-y-4">
                  {pendingAppointments.map(apt => (
                    <div key={apt.id} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-slate-800">{apt.patientName}</p>
                          <p className="text-sm text-slate-600">Date: {apt.date} at {apt.time}</p>
                          <p className="text-sm text-slate-600">Department: {apt.department}</p>
                          {apt.notes && <p className="text-sm text-slate-500 mt-1">Notes: {apt.notes}</p>}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const confirmed = { ...apt, status: 'scheduled' as const };
                              updateAppointment(confirmed);
                              addNotification({
                                id: `NOTIF-${Date.now()}`,
                                patientId: apt.patientId,
                                type: 'appointment_confirmed',
                                title: 'Appointment Confirmed',
                                message: `Your appointment on ${apt.date} at ${apt.time} has been confirmed.`,
                                timestamp: new Date().toISOString(),
                                read: false,
                                relatedId: apt.id
                              });
                            }}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => {
                              const cancelled = { ...apt, status: 'cancelled' as const };
                              updateAppointment(cancelled);
                              addNotification({
                                id: `NOTIF-${Date.now()}`,
                                patientId: apt.patientId,
                                type: 'appointment_cancelled',
                                title: 'Appointment Cancelled',
                                message: `Your appointment on ${apt.date} at ${apt.time} has been cancelled.`,
                                timestamp: new Date().toISOString(),
                                read: false,
                                relatedId: apt.id
                              });
                            }}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
