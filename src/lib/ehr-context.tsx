"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  Patient, 
  Department, 
  Medication, 
  Prescription, 
  LabOrder, 
  Nurse, 
  Activity,
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

export function EHRProvider({ children }: EHRProviderProps) {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [medications] = useState<Medication[]>(mockMedications);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(mockPrescriptions);
  const [labOrders, setLabOrders] = useState<LabOrder[]>(mockLabOrders);
  const [nurses, setNurses] = useState<Nurse[]>(mockNurses);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [currentDepartment, setCurrentDepartment] = useState<Department>('dashboard');

  const updatePatient = useCallback((patient: Patient) => {
    setPatients(prev => prev.map(p => p.id === patient.id ? patient : p));
  }, []);

  const addPatient = useCallback((patient: Patient) => {
    setPatients(prev => [...prev, patient]);
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

  return (
    <EHRContext.Provider value={{
      patients,
      medications,
      prescriptions,
      labOrders,
      nurses,
      activities,
      currentDepartment,
      setCurrentDepartment,
      updatePatient,
      addPatient,
      updatePrescription,
      addPrescription,
      updateLabOrder,
      addLabOrder,
      updateNurse,
      addActivity
    }}>
      {children}
    </EHRContext.Provider>
  );
}
