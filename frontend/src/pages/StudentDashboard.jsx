import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { createRequest, getStudentRequests, resubmitRequest, deleteRequest } from '../services/api';
import { ConfirmModal } from '../components/ui/Modal';
import Announcements from '../components/features/Announcements';
import RequestHistory from '../components/features/RequestHistory';
import DocumentUpload from '../components/features/DocumentUpload';
import RequestComments from '../components/features/RequestComments';
import CertificateDownload from '../components/features/CertificateDownload';

// Green-themed glassmorphism card component
const GlassCard = ({ children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
    className={`relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/80 border border-green-100 shadow-xl shadow-green-500/10 ${className}`}
  >
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
    <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-30 blur-3xl pointer-events-none" />
    <div className="relative z-10 h-full">{children}</div>
  </motion.div>
);

export default function StudentDashboard({ studentId, studentInfo, onSignOut, onOpenSettings }) {
  const [requests, setRequests] = useState([]);
  const [clearanceTypes] = useState([
    { id: 1, name: 'Graduation Clearance', stages: ['library', 'cashier', 'registrar'] },
    { id: 2, name: 'Transfer Clearance', stages: ['library', 'cashier', 'registrar'] },
    { id: 3, name: 'Leave of Absence Clearance', stages: ['library', 'cashier'] }
  ]);
  const [selectedClearanceType, setSelectedClearanceType] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, requestId: null, requestName: '' });
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    document.title = "Smart Clearance System | Student Portal";
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await getStudentRequests(studentId);
      if (data && Array.isArray(data)) {
        setRequests(data);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setRequests([]);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!selectedClearanceType) return;

    setLoading(true);
    try {
      const response = await createRequest(studentId, selectedClearanceType);
      if (response.success) {
        setSelectedClearanceType('');
        setActiveView('my-clearances');
        fetchRequests();
        toast.success('Clearance request created successfully!');
      } else {
        toast.error(response.error || 'Failed to create clearance request');
      }
    } catch (error) {
      toast.error('Error creating request');
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = async (requestId) => {
    setLoading(true);
    try {
      const response = await resubmitRequest(requestId);
      if (response.success) {
        fetchRequests();
        toast.success('Request resubmitted successfully!');
      } else {
        toast.error(response.error || 'Failed to resubmit request');
      }
    } catch (error) {
      toast.error('Error resubmitting request');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (requestId, requestName) => {
    setDeleteConfirm({ show: true, requestId, requestName });
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const response = await deleteRequest(deleteConfirm.requestId);
      if (response.success) {
        fetchRequests();
        toast.success('Request deleted successfully!');
      } else {
        toast.error(response.error || 'Failed to delete request');
      }
    } catch (error) {
      toast.error('Error deleting request');
    } finally {
      setLoading(false);
      setDeleteConfirm({ show: false, requestId: null, requestName: '' });
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'new-clearance', label: 'New Clearance', icon: '➕' },
    { id: 'my-clearances', label: 'My Clearances', icon: '📋' },
    { id: 'history', label: 'History', icon: '📜' },
    { id: 'announcements', label: 'Announcements', icon: '📢' },
    { id: 'certificates', label: 'Certificates', icon: '🎓' },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-white">
      {/* Background Effects - Light Green Theme */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-green-400/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-400/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]" />
      </div>

      {/* SIDEBAR - Green Theme */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-green-600 to-emerald-700 border-r border-green-500/20 text-white flex flex-col transition-all duration-300 shadow-2xl relative z-10`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-white to-green-50 rounded-lg flex items-center justify-center text-green-600 font-bold shadow-lg">
                SC
              </div>
              <span className="font-bold text-white">Smart Clearance</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <span className="text-white text-lg">{sidebarOpen ? '←' : '→'}</span>
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeView === item.id
                  ? 'bg-white text-green-600 shadow-lg shadow-green-900/20 font-semibold'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          {sidebarOpen && (
            <div className="text-xs text-white/70">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                <span>System Online</span>
              </div>
              <div>Smart Clearance v2.0</div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* TOPBAR - Light Green Theme */}
        <div className="h-16 bg-white/80 backdrop-blur-xl border-b border-green-100 flex items-center justify-between px-6 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome back, {studentInfo?.full_name?.split(' ')[0]}!</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenSettings}
              className="p-2 hover:bg-green-50 rounded-lg transition-colors"
              title="Settings"
            >
              <span className="text-xl">⚙️</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{studentInfo?.full_name}</p>
                <p className="text-xs text-gray-600">{studentInfo?.student_number}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                {studentInfo?.full_name?.charAt(0)}
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="px-4 py-2 bg-red-500/10 text-red-600 border border-red-500/20 rounded-full hover:bg-red-500 hover:text-white font-medium transition-all"
            >
              Logout
            </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeView === 'dashboard' && (
            <DashboardView studentInfo={studentInfo} requests={requests} />
          )}
          {activeView === 'new-clearance' && (
            <NewClearanceView
              clearanceTypes={clearanceTypes}
              selectedClearanceType={selectedClearanceType}
              setSelectedClearanceType={setSelectedClearanceType}
              handleCreateRequest={handleCreateRequest}
              loading={loading}
            />
          )}
          {activeView === 'my-clearances' && (
            <MyClearancesView
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
        </div>
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
    </div>
  );
}

// Dashboard View - Green Theme
function DashboardView({ studentInfo, requests = [] }) {
  const pendingCount = Array.isArray(requests) ? requests.filter(r => !r.is_completed).length : 0;
  const completedCount = Array.isArray(requests) ? requests.filter(r => r.is_completed).length : 0;
  const totalCount = Array.isArray(requests) ? requests.length : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Metrics Overview</h2>
        <p className="text-gray-600">Welcome to your student dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="flex flex-col justify-center p-6 min-h-[160px] group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-green-50 text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors duration-300">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-1 tracking-tight group-hover:scale-105 transition-transform origin-left">
            {totalCount}
          </div>
          <div className="text-sm font-medium text-gray-500 uppercase tracking-widest">Total Clearances</div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-center p-6 min-h-[160px] group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div className="text-4xl font-bold text-orange-600 mb-1 tracking-tight group-hover:scale-105 transition-transform origin-left">
            {pendingCount}
          </div>
          <div className="text-sm font-medium text-gray-500 uppercase tracking-widest">Pending</div>
        </GlassCard>

        <GlassCard className="flex flex-col justify-center p-6 min-h-[160px] group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div className="text-4xl font-bold text-emerald-600 mb-1 tracking-tight group-hover:scale-105 transition-transform origin-left">
            {completedCount}
          </div>
          <div className="text-sm font-medium text-gray-500 uppercase tracking-widest">Completed</div>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Clearances</h2>
        {!Array.isArray(requests) || requests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No clearances yet. Create your first one!</p>
        ) : (
          <div className="space-y-4">
            {requests.slice(0, 5).map((req, idx) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-4 bg-green-50/50 border border-green-100 rounded-2xl hover:bg-green-50 hover:border-green-200 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                    {req.document_type?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{req.document_type}</p>
                    <p className="text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  req.is_completed
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-orange-100 text-orange-700 border border-orange-200'
                }`}>
                  {req.is_completed ? 'Completed' : 'Pending'}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// New Clearance View - Green Theme
function NewClearanceView({ clearanceTypes, selectedClearanceType, setSelectedClearanceType, handleCreateRequest, loading }) {
  return (
    <div className="max-w-2xl mx-auto">
      <GlassCard className="p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Clearance</h2>
        <form onSubmit={handleCreateRequest} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Clearance Type
            </label>
            <select
              value={selectedClearanceType}
              onChange={(e) => setSelectedClearanceType(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-green-200 rounded-xl text-gray-900 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              required
            >
              <option value="">Choose a clearance type...</option>
              {clearanceTypes.map((type) => (
                <option key={type.id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading || !selectedClearanceType}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/25 transition-all"
          >
            {loading ? 'Creating...' : 'Submit Request'}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}

// My Clearances View - Green Theme
function MyClearancesView({ requests = [], studentId, handleResubmit, handleDelete, loading }) {
  const requestsArray = Array.isArray(requests) ? requests : [];
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">My Clearances</h2>
      {requestsArray.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <p className="text-gray-600">No clearances found. Create your first one!</p>
        </GlassCard>
      ) : (
        <div className="grid gap-6">
          {requestsArray.map((request) => (
            <GlassCard key={request.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{request.document_type}</h3>
                  <p className="text-sm text-gray-600">Created: {new Date(request.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  request.is_completed
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-orange-100 text-orange-700 border border-orange-200'
                }`}>
                  {request.is_completed ? 'Completed' : 'Pending'}
                </span>
              </div>
              
              <div className="space-y-4">
                <DocumentUpload requestId={request.id} userId={studentId} />
                <RequestComments requestId={request.id} userId={studentId} userRole="student" />
                
                {request.is_completed && (
                  <CertificateDownload requestId={request.id} userId={studentId} />
                )}
                
                <div className="flex gap-2">
                  {!request.is_completed && (
                    <>
                      <button
                        onClick={() => handleResubmit(request.id)}
                        disabled={loading}
                        className="px-4 py-2 bg-green-500/10 text-green-700 border border-green-500/20 rounded-xl hover:bg-green-500 hover:text-white disabled:opacity-50 transition-all"
                      >
                        Resubmit
                      </button>
                      <button
                        onClick={() => handleDelete(request.id, request.document_type)}
                        disabled={loading}
                        className="px-4 py-2 bg-red-500/10 text-red-700 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white disabled:opacity-50 transition-all"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

// Certificates View - Green Theme
function CertificatesView({ requests = [], studentId }) {
  const requestsArray = Array.isArray(requests) ? requests : [];
  const completedRequests = requestsArray.filter(r => r.is_completed);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Certificates</h2>
      {completedRequests.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
          </div>
          <p className="text-gray-600">No completed clearances yet.</p>
        </GlassCard>
      ) : (
        <div className="grid gap-6">
          {completedRequests.map((request) => (
            <GlassCard key={request.id} className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{request.document_type}</h3>
              <CertificateDownload requestId={request.id} userId={studentId} />
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
