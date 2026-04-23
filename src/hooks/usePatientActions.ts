import { useCallback } from 'react';
import { useEHR } from '@/lib/ehr-context';
import { Patient, PatientStatus, Department } from '@/lib/ehr-data';

export function usePatientActions() {
  const { updatePatient, addActivity } = useEHR();

  const updatePatientStatus = useCallback((patient: Patient, newStatus: PatientStatus, reason?: string) => {
    const updatedPatient = { ...patient, status: newStatus };
    updatePatient(updatedPatient);

    // Add activity log
    addActivity({
      id: `activity-${Date.now()}`,
      type: 'notes' as const,
      department: patient.department,
      patientId: patient.id,
      patientName: patient.name,
      description: `Status changed to ${newStatus}${reason ? ` - ${reason}` : ''}`,
      timestamp: new Date().toISOString()
    });
  }, [updatePatient, addActivity]);

  const transferPatient = useCallback((patient: Patient, newDepartment: Department, reason: string, transferredBy: string) => {
    const updatedPatient = { ...patient, department: newDepartment };
    updatePatient(updatedPatient);

    addActivity({
      id: `activity-${Date.now()}`,
      type: 'transfer' as const,
      department: patient.department,
      patientId: patient.id,
      patientName: patient.name,
      description: `Transferred to ${newDepartment} - ${reason}`,
      timestamp: new Date().toISOString()
    });
  }, [updatePatient, addActivity]);

  const updatePatientNotes = useCallback((patient: Patient, notes: string) => {
    const updatedPatient = { ...patient, nurseNotes: notes };
    updatePatient(updatedPatient);
  }, [updatePatient]);

  return {
    updatePatientStatus,
    transferPatient,
    updatePatientNotes,
  };
}