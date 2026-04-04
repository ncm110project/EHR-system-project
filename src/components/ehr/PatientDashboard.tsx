"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useEHR } from "@/lib/ehr-context";
import { Patient, Prescription, LabOrder } from "@/lib/ehr-data";

export function PatientDashboard() {
  const { user } = useAuth();
  const { prescriptions, labOrders, patients, updatePatient } = useEHR();
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    date: "",
    time: "",
    department: "opd",
    notes: ""
  });

  if (!user || !('id' in user)) return null;

  const patient = patients.find(p => p.id === user.id);
  if (!patient) return null;

  const patientPrescriptions = prescriptions.filter(p => p.patientId === user.id);
  const patientLabOrders = labOrders.filter(l => l.patientId === user.id);

  const handleAppointmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentForm.date || !appointmentForm.time) return;

    const updatedPatient: Patient = {
      ...patient,
      followUpDate: appointmentForm.date,
      followUpTime: appointmentForm.time,
      reminderEnabled: true
    };

    updatePatient(updatedPatient);
    setShowAppointmentModal(false);
    setAppointmentForm({ date: "", time: "", department: "opd", notes: "" });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'dispensed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">Welcome, {patient.name}</h1>
          <p className="text-teal-100">Patient ID: {patient.id}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-500">Next Appointment</p>
                <p className="font-semibold text-slate-800">
                  {patient.followUpDate ? formatDate(patient.followUpDate) : "Not scheduled"}
                </p>
              </div>
            </div>
            {patient.followUpTime && (
              <p className="text-sm text-slate-600 ml-13">Time: {patient.followUpTime}</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-500">Prescriptions</p>
                <p className="font-semibold text-slate-800">{patientPrescriptions.length} active</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-slate-500">Lab Results</p>
                <p className="font-semibold text-slate-800">{patientLabOrders.length} orders</p>
              </div>
            </div>
          </div>
        </div>

        {patient.followUpDate && new Date(patient.followUpDate) < new Date() && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-medium text-red-800">Appointment Reminder</p>
              <p className="text-sm text-red-600">Your appointment on {formatDate(patient.followUpDate)} has passed. Please schedule a new appointment.</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-semibold text-slate-800">My Prescriptions</h2>
              <span className="text-sm text-slate-500">{patientPrescriptions.length} prescriptions</span>
            </div>
            <div className="p-4">
              {patientPrescriptions.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No prescriptions found</p>
              ) : (
                <div className="space-y-3">
                  {patientPrescriptions.map((rx: Prescription) => (
                    <div key={rx.id} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-slate-800">{rx.medication}</p>
                          <p className="text-sm text-slate-600">{rx.dosage} - {rx.frequency}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(rx.status)}`}>
                          {rx.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        <p>Duration: {rx.duration}</p>
                        <p>Prescribed by: {rx.prescribedBy}</p>
                        <p>Date: {rx.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-semibold text-slate-800">My Lab Results</h2>
              <span className="text-sm text-slate-500">{patientLabOrders.length} orders</span>
            </div>
            <div className="p-4">
              {patientLabOrders.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No lab orders found</p>
              ) : (
                <div className="space-y-3">
                  {patientLabOrders.map((lab: LabOrder) => (
                    <div key={lab.id} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-slate-800">{lab.testName}</p>
                          <p className="text-sm text-slate-600 capitalize">{lab.testType}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(lab.status)}`}>
                          {lab.status}
                        </span>
                      </div>
                      {lab.results && (
                        <div className="mt-2 p-2 bg-white rounded border border-slate-200">
                          <p className="text-xs text-slate-600"><span className="font-medium">Result:</span> {lab.results}</p>
                          {lab.referenceRange && (
                            <p className="text-xs text-slate-500"><span className="font-medium">Reference:</span> {lab.referenceRange}</p>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-slate-500 mt-2">
                        <p>Ordered by: {lab.orderedBy}</p>
                        <p>Date: {lab.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800">My Medical Information</h2>
          </div>
          <div className="p-4 grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-500 mb-1">Blood Type</p>
              <p className="font-medium text-slate-800">{patient.bloodType}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Allergies</p>
              <p className="font-medium text-slate-800">{patient.allergies.length > 0 ? patient.allergies.join(', ') : 'None'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Date of Birth</p>
              <p className="font-medium text-slate-800">{patient.dob}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Gender</p>
              <p className="font-medium text-slate-800">{patient.gender}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Phone</p>
              <p className="font-medium text-slate-800">{patient.phone}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Address</p>
              <p className="font-medium text-slate-800">{patient.address}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setShowAppointmentModal(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Book Appointment
          </button>
        </div>
      </div>

      {showAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Book Appointment</h3>
            <form onSubmit={handleAppointmentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <select
                  value={appointmentForm.department}
                  onChange={(e) => setAppointmentForm({...appointmentForm, department: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="opd">Outpatient Department</option>
                  <option value="er">Emergency Room</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={appointmentForm.date}
                  onChange={(e) => setAppointmentForm({...appointmentForm, date: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Time</label>
                <select
                  required
                  value={appointmentForm.time}
                  onChange={(e) => setAppointmentForm({...appointmentForm, time: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">Select time</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={appointmentForm.notes}
                  onChange={(e) => setAppointmentForm({...appointmentForm, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  rows={3}
                  placeholder="Reason for visit or any special requests"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAppointmentModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Book Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}