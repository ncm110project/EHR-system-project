"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useEHR } from "@/lib/ehr-context";
import { User, Message } from "@/lib/ehr-data";

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

interface StaffMessagingProps {
  onClose: () => void;
}

export function StaffMessaging({ onClose }: StaffMessagingProps) {
  const { user } = useAuth();
  const { messages, sendMessage, patients } = useEHR();
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [composeForm, setComposeForm] = useState({
    recipientId: "",
    recipientName: "",
    subject: "",
    content: "",
    relatedPatientId: ""
  });

  const staffUsers: User[] = [
    { id: 'U001', username: 'nurse_opd', password: '', name: 'Nurse Sarah Johnson', email: '', role: 'nurse', department: 'opd', departmentName: 'Outpatient Department' },
    { id: 'U002', username: 'doctor_opd', password: '', name: 'Dr. Michael Chen', email: '', role: 'doctor', department: 'opd', departmentName: 'Outpatient Department' },
    { id: 'U003', username: 'nurse_er', password: '', name: 'Nurse Jennifer Adams', email: '', role: 'nurse', department: 'er', departmentName: 'Emergency Room' },
    { id: 'U004', username: 'doctor_er', password: '', name: 'Dr. Robert Patel', email: '', role: 'doctor', department: 'er', departmentName: 'Emergency Room' },
    { id: 'U005', username: 'pharmacy', password: '', name: 'Pharmacist Emily Wong', email: '', role: 'nurse', department: 'pharmacy', departmentName: 'Pharmacy' },
    { id: 'U006', username: 'nursing_admin', password: '', name: 'Admin Nurse Manager', email: '', role: 'admin', department: 'nursing', departmentName: 'Nursing Administration' },
    { id: 'U007', username: 'lab', password: '', name: 'Lab Technician David Lee', email: '', role: 'nurse', department: 'lab', departmentName: 'Laboratory' },
  ];

  const userId = user && 'id' in user ? user.id : '';
  const userName = user && 'name' in user ? user.name : '';
  const userRole = user && 'role' in user ? user.role : '';

  const receivedMessages = messages.filter(m => m.recipientId === userId);
  const sentMessages = messages.filter(m => m.senderId === userId);
  const allMessages = [...receivedMessages, ...sentMessages].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeForm.recipientId || !composeForm.subject || !composeForm.content) return;

    const newMessage: Message = {
      id: generateId(),
      senderId: userId,
      senderName: userName,
      senderRole: userRole as any,
      recipientId: composeForm.recipientId,
      recipientName: composeForm.recipientName,
      subject: composeForm.subject,
      content: composeForm.content,
      timestamp: new Date().toISOString(),
      status: 'unread',
      relatedPatientId: composeForm.relatedPatientId || undefined
    };

    sendMessage(newMessage);
    setShowCompose(false);
    setComposeForm({ recipientId: "", recipientName: "", subject: "", content: "", relatedPatientId: "" });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-[500px] flex flex-col">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">Internal Messages</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded"
        >
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-4 border-b border-slate-200">
        <button
          onClick={() => setShowCompose(true)}
          className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Compose
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {allMessages.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No messages yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {allMessages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className={`p-4 cursor-pointer hover:bg-slate-50 ${msg.status === 'unread' && msg.recipientId === userId ? 'bg-blue-50' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="font-medium text-slate-800 text-sm">
                    {msg.senderId === userId ? `To: ${msg.recipientName}` : `From: ${msg.senderName}`}
                  </p>
                  <span className="text-xs text-slate-400">{formatTime(msg.timestamp)}</span>
                </div>
                <p className="text-sm text-slate-600 truncate">{msg.subject}</p>
                {msg.relatedPatientId && (
                  <p className="text-xs text-teal-600 mt-1">Re: Patient {msg.relatedPatientId}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showCompose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">New Message</h3>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
                <select
                  required
                  value={composeForm.recipientId}
                  onChange={(e) => {
                    const selected = staffUsers.find(u => u.id === e.target.value);
                    setComposeForm({ ...composeForm, recipientId: e.target.value, recipientName: selected?.name || '' });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">Select recipient</option>
                  {staffUsers.filter(u => u.id !== userId).map((staff) => (
                    <option key={staff.id} value={staff.id}>{staff.name} ({staff.departmentName})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Related Patient (Optional)</label>
                <select
                  value={composeForm.relatedPatientId}
                  onChange={(e) => setComposeForm({ ...composeForm, relatedPatientId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">Select patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea
                  required
                  value={composeForm.content}
                  onChange={(e) => setComposeForm({ ...composeForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  rows={4}
                  placeholder="Type your message..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-slate-800">{selectedMessage.subject}</h3>
              <button onClick={() => setSelectedMessage(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">From:</span>
                <span className="text-slate-800">{selectedMessage.senderName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">To:</span>
                <span className="text-slate-800">{selectedMessage.recipientName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Date:</span>
                <span className="text-slate-800">{formatTime(selectedMessage.timestamp)}</span>
              </div>
              {selectedMessage.relatedPatientId && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Patient:</span>
                  <span className="text-teal-600">{selectedMessage.relatedPatientId}</span>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-slate-700 whitespace-pre-wrap">{selectedMessage.content}</p>
            </div>
            <button
              onClick={() => setSelectedMessage(null)}
              className="w-full mt-4 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}