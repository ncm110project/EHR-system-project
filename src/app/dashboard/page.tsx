"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useEHR } from "@/lib/ehr-context";
import { Sidebar } from "@/components/ehr/Sidebar";
import { Header } from "@/components/ehr/Header";
import { OutpatientDepartment } from "@/components/ehr/OutpatientDepartment";
import { EmergencyRoom } from "@/components/ehr/EmergencyRoom";
import { Pharmacy } from "@/components/ehr/Pharmacy";
import { Laboratory } from "@/components/ehr/Laboratory";
import { Imaging } from "@/components/ehr/Imaging";
import { NursingAdmin } from "@/components/ehr/NursingAdmin";
import { PatientDashboard } from "@/components/ehr/PatientDashboard";
import { GeneralWard } from "@/components/ehr/GeneralWard";
import { TriageDepartment } from "@/components/ehr/TriageDepartment";

export default function Dashboard() {
  const { isAuthenticated, user, isPatient } = useAuth();
  const { setCurrentDepartment } = useEHR();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (user && !isPatient && 'department' in user) {
      setCurrentDepartment(user.department);
    }
  }, [user, isPatient, setCurrentDepartment]);

  if (!isAuthenticated || !user) {
    return null;
  }

  if (isPatient) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PatientDashboard />
      </div>
    );
  }

  const renderDepartment = () => {
    const userDept = 'department' in user ? user.department : 'opd';
    switch (userDept) {
      case 'opd':
        return <OutpatientDepartment />;
      case 'er':
        return <EmergencyRoom />;
      case 'pharmacy':
        return <Pharmacy />;
      case 'lab':
        return <Laboratory />;
      case 'imaging':
        return <Imaging />;
      case 'nursing':
        return <NursingAdmin />;
      case 'triage':
        return <TriageDepartment />;
      case 'general-ward':
        return <GeneralWard />;
      default:
        return <OutpatientDepartment />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {renderDepartment()}
        </main>
      </div>
    </div>
  );
}
