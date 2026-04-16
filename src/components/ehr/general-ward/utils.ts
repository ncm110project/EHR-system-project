import { Patient, WardBed, Equipment, MedicationRound, IVFluidRecord, ShiftHandover, DailyRounding, WardIncident, PainAssessment, VisitorRecord, VitalSigns } from "@/lib/ehr-data";

export type WardWorkflowStatus = 'pending_admission' | 'pending_transfer' | 'approved_for_admission' | 'admitted' | 'active' | 'transferred' | 'discharged';

export const getWorkflowStatus = (patient: Patient): WardWorkflowStatus => {
  return patient.wardWorkflowStatus || 'pending_admission';
};

export const canAssignBed = (patient: Patient): boolean => {
  const status = getWorkflowStatus(patient);
  return status === 'pending_admission' || status === 'pending_transfer' || status === 'approved_for_admission';
};

export const canRecordVitals = (patient: Patient): boolean => {
  const status = getWorkflowStatus(patient);
  return status === 'active';
};

export const canDischarge = (patient: Patient): boolean => {
  const status = getWorkflowStatus(patient);
  return status === 'active';
};

export const getWorkflowStatusLabel = (status: WardWorkflowStatus): string => {
  const labels: Record<WardWorkflowStatus, string> = {
    pending_admission: 'Pending Admission',
    pending_transfer: 'Pending Transfer',
    approved_for_admission: 'Approved for Admission',
    admitted: 'Admitted',
    active: 'Active',
    transferred: 'Transferred',
    discharged: 'Discharged'
  };
  return labels[status];
};

export const getWorkflowStatusColor = (status: WardWorkflowStatus): string => {
  const colors: Record<WardWorkflowStatus, string> = {
    pending_admission: 'bg-yellow-100 text-yellow-800',
    pending_transfer: 'bg-orange-100 text-orange-800',
    approved_for_admission: 'bg-teal-100 text-teal-800',
    admitted: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    transferred: 'bg-purple-100 text-purple-800',
    discharged: 'bg-gray-100 text-gray-800'
  };
  return colors[status];
};

export const isAbnormalBP = (bp: string | undefined): boolean => {
  if (!bp) return false;
  const parts = bp.split('/');
  if (parts.length !== 2) return false;
  const systolic = parseInt(parts[0]);
  return systolic < 90 || systolic > 140;
};

export const isAbnormalHR = (hr: number | undefined): boolean => {
  return hr !== undefined && (hr < 60 || hr > 100);
};

export const isAbnormalTemp = (temp: number | undefined): boolean => {
  return temp !== undefined && (temp < 36.1 || temp > 37.2);
};

export const isAbnormalRR = (rr: number | undefined): boolean => {
  return rr !== undefined && (rr < 12 || rr > 20);
};

export const isAbnormalSpO2 = (spo2: number | undefined): boolean => {
  return spo2 !== undefined && spo2 < 95;
};

export const formatVitalTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const generateId = () => `GW-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const initialBeds: WardBed[] = [
  { id: 'B001', roomNumber: '101', bedNumber: 'A', status: 'available' },
  { id: 'B002', roomNumber: '101', bedNumber: 'B', status: 'available' },
  { id: 'B003', roomNumber: '102', bedNumber: 'A', status: 'available' },
  { id: 'B004', roomNumber: '102', bedNumber: 'B', status: 'available' },
  { id: 'B005', roomNumber: '103', bedNumber: 'A', status: 'available' },
  { id: 'B006', roomNumber: '103', bedNumber: 'B', status: 'available' },
  { id: 'B007', roomNumber: '104', bedNumber: 'A', status: 'available' },
  { id: 'B008', roomNumber: '104', bedNumber: 'B', status: 'available' },
  { id: 'B009', roomNumber: '105', bedNumber: 'A', status: 'available' },
  { id: 'B010', roomNumber: '105', bedNumber: 'B', status: 'available' },
];

export const mockEquipment: Equipment[] = [
  { id: 'E001', name: 'Cardiac Monitor #1', type: 'monitor', status: 'available' },
  { id: 'E002', name: 'Cardiac Monitor #2', type: 'monitor', status: 'available' },
  { id: 'E003', name: 'IV Pump #1', type: 'pump', status: 'available' },
  { id: 'E004', name: 'IV Pump #2', type: 'pump', status: 'available' },
  { id: 'E005', name: 'Ventilator #1', type: 'ventilator', status: 'available' },
];

export const initialVitals: VitalSigns = {
  bloodPressure: "",
  heartRate: 0,
  temperature: 0,
  respiratoryRate: 0,
  oxygenSaturation: 0,
  recordedAt: new Date().toISOString()
};

export type TabId = 'beds' | 'patients' | 'medications' | 'tasks' | 'iv' | 'rounds' | 'incidents' | 'equipment' | 'handover' | 'pain';

export interface GeneralWardStats {
  totalBeds: number;
  occupied: number;
  available: number;
  critical: number;
}

export const calculateStats = (beds: WardBed[], wardPatients: Patient[]): GeneralWardStats => ({
  totalBeds: beds.length,
  occupied: beds.filter(b => b.status === 'occupied').length,
  available: beds.filter(b => b.status === 'available').length,
  critical: wardPatients.filter(p => p.status === 'critical').length
});