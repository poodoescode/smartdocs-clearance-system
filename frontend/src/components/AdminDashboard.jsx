import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getAdminRequests, approveRequest, rejectRequest } from '../services/api';
import { ConfirmModal } from './Modal';
import Announcements from './Announcements';
import RequestHistory from './RequestHistory';
import DocumentUpload from './DocumentUpload';
import RequestComments from './RequestComments';

export default function AdminDashboard({ adminId, adminRole }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [filter, setFilter] = useState('all');
  const [approveConfirm, setApproveConfirm] = useState({ show: false, requestId: null });

  useEffect(() => {
    fetchRequests();
  }, [adminRole]);

  const fetchRequests = async () => {
    try {
      const response = await getAdminRequests(adminRole);
      if (response.success) {
        setRequests(response.requests);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleApprove = async (requestId) => {
    setApproveConfirm({ show: true, requestId });
  };

  const confirmApprove = async () => {
    const { requestId } = approveConfirm;
    setApproveConfirm({ show: false, requestId: null });
    
    setLoading(true);
    try {
      const response = await approveRequest(requestId, adminId);
      if (response.success) {
        toast.success(response.message || 'Request approved!');
        fetchRequests();
      } else {
        toast.error(response.error || 'Failed to approve request');
      }
    } catch (error) {
      toast.error('Error approving request: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setLoading(true);
    try {
      const response = await rejectRequest(requestId, adminId, rejectReason);
      if (response.success) {
        toast.success('Request rejected');
        setRejectingId(null);
        setRejectReason('');
        fetchRequests();
      } else {
        toast.error(response.error || 'Failed to reject request');
      }
    } catch (error) {
      toast.error('Error rejecting request: ' + error.message);
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

  const getStageName = () => {
    return adminRole.replace('_admin', '').toUpperCase();
  };

  const getStageIcon = () => {
    const icons = {
      library_admin: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
        </svg>
      ),
      cashier_admin: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
        </svg>
      ),
      registrar_admin: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
        </svg>
      )
    };
    return icons[adminRole] || icons.library_admin;
  };

  return (
    <div className="space-y-6">
      {/* Announcements */}
      <Announcements userRole={adminRole} />

      {/* Admin Header Card */}
      <div className="card bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              {getStageIcon()}
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">{getStageName()} Admin Dashboard</h2>
              <p className="text-blue-100">Manage requests at {getStageName()} stage</p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-3xl font-bold">{requests.length}</div>
            <div className="text-sm text-blue-100">Pending Requests</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ready to Review</p>
              <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Your Stage</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">{getStageName()}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Quick Actions</p>
              <p className="text-2xl font-bold text-gray-900">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Requests Queue */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-900">Request Queue</h3>
          <button 
            onClick={fetchRequests}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {requests.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg font-medium">No pending requests</p>
            <p className="text-gray-400 text-sm mt-2">All caught up! Check back later for new requests.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map(request => (
              <div key={request.id} className="card hover:shadow-lg transition-all">
                {/* Request Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{request.document_types.name}</h4>
                      <span className="badge badge-pending">
                        {request.current_status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{request.profiles.full_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <span>{new Date(request.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        <span>{request.profiles.student_number}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {rejectingId !== request.id ? (
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button 
                      onClick={() => handleApprove(request.id)}
                      disabled={loading}
                      className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Approve
                    </button>
                    <button 
                      onClick={() => setRejectingId(request.id)}
                      disabled={loading}
                      className="btn-danger flex-1 sm:flex-none flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-gray-200 space-y-3 animate-slide-up">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Rejection Reason <span className="text-red-500">*</span>
                      </label>
                      <textarea 
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Please explain why this request is being rejected..."
                        className="input-field min-h-[100px] resize-none"
                        required
                      />
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleReject(request.id)}
                        disabled={loading || !rejectReason.trim()}
                        className="btn-danger flex-1 sm:flex-none"
                      >
                        Confirm Rejection
                      </button>
                      <button 
                        onClick={() => {
                          setRejectingId(null);
                          setRejectReason('');
                        }}
                        className="btn-secondary flex-1 sm:flex-none"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Document Upload - Admins can also upload */}
                <div className="mt-4">
                  <DocumentUpload
                    requestId={request.id}
                    userId={adminId}
                    isOwner={false}
                    isAdmin={true}
                  />
                </div>

                {/* Comments Section */}
                <div className="mt-4">
                  <RequestComments
                    requestId={request.id}
                    userId={adminId}
                    userRole={adminRole}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request History - Shows all requests for admins */}
      <RequestHistory isAdmin={true} />

      {/* Approve Confirmation Modal */}
      <ConfirmModal
        isOpen={approveConfirm.show}
        onClose={() => setApproveConfirm({ show: false, requestId: null })}
        onConfirm={confirmApprove}
        title="Approve Request"
        message="Are you sure you want to approve this request? It will move to the next stage."
        confirmText="Approve"
        cancelText="Cancel"
        type="info"
      />
    </div>
  );
}
