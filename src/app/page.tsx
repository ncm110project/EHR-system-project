"use client";

import { useState } from "react";
import Link from "next/link";
import { Patient } from "@/lib/ehr-data";

const generateId = () => `P${String(Date.now()).slice(-6)}`;

export default function LandingPage() {
  const [submitted, setSubmitted] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [showConditionsOther, setShowConditionsOther] = useState(false);
  const [showAllergiesOther, setShowAllergiesOther] = useState(false);
  const [showReligionOther, setShowReligionOther] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    patientName: "",
    contactInfo: "",
    feedbackType: "complaint" as "complaint" | "suggestion" | "compliment",
    department: "er" as "er" | "opd" | "general-ward" | "icu" | "others",
    serviceArea: "nursing" as "nursing" | "doctor" | "waiting-time" | "facilities" | "cleanliness" | "staff-attitude" | "billing" | "others",
    rating: 3 as 1 | 2 | 3 | 4 | 5,
    visitType: "" as "er" | "opd" | "admission" | "",
    message: ""
  });
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    dob: "",
    sex: "Male" as "Male" | "Female",
    civilStatus: "Single",
    religion: "",
    religionOther: "",
    phone: "",
    email: "",
    streetAddress: "",
    city: "",
    province: "",
    emergencyName: "",
    emergencyRelationship: "",
    emergencyPhone: "",
    hypertension: false,
    diabetes: false,
    asthma: false,
    heartDisease: false,
    kidneyDisease: false,
    stroke: false,
    cancer: false,
    tuberculosis: false,
    arthritis: false,
    thyroidDisorder: false,
    epilepsy: false,
    chronicLungDisease: false,
    conditionsOther: "",
    allergyPeanuts: false,
    allergyTreeNuts: false,
    allergyShellfish: false,
    allergyFish: false,
    allergyEggs: false,
    allergyDairy: false,
    allergySoy: false,
    allergyGluten: false,
    allergyPollen: false,
    allergyLatex: false,
    allergyDustMites: false,
    allergiesOther: "",
    currentMedications: "",
    pastSurgeries: "",
    smoking: "No" as "No" | "Yes" | "Former",
    alcoholUse: "No" as "No" | "Yes",
    occupation: "",
    insuranceProvider: "",
    policyNumber: "",
    memberId: "",
    selfPay: true,
    consent: false,
    signatureName: "",
    signatureDate: ""
  });

  const autoFillForm = () => {
    setFormData({
      firstName: "Test",
      middleName: "M",
      lastName: "Patient",
      dob: "1990-05-15",
      sex: "Male",
      civilStatus: "Single",
      religion: "Roman Catholic",
      religionOther: "",
      phone: "555-9999",
      email: "testpatient@email.com",
      streetAddress: "123 Test Street",
      city: "Test City",
      province: "Test Province",
      emergencyName: "Emergency Contact",
      emergencyRelationship: "Spouse",
      emergencyPhone: "555-8888",
      hypertension: false,
      diabetes: false,
      asthma: true,
      heartDisease: false,
      kidneyDisease: false,
      stroke: false,
      cancer: false,
      tuberculosis: false,
      arthritis: false,
      thyroidDisorder: false,
      epilepsy: false,
      chronicLungDisease: false,
      conditionsOther: "",
      allergyPeanuts: false,
      allergyTreeNuts: false,
      allergyShellfish: false,
      allergyFish: false,
      allergyEggs: true,
      allergyDairy: false,
      allergySoy: false,
      allergyGluten: false,
      allergyPollen: false,
      allergyLatex: false,
      allergyDustMites: false,
      allergiesOther: "",
      currentMedications: "None",
      pastSurgeries: "Appendectomy (2015)",
      smoking: "No",
      alcoholUse: "No",
      occupation: "Software Engineer",
      insuranceProvider: "Health Plus",
      policyNumber: "HP123456",
      memberId: "MEM987654",
      selfPay: false,
      consent: true,
      signatureName: "Test Patient",
      signatureDate: new Date().toISOString().split('T')[0]
    });
  };

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    if (birthDate > today) return 0;
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newPatientId = generateId();
    setPatientId(newPatientId);
    
    const age = calculateAge(formData.dob);
    
    const medicalConditions: string[] = [];
    if (formData.hypertension) medicalConditions.push("Hypertension");
    if (formData.diabetes) medicalConditions.push("Diabetes");
    if (formData.asthma) medicalConditions.push("Asthma");
    if (formData.heartDisease) medicalConditions.push("Heart Disease");
    if (formData.kidneyDisease) medicalConditions.push("Kidney Disease");
    if (formData.stroke) medicalConditions.push("Stroke");
    if (formData.cancer) medicalConditions.push("Cancer");
    if (formData.tuberculosis) medicalConditions.push("Tuberculosis");
    if (formData.arthritis) medicalConditions.push("Arthritis");
    if (formData.thyroidDisorder) medicalConditions.push("Thyroid Disorder");
    if (formData.epilepsy) medicalConditions.push("Epilepsy / Seizure Disorder");
    if (formData.chronicLungDisease) medicalConditions.push("Chronic Lung Disease (COPD)");
    if (formData.conditionsOther) medicalConditions.push(formData.conditionsOther);

    const allergiesList: string[] = [];
    if (formData.allergyPeanuts) allergiesList.push("Peanuts");
    if (formData.allergyTreeNuts) allergiesList.push("Tree Nuts");
    if (formData.allergyShellfish) allergiesList.push("Shellfish");
    if (formData.allergyFish) allergiesList.push("Fish");
    if (formData.allergyEggs) allergiesList.push("Eggs");
    if (formData.allergyDairy) allergiesList.push("Dairy");
    if (formData.allergySoy) allergiesList.push("Soy");
    if (formData.allergyGluten) allergiesList.push("Gluten");
    if (formData.allergyPollen) allergiesList.push("Pollen");
    if (formData.allergyLatex) allergiesList.push("Latex");
    if (formData.allergyDustMites) allergiesList.push("Dust Mites");
    if (formData.allergiesOther) allergiesList.push(formData.allergiesOther);

    const religionValue = formData.religion === "Others" ? formData.religionOther : formData.religion;

    const newPatient: Patient = {
      id: newPatientId,
      name: `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim(),
      age: age,
      gender: formData.sex,
      dob: formData.dob,
      phone: formData.phone,
      address: `${formData.streetAddress}, ${formData.city}, ${formData.province}`.trim(),
      bloodType: 'Unknown',
      allergies: allergiesList,
      status: 'waiting',
      department: 'opd',
      registrationStatus: 'pending',
      admissionDate: new Date().toISOString().split('T')[0],
      email: formData.email,
      emergencyContact: `${formData.emergencyName} (${formData.emergencyRelationship}) - ${formData.emergencyPhone}`,
      emergencyPhone: formData.emergencyPhone,
      workflowStatus: 'registered',
      religion: religionValue,
      registrationSource: 'OPD',
      vitalSigns: { bloodPressure: '-', heartRate: 0, temperature: 0, respiratoryRate: 0, oxygenSaturation: 0, recordedAt: new Date().toISOString() },
      notes: `Religion: ${religionValue || 'Not specified'}. Medical Conditions: ${medicalConditions.join(', ') || 'None'}. Allergies: ${allergiesList.join(', ') || 'None'}. Current Medications: ${formData.currentMedications || 'None'}. Past Surgeries: ${formData.pastSurgeries || 'None'}. Smoking: ${formData.smoking}. Alcohol: ${formData.alcoholUse}. Occupation: ${formData.occupation}. Insurance: ${formData.selfPay ? 'Self Pay' : `${formData.insuranceProvider} (Policy: ${formData.policyNumber}, Member ID: ${formData.memberId})`}`
    };

    const existingPatients = JSON.parse(localStorage.getItem('pendingPatients') || '[]');
    localStorage.setItem('pendingPatients', JSON.stringify([...existingPatients, newPatient]));
    
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
        <div className="card p-8 max-w-lg text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Registration Successful!</h2>
          <p className="text-slate-600 mb-6">
            Your registration has been submitted. Please proceed to the reception desk and wait for your number to be called.
          </p>
          <div className="p-4 bg-teal-50 rounded-lg mb-6">
            <p className="text-sm text-teal-700">Your Patient ID:</p>
            <p className="text-3xl font-mono font-bold text-teal-800">{patientId}</p>
            <p className="text-xs text-teal-600 mt-2">Please save this ID for your records</p>
          </div>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({
                firstName: "",
                middleName: "",
                lastName: "",
                dob: "",
                sex: "Male",
                civilStatus: "Single",
                religion: "",
                religionOther: "",
                phone: "",
                email: "",
                streetAddress: "",
                city: "",
                province: "",
                emergencyName: "",
                emergencyRelationship: "",
                emergencyPhone: "",
                hypertension: false,
                diabetes: false,
                asthma: false,
                heartDisease: false,
                kidneyDisease: false,
                stroke: false,
                cancer: false,
                tuberculosis: false,
                arthritis: false,
                thyroidDisorder: false,
                epilepsy: false,
                chronicLungDisease: false,
                conditionsOther: "",
                allergyPeanuts: false,
                allergyTreeNuts: false,
                allergyShellfish: false,
                allergyFish: false,
                allergyEggs: false,
                allergyDairy: false,
                allergySoy: false,
                allergyGluten: false,
                allergyPollen: false,
                allergyLatex: false,
                allergyDustMites: false,
                allergiesOther: "",
                currentMedications: "",
                pastSurgeries: "",
                smoking: "No",
                alcoholUse: "No",
                occupation: "",
                insuranceProvider: "",
                policyNumber: "",
                memberId: "",
                selfPay: true,
                consent: false,
                signatureName: "",
                signatureDate: ""
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

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";
  const sectionClass = "bg-white rounded-lg p-6 mb-6";
  const sectionTitleClass = "text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200";

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const existingFeedback = JSON.parse(localStorage.getItem('patientFeedback') || '[]');
    localStorage.setItem('patientFeedback', JSON.stringify([...existingFeedback, { 
      ...feedbackForm, 
      id: generateId(),
      dateSubmitted: new Date().toISOString() 
    }]));
    setShowFeedbackModal(false);
    setFeedbackForm({ patientName: "", contactInfo: "", feedbackType: "complaint", department: "er", serviceArea: "nursing", rating: 3, visitType: "", message: "" });
    alert("Thank you! Your feedback has been submitted.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
      <header className="p-4">
        <div className="flex items-center justify-between">
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
          <div className="flex gap-2">
            <button 
              onClick={() => setShowFeedbackModal(true)}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
            >
              Submit Feedback
            </button>
            <Link href="/login" className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
              Employee Login
            </Link>
          </div>
        </div>
      </header>

      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Patient Feedback</h3>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your Name (Optional)</label>
                <input type="text" value={feedbackForm.patientName} onChange={(e) => setFeedbackForm({...feedbackForm, patientName: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Anonymous" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Info (Optional)</label>
                <input type="text" value={feedbackForm.contactInfo} onChange={(e) => setFeedbackForm({...feedbackForm, contactInfo: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="Phone or email" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Feedback Type</label>
                <select value={feedbackForm.feedbackType} onChange={(e) => setFeedbackForm({...feedbackForm, feedbackType: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="complaint">Complaint</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="compliment">Compliment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <select value={feedbackForm.department} onChange={(e) => setFeedbackForm({...feedbackForm, department: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="er">Emergency Room (ER)</option>
                  <option value="opd">Outpatient Department (OPD)</option>
                  <option value="general-ward">General Ward</option>
                  <option value="icu">ICU</option>
                  <option value="others">Others</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Service Area</label>
                <select value={feedbackForm.serviceArea} onChange={(e) => setFeedbackForm({...feedbackForm, serviceArea: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="nursing">Nursing Care</option>
                  <option value="doctor">Doctor Service</option>
                  <option value="waiting-time">Waiting Time</option>
                  <option value="facilities">Facilities</option>
                  <option value="cleanliness">Cleanliness</option>
                  <option value="staff-attitude">Staff Attitude</option>
                  <option value="billing">Billing</option>
                  <option value="others">Others</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rating * (Required)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackForm({...feedbackForm, rating: star as 1|2|3|4|5})}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        star <= feedbackForm.rating 
                          ? star <= 2 ? 'bg-red-500 text-white' : star <= 3 ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {star} {star === 1 ? 'Poor' : star === 2 ? 'Poor' : star === 3 ? 'Fair' : star === 4 ? 'Good' : 'Excellent'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Visit Type (Optional)</label>
                <select value={feedbackForm.visitType} onChange={(e) => setFeedbackForm({...feedbackForm, visitType: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select visit type...</option>
                  <option value="er">ER Visit</option>
                  <option value="opd">OPD Visit</option>
                  <option value="admission">Admission (Ward)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message (Optional)</label>
                <textarea value={feedbackForm.message} onChange={(e) => setFeedbackForm({...feedbackForm, message: e.target.value})} className="w-full h-24 px-3 py-2 border rounded-lg" placeholder="Additional details..." />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowFeedbackModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Patient Registration</h1>
            <p className="text-slate-300">Please fill out this form accurately and completely</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-teal-600/20 backdrop-blur rounded-xl p-4 border border-teal-500/30">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-1 4h1m1-4v4" /></svg>
                <h3 className="font-semibold text-teal-300">Outpatient (OPD)</h3>
              </div>
              <p className="text-sm text-slate-300">Regular consultations and follow-up appointments</p>
            </div>
            <div className="bg-red-600/20 backdrop-blur rounded-xl p-4 border border-red-500/30">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <h3 className="font-semibold text-red-300">Emergency (ER)</h3>
              </div>
              <p className="text-sm text-slate-300">24/7 emergency and urgent care services</p>
            </div>
            <div className="bg-blue-600/20 backdrop-blur rounded-xl p-4 border border-blue-500/30">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                <h3 className="font-semibold text-blue-300">General Ward</h3>
              </div>
              <p className="text-sm text-slate-300">Inpatient care and hospitalization</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECTION 1 - PERSONAL INFORMATION */}
            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>PERSONAL INFORMATION</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>First Name *</label>
                  <input type="text" required value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className={inputClass} placeholder="First Name" />
                </div>
                <div>
                  <label className={labelClass}>Middle Name</label>
                  <input type="text" value={formData.middleName} onChange={(e) => setFormData({...formData, middleName: e.target.value})} className={inputClass} placeholder="Middle Name" />
                </div>
                <div>
                  <label className={labelClass}>Last Name *</label>
                  <input type="text" required value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className={inputClass} placeholder="Last Name" />
                </div>
                <div>
                  <label className={labelClass}>Date of Birth *</label>
                  <input type="date" required value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Age</label>
                  <input type="text" value={calculateAge(formData.dob) || ''} className={`${inputClass} bg-slate-100`} placeholder="Auto-calculated" disabled />
                </div>
                <div>
                  <label className={labelClass}>Sex *</label>
                  <select required value={formData.sex} onChange={(e) => setFormData({...formData, sex: e.target.value as "Male" | "Female"})} className={inputClass}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Civil Status</label>
                  <select value={formData.civilStatus} onChange={(e) => setFormData({...formData, civilStatus: e.target.value})} className={inputClass}>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Religion</label>
                  <select value={formData.religion} onChange={(e) => {
                    const value = e.target.value;
                    setFormData({...formData, religion: value, religionOther: value !== "Others" ? "" : formData.religionOther});
                    setShowReligionOther(value === "Others");
                  }} className={inputClass}>
                    <option value="">Select Religion</option>
                    <option value="Roman Catholic">Roman Catholic</option>
                    <option value="Christian (Protestant / Born Again)">Christian (Protestant / Born Again)</option>
                    <option value="Iglesia ni Cristo">Iglesia ni Cristo</option>
                    <option value="Islam">Islam</option>
                    <option value="Seventh-day Adventist">Seventh-day Adventist</option>
                    <option value="Jehovah's Witness">Jehovah&apos;s Witness</option>
                    <option value="Baptist">Baptist</option>
                    <option value="Methodist">Methodist</option>
                    <option value="Pentecostal">Pentecostal</option>
                    <option value="Latter-day Saints (Mormon)">Latter-day Saints (Mormon)</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                {showReligionOther && (
                  <div className="md:col-span-3">
                    <label className={labelClass}>Please specify your religion</label>
                    <input type="text" value={formData.religionOther} onChange={(e) => setFormData({...formData, religionOther: e.target.value})} className={inputClass} placeholder="Enter your religion" />
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2 - CONTACT INFORMATION */}
            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>CONTACT INFORMATION</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Phone Number *</label>
                  <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className={inputClass} placeholder="Phone Number" />
                </div>
                <div>
                  <label className={labelClass}>Email Address</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={inputClass} placeholder="Email Address" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Street Address</label>
                  <input type="text" value={formData.streetAddress} onChange={(e) => setFormData({...formData, streetAddress: e.target.value})} className={inputClass} placeholder="Street Address" />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className={inputClass} placeholder="City" />
                </div>
                <div>
                  <label className={labelClass}>Province / State</label>
                  <input type="text" value={formData.province} onChange={(e) => setFormData({...formData, province: e.target.value})} className={inputClass} placeholder="Province / State" />
                </div>
              </div>
            </div>

            {/* SECTION 3 - EMERGENCY CONTACT */}
            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>EMERGENCY CONTACT</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Emergency Contact Name *</label>
                  <input type="text" required value={formData.emergencyName} onChange={(e) => setFormData({...formData, emergencyName: e.target.value})} className={inputClass} placeholder="Contact Name" />
                </div>
                <div>
                  <label className={labelClass}>Relationship to Patient</label>
                  <input type="text" value={formData.emergencyRelationship} onChange={(e) => setFormData({...formData, emergencyRelationship: e.target.value})} className={inputClass} placeholder="e.g., Spouse, Parent, Sibling" />
                </div>
                <div>
                  <label className={labelClass}>Emergency Contact Phone *</label>
                  <input type="tel" required value={formData.emergencyPhone} onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})} className={inputClass} placeholder="Phone Number" />
                </div>
              </div>
            </div>

            {/* SECTION 4 - MEDICAL BACKGROUND */}
            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>MEDICAL BACKGROUND</h2>
              <div className="mb-4">
                <label className={labelClass}>Do you have any of the following conditions?</label>
                <div className="grid md:grid-cols-3 gap-3 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.hypertension} onChange={(e) => setFormData({...formData, hypertension: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Hypertension</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.diabetes} onChange={(e) => setFormData({...formData, diabetes: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Diabetes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.asthma} onChange={(e) => setFormData({...formData, asthma: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Asthma</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.heartDisease} onChange={(e) => setFormData({...formData, heartDisease: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Heart Disease</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.kidneyDisease} onChange={(e) => setFormData({...formData, kidneyDisease: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Kidney Disease</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.stroke} onChange={(e) => setFormData({...formData, stroke: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Stroke</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.cancer} onChange={(e) => setFormData({...formData, cancer: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Cancer</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.tuberculosis} onChange={(e) => setFormData({...formData, tuberculosis: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Tuberculosis</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.arthritis} onChange={(e) => setFormData({...formData, arthritis: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Arthritis</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.thyroidDisorder} onChange={(e) => setFormData({...formData, thyroidDisorder: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Thyroid Disorder</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.epilepsy} onChange={(e) => setFormData({...formData, epilepsy: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Epilepsy / Seizure Disorder</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.chronicLungDisease} onChange={(e) => setFormData({...formData, chronicLungDisease: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Chronic Lung Disease (COPD)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={showConditionsOther} onChange={(e) => setShowConditionsOther(e.target.checked)} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm font-medium">Others</span>
                  </label>
                </div>
                {showConditionsOther && (
                  <div className="mt-2 ml-6">
                    <input type="text" value={formData.conditionsOther} onChange={(e) => setFormData({...formData, conditionsOther: e.target.value})} className={inputClass} placeholder="Please specify other conditions" />
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className={labelClass}>Do you have any allergies?</label>
                <div className="grid md:grid-cols-4 gap-3 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.allergyPeanuts} onChange={(e) => setFormData({...formData, allergyPeanuts: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Peanuts</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.allergyTreeNuts} onChange={(e) => setFormData({...formData, allergyTreeNuts: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Tree Nuts</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.allergyShellfish} onChange={(e) => setFormData({...formData, allergyShellfish: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Shellfish</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.allergyFish} onChange={(e) => setFormData({...formData, allergyFish: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Fish</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.allergyEggs} onChange={(e) => setFormData({...formData, allergyEggs: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Eggs</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.allergyDairy} onChange={(e) => setFormData({...formData, allergyDairy: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Dairy</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.allergySoy} onChange={(e) => setFormData({...formData, allergySoy: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Soy</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.allergyGluten} onChange={(e) => setFormData({...formData, allergyGluten: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Gluten</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.allergyPollen} onChange={(e) => setFormData({...formData, allergyPollen: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Pollen</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.allergyLatex} onChange={(e) => setFormData({...formData, allergyLatex: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Latex</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.allergyDustMites} onChange={(e) => setFormData({...formData, allergyDustMites: e.target.checked})} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm">Dust Mites</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={showAllergiesOther} onChange={(e) => setShowAllergiesOther(e.target.checked)} className="w-4 h-4 text-teal-600" />
                    <span className="text-sm font-medium">Others</span>
                  </label>
                </div>
                {showAllergiesOther && (
                  <div className="mt-2">
                    <label className={labelClass}>Please specify other allergies</label>
                    <input type="text" value={formData.allergiesOther} onChange={(e) => setFormData({...formData, allergiesOther: e.target.value})} className={inputClass} placeholder="List any other allergies" />
                  </div>
                )}
              </div>

              <div className="grid gap-4">
                <div>
                  <label className={labelClass}>Current Medications</label>
                  <input type="text" value={formData.currentMedications} onChange={(e) => setFormData({...formData, currentMedications: e.target.value})} className={inputClass} placeholder="List current medications" />
                </div>
                <div>
                  <label className={labelClass}>Past Surgeries (optional)</label>
                  <input type="text" value={formData.pastSurgeries} onChange={(e) => setFormData({...formData, pastSurgeries: e.target.value})} className={inputClass} placeholder="List any past surgeries" />
                </div>
              </div>
            </div>

            {/* SECTION 6 - LIFESTYLE INFORMATION */}
            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>LIFESTYLE INFORMATION</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Smoking</label>
                  <select value={formData.smoking} onChange={(e) => setFormData({...formData, smoking: e.target.value as "No" | "Yes" | "Former"})} className={inputClass}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="Former">Former</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Alcohol Use</label>
                  <select value={formData.alcoholUse} onChange={(e) => setFormData({...formData, alcoholUse: e.target.value as "No" | "Yes"})} className={inputClass}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Occupation</label>
                  <input type="text" value={formData.occupation} onChange={(e) => setFormData({...formData, occupation: e.target.value})} className={inputClass} placeholder="Your occupation" />
                </div>
              </div>
            </div>

            {/* SECTION 7 - INSURANCE INFORMATION */}
            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>INSURANCE INFORMATION</h2>
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.selfPay} onChange={(e) => setFormData({...formData, selfPay: e.target.checked, insuranceProvider: e.target.checked ? '' : formData.insuranceProvider, policyNumber: e.target.checked ? '' : formData.policyNumber, memberId: e.target.checked ? '' : formData.memberId})} className="w-4 h-4 text-teal-600" />
                  <span className="text-sm font-medium">Self Pay</span>
                </label>
              </div>
              {!formData.selfPay && (
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>Insurance Provider</label>
                    <input type="text" value={formData.insuranceProvider} onChange={(e) => setFormData({...formData, insuranceProvider: e.target.value})} className={inputClass} placeholder="Insurance Company" />
                  </div>
                  <div>
                    <label className={labelClass}>Policy Number</label>
                    <input type="text" value={formData.policyNumber} onChange={(e) => setFormData({...formData, policyNumber: e.target.value})} className={inputClass} placeholder="Policy Number" />
                  </div>
                  <div>
                    <label className={labelClass}>Member ID</label>
                    <input type="text" value={formData.memberId} onChange={(e) => setFormData({...formData, memberId: e.target.value})} className={inputClass} placeholder="Member ID" />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 8 - CONSENT */}
            <div className={sectionClass}>
              <h2 className={sectionTitleClass}>CONSENT</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" required checked={formData.consent} onChange={(e) => setFormData({...formData, consent: e.target.checked})} className="w-5 h-5 text-teal-600 mt-0.5" />
                  <span className="text-sm text-slate-700">I confirm that the information I have provided is accurate and complete to the best of my knowledge. I understand that providing false information may affect my medical care.</span>
                </label>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Patient Full Name (Signature) *</label>
                  <input type="text" required value={formData.signatureName} onChange={(e) => setFormData({...formData, signatureName: e.target.value})} className={inputClass} placeholder="Full Name" />
                </div>
                <div>
                  <label className={labelClass}>Date *</label>
                  <input type="date" required value={formData.signatureDate} onChange={(e) => setFormData({...formData, signatureDate: e.target.value})} className={inputClass} />
                </div>
              </div>
            </div>

            <button type="submit" id="submit-btn" className="w-full btn btn-primary py-4 text-lg font-semibold">
              Submit Registration
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
