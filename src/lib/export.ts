"use client";

interface ExportOptions {
  filename?: string;
  columns?: { key: string; label: string }[];
}

export function exportToCSV<T extends Record<string, any>>(data: T[], options: ExportOptions = {}) {
  const { filename = 'export', columns } = options;
  
  if (data.length === 0) return;
  
  const keys = columns 
    ? columns.map(c => c.key) 
    : Object.keys(data[0]);
  
  const headers = columns 
    ? columns.map(c => c.label).join(',') 
    : keys.join(',');
  
  const rows = data.map(item => 
    keys.map(key => {
      const value = item[key];
      // Handle values with commas by wrapping in quotes
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value ?? '';
    }).join(',')
  );
  
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportPatientList(patients: any[]) {
  const data = patients.map(p => ({
    'Patient ID': p.id,
    'Name': p.name,
    'Age': p.age,
    'Gender': p.gender,
    'Department': p.department,
    'Status': p.status,
    'Admission Date': p.admissionDate,
    'Room': p.roomNumber ? `Room ${p.roomNumber}` : 'N/A',
    'Bed': p.bedNumber || 'N/A',
  }));
  
  exportToCSV(data, { filename: 'patients' });
}

export function exportLabOrders(orders: any[]) {
  const data = orders.map(o => ({
    'Order ID': o.id,
    'Patient ID': o.patientId,
    'Test Name': o.testName,
    'Test Type': o.testType,
    'Status': o.status,
    'Ordered By': o.orderedBy,
    'Date': o.date,
    'Results': o.results || 'Pending',
  }));
  
  exportToCSV(data, { filename: 'lab_orders' });
}

export function exportPrescriptions(rxList: any[]) {
  const data = rxList.map(rx => ({
    'Rx ID': rx.id,
    'Patient ID': rx.patientId,
    'Medication': rx.medication,
    'Dosage': rx.dosage,
    'Frequency': rx.frequency,
    'Duration': rx.duration,
    'Status': rx.status,
    'Prescribed By': rx.prescribedBy,
    'Date': rx.date,
  }));
  
  exportToCSV(data, { filename: 'prescriptions' });
}

export function exportActivities(activities: any[]) {
  const data = activities.map(a => ({
    'Activity ID': a.id,
    'Type': a.type,
    'Department': a.department,
    'Patient ID': a.patientId,
    'Patient Name': a.patientName,
    'Description': a.description,
    'Performed By': a.performedBy || 'System',
    'Timestamp': a.timestamp,
  }));
  
  exportToCSV(data, { filename: 'activities' });
}

export function exportAllData() {
  const data = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    note: 'Full system data export'
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `medconnect_full_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}