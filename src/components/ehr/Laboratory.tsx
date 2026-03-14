"use client";

import { useState } from "react";
import { useEHR } from "@/lib/ehr-context";
import { LabOrder, LabTestStatus } from "@/lib/ehr-data";

const generateId = () => `A${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function Laboratory() {
  const { labOrders, patients, updateLabOrder, addActivity, setCurrentDepartment } = useEHR();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [resultsText, setResultsText] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);

  const filteredOrders = activeTab === 'all' 
    ? labOrders 
    : labOrders.filter(o => o.status === activeTab);

  const getPatientInfo = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return null;
    return {
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      bloodType: patient.bloodType
    };
  };

  const getTestTypeIcon = (type: string) => {
    switch (type) {
      case 'blood':
        return (
          <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center text-red-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3 7h6l-5 4 2 7-6-4-6 4 2-7-5-4h6l3-7z"></path>
            </svg>
          </div>
        );
      case 'urine':
        return (
          <div className="w-8 h-8 bg-amber-100 rounded flex items-center justify-center text-amber-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M8 6c2-2 6-2 8 0M6 10c3-3 9-3 12 0M4 14c4-4 12-4 16 0"></path>
            </svg>
          </div>
        );
      case 'imaging':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
        );
      case 'pathology':
        return (
          <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center text-green-600">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4M12 8h.01"></path>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: LabTestStatus) => {
    switch (status) {
      case 'pending':
        return 'badge-warning';
      case 'in-progress':
        return 'badge-info';
      case 'completed':
        return 'badge-success';
      default:
        return 'badge-neutral';
    }
  };

  const handleStatusChange = (order: LabOrder, status: LabTestStatus) => {
    updateLabOrder({ ...order, status });
    if (status === 'completed') {
      addActivity({
        id: generateId(),
        type: 'lab-result',
        department: 'lab',
        patientId: order.patientId,
        patientName: getPatientInfo(order.patientId)?.name || 'Unknown',
        description: `${order.testName} results ready`,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleSaveResults = () => {
    if (!selectedOrder || !resultsText) return;
    updateLabOrder({ 
      ...selectedOrder, 
      results: resultsText,
      attachments: attachments,
      status: 'completed' 
    });
    addActivity({
      id: generateId(),
      type: 'lab-result',
      department: 'lab',
      patientId: selectedOrder.patientId,
      patientName: getPatientInfo(selectedOrder.patientId)?.name || 'Unknown',
      description: `${selectedOrder.testName} results saved`,
      timestamp: new Date().toISOString()
    });
    setSelectedOrder(null);
    setResultsText("");
    setAttachments([]);
  };

  const stats = {
    pending: labOrders.filter(o => o.status === 'pending').length,
    inProgress: labOrders.filter(o => o.status === 'in-progress').length,
    completed: labOrders.filter(o => o.status === 'completed').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Laboratory</h2>
          <p className="text-slate-500">View and process doctor&apos;s lab orders</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-lg">
            <span className="font-bold">{stats.pending}</span> Pending
          </div>
          <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
            <span className="font-bold">{stats.inProgress}</span> In Progress
          </div>
          <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg">
            <span className="font-bold">{stats.completed}</span> Completed
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {(['all', 'pending', 'in-progress', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${activeTab === tab ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Test</th>
              <th>Type</th>
              <th>Patient</th>
              <th>Ordered By</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              const patientInfo = getPatientInfo(order.patientId);
              return (
                <tr key={order.id}>
                  <td className="font-mono text-sm">{order.id}</td>
                  <td className="font-medium">{order.testName}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {getTestTypeIcon(order.testType)}
                      <span className="capitalize">{order.testType}</span>
                    </div>
                  </td>
                  <td>
                    {patientInfo ? (
                      <div>
                        <p className="font-medium">{patientInfo.name}</p>
                        <p className="text-xs text-slate-500">{patientInfo.age}y {patientInfo.gender[0]} • {patientInfo.bloodType}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400">Unknown</span>
                    )}
                  </td>
                  <td>Dr. {order.orderedBy}</td>
                  <td className="text-slate-500">{order.date}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(order.status)}`}>
                      {order.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <button 
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          onClick={() => handleStatusChange(order, 'in-progress')}
                        >
                          Start
                        </button>
                      )}
                      {order.status === 'in-progress' && (
                        <button 
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                          onClick={() => setSelectedOrder(order)}
                        >
                          Enter Results
                        </button>
                      )}
                      {order.status === 'completed' && (
                        <button 
                          className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                          onClick={() => setSelectedOrder(order)}
                        >
                          View
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No lab orders found
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold">{selectedOrder.testName}</h3>
              <p className="text-slate-500">{selectedOrder.id}</p>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const patientInfo = getPatientInfo(selectedOrder.patientId);
                return patientInfo ? (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Patient Information</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-slate-500">Name:</span> <span className="font-medium">{patientInfo.name}</span></div>
                      <div><span className="text-slate-500">Age/Gender:</span> <span className="font-medium">{patientInfo.age}y {patientInfo.gender[0]}</span></div>
                      <div><span className="text-slate-500">Phone:</span> <span className="font-medium">{patientInfo.phone}</span></div>
                      <div><span className="text-slate-500">Blood Type:</span> <span className="font-medium">{patientInfo.bloodType}</span></div>
                    </div>
                  </div>
                ) : null;
              })()}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Test Type</p>
                  <p className="font-medium capitalize">{selectedOrder.testType}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Ordered By</p>
                  <p className="font-medium">Dr. {selectedOrder.orderedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Date</p>
                  <p className="font-medium">{selectedOrder.date}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <span className={`badge ${getStatusBadge(selectedOrder.status)}`}>
                    {selectedOrder.status.replace('-', ' ')}
                  </span>
                </div>
              </div>

              {selectedOrder.status === 'completed' && selectedOrder.results && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="font-semibold text-green-700 mb-2">Results</p>
                  <p className="text-green-800">{selectedOrder.results}</p>
                  {selectedOrder.referenceRange && (
                    <p className="text-sm text-green-600 mt-2">Reference: {selectedOrder.referenceRange}</p>
                  )}
                  {selectedOrder.attachments && selectedOrder.attachments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="font-semibold text-green-700 mb-2">Attachments ({selectedOrder.attachments.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedOrder.attachments.map((url, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-green-200">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                            </svg>
                            <span className="text-sm">Attachment {idx + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedOrder.status === 'in-progress' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Enter Results</label>
                  <textarea
                    value={resultsText}
                    onChange={(e) => setResultsText(e.target.value)}
                    placeholder="Enter test results..."
                    className="w-full h-32"
                  />
                  {selectedOrder.referenceRange && (
                    <p className="text-sm text-slate-500 mt-2">Reference Range: {selectedOrder.referenceRange}</p>
                  )}
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Attach Files / Pictures</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        id="file-upload"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const fileUrls = files.map(file => URL.createObjectURL(file));
                          setAttachments([...attachments, ...fileUrls]);
                        }}
                        className="hidden"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <svg className="mx-auto h-12 w-12 text-slate-400" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"></path>
                        </svg>
                        <p className="mt-1 text-sm text-slate-600">Click to upload files or images</p>
                      </label>
                    </div>
                    {attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {attachments.map((url, idx) => (
                          <div key={idx} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-sm">
                            <span>File {idx + 1}</span>
                            <button 
                              type="button"
                              onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                              className="text-red-500 ml-1"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-2 justify-end">
              <button className="btn btn-secondary" onClick={() => { setSelectedOrder(null); setAttachments([]); }}>Cancel</button>
              {selectedOrder.status === 'in-progress' && (
                <button className="btn btn-primary" onClick={handleSaveResults}>Save Results</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
