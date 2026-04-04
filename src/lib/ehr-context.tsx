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
  Message,
  Appointment,
  AuditLog,
  BillingRecord,
  TransferRecord,
  FollowUp,
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
  messages: Message[];
  appointments: Appointment[];
  auditLogs: AuditLog[];
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
  sendMessage: (message: Message) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (appointment: Appointment) => void;
  addAuditLog: (log: AuditLog) => void;
  transferPatient: (patient: Patient, toDepartment: Department, reason: string, transferredBy: string) => void;
  addFollowUp: (followUp: FollowUp) => void;
  updateFollowUp: (followUp: FollowUp) => void;
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
  const [localMessages, setLocalMessages] = useLocalStorage<Message[]>('messages', []);
  const [localAppointments, setLocalAppointments] = useLocalStorage<Appointment[]>('appointments', []);
  const [localAuditLogs, setLocalAuditLogs] = useLocalStorage<AuditLog[]>('auditLogs', []);
  
  const [patients, setPatients] = useState<Patient[]>([...mockPatients, ...localPatients]);
  const [medications, setMedications] = useState<Medication[]>(mockMedications);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(mockPrescriptions);
  const [labOrders, setLabOrders] = useState<LabOrder[]>(mockLabOrders);
  const [nurses, setNurses] = useState<Nurse[]>(mockNurses);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [incidentReports, setIncidentReports] = useState<IncidentReport[]>(localIncidents);
  const [messages, setMessages] = useState<Message[]>(localMessages);
  const [appointments, setAppointments] = useState<Appointment[]>(localAppointments);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(localAuditLogs);
  const [currentDepartment, setCurrentDepartment] = useState<Department>('dashboard');

  useEffect(() => {
    setPatients([...mockPatients, ...localPatients]);
  }, [localPatients]);

  useEffect(() => {
    setIncidentReports(localIncidents);
  }, [localIncidents]);

  useEffect(() => {
    setMessages(localMessages);
  }, [localMessages]);

  useEffect(() => {
    setAppointments(localAppointments);
  }, [localAppointments]);

  useEffect(() => {
    setAuditLogs(localAuditLogs);
  }, [localAuditLogs]);

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

  const sendMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
    const saved = localStorage.getItem('messages');
    const existing: Message[] = saved ? JSON.parse(saved) : [];
    localStorage.setItem('messages', JSON.stringify([...existing, message]));
  }, []);

  const addAppointment = useCallback((appointment: Appointment) => {
    setAppointments(prev => [...prev, appointment]);
    const saved = localStorage.getItem('appointments');
    const existing: Appointment[] = saved ? JSON.parse(saved) : [];
    localStorage.setItem('appointments', JSON.stringify([...existing, appointment]));
  }, []);

  const updateAppointment = useCallback((appointment: Appointment) => {
    setAppointments(prev => prev.map(a => a.id === appointment.id ? appointment : a));
    const saved = localStorage.getItem('appointments');
    if (saved) {
      const existing: Appointment[] = JSON.parse(saved);
      const updated = existing.map((a: Appointment) => a.id === appointment.id ? appointment : a);
      localStorage.setItem('appointments', JSON.stringify(updated));
    }
  }, []);

  const addAuditLog = useCallback((log: AuditLog) => {
    setAuditLogs(prev => [log, ...prev]);
    const saved = localStorage.getItem('auditLogs');
    const existing: AuditLog[] = saved ? JSON.parse(saved) : [];
    localStorage.setItem('auditLogs', JSON.stringify([log, ...existing]));
  }, []);

  const transferPatient = useCallback((patient: Patient, toDepartment: Department, reason: string, transferredBy: string) => {
    const transferRecord: TransferRecord = {
      id: `TRF-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      fromDepartment: patient.department,
      toDepartment,
      reason,
      transferredBy,
      transferredAt: new Date().toISOString(),
      status: 'completed'
    };
    
    const updatedPatient: Patient = {
      ...patient,
      department: toDepartment,
      transferHistory: [...(patient.transferHistory || []), transferRecord]
    };
    
    setPatients(prev => prev.map(p => p.id === patient.id ? updatedPatient : p));
    
    addActivity({
      id: `ACT-${Date.now()}`,
      type: 'transfer',
      department: toDepartment,
      patientId: patient.id,
      patientName: patient.name,
      description: `Transferred from ${patient.department} to ${toDepartment}: ${reason}`,
      timestamp: new Date().toISOString()
    });
  }, []);

  const addFollowUp = useCallback((followUp: FollowUp) => {
    const patient = patients.find(p => p.id === followUp.patientId);
    if (patient) {
      const updatedPatient: Patient = {
        ...patient,
        followUps: [...(patient.followUps || []), followUp]
      };
      setPatients(prev => prev.map(p => p.id === followUp.patientId ? updatedPatient : p));
    }
  }, [patients]);

  const updateFollowUp = useCallback((followUp: FollowUp) => {
    const patient = patients.find(p => p.id === followUp.patientId);
    if (patient && patient.followUps) {
      const updatedFollowUps = patient.followUps.map(f => f.id === followUp.id ? followUp : f);
      const updatedPatient: Patient = {
        ...patient,
        followUps: updatedFollowUps
      };
      setPatients(prev => prev.map(p => p.id === followUp.patientId ? updatedPatient : p));
    }
  }, [patients]);

  return (
    <EHRContext.Provider value={{
      patients,
      medications,
      prescriptions,
      labOrders,
      nurses,
      activities,
      incidentReports,
      messages,
      appointments,
      auditLogs,
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
      updateIncidentReport,
      sendMessage,
      addAppointment,
      updateAppointment,
      addAuditLog,
      transferPatient,
      addFollowUp,
      updateFollowUp
    }}>
      {children}
    </EHRContext.Provider>
  );
}
