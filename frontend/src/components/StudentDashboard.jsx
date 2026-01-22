import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { createRequest, getStudentRequests, resubmitRequest, deleteRequest } from '../services/api';
import { ConfirmModal } from './Modal';
import Announcements from './Announcements';
import RequestHistory from './RequestHistory';

export default function StudentDashboard({ studentId, studentInfo }) {
  const [requests, setRequests] = useState([]);
  const [docTypes, setDocTypes] = useState([
    { id: 1, name: 'Graduation Clearance', stages: ['library', 'cashier', 'registrar'] },
    { id: 2, name: 'Transfer Clearance', stages: ['library', 'cashier', 'registrar'] },
    { id: 3, name: 'Leave of Absence', stages: ['library', 'cashier'] }
  ]);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, requestId: null, requestName: '' });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await getStudentRequests(studentId);
      if (response.success) {
        setRequests(response.requests);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!selectedDocType) return;

    setLoading(true);
    try {
      const response = await createRequest(studentId, selectedDocType);
      if (response.success) {
        setSelectedDocType('');
        setShowCreateForm(false);
        fetchRequests();
        toast.success('Request created successfully!');
      } else {
        toast.error(response.error || 'Failed to create request');
      }
    } catch (error) {
      toast.error('Error creating request: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = async (requestId) => {
    setLoading(true);
    try {
      const response = await resubmitRequest(requestId, studentId);
      if (response.success) {
        fetchRequests();
        toast.success('Request resubmitted successfully!');
      } else {
        toast.error(response.error || 'Failed to resubmit request');
      }
    } catch (error) {
      toast.error('Error resubmitting: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (requestId, requestName) => {
    setDeleteConfirm({ show: true, requestId, requestName });
  };

  const confirmDelete = async () => {
    const { requestId } = deleteConfirm;
    setDeleteConfirm({ show: false, requestId: null, requestName: '' });
    
    setLoading(true);
    try {
      const response = await deleteRequest(requestId, studentId);
      if (response.success) {
        fetchRequests();
        toast.success('Request deleted successfully!');
      } else {
        toast.error(response.error || 'Failed to delete request');
      }
    } catch (error) {
      toast.error('Error deleting request: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    // Deprecated - using toast directly now
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const calculateProgress = (request) => {
    const totalStages = request.document_types.required_stages.length;
    const currentIndex = request.current_stage_index;
    
    if (request.is_completed) return 100;
    return Math.round((currentIndex / totalStages) * 100);
  };

  const getCurrentStage = (request) => {
    if (request.is_completed) return 'Completed';
    return request.document_types.required_stages[request.current_stage_index];
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge badge-pending',
      approved: 'badge badge-approved',
      on_hold: 'badge badge-rejected',
      completed: 'badge badge-completed'
    };
    return badges[status] || 'badge';
  };

  return (
    <div className="space-y-6">
      {/* Announcements */}
      <Announcements userRole="student" />

      {/* Welcome Card */}
      <div className="card bg-gradient-to-r from-primary-500 to-green-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome back, {studentInfo?.full_name}!</h2>
            <p className="text-primary-100">Student Number: {studentInfo?.student_number}</p>
            <p className="text-primary-100">{studentInfo?.course_year}</p>
          </div>
          <div className="hidden sm:block">
            <svg className="w-24 h-24 text-white opacity-20" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Request
        </button>
      </div>

      {/* Create Request Form */}
      {showCreateForm && (
        <div className="card animate-slide-up">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Request</h3>
          <form onSubmit={handleCreateRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Document Type
              </label>
              <select 
                value={selectedDocType} 
                onChange={(e) => setSelectedDocType(e.target.value)}
                className="input-field"
                required
              >
                <option value="">-- Choose Document --</option>
                {docTypes.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.stages.join(' → ')})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-3">
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Creating...' : 'Submit Request'}
              </button>
              <button 
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* My Requests */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">My Requests</h3>
        
        {requests.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg">No requests yet</p>
            <p className="text-gray-400 text-sm mt-2">Create your first request to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map(request => (
              <div key={request.id} className="card hover:shadow-lg transition-shadow">
                {/* Request Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{request.document_types.name}</h4>
                    <p className="text-sm text-gray-500">
                      Created {new Date(request.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                  <span className={getStatusBadge(request.current_status)}>
                    {request.current_status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Current Stage */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Current Stage: <span className="text-primary-600 capitalize">{getCurrentStage(request)}</span>
                  </p>
                </div>

                {/* Progress Visualization */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    {request.document_types.required_stages.map((stage, index) => (
                      <div key={stage} className="flex flex-col items-center flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-all ${
                          index <= request.current_stage_index 
                            ? 'bg-primary-600 text-white' 
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          {index < request.current_stage_index || request.is_completed ? (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className="text-sm font-medium">{index + 1}</span>
                          )}
                        </div>
                        <p className={`text-xs font-medium capitalize ${
                          index <= request.current_stage_index ? 'text-primary-600' : 'text-gray-400'
                        }`}>
                          {stage}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${calculateProgress(request)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {calculateProgress(request)}% Complete
                  </p>
                </div>

                {/* Action Buttons */}
                {(request.current_status === 'pending' || request.current_status === 'on_hold') && (
                  <div className="pt-4 border-t border-gray-200 flex gap-3">
                    {/* Resubmit Button (only for on_hold) */}
                    {request.current_status === 'on_hold' && (
                      <button 
                        onClick={() => handleResubmit(request.id)}
                        disabled={loading}
                        className="btn-warning flex-1 sm:flex-none flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Resubmit
                      </button>
                    )}
                    
                    {/* Delete Button (for pending or on_hold) */}
                    <button 
                      onClick={() => handleDelete(request.id, request.document_types.name)}
                      disabled={loading}
                      className="btn-danger flex-1 sm:flex-none flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request History */}
      <RequestHistory studentId={studentId} isAdmin={false} />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, requestId: null, requestName: '' })}
        onConfirm={confirmDelete}
        title="Delete Request"
        message={`Are you sure you want to delete "${deleteConfirm.requestName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
