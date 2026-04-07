"use client";

import { MedicationRound } from "@/lib/ehr-data";

interface MedicationRoundsProps {
  rounds: MedicationRound[];
  patientNames: Record<string, string>;
  onAdminister: (roundId: string) => void;
}

export function MedicationRounds({ rounds, patientNames, onAdminister }: MedicationRoundsProps) {
  const pendingRounds = rounds.filter(r => r.status === 'pending');
  const completedRounds = rounds.filter(r => r.status === 'given');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
          <h3 className="font-medium text-amber-800">Pending Medication Rounds ({pendingRounds.length})</h3>
        </div>
        {pendingRounds.length > 0 ? (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Patient</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Medication</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Dosage</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pendingRounds.map(round => (
                <tr key={round.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(round.scheduledTime).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{patientNames[round.patientId] || round.patientId}</td>
                  <td className="px-4 py-3 text-slate-600">{round.medication}</td>
                  <td className="px-4 py-3 text-slate-600">{round.dosage}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onAdminister(round.id)}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Administer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-slate-500">No pending medication rounds</div>
        )}
      </div>

      {completedRounds.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-green-50 border-b border-green-100">
            <h3 className="font-medium text-green-800">Completed ({completedRounds.length})</h3>
          </div>
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Patient</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Medication</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {completedRounds.map(round => (
                <tr key={round.id} className="text-sm">
                  <td className="px-4 py-3 text-slate-600">{new Date(round.scheduledTime).toLocaleTimeString()}</td>
                  <td className="px-4 py-3 text-slate-800">{patientNames[round.patientId] || round.patientId}</td>
                  <td className="px-4 py-3 text-slate-600">{round.medication} {round.dosage}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Given</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}