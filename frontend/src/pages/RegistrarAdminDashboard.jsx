import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const GlassCard = ({ children, className = "", onClick, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 300, damping: 30, delay }}
    onClick={onClick}
    className={`relative overflow-hidden rounded-3xl backdrop-blur-3xl bg-white/[0.02] border border-white/[0.05] ${onClick ? 'cursor-pointer hover:bg-white/[0.05] hover:border-white/[0.1]' : ''} shadow-2xl shadow-black/50 ${className}`}
  >
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
    <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-30 blur-3xl pointer-events-none" />
    <div className="relative z-10 h-full">{children}</div>
  </motion.div>
);

export default function RegistrarAdminDashboard({ adminId, onSignOut, onOpenSettings }) {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    document.title = "Registrar Dashboard | ISU Clearance System";
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/graduation/registrar/pending`);
      if (response.data.success) {
        setRequests(response.data.requests);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load pending clearances');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    setActionLoading(true);
    try {
      const response = await axios.post(`${API_URL}/graduation/registrar/approve`, {
        request_id: selectedRequest.id,
        admin_id: adminId,
        comments: comments.trim() || null
      });

      if (response.data.success) {
        toast.success(`Graduation clearance completed! Certificate #${response.data.certificateNumber}`);
        setComments('');
        setSelectedRequest(null);
        fetchPendingRequests();
      }
    } catch (error) {
      console.error('Error approving:', error);
      toast.error(error.response?.data?.error || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    
    if (!comments.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      const response = await axios.post(`${API_URL}/graduation/registrar/reject`, {
        request_id: selectedRequest.id,
        admin_id: adminId,
        comments: comments.trim()
      });

      if (response.data.success) {
        toast.success('Registrar clearance rejected');
        setComments('');
        setSelectedRequest(null);
        fetchPendingRequests();
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error(error.response?.data?.error || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const menuItems = [
    { id: 'pending', label: 'Final Approvals', icon: '🎓', count: requests.length },
  ];

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]" />
      </div>

      {/* SIDEBAR */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-900 to-slate-950 border-r border-white/5 text-white flex flex-col transition-all duration-300 shadow-2xl z-50`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                R
              </div>
              <span className="font-bold text-white">Registrar</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <span className="text-white text-lg">{sidebarOpen ? '←' : '→'}</span>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 font-semibold"
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && (
                <div className="flex-1 flex items-center justify-between">
                  <span className="font-medium">{item.label}</span>
                  {item.count > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/20">
                      {item.count}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          {sidebarOpen && (
            <div className="text-xs text-white/50">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                <span>System Online</span>
              </div>
              <div>ISU Clearance v2.0</div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className={`${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* TOPBAR */}
        <div className="h-16 bg-slate-900/40 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 shadow-lg sticky top-0 z-40">
          <div>
            <h1 className="text-xl font-bold text-white">Registrar Dashboard</h1>
            <p className="text-sm text-slate-400">Isabela State University Campus</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenSettings}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <span className="text-xl">⚙️</span>
            </button>
            <button
              onClick={onSignOut}
              className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full hover:bg-red-500 hover:text-white font-medium transition-all"
            >
              Logout
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-8 relative z-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Final Approval & Certificate Generation</h2>
            <p className="text-slate-400">Review students who have completed all previous stages</p>
          </div>

          {loading ? (
            <GlassCard className="p-12 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400">Loading clearances...</p>
            </GlassCard>
          ) : requests.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🎓</span>
              </div>
              <p className="text-slate-400">No pending final approvals</p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Request List */}
              <div className="lg:col-span-7 space-y-4">
                {requests.map((request, idx) => (
                  <GlassCard
                    key={request.id}
                    onClick={() => setSelectedRequest(request)}
                    delay={idx * 0.05}
                    className="p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
                          {request.student?.full_name?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{request.student?.full_name}</h3>
                          <p className="text-sm text-slate-400">
                            {request.student?.student_number} • {request.student?.course_year}
                          </p>
                          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                            <span>✓</span> All stages approved
                          </p>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 group-hover:bg-white group-hover:text-black transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>

              {/* Details Panel */}
              <div className="lg:col-span-5">
                <GlassCard className="sticky top-24">
                  {!selectedRequest ? (
                    <div className="p-12 text-center">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-white/5 to-transparent border border-white/5 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Final Approval</h3>
                      <p className="text-slate-400 text-sm">Select a student for final approval and certificate generation</p>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                      <div className="p-6 border-b border-white/5 bg-gradient-to-b from-indigo-500/10 to-transparent">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h2 className="text-xl font-bold text-white">{selectedRequest.student?.full_name}</h2>
                            <p className="text-indigo-300 text-sm">{selectedRequest.student?.student_number}</p>
                          </div>
                          <button
                            onClick={() => setSelectedRequest(null)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                          >
                            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Course/Year</p>
                            <p className="text-xs font-medium text-white">{selectedRequest.student?.course_year}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1">Clearance Status</p>
                            <div className="space-y-1">
                              <p className="text-xs text-emerald-300">✓ Professors Approved</p>
                              <p className="text-xs text-emerald-300">✓ Library Approved</p>
                              <p className="text-xs text-emerald-300">✓ Cashier Approved</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                          <p className="text-sm text-indigo-300 mb-2">
                            <strong>⚠️ Final Approval:</strong>
                          </p>
                          <p className="text-xs text-slate-300">
                            Approving this clearance will mark it as COMPLETED and automatically generate a graduation certificate for the student.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                            Comments (Optional)
                          </label>
                          <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                            rows="4"
                            placeholder="Add any final comments or notes..."
                          />
                        </div>
                      </div>

                      <div className="p-6 border-t border-white/5 bg-black/20 space-y-3">
                        <button
                          onClick={handleApprove}
                          disabled={actionLoading}
                          className="w-full h-12 px-6 rounded-full font-bold text-sm tracking-wide flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading ? 'Processing...' : '✓ Final Approval & Generate Certificate'}
                        </button>
                        <button
                          onClick={handleReject}
                          disabled={actionLoading}
                          className="w-full h-12 px-6 rounded-full font-bold text-sm tracking-wide flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading ? 'Processing...' : '✗ Reject Clearance'}
                        </button>
                      </div>
                    </div>
                  )}
                </GlassCard>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
