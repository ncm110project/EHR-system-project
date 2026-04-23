import { Appointment } from '@/lib/ehr-data';
import { DataStorage } from './storage';

const APPOINTMENTS_KEY = 'appointments';

export class AppointmentService {
  /**
   * Get all appointments
   */
  static getAll(): Appointment[] {
    return DataStorage.getOrDefault(APPOINTMENTS_KEY, []);
  }

  /**
   * Add a new appointment
   */
  static add(appointment: Appointment): void {
    const appointments = this.getAll();
    const updated = [...appointments, appointment];
    DataStorage.set(APPOINTMENTS_KEY, updated);
  }

  /**
   * Update an existing appointment
   */
  static update(updatedAppointment: Appointment): void {
    const appointments = this.getAll();
    const index = appointments.findIndex(a => a.id === updatedAppointment.id);

    if (index !== -1) {
      const updated = [...appointments];
      updated[index] = updatedAppointment;
      DataStorage.set(APPOINTMENTS_KEY, updated);
    }
  }

  /**
   * Find appointment by ID
   */
  static findById(id: string): Appointment | null {
    const appointments = this.getAll();
    return appointments.find(a => a.id === id) || null;
  }

  /**
   * Get appointments by patient ID
   */
  static getByPatientId(patientId: string): Appointment[] {
    const appointments = this.getAll();
    return appointments.filter(a => a.patientId === patientId);
  }

  /**
   * Get appointments by date
   */
  static getByDate(date: string): Appointment[] {
    const appointments = this.getAll();
    return appointments.filter(a => a.date === date);
  }

  /**
   * Get appointments by status
   */
  static getByStatus(status: string): Appointment[] {
    const appointments = this.getAll();
    return appointments.filter(a => a.status === status);
  }

  /**
   * Check for conflicting appointments
   */
  static hasConflict(date: string, time: string, excludeId?: string): boolean {
    const appointments = this.getAll();
    return appointments.some(a =>
      a.date === date &&
      a.time === time &&
      a.status !== 'cancelled' &&
      (!excludeId || a.id !== excludeId)
    );
  }
}