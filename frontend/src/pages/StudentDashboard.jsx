import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { createRequest, getStudentRequests, resubmitRequest, deleteRequest } from '../services/api';
import { ConfirmModal } from '../components/ui/Modal';
import Announcements from '../components/features/Announcements';
import RequestHistory from '../components/features/RequestHistory';
import DocumentUpload from '../components/features/DocumentUpload';
import RequestComments from '../components/features/RequestComments';
import CertificateDownload from '../components/features/CertificateDownload';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';

export default function StudentDashboard({ studentId, studentInfo, onSignOut, onOpenSettings }) {
  const [requests, setRequests] = useState([]);
  const [docTypes] = useState([
    { id: 1, name: 'Graduation Clearance', stages: ['library', 'cashier', 'registrar'] },
    { id: 2, name: 'Transfer Clearance', stages: ['library', 'cashier', 'registrar'] },
    { id: 3, name: 'Leave of Absence', stages: ['library', 'cashier'] }
  ]);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, requestId: null, requestName: '' });
  
  // Sidebar & Navigation State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');

  useEffect(() => {
    document.title = "SmartDocs | Student Portal";
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
        setActiveView('my-requests');
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

  // Sidebar Menu Items
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: 'new-request',
      label: 'New Request',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )
    },
    {
      id: 'my-requests',
      label: 'My Requests',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      badge: requests.filter(r => !r.is_completed).length || null
    },
    {
      id: 'history',
      label: 'Request History',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    },
    {
      id: 'certificates',
      label: 'Certificates',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      badge: requests.filter(r => r.is_completed).length || null
    }
  ];

  return (
    <>
      {/* Sidebar - Fixed on left */}
      <Sidebar
        menuItems={menuItems}
        activeView={activeView}
        onViewChange={setActiveView}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        theme="light"
      />

      {/* Main Content Area - Offset by sidebar width */}
      <div 
        className="min-h-screen bg-gray-50 transition-all duration-300"
        style={{ 
          marginLeft: sidebarCollapsed ? '80px' : '280px',
          width: `calc(100% - ${sidebarCollapsed ? '80px' : '280px'})`
        }}
      >
        {/* Topbar */}
        <Topbar
          user={studentInfo}
          onSignOut={onSignOut}
          onOpenSettings={onOpenSettings}
          theme="light"
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Content Container */}
        <main className="pt-20 p-8">
          {activeView === 'dashboard' && (
            <DashboardView studentInfo={studentInfo} requests={requests} />
          )}
          {activeView === 'new-request' && (
            <NewRequestView 
              docTypes={docTypes} 
              selectedDocType={selectedDocType} 
              setSelectedDocType={setSelectedDocType} 
              handleCreateRequest={handleCreateRequest} 
              loading={loading} 
              setActiveView={setActiveView} 
            />
          )}
          {activeView === 'my-requests' && (
            <MyRequestsView 
              requests={requests} 
              studentId={studentId} 
              handleResubmit={handleResubmit} 
              handleDelete={handleDelete} 
              loading={loading} 
            />
          )}
          {activeView === 'history' && (
            <RequestHistory studentId={studentId} isAdmin={false} />
          )}
          {activeView === 'announcements' && (
            <Announcements userRole="student" />
          )}
          {activeView === 'certificates' && (
            <CertificatesView requests={requests} studentId={studentId} />
          )}
        </main>
      </div>

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
    </>
  );
}

// Dashboard View Component
function DashboardView({ studentInfo, requests }) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Card */}
      <div className="spatial-glass rounded-3xl p-8 border border-green-200/50 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Welcome back, {studentInfo?.full_name}!
            </h2>
            <div className="space-y-1">
              <p className="text-gray-600 font-medium flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                Student Number: <span className="text-gray-900 font-semibold">{studentInfo?.student_number}</span>
              </p>
              <p className="text-gray-600 font-medium flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                {studentInfo?.course_year}
              </p>
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
              <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="spatial-glass rounded-2xl p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{requests.filter(r => !r.is_completed).length}</p>
              <p className="text-sm text-gray-600 font-medium">Active Requests</p>
            </div>
          </div>
        </div>

        <div className="spatial-glass rounded-2xl p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{requests.filter(r => r.is_completed).length}</p>
              <p className="text-sm text-gray-600 font-medium">Completed</p>
            </div>
          </div>
        </div>

        <div className="spatial-glass rounded-2xl p-6 border border-gray-200/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{requests.filter(r => r.current_status === 'pending').length}</p>
              <p className="text-sm text-gray-600 font-medium">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements */}
      <Announcements userRole="student" />
    </div>
  );
}

// New Request View Component
function NewRequestView({ docTypes, selectedDocType, setSelectedDocType, handleCreateRequest, loading, setActiveView }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="spatial-glass rounded-3xl p-8 border border-green-200/50 shadow-xl">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          Create New Request
        </h3>
        <form onSubmit={handleCreateRequest} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
              Select Document Type <span className="text-red-500">*</span>
            </label>
            <select 
              value={selectedDocType} 
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none transition-all font-medium bg-white text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
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
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow-lg shadow-green-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Submit Request'}
            </button>
            <button 
              type="button"
              onClick={() => setActiveView('dashboard')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-full transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// My Requests View Component
function MyRequestsView({ requests, studentId, handleResubmit, handleDelete, loading }) {
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

  const RequestCard = ({ request }) => (
    <div className="spatial-glass rounded-3xl p-6 border border-gray-200/50 hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-300">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h4 className="text-xl font-bold text-gray-900 mb-2">{request.document_types.name}</h4>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Created {new Date(request.created_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </p>
        </div>
        <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${
          request.current_status === 'completed' ? 'bg-green-100 text-green-700' :
          request.current_status === 'approved' ? 'bg-blue-100 text-blue-700' :
          request.current_status === 'on_hold' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {request.current_status.replace('_', ' ')}
        </span>
      </div>

      <div className="mb-6 p-4 bg-green-50 rounded-2xl border border-green-100">
        <p className="text-sm font-bold text-gray-700 mb-1">Current Stage</p>
        <p className="text-lg font-bold text-green-600 capitalize flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {getCurrentStage(request)}
        </p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          {request.document_types.required_stages.map((stage, index) => (
            <div key={stage} className="flex flex-col items-center flex-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all shadow-lg ${
                index <= request.current_stage_index 
                  ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-green-500/50' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {index < request.current_stage_index || request.is_completed ? (
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-sm font-bold">{index + 1}</span>
                )}
              </div>
              <p className={`text-xs font-bold capitalize ${
                index <= request.current_stage_index ? 'text-green-600' : 'text-gray-400'
              }`}>
                {stage}
              </p>
            </div>
          ))}
        </div>
        
        <div className="w-full bg-gray-100 rounded-full h-3 shadow-inner">
          <div 
            className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-500 shadow-lg"
            style={{ width: `${calculateProgress(request)}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-right font-semibold">
          {calculateProgress(request)}% Complete
        </p>
      </div>

      {request.is_completed && (
        <div className="mt-4">
          <CertificateDownload
            requestId={request.id}
            userId={studentId}
            isCompleted={request.is_completed}
          />
        </div>
      )}

      <div className="mt-4">
        <DocumentUpload
          requestId={request.id}
          userId={studentId}
          isOwner={true}
          isAdmin={false}
        />
      </div>

      <div className="mt-4">
        <RequestComments
          requestId={request.id}
          userId={studentId}
          userRole="student"
        />
      </div>

      {(request.current_status === 'pending' || request.current_status === 'on_hold') && (
        <div className="pt-6 border-t border-gray-200 flex gap-3">
          {request.current_status === 'on_hold' && (
            <button 
              onClick={() => handleResubmit(request.id)}
              disabled={loading}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-full shadow-lg shadow-yellow-500/30 transition-all hover:scale-105 disabled:opacity-50 flex-1 sm:flex-none flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Resubmit
            </button>
          )}
          
          <button 
            onClick={() => handleDelete(request.id, request.document_types.name)}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-full shadow-lg shadow-red-500/30 transition-all hover:scale-105 disabled:opacity-50 flex-1 sm:flex-none flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        My Requests
      </h3>
      
      {requests.length === 0 ? (
        <div className="spatial-glass rounded-3xl p-12 text-center border border-gray-200/50">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600 text-lg font-semibold mb-2">No requests yet</p>
          <p className="text-gray-400 text-sm">Create your first request to get started</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map(request => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}

// Certificates View Component
function CertificatesView({ requests, studentId }) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        My Certificates
      </h3>

      {requests.filter(r => r.is_completed).length === 0 ? (
        <div className="spatial-glass rounded-3xl p-12 text-center border border-gray-200/50">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <p className="text-gray-600 text-lg font-semibold mb-2">No certificates yet</p>
          <p className="text-gray-400 text-sm">Complete your requests to receive certificates</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.filter(r => r.is_completed).map(request => (
            <div key={request.id} className="spatial-glass rounded-3xl p-6 border border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{request.document_types.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Completed on {new Date(request.updated_at).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
                <CertificateDownload
                  requestId={request.id}
                  userId={studentId}
                  isCompleted={request.is_completed}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
