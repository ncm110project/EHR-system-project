"use client";

import { useEHR } from "@/lib/ehr-context";
import { Sidebar } from "@/components/ehr/Sidebar";
import { Header } from "@/components/ehr/Header";
import { Dashboard } from "@/components/ehr/Dashboard";
import { OutpatientDepartment } from "@/components/ehr/OutpatientDepartment";
import { EmergencyRoom } from "@/components/ehr/EmergencyRoom";
import { Pharmacy } from "@/components/ehr/Pharmacy";
import { Laboratory } from "@/components/ehr/Laboratory";
import { NursingAdmin } from "@/components/ehr/NursingAdmin";

export default function Home() {
  const { currentDepartment } = useEHR();

  const renderDepartment = () => {
    switch (currentDepartment) {
      case 'dashboard':
        return <Dashboard />;
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
        return <Dashboard />;
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
