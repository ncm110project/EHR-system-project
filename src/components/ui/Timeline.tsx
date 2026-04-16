"use client";

import { useMemo } from 'react';

interface TimelineEvent {
  id: string;
  type: 'admission' | 'transfer' | 'triage' | 'diagnosis' | 'prescription' | 'lab' | 'discharge' | 'note';
  title: string;
  description?: string;
  timestamp: string;
  user?: string;
  department?: string;
}

interface PatientTimelineProps {
  patient: any;
  activities?: any[];
}

const eventIcons = {
  admission: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  transfer: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  triage: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  diagnosis: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  prescription: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  lab: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  discharge: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  note: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
};

const eventColors = {
  admission: 'bg-blue-500',
  transfer: 'bg-purple-500',
  triage: 'bg-yellow-500',
  diagnosis: 'bg-teal-500',
  prescription: 'bg-green-500',
  lab: 'bg-orange-500',
  discharge: 'bg-red-500',
  note: 'bg-slate-500'
};

export function PatientTimeline({ patient, activities = [] }: PatientTimelineProps) {
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    // Add admission
    if (patient.admissionDate) {
      events.push({
        id: `adm-${patient.id}`,
        type: 'admission',
        title: 'Patient Admitted',
        description: `Initial registration at ${patient.department}`,
        timestamp: patient.admissionDate,
        department: patient.department
      });
    }

    // Add from activities
    activities.forEach(activity => {
      const type = activity.type as TimelineEvent['type'];
      if (['admission', 'transfer', 'triage', 'diagnosis', 'prescription', 'lab', 'discharge', 'note'].includes(type)) {
        events.push({
          id: activity.id,
          type,
          title: activity.description?.split(':')[0] || `${type} Activity`,
          description: activity.description,
          timestamp: activity.timestamp,
          user: activity.performedBy,
          department: activity.department
        });
      }
    });

    // Add triage if exists
    if (patient.triageStatus === 'triaged') {
      events.push({
        id: `triage-${patient.id}`,
        type: 'triage',
        title: 'Triage Completed',
        description: `ESI Level: ${patient.triagePriority} | Priority: ${patient.triagePriority <= 2 ? 'Urgent' : 'Standard'}`,
        timestamp: patient.triageCompletedAt || patient.updatedAt,
        department: 'triage'
      });
    }

    // Add diagnosis if exists
    if (patient.diagnosis) {
      events.push({
        id: `diag-${patient.id}`,
        type: 'diagnosis',
        title: 'Diagnosis Recorded',
        description: patient.diagnosis,
        timestamp: patient.updatedAt,
        department: patient.department
      });
    }

    // Sort by timestamp descending
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [patient, activities]);

  if (timelineEvents.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>No history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {timelineEvents.map((event, index) => (
        <div key={event.id} className="flex gap-4 relative">
          {/* Timeline line */}
          {index < timelineEvents.length - 1 && (
            <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-slate-200" />
          )}
          
          {/* Icon */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full ${eventColors[event.type]} flex items-center justify-center text-white`}>
            {eventIcons[event.type]}
          </div>
          
          {/* Content */}
          <div className="flex-1 pb-6">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-800">{event.title}</span>
              <span className="text-xs text-slate-400">
                {new Date(event.timestamp).toLocaleString()}
              </span>
            </div>
            {event.description && (
              <p className="text-sm text-slate-600 mt-1">{event.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              {event.department && (
                <span className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                  {event.department}
                </span>
              )}
              {event.user && (
                <span className="text-xs text-slate-400">by {event.user}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}