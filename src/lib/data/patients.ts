import { Patient } from '@/lib/ehr-data';
import { DataStorage } from './storage';

const PATIENTS_KEY = 'patients';
const PENDING_PATIENTS_KEY = 'pendingPatients';

export class PatientService {
  /**
   * Get all patients
   */
  static getAll(): Patient[] {
    return DataStorage.getOrDefault(PATIENTS_KEY, []);
  }

  /**
   * Get pending patients (from public registration)
   */
  static getPending(): Patient[] {
    return DataStorage.getOrDefault(PENDING_PATIENTS_KEY, []);
  }

  /**
   * Add a new patient
   */
  static add(patient: Patient): void {
    const patients = this.getAll();
    const updated = [...patients, patient];
    DataStorage.set(PATIENTS_KEY, updated);
  }

  /**
   * Update an existing patient
   */
  static update(updatedPatient: Patient): void {
    const patients = this.getAll();
    const index = patients.findIndex(p => p.id === updatedPatient.id);

    if (index !== -1) {
      const updated = [...patients];
      updated[index] = updatedPatient;
      DataStorage.set(PATIENTS_KEY, updated);
    }
  }

  /**
   * Add a pending patient (from public registration)
   */
  static addPending(patient: Patient): void {
    const pending = this.getPending();
    const updated = [...pending, patient];
    DataStorage.set(PENDING_PATIENTS_KEY, updated);
  }

  /**
   * Move patient from pending to active
   */
  static approvePending(patientId: string): void {
    const pending = this.getPending();
    const patientIndex = pending.findIndex(p => p.id === patientId);

    if (patientIndex !== -1) {
      const patient = pending[patientIndex];
      this.add(patient);

      // Remove from pending
      const updatedPending = pending.filter(p => p.id !== patientId);
      DataStorage.set(PENDING_PATIENTS_KEY, updatedPending);
    }
  }

  /**
   * Find patient by ID
   */
  static findById(id: string): Patient | null {
    const patients = this.getAll();
    return patients.find(p => p.id === id) || null;
  }

  /**
   * Search patients by name or ID
   */
  static search(query: string): Patient[] {
    const patients = this.getAll();
    const lowerQuery = query.toLowerCase();

    return patients.filter(patient =>
      patient.name.toLowerCase().includes(lowerQuery) ||
      patient.id.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get patients by department
   */
  static getByDepartment(department: string): Patient[] {
    const patients = this.getAll();
    return patients.filter(p => p.department === department);
  }

  /**
   * Get patients by status
   */
  static getByStatus(status: string): Patient[] {
    const patients = this.getAll();
    return patients.filter(p => p.status === status);
  }
}