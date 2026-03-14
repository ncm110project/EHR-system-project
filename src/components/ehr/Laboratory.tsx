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

  const filteredOrders = activeTab === 'all' 
    ? labOrders 
    : labOrders.filter(o => o.status === activeTab);

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient?.name || 'Unknown';
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
        patientName: getPatientName(order.patientId),
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
      status: 'completed' 
    });
    addActivity({
      id: generateId(),
      type: 'lab-result',
      department: 'lab',
      patientId: selectedOrder.patientId,
      patientName: getPatientName(selectedOrder.patientId),
      description: `${selectedOrder.testName} results saved`,
      timestamp: new Date().toISOString()
    });
    setSelectedOrder(null);
    setResultsText("");
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
          <p className="text-slate-500">Test orders and results management</p>
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
            {filteredOrders.map((order) => (
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
                  <button 
                    className="text-blue-600 hover:underline"
                    onClick={() => setCurrentDepartment('opd')}
                  >
                    {getPatientName(order.patientId)}
                  </button>
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
            ))}
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
              <p className="text-slate-500">{selectedOrder.id} • Patient: {getPatientName(selectedOrder.patientId)}</p>
            </div>
            <div className="p-6 space-y-4">
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
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-2 justify-end">
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Cancel</button>
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
