export type PatientStatus = 'waiting' | 'in-treatment' | 'admitted' | 'discharged' | 'critical' | 'stable';

export type WorkflowStatus = 'registered' | 'nurse-pending' | 'nurse-completed' | 'doctor-pending' | 'doctor-completed' | 'completed';

export type RegistrationStatus = 'pending' | 'confirmed' | 'rejected';

export type ChartVerificationStatus = 'pending' | 'verified' | 'rejected';

export type Department = 'dashboard' | 'opd' | 'er' | 'pharmacy' | 'lab' | 'nursing' | 'registration' | 'general-ward';

export type UserRole = 'doctor' | 'nurse' | 'admin' | 'clerk' | 'patient';

export type TriagePriority = 1 | 2 | 3 | 4 | 5;

export type LabTestStatus = 'pending' | 'in-progress' | 'completed';

export type ShiftType = 'morning' | 'afternoon' | 'night';

export type IncidentStatus = 'pending' | 'reviewed' | 'resolved';

export type MessageStatus = 'unread' | 'read';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  recipientName: string;
  subject: string;
  content: string;
  timestamp: string;
  status: MessageStatus;
  relatedPatientId?: string;
}

export type NotificationType = 'appointment_reminder' | 'appointment_confirmed' | 'appointment_cancelled' | 'lab_result' | 'prescription';

export interface Notification {
  id: string;
  patientId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  relatedId?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  department: Department;
  doctorId?: string;
  doctorName?: string;
  date: string;
  time: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  createdAt: string;
  reminderSent?: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export type IncidentType = 
  | 'medication-error'
  | 'patient-fall'
  | 'equipment-failure'
  | 'needle-stick-injury'
  | 'misidentification'
  | 'documentation-error'
  | 'delay-in-treatment'
  | 'adverse-drug-reaction'
  | 'infection-control-issue'
  | 'other';

export type IncidentLocation = 
  | 'er'
  | 'opd'
  | 'laboratory'
  | 'pharmacy'
  | 'ward'
  | 'icu'
  | 'operating-room'
  | 'waiting-area'
  | 'other';

export type SeverityLevel = 
  | 'near-miss'
  | 'mild'
  | 'moderate'
  | 'severe'
  | 'sentinel-event';

export type IncidentOutcome = 
  | 'no-harm'
  | 'minor-injury'
  | 'temporary-harm'
  | 'permanent-harm'
  | 'death'
  | 'unknown';

export type StaffRole = 
  | 'doctor'
  | 'nurse'
  | 'pharmacist'
  | 'lab-technician'
  | 'registration-clerk'
  | 'other';

export type TransferStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface TransferRecord {
  id: string;
  patientId: string;
  patientName: string;
  fromDepartment: Department;
  toDepartment: Department;
  reason: string;
  transferredBy: string;
  transferredAt: string;
  status: TransferStatus;
  notes?: string;
}

export type FollowUpStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show';

export interface FollowUp {
  id: string;
  patientId: string;
  patientName: string;
  scheduledDate: string;
  scheduledTime: string;
  department: Department;
  doctorId?: string;
  doctorName?: string;
  reason: string;
  status: FollowUpStatus;
  completedAt?: string;
  notes?: string;
}

export type ContributingFactor = 
  | 'human-error'
  | 'equipment-malfunction'
  | 'communication-failure'
  | 'high-workload'
  | 'lack-of-training'
  | 'system-process-failure'
  | 'environmental-factors'
  | 'other';

export type ActionTaken = 
  | 'notified-doctor'
  | 'provided-first-aid'
  | 'stopped-medication'
  | 'replaced-equipment'
  | 'escalated-to-supervisor'
  | 'no-action-needed';

export interface IncidentReport {
  id: string;
  reportedBy: string;
  reporterDepartment: Department;
  incidentDate: string;
  incidentTime: string;
  incidentType: IncidentType;
  location: IncidentLocation;
  severity: SeverityLevel;
  patientId?: string;
  patientName?: string;
  staffRoles: StaffRole[];
  contributingFactors: ContributingFactor[];
  actionsTaken: ActionTaken[];
  additionalActionsTaken?: string;
  outcome: IncidentOutcome;
  description: string;
  status: IncidentStatus;
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  role: UserRole;
  department: Department;
  departmentName: string;
  phone?: string;
  permissions?: string[];
}

export const mockUsers: User[] = [
  { id: 'U001', username: 'nurse_opd', password: 'nurse123', name: 'Nurse Sarah Johnson', email: 'sjohnson@hospital.org', role: 'nurse', department: 'opd', departmentName: 'Outpatient Department' },
  { id: 'U002', username: 'doctor_opd', password: 'doctor123', name: 'Dr. Michael Chen', email: 'mchen@hospital.org', role: 'doctor', department: 'opd', departmentName: 'Outpatient Department' },
  { id: 'U003', username: 'nurse_er', password: 'nurse123', name: 'Nurse Jennifer Adams', email: 'jadams@hospital.org', role: 'nurse', department: 'er', departmentName: 'Emergency Room' },
  { id: 'U004', username: 'doctor_er', password: 'doctor123', name: 'Dr. Robert Patel', email: 'rpatel@hospital.org', role: 'doctor', department: 'er', departmentName: 'Emergency Room' },
  { id: 'U005', username: 'pharmacy', password: 'pharmacy123', name: 'Pharmacist Emily Wong', email: 'ewong@hospital.org', role: 'nurse', department: 'pharmacy', departmentName: 'Pharmacy' },
  { id: 'U006', username: 'nursing_admin', password: 'admin123', name: 'Admin Nurse Manager', email: 'admin@hospital.org', role: 'admin', department: 'nursing', departmentName: 'Nursing Administration' },
  { id: 'U007', username: 'lab', password: 'lab123', name: 'Lab Technician David Lee', email: 'dlee@hospital.org', role: 'nurse', department: 'lab', departmentName: 'Laboratory' },
  { id: 'U008', username: 'clerk', password: 'clerk123', name: 'Registration Clerk Maria Santos', email: 'msantos@hospital.org', role: 'clerk', department: 'registration', departmentName: 'Patient Registration' },
  { id: 'U009', username: 'nurse_ward', password: 'nurse123', name: 'Nurse Linda Martinez', email: 'lmartinez@hospital.org', role: 'nurse', department: 'general-ward', departmentName: 'General Ward' },
  { id: 'U010', username: 'doctor_ward', password: 'doctor123', name: 'Dr. James Wilson', email: 'jwilson@hospital.org', role: 'doctor', department: 'general-ward', departmentName: 'General Ward' },
];

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  dob: string;
  phone: string;
  address: string;
  bloodType: string;
  allergies: string[];
  status: PatientStatus;
  department: Department;
  admissionDate: string;
  registrationStatus?: RegistrationStatus;
  triagePriority?: TriagePriority;
  chiefComplaint?: string;
  diagnosis?: string;
  prescriptions?: Prescription[];
  labOrders?: LabOrder[];
  vitalSigns?: VitalSigns;
  vitalSignsHistory?: VitalSignsEntry[];
  notes?: string;
  notesHistory?: NotesEntry[];
  diagnosisHistory?: DiagnosisEntry[];
  workflowStatus?: WorkflowStatus;
  nurseNotes?: string;
  nurseVitals?: VitalSigns;
  email?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  chartVerificationStatus?: ChartVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  hasPatientAccount?: boolean;
  username?: string;
  password?: string;
  followUpDate?: string;
  followUpTime?: string;
  reminderEnabled?: boolean;
  appointmentHistory?: Appointment[];
  billingHistory?: BillingRecord[];
  transferHistory?: TransferRecord[];
  followUps?: FollowUp[];
  roomNumber?: string;
  bedNumber?: string;
  admittingPhysician?: string;
  admissionDiagnosis?: string;
  wardStatus?: 'admitted' | 'discharged' | 'transferred-out' | 'transferred-in';
  wardNurse?: string;
  nursingNotes?: string;
  nursingNotesHistory?: NotesEntry[];
  dailyProgress?: string;
  dailyProgressHistory?: NotesEntry[];
  shiftHandover?: string;
  ivFluid?: string;
  ivRate?: number;
  ivStartedAt?: string;
  dietType?: 'regular' | 'soft' | 'liquid' | 'NPO' | 'special';
  equipmentAssigned?: string[];
  visitorLog?: VisitorRecord[];
}

export interface WardBed {
  id: string;
  roomNumber: string;
  bedNumber: string;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  patientId?: string;
  patientName?: string;
}

export interface ShiftHandover {
  id: string;
  date: string;
  shiftType: ShiftType;
  nurseOutgoing: string;
  nurseIncoming: string;
  patientSummary: string;
  criticalNotes: string;
  timestamp: string;
}

export interface MedicationRound {
  id: string;
  patientId: string;
  medication: string;
  dosage: string;
  scheduledTime: string;
  administeredTime?: string;
  status: 'pending' | 'given' | 'missed' | 'refused';
  administeredBy?: string;
}

export interface IVFluidRecord {
  id: string;
  patientId: string;
  fluidName: string;
  volume: number;
  startTime: string;
  endTime?: string;
  rate: number;
  remaining?: number;
  status: 'running' | 'completed' | 'paused';
  monitoredBy?: string;
}

export interface DailyRounding {
  id: string;
  patientId: string;
  date: string;
  doctorName: string;
  assessment: string;
  plan: string;
  complications?: string;
  timestamp: string;
}

export interface WardIncident {
  id: string;
  patientId: string;
  type: 'fall' | 'infection' | 'medication-error' | 'equipment-failure' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high';
  reportedBy: string;
  timestamp: string;
  status: 'pending' | 'investigated' | 'resolved';
}

export interface Equipment {
  id: string;
  name: string;
  type: 'monitor' | 'pump' | 'ventilator' | 'other';
  status: 'available' | 'in-use' | 'maintenance';
  assignedTo?: string;
}

export interface VisitorRecord {
  id: string;
  patientId: string;
  visitorName: string;
  relation: string;
  checkIn: string;
  checkOut?: string;
}

export interface BillingRecord {
  id: string;
  patientId: string;
  date: string;
  description: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  paymentMethod?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  medication: string;
  dosage: string;
  frequency: string;
  route?: string;
  duration: string;
  instructions?: string;
  prescribedBy: string;
  status: 'pending' | 'dispensed' | 'active';
  prescribedAt?: string;
  date?: string;
}

export interface LabOrder {
  id: string;
  patientId: string;
  testName: string;
  testType: 'blood' | 'urine' | 'imaging' | 'pathology';
  status: LabTestStatus;
  orderedBy: string;
  date: string;
  results?: string;
  referenceRange?: string;
  attachments?: string[];
  verified?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  notificationSent?: boolean;
}

export interface VitalSigns {
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSaturation: number;
  recordedAt: string;
  recordedBy?: string;
}

export interface VitalSignsEntry {
  vitals: VitalSigns;
  timestamp: string;
  recordedBy: string;
}

export interface DiagnosisEntry {
  diagnosis: string;
  timestamp: string;
  diagnosedBy: string;
}

export interface NotesEntry {
  id?: string;
  notes?: string;
  content?: string;
  timestamp?: string;
  recordedAt?: string;
  recordedBy: string;
}

export interface Medication {
  id: string;
  name: string;
  category: string;
  classification: string;
  stock: number;
  minStock: number;
  unit: string;
  price: number;
  dosageForm: 'tablet' | 'capsule' | 'syrup' | 'injection' | 'cream' | 'drops' | 'inhaler' | 'suppository';
}

export interface DrugInteraction {
  id: string;
  drugA: string;
  drugB: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
}

export interface InventoryLog {
  id: string;
  medicationId: string;
  medicationName: string;
  quantity: number;
  actionType: 'dispense' | 'restock' | 'adjust';
  userId: string;
  userName: string;
  patientId?: string;
  timestamp: string;
}

export interface Nurse {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: Department;
  shift: ShiftType;
  status: 'available' | 'on-duty' | 'off-duty';
  assignedPatients: number;
}

export interface NurseSchedule {
  nurseId: string;
  date: string;
  shift: ShiftType;
  department: Department;
}

export interface Activity {
  id: string;
  type: 'admission' | 'discharge' | 'transfer' | 'lab-result' | 'prescription' | 'triage' | 'nurse-assign' | 'vitals' | 'notes' | 'lab-order' | 'ward-admit';
  department: Department;
  patientId?: string;
  patientName?: string;
  description: string;
  timestamp: string;
}

export const mockPatients: Patient[] = [
  {
    id: 'P001',
    name: 'John Smith',
    age: 45,
    gender: 'Male',
    dob: '1981-03-15',
    phone: '555-0101',
    address: '123 Oak Street',
    bloodType: 'A+',
    allergies: ['Penicillin'],
    status: 'waiting',
    department: 'opd',
    admissionDate: '2026-03-14',
    chiefComplaint: 'Chest pain',
    vitalSigns: { bloodPressure: '120/80', heartRate: 72, temperature: 98.6, respiratoryRate: 16, oxygenSaturation: 98, recordedAt: '2026-03-14T10:30:00' }
  },
  {
    id: 'P002',
    name: 'Maria Garcia',
    age: 32,
    gender: 'Female',
    dob: '1994-07-22',
    phone: '555-0102',
    address: '456 Maple Ave',
    bloodType: 'O-',
    allergies: [],
    status: 'critical',
    department: 'er',
    admissionDate: '2026-03-14',
    triagePriority: 1,
    chiefComplaint: 'Severe abdominal pain',
    vitalSigns: { bloodPressure: '90/60', heartRate: 110, temperature: 101.2, respiratoryRate: 22, oxygenSaturation: 95, recordedAt: '2026-03-14T09:15:00' }
  },
  {
    id: 'P003',
    name: 'Robert Chen',
    age: 58,
    gender: 'Male',
    dob: '1968-11-08',
    phone: '555-0103',
    address: '789 Pine Road',
    bloodType: 'B+',
    allergies: ['Sulfa', 'Aspirin'],
    status: 'in-treatment',
    department: 'er',
    admissionDate: '2026-03-13',
    triagePriority: 2,
    chiefComplaint: 'Shortness of breath',
    diagnosis: 'Pneumonia',
    vitalSigns: { bloodPressure: '140/90', heartRate: 88, temperature: 99.8, respiratoryRate: 24, oxygenSaturation: 91, recordedAt: '2026-03-13T14:20:00' }
  },
  {
    id: 'P004',
    name: 'Sarah Johnson',
    age: 28,
    gender: 'Female',
    dob: '1998-02-14',
    phone: '555-0104',
    address: '321 Elm Street',
    bloodType: 'AB+',
    allergies: [],
    status: 'admitted',
    department: 'opd',
    admissionDate: '2026-03-12',
    diagnosis: 'Appendicitis',
    vitalSigns: { bloodPressure: '110/70', heartRate: 68, temperature: 98.4, respiratoryRate: 14, oxygenSaturation: 99, recordedAt: '2026-03-12T11:00:00' }
  },
  {
    id: 'P005',
    name: 'Michael Brown',
    age: 67,
    gender: 'Male',
    dob: '1959-09-30',
    phone: '555-0105',
    address: '654 Cedar Lane',
    bloodType: 'A-',
    allergies: ['Latex'],
    status: 'stable',
    department: 'er',
    admissionDate: '2026-03-14',
    triagePriority: 3,
    chiefComplaint: 'Headache and dizziness',
    vitalSigns: { bloodPressure: '160/95', heartRate: 78, temperature: 98.2, respiratoryRate: 18, oxygenSaturation: 97, recordedAt: '2026-03-14T08:45:00' }
  },
  {
    id: 'P006',
    name: 'Emily Wilson',
    age: 5,
    gender: 'Female',
    dob: '2021-05-20',
    phone: '555-0106',
    address: '987 Birch Way',
    bloodType: 'O+',
    allergies: ['Eggs'],
    status: 'waiting',
    department: 'opd',
    admissionDate: '2026-03-14',
    chiefComplaint: 'High fever',
    vitalSigns: { bloodPressure: '100/65', heartRate: 120, temperature: 102.4, respiratoryRate: 28, oxygenSaturation: 96, recordedAt: '2026-03-14T09:30:00' }
  },
  {
    id: 'P007',
    name: 'David Lee',
    age: 42,
    gender: 'Male',
    dob: '1984-12-03',
    phone: '555-0107',
    address: '147 Spruce St',
    bloodType: 'B-',
    allergies: [],
    status: 'discharged',
    department: 'opd',
    admissionDate: '2026-03-10',
    diagnosis: 'Upper respiratory infection',
    vitalSigns: { bloodPressure: '118/75', heartRate: 70, temperature: 98.6, respiratoryRate: 16, oxygenSaturation: 99, recordedAt: '2026-03-10T15:00:00' }
  },
  {
    id: 'P008',
    name: 'Lisa Anderson',
    age: 35,
    gender: 'Female',
    dob: '1991-08-17',
    phone: '555-0108',
    address: '258 Willow Ave',
    bloodType: 'A+',
    allergies: ['Morphine'],
    status: 'in-treatment',
    department: 'er',
    admissionDate: '2026-03-14',
    triagePriority: 4,
    chiefComplaint: 'Minor laceration',
    vitalSigns: { bloodPressure: '115/72', heartRate: 76, temperature: 98.4, respiratoryRate: 15, oxygenSaturation: 99, recordedAt: '2026-03-14T10:00:00' }
  }
];

export const medicationClassifications = [
  'Analgesics', 'Antacids', 'Antianxiety Drugs', 'Antiarrhythmics', 'Antibiotics',
  'Anticoagulants and Thrombolytics', 'Anticonvulsants', 'Antidepressants', 'Antidiarrheals',
  'Antiemetics', 'Antifungals', 'Antihistamines', 'Antihypertensives', 'Anti-Inflammatories',
  'Antineoplastics', 'Antipsychotics', 'Antipyretics', 'Antivirals', 'Barbiturates',
  'Beta-Blockers', 'Bronchodilators', 'Corticosteroids', 'Cough Suppressants', 'Cytotoxic',
  'Decongestants', 'Diuretics', 'Expectorant', 'Hypoglycemics', 'Immunosuppressives',
  'Laxatives', 'Muscle Relaxants', 'Vitamins'
];

export const mockMedications: Medication[] = [
  // Analgesics
  { id: 'M001', name: 'Paracetamol', category: 'Pain Relief', classification: 'Analgesics', stock: 200, minStock: 50, unit: 'tablets', price: 5.00, dosageForm: 'tablet' },
  { id: 'M002', name: 'Ibuprofen', category: 'Pain Relief', classification: 'Analgesics', stock: 180, minStock: 50, unit: 'tablets', price: 8.75, dosageForm: 'tablet' },
  { id: 'M003', name: 'Morphine', category: 'Pain Relief', classification: 'Analgesics', stock: 30, minStock: 10, unit: 'injections', price: 45.00, dosageForm: 'injection' },

  // Antacids
  { id: 'M004', name: 'Aluminum Hydroxide', category: 'GI', classification: 'Antacids', stock: 100, minStock: 30, unit: 'tablets', price: 6.50, dosageForm: 'tablet' },
  { id: 'M005', name: 'Magnesium Hydroxide', category: 'GI', classification: 'Antacids', stock: 90, minStock: 30, unit: 'tablets', price: 7.00, dosageForm: 'tablet' },
  { id: 'M006', name: 'Calcium Carbonate', category: 'GI', classification: 'Antacids', stock: 120, minStock: 40, unit: 'tablets', price: 5.50, dosageForm: 'tablet' },

  // Antianxiety Drugs
  { id: 'M007', name: 'Diazepam', category: 'Anxiety', classification: 'Antianxiety Drugs', stock: 50, minStock: 20, unit: 'tablets', price: 12.00, dosageForm: 'tablet' },
  { id: 'M008', name: 'Alprazolam', category: 'Anxiety', classification: 'Antianxiety Drugs', stock: 40, minStock: 15, unit: 'tablets', price: 15.00, dosageForm: 'tablet' },
  { id: 'M009', name: 'Lorazepam', category: 'Anxiety', classification: 'Antianxiety Drugs', stock: 35, minStock: 15, unit: 'tablets', price: 14.00, dosageForm: 'tablet' },

  // Antiarrhythmics
  { id: 'M010', name: 'Amiodarone', category: 'Cardiac', classification: 'Antiarrhythmics', stock: 25, minStock: 10, unit: 'tablets', price: 35.00, dosageForm: 'tablet' },
  { id: 'M011', name: 'Lidocaine', category: 'Cardiac', classification: 'Antiarrhythmics', stock: 40, minStock: 15, unit: 'injections', price: 28.00, dosageForm: 'injection' },
  { id: 'M012', name: 'Procainamide', category: 'Cardiac', classification: 'Antiarrhythmics', stock: 20, minStock: 10, unit: 'capsules', price: 32.00, dosageForm: 'capsule' },

  // Antibiotics
  { id: 'M013', name: 'Amoxicillin', category: 'Antibiotic', classification: 'Antibiotics', stock: 150, minStock: 50, unit: 'capsules', price: 12.50, dosageForm: 'capsule' },
  { id: 'M014', name: 'Ciprofloxacin', category: 'Antibiotic', classification: 'Antibiotics', stock: 80, minStock: 30, unit: 'tablets', price: 18.00, dosageForm: 'tablet' },
  { id: 'M015', name: 'Azithromycin', category: 'Antibiotic', classification: 'Antibiotics', stock: 60, minStock: 25, unit: 'tablets', price: 25.00, dosageForm: 'tablet' },

  // Anticoagulants and Thrombolytics
  { id: 'M016', name: 'Heparin', category: 'Blood Thinner', classification: 'Anticoagulants and Thrombolytics', stock: 45, minStock: 20, unit: 'injections', price: 40.00, dosageForm: 'injection' },
  { id: 'M017', name: 'Warfarin', category: 'Blood Thinner', classification: 'Anticoagulants and Thrombolytics', stock: 70, minStock: 30, unit: 'tablets', price: 15.00, dosageForm: 'tablet' },
  { id: 'M018', name: 'Alteplase', category: 'Blood Thinner', classification: 'Anticoagulants and Thrombolytics', stock: 10, minStock: 5, unit: 'injections', price: 250.00, dosageForm: 'injection' },

  // Anticonvulsants
  { id: 'M019', name: 'Phenytoin', category: 'Seizure', classification: 'Anticonvulsants', stock: 60, minStock: 25, unit: 'capsules', price: 20.00, dosageForm: 'capsule' },
  { id: 'M020', name: 'Valproic Acid', category: 'Seizure', classification: 'Anticonvulsants', stock: 45, minStock: 20, unit: 'syrup', price: 28.00, dosageForm: 'syrup' },
  { id: 'M021', name: 'Carbamazepine', category: 'Seizure', classification: 'Anticonvulsants', stock: 55, minStock: 20, unit: 'tablets', price: 22.00, dosageForm: 'tablet' },

  // Antidepressants
  { id: 'M022', name: 'Fluoxetine', category: 'Mental Health', classification: 'Antidepressants', stock: 80, minStock: 30, unit: 'capsules', price: 18.00, dosageForm: 'capsule' },
  { id: 'M023', name: 'Sertraline', category: 'Mental Health', classification: 'Antidepressants', stock: 75, minStock: 30, unit: 'tablets', price: 20.00, dosageForm: 'tablet' },
  { id: 'M024', name: 'Amitriptyline', category: 'Mental Health', classification: 'Antidepressants', stock: 60, minStock: 25, unit: 'tablets', price: 12.00, dosageForm: 'tablet' },

  // Antidiarrheals
  { id: 'M025', name: 'Loperamide', category: 'GI', classification: 'Antidiarrheals', stock: 100, minStock: 40, unit: 'capsules', price: 8.00, dosageForm: 'capsule' },
  { id: 'M026', name: 'Bismuth Subsalicylate', category: 'GI', classification: 'Antidiarrheals', stock: 90, minStock: 35, unit: 'tablets', price: 7.50, dosageForm: 'tablet' },
  { id: 'M027', name: 'Diphenoxylate', category: 'GI', classification: 'Antidiarrheals', stock: 50, minStock: 20, unit: 'tablets', price: 15.00, dosageForm: 'tablet' },

  // Antiemetics
  { id: 'M028', name: 'Ondansetron', category: 'Nausea', classification: 'Antiemetics', stock: 70, minStock: 30, unit: 'tablets', price: 22.00, dosageForm: 'tablet' },
  { id: 'M029', name: 'Metoclopramide', category: 'Nausea', classification: 'Antiemetics', stock: 65, minStock: 25, unit: 'tablets', price: 10.00, dosageForm: 'tablet' },
  { id: 'M030', name: 'Promethazine', category: 'Nausea', classification: 'Antiemetics', stock: 55, minStock: 20, unit: 'tablets', price: 12.00, dosageForm: 'tablet' },

  // Antifungals
  { id: 'M031', name: 'Fluconazole', category: 'Antifungal', classification: 'Antifungals', stock: 60, minStock: 25, unit: 'capsules', price: 18.00, dosageForm: 'capsule' },
  { id: 'M032', name: 'Ketoconazole', category: 'Antifungal', classification: 'Antifungals', stock: 45, minStock: 20, unit: 'tablets', price: 22.00, dosageForm: 'tablet' },
  { id: 'M033', name: 'Nystatin', category: 'Antifungal', classification: 'Antifungals', stock: 80, minStock: 30, unit: 'drops', price: 15.00, dosageForm: 'drops' },

  // Antihistamines
  { id: 'M034', name: 'Diphenhydramine', category: 'Allergy', classification: 'Antihistamines', stock: 120, minStock: 40, unit: 'capsules', price: 8.00, dosageForm: 'capsule' },
  { id: 'M035', name: 'Loratadine', category: 'Allergy', classification: 'Antihistamines', stock: 100, minStock: 35, unit: 'tablets', price: 10.00, dosageForm: 'tablet' },
  { id: 'M036', name: 'Cetirizine', category: 'Allergy', classification: 'Antihistamines', stock: 110, minStock: 40, unit: 'tablets', price: 9.00, dosageForm: 'tablet' },

  // Antihypertensives
  { id: 'M037', name: 'Amlodipine', category: 'Blood Pressure', classification: 'Antihypertensives', stock: 90, minStock: 35, unit: 'tablets', price: 14.00, dosageForm: 'tablet' },
  { id: 'M038', name: 'Losartan', category: 'Blood Pressure', classification: 'Antihypertensives', stock: 85, minStock: 30, unit: 'tablets', price: 16.00, dosageForm: 'tablet' },
  { id: 'M039', name: 'Enalapril', category: 'Blood Pressure', classification: 'Antihypertensives', stock: 75, minStock: 30, unit: 'tablets', price: 12.00, dosageForm: 'tablet' },

  // Anti-Inflammatories
  { id: 'M040', name: 'Diclofenac', category: 'Pain Relief', classification: 'Anti-Inflammatories', stock: 100, minStock: 40, unit: 'tablets', price: 11.00, dosageForm: 'tablet' },
  { id: 'M041', name: 'Naproxen', category: 'Pain Relief', classification: 'Anti-Inflammatories', stock: 95, minStock: 35, unit: 'tablets', price: 10.00, dosageForm: 'tablet' },
  { id: 'M042', name: 'Celecoxib', category: 'Pain Relief', classification: 'Anti-Inflammatories', stock: 60, minStock: 25, unit: 'capsules', price: 28.00, dosageForm: 'capsule' },

  // Antineoplastics
  { id: 'M043', name: 'Cyclophosphamide', category: 'Oncology', classification: 'Antineoplastics', stock: 15, minStock: 5, unit: 'tablets', price: 150.00, dosageForm: 'tablet' },
  { id: 'M044', name: 'Methotrexate', category: 'Oncology', classification: 'Antineoplastics', stock: 20, minStock: 8, unit: 'tablets', price: 85.00, dosageForm: 'tablet' },
  { id: 'M045', name: 'Doxorubicin', category: 'Oncology', classification: 'Antineoplastics', stock: 12, minStock: 5, unit: 'injections', price: 200.00, dosageForm: 'injection' },

  // Antipsychotics
  { id: 'M046', name: 'Haloperidol', category: 'Mental Health', classification: 'Antipsychotics', stock: 40, minStock: 15, unit: 'tablets', price: 18.00, dosageForm: 'tablet' },
  { id: 'M047', name: 'Risperidone', category: 'Mental Health', classification: 'Antipsychotics', stock: 45, minStock: 18, unit: 'tablets', price: 25.00, dosageForm: 'tablet' },
  { id: 'M048', name: 'Olanzapine', category: 'Mental Health', classification: 'Antipsychotics', stock: 35, minStock: 15, unit: 'tablets', price: 30.00, dosageForm: 'tablet' },

  // Antipyretics
  { id: 'M049', name: 'Aspirin', category: 'Pain Relief', classification: 'Antipyretics', stock: 180, minStock: 60, unit: 'tablets', price: 4.00, dosageForm: 'tablet' },

  // Antivirals
  { id: 'M050', name: 'Acyclovir', category: 'Antiviral', classification: 'Antivirals', stock: 70, minStock: 25, unit: 'tablets', price: 22.00, dosageForm: 'tablet' },
  { id: 'M051', name: 'Oseltamivir', category: 'Antiviral', classification: 'Antivirals', stock: 50, minStock: 20, unit: 'capsules', price: 45.00, dosageForm: 'capsule' },
  { id: 'M052', name: 'Zidovudine', category: 'Antiviral', classification: 'Antivirals', stock: 30, minStock: 10, unit: 'capsules', price: 80.00, dosageForm: 'capsule' },

  // Barbiturates
  { id: 'M053', name: 'Phenobarbital', category: 'Sedative', classification: 'Barbiturates', stock: 25, minStock: 10, unit: 'tablets', price: 15.00, dosageForm: 'tablet' },
  { id: 'M054', name: 'Thiopental', category: 'Sedative', classification: 'Barbiturates', stock: 15, minStock: 5, unit: 'injections', price: 60.00, dosageForm: 'injection' },
  { id: 'M055', name: 'Secobarbital', category: 'Sedative', classification: 'Barbiturates', stock: 20, minStock: 8, unit: 'capsules', price: 25.00, dosageForm: 'capsule' },

  // Beta-Blockers
  { id: 'M056', name: 'Atenolol', category: 'Blood Pressure', classification: 'Beta-Blockers', stock: 80, minStock: 30, unit: 'tablets', price: 12.00, dosageForm: 'tablet' },
  { id: 'M057', name: 'Metoprolol', category: 'Blood Pressure', classification: 'Beta-Blockers', stock: 85, minStock: 35, unit: 'tablets', price: 14.00, dosageForm: 'tablet' },
  { id: 'M058', name: 'Propranolol', category: 'Blood Pressure', classification: 'Beta-Blockers', stock: 70, minStock: 25, unit: 'tablets', price: 10.00, dosageForm: 'tablet' },

  // Bronchodilators
  { id: 'M059', name: 'Salbutamol', category: 'Respiratory', classification: 'Bronchodilators', stock: 60, minStock: 25, unit: 'inhalers', price: 35.00, dosageForm: 'inhaler' },
  { id: 'M060', name: 'Ipratropium', category: 'Respiratory', classification: 'Bronchodilators', stock: 45, minStock: 20, unit: 'inhalers', price: 40.00, dosageForm: 'inhaler' },
  { id: 'M061', name: 'Theophylline', category: 'Respiratory', classification: 'Bronchodilators', stock: 55, minStock: 20, unit: 'tablets', price: 18.00, dosageForm: 'tablet' },

  // Corticosteroids
  { id: 'M062', name: 'Prednisone', category: 'Steroid', classification: 'Corticosteroids', stock: 100, minStock: 40, unit: 'tablets', price: 8.00, dosageForm: 'tablet' },
  { id: 'M063', name: 'Dexamethasone', category: 'Steroid', classification: 'Corticosteroids', stock: 70, minStock: 25, unit: 'tablets', price: 12.00, dosageForm: 'tablet' },
  { id: 'M064', name: 'Hydrocortisone', category: 'Steroid', classification: 'Corticosteroids', stock: 80, minStock: 30, unit: 'cream', price: 15.00, dosageForm: 'cream' },

  // Cough Suppressants
  { id: 'M065', name: 'Dextromethorphan', category: 'Cough', classification: 'Cough Suppressants', stock: 120, minStock: 40, unit: 'syrup', price: 9.00, dosageForm: 'syrup' },
  { id: 'M066', name: 'Codeine', category: 'Cough', classification: 'Cough Suppressants', stock: 40, minStock: 15, unit: 'syrup', price: 25.00, dosageForm: 'syrup' },
  { id: 'M067', name: 'Benzonatate', category: 'Cough', classification: 'Cough Suppressants', stock: 60, minStock: 20, unit: 'capsules', price: 18.00, dosageForm: 'capsule' },

  // Cytotoxic
  { id: 'M068', name: 'Cisplatin', category: 'Oncology', classification: 'Cytotoxic', stock: 10, minStock: 5, unit: 'injections', price: 180.00, dosageForm: 'injection' },
  { id: 'M069', name: 'Vincristine', category: 'Oncology', classification: 'Cytotoxic', stock: 8, minStock: 3, unit: 'injections', price: 220.00, dosageForm: 'injection' },
  { id: 'M070', name: 'Bleomycin', category: 'Oncology', classification: 'Cytotoxic', stock: 12, minStock: 5, unit: 'injections', price: 160.00, dosageForm: 'injection' },

  // Decongestants
  { id: 'M071', name: 'Pseudoephedrine', category: 'Cold/Flu', classification: 'Decongestants', stock: 100, minStock: 35, unit: 'tablets', price: 8.00, dosageForm: 'tablet' },
  { id: 'M072', name: 'Phenylephrine', category: 'Cold/Flu', classification: 'Decongestants', stock: 90, minStock: 30, unit: 'tablets', price: 7.00, dosageForm: 'tablet' },
  { id: 'M073', name: 'Oxymetazoline', category: 'Cold/Flu', classification: 'Decongestants', stock: 75, minStock: 25, unit: 'drops', price: 10.00, dosageForm: 'drops' },

  // Diuretics
  { id: 'M074', name: 'Furosemide', category: 'Diuretic', classification: 'Diuretics', stock: 90, minStock: 35, unit: 'tablets', price: 8.00, dosageForm: 'tablet' },
  { id: 'M075', name: 'Hydrochlorothiazide', category: 'Diuretic', classification: 'Diuretics', stock: 100, minStock: 40, unit: 'tablets', price: 7.00, dosageForm: 'tablet' },
  { id: 'M076', name: 'Spironolactone', category: 'Diuretic', classification: 'Diuretics', stock: 70, minStock: 25, unit: 'tablets', price: 12.00, dosageForm: 'tablet' },

  // Expectorant
  { id: 'M077', name: 'Guaifenesin', category: 'Cough', classification: 'Expectorant', stock: 110, minStock: 40, unit: 'syrup', price: 9.00, dosageForm: 'syrup' },
  { id: 'M078', name: 'Bromhexine', category: 'Cough', classification: 'Expectorant', stock: 85, minStock: 30, unit: 'tablets', price: 8.00, dosageForm: 'tablet' },
  { id: 'M079', name: 'Ambroxol', category: 'Cough', classification: 'Expectorant', stock: 95, minStock: 35, unit: 'syrup', price: 10.00, dosageForm: 'syrup' },

  // Hypoglycemics
  { id: 'M080', name: 'Metformin', category: 'Diabetes', classification: 'Hypoglycemics', stock: 150, minStock: 50, unit: 'tablets', price: 10.00, dosageForm: 'tablet' },
  { id: 'M081', name: 'Glibenclamide', category: 'Diabetes', classification: 'Hypoglycemics', stock: 80, minStock: 30, unit: 'tablets', price: 12.00, dosageForm: 'tablet' },
  { id: 'M082', name: 'Insulin', category: 'Diabetes', classification: 'Hypoglycemics', stock: 50, minStock: 20, unit: 'injections', price: 85.00, dosageForm: 'injection' },

  // Immunosuppressives
  { id: 'M083', name: 'Cyclosporine', category: 'Immunosuppressant', classification: 'Immunosuppressives', stock: 25, minStock: 10, unit: 'capsules', price: 120.00, dosageForm: 'capsule' },
  { id: 'M084', name: 'Tacrolimus', category: 'Immunosuppressant', classification: 'Immunosuppressives', stock: 20, minStock: 8, unit: 'capsules', price: 150.00, dosageForm: 'capsule' },
  { id: 'M085', name: 'Azathioprine', category: 'Immunosuppressant', classification: 'Immunosuppressives', stock: 30, minStock: 12, unit: 'tablets', price: 45.00, dosageForm: 'tablet' },

  // Laxatives
  { id: 'M086', name: 'Lactulose', category: 'GI', classification: 'Laxatives', stock: 90, minStock: 35, unit: 'syrup', price: 12.00, dosageForm: 'syrup' },
  { id: 'M087', name: 'Bisacodyl', category: 'GI', classification: 'Laxatives', stock: 100, minStock: 40, unit: 'tablets', price: 7.00, dosageForm: 'tablet' },
  { id: 'M088', name: 'Senna', category: 'GI', classification: 'Laxatives', stock: 80, minStock: 30, unit: 'tablets', price: 6.00, dosageForm: 'tablet' },

  // Muscle Relaxants
  { id: 'M089', name: 'Baclofen', category: 'Muscle Relaxant', classification: 'Muscle Relaxants', stock: 50, minStock: 20, unit: 'tablets', price: 15.00, dosageForm: 'tablet' },
  { id: 'M090', name: 'Tizanidine', category: 'Muscle Relaxant', classification: 'Muscle Relaxants', stock: 45, minStock: 18, unit: 'tablets', price: 18.00, dosageForm: 'tablet' },

  // Vitamins
  { id: 'M091', name: 'Vitamin C', category: 'Supplement', classification: 'Vitamins', stock: 200, minStock: 60, unit: 'tablets', price: 5.00, dosageForm: 'tablet' },
  { id: 'M092', name: 'Vitamin D', category: 'Supplement', classification: 'Vitamins', stock: 180, minStock: 50, unit: 'tablets', price: 8.00, dosageForm: 'tablet' },
  { id: 'M093', name: 'Vitamin B Complex', category: 'Supplement', classification: 'Vitamins', stock: 160, minStock: 50, unit: 'tablets', price: 10.00, dosageForm: 'tablet' }
];

export const drugInteractions: DrugInteraction[] = [
  { id: 'DI001', drugA: 'Warfarin', drugB: 'Aspirin', severity: 'severe', description: 'Increased risk of bleeding. Monitor INR closely.' },
  { id: 'DI002', drugA: 'Diazepam', drugB: 'Codeine', severity: 'moderate', description: 'Enhanced sedation. Use with caution.' },
  { id: 'DI003', drugA: 'Ibuprofen', drugB: 'Enalapril', severity: 'mild', description: 'Reduced antihypertensive effect. Monitor blood pressure.' },
  { id: 'DI004', drugA: 'Metformin', drugB: 'Furosemide', severity: 'mild', description: 'May increase risk of lactic acidosis. Monitor renal function.' },
  { id: 'DI005', drugA: 'Amoxicillin', drugB: 'Warfarin', severity: 'moderate', description: 'May increase anticoagulant effect. Monitor INR.' },
  { id: 'DI006', drugA: 'Fluoxetine', drugB: 'Tramadol', severity: 'severe', description: 'Risk of serotonin syndrome. Avoid combination.' },
  { id: 'DI007', drugA: 'Ciprofloxacin', drugB: 'Theophylline', severity: 'moderate', description: 'Increased theophylline levels. Monitor for toxicity.' },
  { id: 'DI008', drugA: 'Amlodipine', drugB: 'Simvastatin', severity: 'moderate', description: 'Increased simvastatin levels. Limit dose to 20mg.' },
  { id: 'DI009', drugA: 'Omeprazole', drugB: 'Clopidogrel', severity: 'severe', description: 'Reduced antiplatelet effect. Use alternative PPI.' },
  { id: 'DI010', drugA: 'Lisinopril', drugB: 'Potassium', severity: 'moderate', description: 'Risk of hyperkalemia. Monitor potassium levels.' }
];

export let inventoryLogs: InventoryLog[] = [];

export const addInventoryLog = (log: InventoryLog) => {
  inventoryLogs.push(log);
};

export const mockPrescriptions: Prescription[] = [
  { id: 'RX001', patientId: 'P001', medication: 'Amoxicillin', dosage: '500mg', frequency: '3x daily', duration: '7 days', prescribedBy: 'Dr. Martinez', status: 'pending', date: '2026-03-14' },
  { id: 'RX002', patientId: 'P002', medication: 'Morphine', dosage: '5mg', frequency: 'As needed', duration: '24 hours', prescribedBy: 'Dr. Patel', status: 'dispensed', date: '2026-03-14' },
  { id: 'RX003', patientId: 'P003', medication: 'Azithromycin', dosage: '250mg', frequency: '1x daily', duration: '5 days', prescribedBy: 'Dr. Martinez', status: 'pending', date: '2026-03-13' },
  { id: 'RX004', patientId: 'P004', medication: 'Ciprofloxacin', dosage: '500mg', frequency: '2x daily', duration: '10 days', prescribedBy: 'Dr. Chen', status: 'dispensed', date: '2026-03-12' },
  { id: 'RX005', patientId: 'P005', medication: 'Lisinopril', dosage: '10mg', frequency: '1x daily', duration: '30 days', prescribedBy: 'Dr. Patel', status: 'pending', date: '2026-03-14' }
];

export const mockLabOrders: LabOrder[] = [
  { id: 'LB001', patientId: 'P001', testName: 'Complete Blood Count', testType: 'blood', status: 'pending', orderedBy: 'Dr. Martinez', date: '2026-03-14' },
  { id: 'LB002', patientId: 'P002', testName: 'Basic Metabolic Panel', testType: 'blood', status: 'in-progress', orderedBy: 'Dr. Patel', date: '2026-03-14' },
  { id: 'LB003', patientId: 'P003', testName: 'Chest X-Ray', testType: 'imaging', status: 'completed', orderedBy: 'Dr. Martinez', date: '2026-03-13', results: 'Consolidation in right lower lobe', referenceRange: 'Clear lungs' },
  { id: 'LB004', patientId: 'P004', testName: 'Urinalysis', testType: 'urine', status: 'completed', orderedBy: 'Dr. Chen', date: '2026-03-12', results: 'Normal', referenceRange: 'Normal' },
  { id: 'LB005', patientId: 'P005', testName: 'Lipid Panel', testType: 'blood', status: 'pending', orderedBy: 'Dr. Patel', date: '2026-03-14' },
  { id: 'LB006', patientId: 'P006', testName: 'Blood Culture', testType: 'blood', status: 'in-progress', orderedBy: 'Dr. Martinez', date: '2026-03-14' }
];

export const mockNurses: Nurse[] = [
  { id: 'N001', name: 'Jennifer Adams', email: 'jadams@hospital.org', phone: '555-1001', department: 'er', shift: 'morning', status: 'on-duty', assignedPatients: 4 },
  { id: 'N002', name: 'Marcus Thompson', email: 'mthompson@hospital.org', phone: '555-1002', department: 'opd', shift: 'morning', status: 'on-duty', assignedPatients: 6 },
  { id: 'N003', name: 'Sofia Rodriguez', email: 'srodriguez@hospital.org', phone: '555-1003', department: 'er', shift: 'night', status: 'on-duty', assignedPatients: 3 },
  { id: 'N004', name: 'James Wilson', email: 'jwilson@hospital.org', phone: '555-1004', department: 'lab', shift: 'morning', status: 'on-duty', assignedPatients: 0 },
  { id: 'N005', name: 'Michelle Park', email: 'mpark@hospital.org', phone: '555-1005', department: 'pharmacy', shift: 'afternoon', status: 'on-duty', assignedPatients: 0 },
  { id: 'N006', name: 'David Kim', email: 'dkim@hospital.org', phone: '555-1006', department: 'er', shift: 'afternoon', status: 'available', assignedPatients: 0 },
  { id: 'N007', name: 'Rachel Green', email: 'rgreen@hospital.org', phone: '555-1007', department: 'opd', shift: 'afternoon', status: 'on-duty', assignedPatients: 5 },
  { id: 'N008', name: 'Carlos Mendez', email: 'cmendez@hospital.org', phone: '555-1008', department: 'nursing', shift: 'morning', status: 'on-duty', assignedPatients: 8 }
];

export const mockActivities: Activity[] = [
  { id: 'A001', type: 'triage', department: 'er', patientId: 'P002', patientName: 'Maria Garcia', description: 'Triaged as Priority 1 - Critical', timestamp: '2026-03-14T10:30:00' },
  { id: 'A002', type: 'lab-result', department: 'lab', patientId: 'P003', patientName: 'Robert Chen', description: 'Chest X-Ray results available', timestamp: '2026-03-14T10:25:00' },
  { id: 'A003', type: 'prescription', department: 'pharmacy', patientId: 'P004', patientName: 'Sarah Johnson', description: 'Prescription dispensed - Ciprofloxacin', timestamp: '2026-03-14T10:15:00' },
  { id: 'A004', type: 'admission', department: 'opd', patientId: 'P006', patientName: 'Emily Wilson', description: 'New patient registered - Waiting', timestamp: '2026-03-14T10:10:00' },
  { id: 'A005', type: 'nurse-assign', department: 'nursing', patientId: 'P003', patientName: 'Robert Chen', description: 'Assigned to Nurse Jennifer Adams', timestamp: '2026-03-14T10:05:00' },
  { id: 'A006', type: 'transfer', department: 'er', patientId: 'P005', patientName: 'Michael Brown', description: 'Transferred from OPD to ER', timestamp: '2026-03-14T09:55:00' }
];

export const departments: { id: Department; name: string; icon: string; color: string }[] = [
  { id: 'dashboard', name: 'Dashboard', icon: 'grid', color: '#0F766E' },
  { id: 'opd', name: 'Outpatient', icon: 'user', color: '#3B82F6' },
  { id: 'er', name: 'Emergency', icon: 'alert', color: '#EF4444' },
  { id: 'pharmacy', icon: 'pill', name: 'Pharmacy', color: '#8B5CF6' },
  { id: 'lab', name: 'Laboratory', icon: 'flask', color: '#F59E0B' },
  { id: 'nursing', name: 'Nursing Admin', icon: 'clipboard', color: '#10B981' }
];
