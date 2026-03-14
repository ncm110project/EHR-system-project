export type PatientStatus = 'waiting' | 'in-treatment' | 'admitted' | 'discharged' | 'critical' | 'stable';

export type WorkflowStatus = 'registered' | 'nurse-pending' | 'nurse-completed' | 'doctor-pending' | 'doctor-completed' | 'completed';

export type Department = 'dashboard' | 'opd' | 'er' | 'pharmacy' | 'lab' | 'nursing';

export type UserRole = 'doctor' | 'nurse' | 'admin';

export type TriagePriority = 1 | 2 | 3 | 4 | 5;

export type LabTestStatus = 'pending' | 'in-progress' | 'completed';

export type ShiftType = 'morning' | 'afternoon' | 'night';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  role: UserRole;
  department: Department;
  departmentName: string;
}

export const mockUsers: User[] = [
  { id: 'U001', username: 'nurse_opd', password: 'nurse123', name: 'Nurse Sarah Johnson', email: 'sjohnson@hospital.org', role: 'nurse', department: 'opd', departmentName: 'Outpatient Department' },
  { id: 'U002', username: 'doctor_opd', password: 'doctor123', name: 'Dr. Michael Chen', email: 'mchen@hospital.org', role: 'doctor', department: 'opd', departmentName: 'Outpatient Department' },
  { id: 'U003', username: 'nurse_er', password: 'nurse123', name: 'Nurse Jennifer Adams', email: 'jadams@hospital.org', role: 'nurse', department: 'er', departmentName: 'Emergency Room' },
  { id: 'U004', username: 'doctor_er', password: 'doctor123', name: 'Dr. Robert Patel', email: 'rpatel@hospital.org', role: 'doctor', department: 'er', departmentName: 'Emergency Room' },
  { id: 'U005', username: 'pharmacy', password: 'pharmacy123', name: 'Pharmacist Emily Wong', email: 'ewong@hospital.org', role: 'nurse', department: 'pharmacy', departmentName: 'Pharmacy' },
  { id: 'U006', username: 'nursing_admin', password: 'admin123', name: 'Admin Nurse Manager', email: 'admin@hospital.org', role: 'admin', department: 'nursing', departmentName: 'Nursing Administration' },
  { id: 'U007', username: 'lab', password: 'lab123', name: 'Lab Technician David Lee', email: 'dlee@hospital.org', role: 'nurse', department: 'lab', departmentName: 'Laboratory' },
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
  triagePriority?: TriagePriority;
  chiefComplaint?: string;
  diagnosis?: string;
  prescriptions?: Prescription[];
  labOrders?: LabOrder[];
  vitalSigns?: VitalSigns;
  notes?: string;
  workflowStatus?: WorkflowStatus;
  nurseNotes?: string;
  nurseVitals?: VitalSigns;
  email?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribedBy: string;
  status: 'pending' | 'dispensed';
  date: string;
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
}

export interface VitalSigns {
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSaturation: number;
}

export interface Medication {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  price: number;
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
  type: 'admission' | 'discharge' | 'transfer' | 'lab-result' | 'prescription' | 'triage' | 'nurse-assign';
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
    vitalSigns: { bloodPressure: '120/80', heartRate: 72, temperature: 98.6, respiratoryRate: 16, oxygenSaturation: 98 }
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
    vitalSigns: { bloodPressure: '90/60', heartRate: 110, temperature: 101.2, respiratoryRate: 22, oxygenSaturation: 95 }
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
    vitalSigns: { bloodPressure: '140/90', heartRate: 88, temperature: 99.8, respiratoryRate: 24, oxygenSaturation: 91 }
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
    vitalSigns: { bloodPressure: '110/70', heartRate: 68, temperature: 98.4, respiratoryRate: 14, oxygenSaturation: 99 }
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
    vitalSigns: { bloodPressure: '160/95', heartRate: 78, temperature: 98.2, respiratoryRate: 18, oxygenSaturation: 97 }
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
    vitalSigns: { bloodPressure: '100/65', heartRate: 120, temperature: 102.4, respiratoryRate: 28, oxygenSaturation: 96 }
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
    vitalSigns: { bloodPressure: '118/75', heartRate: 70, temperature: 98.6, respiratoryRate: 16, oxygenSaturation: 99 }
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
    vitalSigns: { bloodPressure: '115/72', heartRate: 76, temperature: 98.4, respiratoryRate: 15, oxygenSaturation: 99 }
  }
];

export const mockMedications: Medication[] = [
  { id: 'M001', name: 'Amoxicillin', category: 'Antibiotic', stock: 150, minStock: 50, unit: 'capsules', price: 12.50 },
  { id: 'M002', name: 'Ibuprofen', category: 'Pain Relief', stock: 200, minStock: 100, unit: 'tablets', price: 8.75 },
  { id: 'M003', name: 'Metformin', category: 'Diabetes', stock: 80, minStock: 60, unit: 'tablets', price: 15.00 },
  { id: 'M004', name: 'Lisinopril', category: 'Blood Pressure', stock: 45, minStock: 50, unit: 'tablets', price: 18.25 },
  { id: 'M005', name: 'Omeprazole', category: 'GI', stock: 120, minStock: 40, unit: 'capsules', price: 22.00 },
  { id: 'M006', name: 'Atorvastatin', category: 'Cholesterol', stock: 30, minStock: 40, unit: 'tablets', price: 28.50 },
  { id: 'M007', name: 'Prednisone', category: 'Steroid', stock: 60, minStock: 30, unit: 'tablets', price: 14.75 },
  { id: 'M008', name: 'Azithromycin', category: 'Antibiotic', stock: 25, minStock: 40, unit: 'tablets', price: 35.00 },
  { id: 'M009', name: 'Acetaminophen', category: 'Pain Relief', stock: 180, minStock: 80, unit: 'tablets', price: 6.50 },
  { id: 'M010', name: 'Salbutamol', category: 'Respiratory', stock: 40, minStock: 25, unit: 'inhalers', price: 45.00 }
];

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
