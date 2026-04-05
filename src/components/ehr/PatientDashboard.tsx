"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useEHR } from "@/lib/ehr-context";
import { Patient, Prescription, LabOrder, Appointment, BillingRecord, Message } from "@/lib/ehr-data";
import { PasswordChangeModal } from "./PasswordChangeModal";

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function PatientDashboard() {
  const { user } = useAuth();
  const { prescriptions, labOrders, patients, appointments, updatePatient, sendMessage, addAppointment, notifications, markNotificationRead, updateAppointment } = useEHR();
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPastAppointments, setShowPastAppointments] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'prescriptions' | 'lab' | 'billing' | 'messages'>('overview');
  const [appointmentForm, setAppointmentForm] = useState({
    date: "",
    time: "",
    department: "opd",
    notes: ""
  });
  const [messageForm, setMessageForm] = useState({
    subject: "",
    content: ""
  });

  if (!user || !('id' in user)) return null;

  const patient = patients.find(p => p.id === user.id);
  if (!patient) return null;

  const patientPrescriptions = prescriptions.filter(p => p.patientId === user.id);
  const patientLabOrders = labOrders.filter(l => l.patientId === user.id);
  const patientAppointments = appointments.filter(a => a.patientId === user.id);

  const mockBilling: BillingRecord[] = [
    { id: 'B001', patientId: user.id as string, date: '2026-03-14', description: 'Consultation Fee', amount: 500, status: 'paid', paymentMethod: 'Cash' },
    { id: 'B002', patientId: user.id as string, date: '2026-03-10', description: 'Laboratory - CBC', amount: 350, status: 'paid', paymentMethod: 'Credit Card' },
    { id: 'B003', patientId: user.id as string, date: '2026-04-01', description: 'Follow-up Visit', amount: 300, status: 'pending' },
  ];

  const handleAppointmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentForm.date || !appointmentForm.time) return;

    const conflict = patientAppointments.find(apt => 
      apt.date === appointmentForm.date && 
      apt.time === appointmentForm.time && 
      (apt.status === 'scheduled' || apt.status === 'pending')
    );
    
    if (conflict) {
      alert('You already have an appointment scheduled at this date and time. Please choose a different time.');
      return;
    }

    const newAppointment: Appointment = {
      id: generateId(),
      patientId: user.id as string,
      patientName: patient.name,
      department: appointmentForm.department as any,
      date: appointmentForm.date,
      time: appointmentForm.time,
      status: 'pending',
      notes: appointmentForm.notes,
      createdAt: new Date().toISOString()
    };

    addAppointment(newAppointment);
    
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageForm.subject || !messageForm.content) return;

    const newMessage: Message = {
      id: generateId(),
      senderId: user.id as string,
      senderName: patient.name,
      senderRole: 'patient',
      recipientId: 'admin',
      recipientName: 'Admin',
      subject: messageForm.subject,
      content: messageForm.content,
      timestamp: new Date().toISOString(),
      status: 'unread'
    };

    sendMessage(newMessage);
    setShowMessageModal(false);
    setMessageForm({ subject: "", content: "" });
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
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no-show': return 'bg-gray-100 text-gray-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUpcomingAppointment = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return patientAppointments.find(apt => {
      const aptDate = new Date(apt.date);
      return (apt.status === 'scheduled' || apt.status === 'pending') && aptDate >= now && aptDate <= tomorrow;
    });
  };

  const upcomingAppointment = getUpcomingAppointment();
  const hasOverdueAppointment = patientAppointments.some(apt => apt.status === 'scheduled' && new Date(apt.date) < new Date());
  const pendingAppointment = patientAppointments.find(apt => apt.status === 'pending');
  const pastAppointments = patientAppointments.filter(apt => apt.status === 'completed' || apt.status === 'cancelled' || apt.status === 'no-show' || (apt.status === 'scheduled' && new Date(apt.date) < new Date()));
  const futureAppointments = patientAppointments.filter(apt => apt.status === 'scheduled' && new Date(apt.date) >= new Date());

  const renderOverview = () => (
    <>
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

      {hasOverdueAppointment && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 mt-6">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-medium text-red-800">Appointment Reminder</p>
            <p className="text-sm text-red-600">Your appointment has passed. Please schedule a new appointment.</p>
          </div>
        </div>
      )}

      {upcomingAppointment && !hasOverdueAppointment && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 mt-6">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div>
            <p className="font-medium text-blue-800">Upcoming Appointment</p>
            <p className="text-sm text-blue-600">Your appointment is scheduled for {formatDate(upcomingAppointment.date)} at {upcomingAppointment.time}</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800">My Prescriptions</h2>
            <button onClick={() => setActiveTab('prescriptions')} className="text-sm text-teal-600 hover:text-teal-700">View All</button>
          </div>
          <div className="p-4">
            {patientPrescriptions.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No prescriptions found</p>
            ) : (
              <div className="space-y-3">
                {patientPrescriptions.slice(0, 3).map((rx: Prescription) => (
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800">My Lab Results</h2>
            <button onClick={() => setActiveTab('lab')} className="text-sm text-teal-600 hover:text-teal-700">View All</button>
          </div>
          <div className="p-4">
            {patientLabOrders.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No lab orders found</p>
            ) : (
              <div className="space-y-3">
                {patientLabOrders.slice(0, 3).map((lab: LabOrder) => (
                  <div key={lab.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-slate-800">{lab.testName}</p>
                        <p className="text-sm text-slate-600 capitalize">{lab.testType}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(lab.status)}`}>
                        {lab.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mt-6">
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
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Medical Records
          </button>
        </div>
      </div>
    </>
  );

  const renderAppointments = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="font-semibold text-slate-800">My Appointments</h2>
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
      <div className="p-4 space-y-6">
        {futureAppointments.length > 0 && (
          <div>
            <h3 className="font-medium text-slate-700 mb-3">Upcoming Appointments</h3>
            <div className="space-y-3">
              {futureAppointments.map((apt: Appointment) => (
                <div key={apt.id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-800">{formatDate(apt.date)}</p>
                      <p className="text-sm text-slate-600">Time: {apt.time}</p>
                      <p className="text-sm text-slate-600">Department: {apt.department}</p>
                      {apt.notes && <p className="text-sm text-slate-500 mt-1">Notes: {apt.notes}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                      <button
                        onClick={() => {
                          updateAppointment({ ...apt, status: 'cancelled' });
                        }}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingAppointment && (
          <div>
            <h3 className="font-medium text-amber-700 mb-3">Pending Confirmation</h3>
            <div className="space-y-3">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-slate-800">{formatDate(pendingAppointment.date)}</p>
                    <p className="text-sm text-slate-600">Time: {pendingAppointment.time}</p>
                    <p className="text-sm text-slate-600">Department: {pendingAppointment.department}</p>
                    {pendingAppointment.notes && <p className="text-sm text-slate-500 mt-1">Notes: {pendingAppointment.notes}</p>}
                  </div>
                  <span className="px-3 py-1 rounded-full text-sm bg-amber-100 text-amber-800">
                    Pending
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {pastAppointments.length > 0 && (
          <div>
            <button
              onClick={() => setShowPastAppointments(!showPastAppointments)}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 mb-3"
            >
              <svg className={`w-4 h-4 transition-transform ${showPastAppointments ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Past Appointments ({pastAppointments.length})
            </button>
            {showPastAppointments && (
              <div className="space-y-3 mt-2">
                {pastAppointments.map((apt: Appointment) => (
                  <div key={apt.id} className="p-4 bg-slate-100 rounded-lg opacity-75">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-slate-800">{formatDate(apt.date)}</p>
                        <p className="text-sm text-slate-600">Time: {apt.time}</p>
                        <p className="text-sm text-slate-600">Department: {apt.department}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {patientAppointments.length === 0 && (
          <p className="text-slate-500 text-center py-8">No appointments found. Book an appointment to get started.</p>
        )}
      </div>
    </div>
  );

  const renderPrescriptions = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <h2 className="font-semibold text-slate-800">My Prescriptions</h2>
      </div>
      <div className="p-4">
        {patientPrescriptions.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No prescriptions found</p>
        ) : (
          <div className="space-y-3">
            {patientPrescriptions.map((rx: Prescription) => (
              <div key={rx.id} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-slate-800 text-lg">{rx.medication}</p>
                    <p className="text-slate-600">{rx.dosage} - {rx.frequency}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(rx.status)}`}>
                    {rx.status}
                  </span>
                </div>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Duration</p>
                    <p className="text-slate-800">{rx.duration}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Prescribed by</p>
                    <p className="text-slate-800">{rx.prescribedBy}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Date</p>
                    <p className="text-slate-800">{rx.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderLabResults = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="font-semibold text-slate-800">My Lab Results</h2>
      </div>
      <div className="p-4">
        {patientLabOrders.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No lab orders found</p>
        ) : (
          <div className="space-y-3">
            {patientLabOrders.map((lab: LabOrder) => (
              <div key={lab.id} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-slate-800 text-lg">{lab.testName}</p>
                    <p className="text-slate-600 capitalize">{lab.testType}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(lab.status)}`}>
                    {lab.status}
                  </span>
                </div>
                
                {lab.results && (
                  <div className={`p-3 rounded border mb-3 ${lab.verified ? 'bg-white border-slate-200' : 'bg-amber-50 border-amber-200'}`}>
                    {!lab.verified && (
                      <p className="text-amber-700 text-sm mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Results pending verification
                      </p>
                    )}
                    <p className={`text-sm ${lab.referenceRange && lab.results ? 'font-medium' : ''} ${lab.referenceRange && !lab.results?.includes('Normal') ? 'text-red-700' : 'text-slate-800'}`}>
                      <span className="font-medium">Result:</span> {lab.results}
                    </p>
                    {lab.referenceRange && (
                      <p className="text-sm text-slate-500"><span className="font-medium">Reference:</span> {lab.referenceRange}</p>
                    )}
                  </div>
                )}
                
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Ordered by</p>
                    <p className="text-slate-800">{lab.orderedBy}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Date</p>
                    <p className="text-slate-800">{lab.date}</p>
                  </div>
                </div>
                
                {lab.verified && lab.results && (
                  <button
                    onClick={() => window.print()}
                    className="mt-3 text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Lab Report
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <h2 className="font-semibold text-slate-800">Billing History</h2>
      </div>
      <div className="p-4">
        {mockBilling.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No billing records found</p>
        ) : (
          <div className="space-y-3">
            {mockBilling.map((bill: BillingRecord) => (
              <div key={bill.id} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium text-slate-800">{bill.description}</p>
                    <p className="text-sm text-slate-600">{bill.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-800">${bill.amount}</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(bill.status)}`}>
                      {bill.status}
                    </span>
                  </div>
                </div>
                {bill.paymentMethod && (
                  <p className="text-sm text-slate-500">Payment Method: {bill.paymentMethod}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="font-semibold text-slate-800">Messages</h2>
        <button
          onClick={() => setShowMessageModal(true)}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Message
        </button>
      </div>
      <div className="p-4">
        <p className="text-slate-500 text-center py-8">No messages yet. Send a message to the clinic.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {patient.name}</h1>
            <p className="text-teal-100">Patient ID: {patient.id}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative px-4 py-2 bg-teal-500 bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Notifications
              {notifications.filter(n => n.patientId === user.id && !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {notifications.filter(n => n.patientId === user.id && !n.read).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 bg-teal-500 bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Change Password
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-4 mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { id: 'appointments', label: 'Appointments', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { id: 'prescriptions', label: 'Prescriptions', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'lab', label: 'Lab Results', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
            { id: 'billing', label: 'Billing', icon: 'M3 10h18M7 15h1m2 0h1m-2 4h1m4-4h1m2 0h1M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { id: 'messages', label: 'Messages', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'appointments' && renderAppointments()}
        {activeTab === 'prescriptions' && renderPrescriptions()}
        {activeTab === 'lab' && renderLabResults()}
        {activeTab === 'billing' && renderBilling()}
        {activeTab === 'messages' && renderMessages()}
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

      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Send Message to Clinic</h3>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm({...messageForm, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea
                  required
                  value={messageForm.content}
                  onChange={(e) => setMessageForm({...messageForm, content: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  rows={5}
                  placeholder="Type your message..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />
      )}

      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Notifications</h3>
              <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {notifications.filter(n => n.patientId === user.id).length === 0 ? (
                <p className="text-slate-500 text-center py-4">No notifications</p>
              ) : (
                notifications.filter(n => n.patientId === user.id).map(notif => (
                  <div 
                    key={notif.id} 
                    className={`p-3 rounded-lg border ${notif.read ? 'bg-slate-50 border-slate-200' : 'bg-blue-50 border-blue-200'}`}
                    onClick={() => markNotificationRead(notif.id)}
                  >
                    <p className="font-medium text-slate-800">{notif.title}</p>
                    <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                    <p className="text-xs text-slate-400 mt-2">{new Date(notif.timestamp).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Medical Records</h3>
              <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="border border-slate-200 rounded-lg p-6 bg-white">
              <div className="text-center border-b border-slate-200 pb-4 mb-4">
                <h1 className="text-xl font-bold text-slate-800">MedConnect EHR</h1>
                <p className="text-sm text-slate-600">Patient Medical Record</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><p className="text-sm text-slate-500">Patient Name</p><p className="font-medium">{patient.name}</p></div>
                <div><p className="text-sm text-slate-500">Patient ID</p><p className="font-medium">{patient.id}</p></div>
                <div><p className="text-sm text-slate-500">Date of Birth</p><p className="font-medium">{patient.dob}</p></div>
                <div><p className="text-sm text-slate-500">Gender</p><p className="font-medium">{patient.gender}</p></div>
                <div><p className="text-sm text-slate-500">Blood Type</p><p className="font-medium">{patient.bloodType}</p></div>
                <div><p className="text-sm text-slate-500">Phone</p><p className="font-medium">{patient.phone}</p></div>
              </div>
              <div className="mb-4">
                <p className="text-sm text-slate-500">Address</p>
                <p className="font-medium">{patient.address}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-slate-500">Allergies</p>
                <p className="font-medium">{patient.allergies.length > 0 ? patient.allergies.join(', ') : 'None'}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-slate-500">Emergency Contact</p>
                <p className="font-medium">{patient.emergencyContact || 'N/A'}</p>
              </div>
              <div className="text-xs text-slate-400 text-center mt-6 pt-4 border-t border-slate-200">
                <p>Generated on {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => window.print()}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Print
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}