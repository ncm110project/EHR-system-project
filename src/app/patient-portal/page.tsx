"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Appointment, LabOrder } from "@/lib/ehr-data";

type Tab = "appointments" | "prescriptions" | "lab-results" | "profile";

export default function PatientPortalPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated, isPatient } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("appointments");
  const isClient = typeof window !== 'undefined';

  useEffect(() => {
    if (!isAuthenticated || !isPatient) {
      router.push("/login");
    }
  }, [isAuthenticated, isPatient, router]);

  const storedAppointments: Appointment[] = isClient ? JSON.parse(localStorage.getItem('appointments') || '[]') : [];

  if (!isClient) {
    return null;
  }
  const patientId = user && 'id' in user ? (user as any).id : '';
  const patientName = user && 'name' in user ? (user as any).name : '';
  const appointments = storedAppointments.filter((a: Appointment) => 
    a.patientId === patientId || a.patientName === patientName
  );
  const upcomingAppointments = appointments
    .filter((a: Appointment) => a.status === 'scheduled' && a.date >= new Date().toISOString().split('T')[0])
    .sort((a: Appointment, b: Appointment) => a.date.localeCompare(b.date));
  const pastAppointments = appointments
    .filter((a: Appointment) => a.status === 'completed' || a.date < new Date().toISOString().split('T')[0])
    .sort((a: Appointment, b: Appointment) => b.date.localeCompare(a.date));

  const patient = user as any;
  const prescriptions = patient?.prescriptions || [];
  const labOrders = patient?.labOrders || [];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-teal-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold">MedConnect Patient Portal</h1>
              <p className="text-xs text-teal-200">Welcome, {patient?.name || 'Patient'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 bg-white text-teal-700 font-medium rounded-lg hover:bg-teal-50 transition-colors text-sm">
            Sign Out
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <div className="card p-4">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("appointments")}
                  className={`w-full p-3 text-left rounded-lg flex items-center gap-3 ${
                    activeTab === "appointments" ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span className="font-medium">Appointments</span>
                </button>
                <button
                  onClick={() => setActiveTab("prescriptions")}
                  className={`w-full p-3 text-left rounded-lg flex items-center gap-3 ${
                    activeTab === "prescriptions" ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"></path>
                  </svg>
                  <span className="font-medium">Medications</span>
                </button>
                <button
                  onClick={() => setActiveTab("lab-results")}
                  className={`w-full p-3 text-left rounded-lg flex items-center gap-3 ${
                    activeTab === "lab-results" ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <line x1="10" y1="9" x2="8" y2="9"></line>
                  </svg>
                  <span className="font-medium">Lab Results</span>
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full p-3 text-left rounded-lg flex items-center gap-3 ${
                    activeTab === "profile" ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span className="font-medium">My Profile</span>
                </button>
              </nav>
            </div>
          </div>

          <div className="md:col-span-3">
            {activeTab === "appointments" && (
              <div className="space-y-4">
                <div className="card p-6">
                  <h2 className="text-xl font-bold mb-4">Upcoming Appointments</h2>
                  {upcomingAppointments.length === 0 ? (
                    <p className="text-slate-500">No upcoming appointments.</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingAppointments.map(apt => (
                        <div key={apt.id} className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{apt.department.toUpperCase()}</p>
                              <p className="text-sm text-slate-600">
                                {new Date(apt.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {apt.time}
                              </p>
                              {apt.notes && <p className="text-sm text-slate-500 mt-1">{apt.notes}</p>}
                            </div>
                            <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                              {apt.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card p-6">
                  <h2 className="text-xl font-bold mb-4">Past Appointments</h2>
                  {pastAppointments.length === 0 ? (
                    <p className="text-slate-500">No past appointments.</p>
                  ) : (
                    <div className="space-y-3">
                      {pastAppointments.slice(0, 5).map(apt => (
                        <div key={apt.id} className="p-4 bg-slate-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{apt.department.toUpperCase()}</p>
                              <p className="text-sm text-slate-600">
                                {new Date(apt.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at {apt.time}
                              </p>
                            </div>
                            <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-xs font-medium">
                              {apt.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "prescriptions" && (
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">My Medications</h2>
                {prescriptions.length === 0 ? (
                  <p className="text-slate-500">No prescriptions found.</p>
                ) : (
                  <div className="space-y-4">
                    {prescriptions.map((rx: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-lg">{rx.medication}</p>
                            <p className="text-sm text-slate-600">Dosage: {rx.dosage}</p>
                          </div>
                          {rx.status === 'dispensed' ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Dispensed</span>
                          ) : rx.status === 'pending' ? (
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Pending</span>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-slate-500">Frequency:</span> {rx.frequency}</div>
                          <div><span className="text-slate-500">Duration:</span> {rx.duration}</div>
                          {rx.instructions && <div className="col-span-2"><span className="text-slate-500">Instructions:</span> {rx.instructions}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "lab-results" && (
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">Lab Results</h2>
                {labOrders.length === 0 ? (
                  <p className="text-slate-500">No lab tests found.</p>
                ) : (
                  <div className="space-y-4">
                    {labOrders.map((lab: LabOrder, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-lg">{lab.testName}</p>
                            <p className="text-sm text-slate-600">Ordered: {new Date(lab.date).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            lab.status === 'completed' ? 'bg-green-100 text-green-700' :
                            lab.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {lab.status}
                          </span>
                        </div>
                        {lab.results && (
                          <div className="mt-3 p-3 bg-white rounded border">
                            <p className="text-sm font-medium mb-1">Results:</p>
                            <p className="text-sm whitespace-pre-wrap">{lab.results}</p>
                            {lab.verifiedAt && (
                              <p className="text-xs text-slate-500 mt-2">Verified: {new Date(lab.verifiedAt).toLocaleDateString()}</p>
                            )}
                          </div>
                        )}
                        {lab.attachments && lab.attachments.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-2">Attached Files:</p>
                            <div className="flex flex-wrap gap-2">
                              {lab.attachments.map((url: string, fileIdx: number) => (
                                <a
                                  key={fileIdx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-3 py-2 bg-white border border-green-200 rounded text-sm text-green-700 hover:bg-green-50"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                                  </svg>
                                  View File {fileIdx + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "profile" && (
              <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">My Profile</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Patient ID</p>
                    <p className="font-semibold">{patient.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Full Name</p>
                    <p className="font-semibold">{patient.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Date of Birth</p>
                    <p className="font-semibold">{patient.dob || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Gender</p>
                    <p className="font-semibold">{patient.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Phone</p>
                    <p className="font-semibold">{patient.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-semibold">{patient.email || '-'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-slate-500">Address</p>
                    <p className="font-semibold">{patient.address || '-'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-slate-500">Emergency Contact</p>
                    <p className="font-semibold">{patient.emergencyContact || '-'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}