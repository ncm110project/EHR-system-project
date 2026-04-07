"use client";

import { WardBed } from "@/lib/ehr-data";

interface BedGridProps {
  beds: WardBed[];
}

export function BedGrid({ beds }: BedGridProps) {
  return (
    <div className="grid grid-cols-5 gap-4">
      {beds.map(bed => (
        <div 
          key={bed.id} 
          className={`p-4 rounded-lg border-2 ${
            bed.status === 'occupied' ? 'bg-amber-50 border-amber-300' : 
            bed.status === 'available' ? 'bg-green-50 border-green-300' : 
            bed.status === 'cleaning' ? 'bg-blue-50 border-blue-300' : 
            'bg-gray-50 border-gray-300'
          }`}
        >
          <p className="font-semibold text-slate-800">Room {bed.roomNumber}</p>
          <p className="text-sm text-slate-600">Bed {bed.bedNumber}</p>
          <p className={`text-xs mt-2 capitalize ${
            bed.status === 'occupied' ? 'text-amber-600' : 'text-green-600'
          }`}>
            {bed.status}
          </p>
          {bed.patientName && (
            <p className="text-sm font-medium text-slate-700 mt-1 truncate">
              {bed.patientName}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}