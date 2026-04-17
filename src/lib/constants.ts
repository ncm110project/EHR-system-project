/**
 * Application-wide constants
 * Centralizes magic strings and values for easier maintenance
 */

export const MOCK_USERNAMES = [
  'nurse_opd',
  'doctor_opd',
  'nurse_er',
  'doctor_er',
  'pharmacy',
  'nursing_admin',
  'lab',
  'charge_nurse',
  'staff_nurse_1',
  'doctor_ward',
  'staff_nurse_2',
  'charge_nurse_er',
  'doctor_er2',
  'nurse_triage',
  'triage_nurse',
  'admin',
] as const;

export const REGISTRATION_SOURCES = {
  OPD: 'OPD',
  TRIAGE: 'TRIAGE',
  OPD_NURSE_ACCOUNT: 'OPD_NURSE_ACCOUNT',
  SELF_REGISTRATION: 'SELF_REGISTRATION',
} as const;

export const WORKFLOW_STATUS = {
  REGISTERED: 'registered',
  NURSE_PENDING: 'nurse-pending',
  NURSE_COMPLETED: 'nurse-completed',
  DOCTOR_PENDING: 'doctor-pending',
  DOCTOR_COMPLETED: 'doctor-completed',
  COMPLETED: 'completed',
} as const;

export const CHART_VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;

export const TRANSFER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
} as const;

export const LAB_TEST_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
} as const;

export const INCIDENT_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  RESOLVED: 'resolved',
} as const;

export const MESSAGE_STATUS = {
  UNREAD: 'unread',
  READ: 'read',
} as const;

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show',
} as const;

export const FOLLOW_UP_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show',
} as const;

export const PATIENT_STATUS = {
  WAITING: 'waiting',
  IN_TREATMENT: 'in-treatment',
  ADMITTED: 'admitted',
  DISCHARGED: 'discharged',
  CRITICAL: 'critical',
  STABLE: 'stable',
} as const;

export const SHIFT_TYPE = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  NIGHT: 'night',
} as const;
