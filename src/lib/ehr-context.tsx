"use client";

import React, { createContext, useContext, useState, useCallback, useSyncExternalStore, useEffect, ReactNode } from 'react';
import { 
  Patient, 
  Department, 
  Medication, 
  Prescription, 
  LabOrder, 
  Nurse, 
  Activity,
  IncidentReport,
  mockPatients,
  mockMedications,
  mockPrescriptions,
  mockLabOrders,
  mockNurses,
  mockActivities
} from '@/lib/ehr-data';

interface EHRContextType {
  patients: Patient[];
  medications: Medication[];
  prescriptions: Prescription[];
  labOrders: LabOrder[];
  nurses: Nurse[];
  activities: Activity[];
  incidentReports: IncidentReport[];
  currentDepartment: Department;
  setCurrentDepartment: (dept: Department) => void;
  updatePatient: (patient: Patient) => void;
  addPatient: (patient: Patient) => void;
  updatePrescription: (prescription: Prescription) => void;
  addPrescription: (prescription: Prescription) => void;
  updateLabOrder: (order: LabOrder) => void;
  addLabOrder: (order: LabOrder) => void;
  updateNurse: (nurse: Nurse) => void;
  addActivity: (activity: Activity) => void;
  updateMedication: (medication: Medication) => void;
  loadPendingPatients: () => void;
  addIncidentReport: (report: IncidentReport) => void;
  updateIncidentReport: (report: IncidentReport) => void;
}

const EHRContext = createContext<EHRContextType | null>(null);

export function useEHR() {
  const context = useContext(EHRContext);
  if (!context) {
    throw new Error('useEHR must be used within EHRProvider');
  }
  return context;
}

interface EHRProviderProps {
  children: ReactNode;
}

const subscribe = (callback: () => void) => {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
};

const getServerSnapshot = () => null;

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const store = useSyncExternalStore(subscribe, getServerSnapshot, getServerSnapshot);
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  });

  const setStoredValue = useCallback((newValue: T) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  }, [key]);

  return [value, setStoredValue];
}

export function EHRProvider({ children }: EHRProviderProps) {
  const [localPatients, setLocalPatients] = useLocalStorage<Patient[]>('pendingPatients', []);
  const [localIncidents, setLocalIncidents] = useLocalStorage<IncidentReport[]>('incidentReports', []);
  
  const [patients, setPatients] = useState<Patient[]>([...mockPatients, ...localPatients]);
  const [medications, setMedications] = useState<Medication[]>(mockMedications);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(mockPrescriptions);
  const [labOrders, setLabOrders] = useState<LabOrder[]>(mockLabOrders);
  const [nurses, setNurses] = useState<Nurse[]>(mockNurses);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [incidentReports, setIncidentReports] = useState<IncidentReport[]>(localIncidents);
  const [currentDepartment, setCurrentDepartment] = useState<Department>('dashboard');

  useEffect(() => {
    setPatients([...mockPatients, ...localPatients]);
  }, [localPatients]);

  useEffect(() => {
    setIncidentReports(localIncidents);
  }, [localIncidents]);

  const loadPendingPatients = useCallback(() => {
    const savedPatients = localStorage.getItem('pendingPatients');
    const localPatients: Patient[] = savedPatients ? JSON.parse(savedPatients) : [];
    setPatients([...mockPatients, ...localPatients]);
  }, []);

  const updatePatient = useCallback((patient: Patient) => {
    setPatients(prev => prev.map(p => p.id === patient.id ? patient : p));
    const savedPatients = localStorage.getItem('pendingPatients');
    if (savedPatients) {
      const localPatients: Patient[] = JSON.parse(savedPatients);
      const updatedLocal = localPatients.map((p: Patient) => p.id === patient.id ? patient : p);
      localStorage.setItem('pendingPatients', JSON.stringify(updatedLocal));
    }
  }, []);

  const addPatient = useCallback((patient: Patient) => {
    setPatients(prev => [...prev, patient]);
    const savedPatients = localStorage.getItem('pendingPatients');
    const localPatients: Patient[] = savedPatients ? JSON.parse(savedPatients) : [];
    localStorage.setItem('pendingPatients', JSON.stringify([...localPatients, patient]));
  }, []);

  const updateMedication = useCallback((medication: Medication) => {
    setMedications(prev => prev.map(m => m.id === medication.id ? medication : m));
  }, []);

  const updatePrescription = useCallback((prescription: Prescription) => {
    setPrescriptions(prev => prev.map(p => p.id === prescription.id ? prescription : p));
  }, []);

  const addPrescription = useCallback((prescription: Prescription) => {
    setPrescriptions(prev => [...prev, prescription]);
  }, []);

  const updateLabOrder = useCallback((order: LabOrder) => {
    setLabOrders(prev => prev.map(o => o.id === order.id ? order : o));
  }, []);

  const addLabOrder = useCallback((order: LabOrder) => {
    setLabOrders(prev => [...prev, order]);
  }, []);

  const updateNurse = useCallback((nurse: Nurse) => {
    setNurses(prev => prev.map(n => n.id === nurse.id ? nurse : n));
  }, []);

  const addActivity = useCallback((activity: Activity) => {
    setActivities(prev => [activity, ...prev]);
  }, []);

  const addIncidentReport = useCallback((report: IncidentReport) => {
    setIncidentReports(prev => [...prev, report]);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('incidentReports');
      const existing: IncidentReport[] = saved ? JSON.parse(saved) : [];
      localStorage.setItem('incidentReports', JSON.stringify([...existing, report]));
    }
  }, []);

  const updateIncidentReport = useCallback((report: IncidentReport) => {
    setIncidentReports(prev => prev.map(r => r.id === report.id ? report : r));
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('incidentReports');
      if (saved) {
        const existing: IncidentReport[] = JSON.parse(saved);
        const updated = existing.map((r: IncidentReport) => r.id === report.id ? report : r);
        localStorage.setItem('incidentReports', JSON.stringify(updated));
      }
    }
  }, []);

  return (
    <EHRContext.Provider value={{
      patients,
      medications,
      prescriptions,
      labOrders,
      nurses,
      activities,
      incidentReports,
      currentDepartment,
      setCurrentDepartment,
      updatePatient,
      addPatient,
      updatePrescription,
      addPrescription,
      updateLabOrder,
      addLabOrder,
      updateNurse,
      addActivity,
      updateMedication,
      loadPendingPatients,
      addIncidentReport,
      updateIncidentReport
    }}>
      {children}
    </EHRContext.Provider>
  );
}
