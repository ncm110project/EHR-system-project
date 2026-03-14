"use client";

import { useState } from "react";
import { Patient } from "@/lib/ehr-data";

const generateId = () => `P${String(Date.now()).slice(-6)}`;

export default function LandingPage() {
  const [submitted, setSubmitted] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    gender: "Male" as "Male" | "Female",
    phone: "",
    email: "",
    address: "",
    bloodType: "Unknown",
    allergies: "",
    emergencyContact: "",
    emergencyPhone: "",
    chiefComplaint: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newPatientId = generateId();
    setPatientId(newPatientId);
    
    const newPatient: Patient = {
      id: newPatientId,
      name: `${formData.firstName} ${formData.lastName}`,
      age: formData.dob ? new Date().getFullYear() - new Date(formData.dob).getFullYear() : 0,
      gender: formData.gender,
      dob: formData.dob,
      phone: formData.phone,
      address: formData.address,
      bloodType: formData.bloodType,
      allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()) : [],
      status: 'waiting',
      department: 'opd',
      admissionDate: new Date().toISOString().split('T')[0],
      chiefComplaint: formData.chiefComplaint,
      email: formData.email,
      emergencyContact: formData.emergencyContact,
      emergencyPhone: formData.emergencyPhone,
      workflowStatus: 'registered',
      vitalSigns: { bloodPressure: '-', heartRate: 0, temperature: 0, respiratoryRate: 0, oxygenSaturation: 0 }
    };

    const existingPatients = JSON.parse(localStorage.getItem('pendingPatients') || '[]');
    localStorage.setItem('pendingPatients', JSON.stringify([...existingPatients, newPatient]));
    
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Registration Complete!</h2>
          <p className="text-slate-600 mb-6">
            Your registration has been submitted. Please proceed to the reception desk and wait for your number to be called.
          </p>
          <div className="p-4 bg-teal-50 rounded-lg mb-6">
            <p className="text-sm text-teal-700">Your Patient ID:</p>
            <p className="text-2xl font-mono font-bold text-teal-800">{patientId}</p>
            <p className="text-xs text-teal-600 mt-2">Please save this for your records</p>
          </div>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({
                firstName: "",
                lastName: "",
                dob: "",
                gender: "Male",
                phone: "",
                email: "",
                address: "",
                bloodType: "Unknown",
                allergies: "",
                emergencyContact: "",
                emergencyPhone: "",
                chiefComplaint: ""
              });
            }}
            className="btn btn-primary"
          >
            Register Another Patient
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
      <header className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">MedConnect</h1>
            <p className="text-xs text-slate-400">EHR System</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Patient Registration</h1>
            <p className="text-slate-300 text-lg">Please fill out this form to register for your appointment</p>
          </div>

          <form onSubmit={handleSubmit} className="card p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b">Personal Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full"
                    placeholder="Enter last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({...formData, dob: e.target.value})}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value as "Male" | "Female"})}
                    className="w-full"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full"
                    placeholder="Enter email (optional)"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full"
                    placeholder="Enter address"
                  />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b">Medical Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Blood Type</label>
                  <select
                    value={formData.bloodType}
                    onChange={(e) => setFormData({...formData, bloodType: e.target.value})}
                    className="w-full"
                  >
                    <option value="Unknown">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Allergies</label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                    className="w-full"
                    placeholder="List any allergies (comma separated)"
                  />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b">Emergency Contact</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                    className="w-full"
                    placeholder="Emergency contact name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                    className="w-full"
                    placeholder="Emergency contact phone"
                  />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b">Visit Information</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chief Complaint / Reason for Visit *</label>
                <textarea
                  required
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData({...formData, chiefComplaint: e.target.value})}
                  className="w-full h-24"
                  placeholder="Describe your symptoms or reason for visit..."
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full btn btn-primary py-3 text-lg"
            >
              Submit Registration
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
