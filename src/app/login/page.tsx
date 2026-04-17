"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

type LoginTab = "employee" | "patient";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isAuthenticated, loginAsPatient } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<LoginTab>("employee");

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      const success = login(username, password);
      if (success) {
        router.push("/dashboard");
      } else {
        setError("Invalid username or password");
      }
      setLoading(false);
    }, 500);
  };

  const handleQuickLogin = (userUsername: string, userPassword: string) => {
    setUsername(userUsername);
    setPassword(userPassword);
    setError("");
    setLoading(true);

    setTimeout(() => {
      const success = login(userUsername, userPassword);
      if (success) {
        router.push("/dashboard");
      } else {
        setError("Login failed");
      }
      setLoading(false);
    }, 300);
  };

   const handlePatientLogin = (e: React.FormEvent) => {
     e.preventDefault();
     setError("");
     setLoading(true);

     setTimeout(() => {
       const success = loginAsPatient(username, password);
       if (success) {
         router.push("/patient-portal");
       } else {
         setError("Invalid credentials. Make sure you have a patient account created by the hospital.");
       }
       setLoading(false);
     }, 500);
   };

   const handleEmployeeTabClick = useCallback(() => {
     setActiveTab("employee");
   }, []);

   const handlePatientTabClick = useCallback(() => {
     setActiveTab("patient");
   }, []);

   if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <Link href="/" className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
          ← Patient Registration
        </Link>
      </div>
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-2xl mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">MedConnect EHR</h1>
          <p className="text-slate-400 mt-2">Electronic Health Record System</p>
        </div>

        <div className="flex mb-6">
          <button
            onClick={handleEmployeeTabClick}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "employee" 
                ? "bg-teal-600 text-white" 
                : "bg-white/10 text-slate-300 hover:bg-white/20"
            }`}
          >
            Employee Portal
          </button>
          <button
            onClick={handlePatientTabClick}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "patient" 
                ? "bg-teal-600 text-white" 
                : "bg-white/10 text-slate-300 hover:bg-white/20"
            }`}
          >
            Patient Portal
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="card p-8">
            {activeTab === "employee" ? (
              <>
                <h2 className="text-xl font-semibold mb-6">Employee Sign In</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full"
                      placeholder="Enter username"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full"
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn btn-primary py-3 disabled:opacity-50"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-6">Patient Portal</h2>
                <p className="text-sm text-slate-500 mb-4">Sign in with the account credentials provided by the hospital after your visit.</p>
                <form onSubmit={handlePatientLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full"
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn btn-primary py-3 disabled:opacity-50"
                  >
                    {loading ? "Signing in..." : "Sign In to Patient Portal"}
                  </button>
                </form>
              </>
            )}
          </div>

          {activeTab === "employee" && (
          <div className="space-y-4">
            <div className="card p-6">
              <h3 className="font-semibold mb-4 text-slate-700">Quick Login - Demo Accounts</h3>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-800">OPD - Nurse</p>
                  <p className="text-sm text-blue-600">Username: nurse_opd | Password: nurse123</p>
                  <button
                    onClick={() => handleQuickLogin("nurse_opd", "nurse123")}
                    className="mt-2 text-xs text-blue-700 underline"
                  >
                    Quick Login
                  </button>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-800">OPD - Doctor</p>
                  <p className="text-sm text-blue-600">Username: doctor_opd | Password: doctor123</p>
                  <button
                    onClick={() => handleQuickLogin("doctor_opd", "doctor123")}
                    className="mt-2 text-xs text-blue-700 underline"
                  >
                    Quick Login
                  </button>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="font-medium text-red-800">ER - Charge Nurse</p>
                  <p className="text-sm text-red-600">Username: charge_nurse_er | Password: charge123</p>
                  <button
                    onClick={() => handleQuickLogin("charge_nurse_er", "charge123")}
                    className="mt-2 text-xs text-red-700 underline"
                  >
                    Quick Login
                  </button>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="font-medium text-red-800">ER - Nurse</p>
                  <p className="text-sm text-red-600">Username: nurse_er | Password: nurse123</p>
                  <button
                    onClick={() => handleQuickLogin("nurse_er", "nurse123")}
                    className="mt-2 text-xs text-red-700 underline"
                  >
                    Quick Login
                  </button>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="font-medium text-red-800">ER - Doctor</p>
                  <p className="text-sm text-red-600">Username: doctor_er | Password: doctor123</p>
                  <button
                    onClick={() => handleQuickLogin("doctor_er", "doctor123")}
                    className="mt-2 text-xs text-red-700 underline"
                  >
                    Quick Login
                  </button>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="font-medium text-red-800">ER - Doctor 2</p>
                  <p className="text-sm text-red-600">Username: doctor_er2 | Password: doctor123</p>
                  <button
                    onClick={() => handleQuickLogin("doctor_er2", "doctor123")}
                    className="mt-2 text-xs text-red-700 underline"
                  >
                    Quick Login
                  </button>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="font-medium text-purple-800">Pharmacy</p>
                  <p className="text-sm text-purple-600">Username: pharmacy | Password: pharmacy123</p>
                  <button
                    onClick={() => handleQuickLogin("pharmacy", "pharmacy123")}
                    className="mt-2 text-xs text-purple-700 underline"
                  >
                    Quick Login
                  </button>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="font-medium text-green-800">Nursing Admin</p>
                  <p className="text-sm text-green-600">Username: nursing_admin | Password: admin123</p>
                  <button
                    onClick={() => handleQuickLogin("nursing_admin", "admin123")}
                    className="mt-2 text-xs text-green-700 underline"
                  >
                    Quick Login
                  </button>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="font-medium text-amber-800">Laboratory</p>
                  <p className="text-sm text-amber-600">Username: lab | Password: lab123</p>
                  <button
                    onClick={() => handleQuickLogin("lab", "lab123")}
                    className="mt-2 text-xs text-amber-700 underline"
                  >
                    Quick Login
                  </button>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="font-medium text-amber-800">Triage - Nurse</p>
                  <p className="text-sm text-amber-600">Username: nurse_triage | Password: triage123</p>
                  <button
                    onClick={() => handleQuickLogin("nurse_triage", "triage123")}
                    className="mt-2 text-xs text-amber-700 underline"
                  >
                    Quick Login
                  </button>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <p className="font-medium text-indigo-800">General Ward - Staff Nurse 1</p>
                  <p className="text-sm text-indigo-600">Username: staff_nurse_1 | Password: staff123</p>
                  <button
                    onClick={() => handleQuickLogin("staff_nurse_1", "staff123")}
                    className="mt-2 text-xs text-indigo-700 underline"
                  >
                    Quick Login
                  </button>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <p className="font-medium text-indigo-800">General Ward - Doctor</p>
                  <p className="text-sm text-indigo-600">Username: doctor_ward | Password: doctor123</p>
                  <button
                    onClick={() => handleQuickLogin("doctor_ward", "doctor123")}
                    className="mt-2 text-xs text-indigo-700 underline"
                  >
                    Quick Login
                  </button>
                </div>
                <div className="p-3 bg-violet-50 rounded-lg">
                  <p className="font-medium text-violet-800">General Ward - Charge Nurse</p>
                  <p className="text-sm text-violet-600">Username: charge_nurse | Password: charge123</p>
                  <button
                    onClick={() => handleQuickLogin("charge_nurse", "charge123")}
                    className="mt-2 text-xs text-violet-700 underline"
                  >
                    Quick Login
                  </button>
                </div>
                <div className="p-3 bg-violet-50 rounded-lg">
                  <p className="font-medium text-violet-800">General Ward - Staff Nurse 2</p>
                  <p className="text-sm text-violet-600">Username: staff_nurse_2 | Password: staff123</p>
                  <button
                    onClick={() => handleQuickLogin("staff_nurse_2", "staff123")}
                    className="mt-2 text-xs text-violet-700 underline"
                  >
                    Quick Login
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
