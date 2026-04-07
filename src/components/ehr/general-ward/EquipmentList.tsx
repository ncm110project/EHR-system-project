"use client";

import { Equipment } from "@/lib/ehr-data";

interface EquipmentListProps {
  equipment: Equipment[];
}

export function EquipmentList({ equipment }: EquipmentListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700';
      case 'in-use': return 'bg-amber-100 text-amber-700';
      case 'maintenance': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'monitor': return '🖥️';
      case 'pump': return '💉';
      case 'ventilator': return '🌬️';
      default: return '📦';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <h3 className="font-medium text-slate-700">Equipment Inventory ({equipment.length})</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {equipment.map(item => (
          <div key={item.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getTypeIcon(item.type)}</span>
                <div>
                  <p className="font-medium text-slate-800">{item.name}</p>
                  <p className="text-sm text-slate-500 capitalize">{item.type}</p>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                {item.status === 'in-use' ? 'In Use' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}