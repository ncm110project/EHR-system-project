/**
 * Centralized data layer for MedConnect EHR
 * Provides type-safe, error-handled access to all application data
 */

// Re-export storage utilities
export { DataStorage } from './storage';

// Re-export data services
export { PatientService } from './patients';
export { AppointmentService } from './appointments';

// Re-export types for convenience
export type { Patient, Appointment, VitalSigns } from '@/lib/ehr-data';