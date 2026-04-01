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
import { NursingAdmin } from "@/components/ehr/NursingAdmin";
import { RegistrationClerk } from "@/components/ehr/RegistrationClerk";

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const { setCurrentDepartment } = useEHR();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user) {
      setCurrentDepartment(user.department);
    }
  }, [isAuthenticated, user, router, setCurrentDepartment]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const renderDepartment = () => {
    switch (user.department) {
      case 'registration':
        return <RegistrationClerk />;
      case 'opd':
        return <OutpatientDepartment />;
      case 'er':
        return <EmergencyRoom />;
      case 'pharmacy':
        return <Pharmacy />;
      case 'lab':
        return <Laboratory />;
      case 'nursing':
        return <NursingAdmin />;
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
