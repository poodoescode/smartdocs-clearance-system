import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const GlassCard = ({ children, className = "", isDark = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
    className={`relative overflow-hidden rounded-3xl backdrop-blur-xl ${
      isDark 
        ? 'bg-slate-800/80 border border-white/10 shadow-xl shadow-black/20' 
        : 'bg-white/80 border border-green-100 shadow-xl shadow-green-500/10'
    } ${className}`}
  >
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
    <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-30 blur-3xl pointer-events-none" />
    <div className="relative z-10 h-full">{children}</div>
  </motion.div>
);

export default function ProfessorDashboard({ professorId, professorInfo, onSignOut, onOpenSettings, isDarkMode = false }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('pending');

  useEffect(() => {
    document.title = "Professor Dashboard | ISU Clearance System";
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/graduation/professor/students/${professorId}`);
      if (response.data.success) {
        setStudents(response.data.approvals);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId) => {
    setActionLoading(true);
    try {
      const response = await axios.post(`${API_URL}/graduation/professor/approve`, {
        approval_id: approvalId,
        professor_id: professorId,
        comments: comments.trim() || null
      });

      if (response.data.success) {
        toast.success('Student approved successfully!');
        setComments('');
        setSelectedStudent(null);
        fetchStudents();
      }
    } catch (error) {
      console.error('Error approving student:', error);
      toast.error(error.response?.data?.error || 'Failed to approve student');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (approvalId) => {
    if (!comments.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      const response = await axios.post(`${API_URL}/graduation/professor/reject`, {
        approval_id: approvalId,
        professor_id: professorId,
        comments: comments.trim()
      });

      if (response.data.success) {
        toast.success('Student rejected with comments');
        setComments('');
        setSelectedStudent(null);
        fetchStudents();
      }
    } catch (error) {
      console.error('Error rejecting student:', error);
      toast.error(error.response?.data?.error || 'Failed to reject student');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingStudents = students.filter(s => s.status === 'pending');
  const approvedStudents = students.filter(s => s.status === 'approved');
  const rejectedStudents = students.filter(s => s.status === 'rejected');

  const menuItems = [
    { id: 'pending', label: 'Pending Approvals', icon: '⏳', count: pendingStudents.length },
    { id: 'approved', label: 'Approved', icon: '✅', count: approvedStudents.length },
    { id: 'rejected', label: 'Rejected', icon: '❌', count: rejectedStudents.length },
  ];

  const displayStudents = activeView === 'pending' ? pendingStudents : 
                          activeView === 'approved' ? approvedStudents : rejectedStudents;

  return (
    <div className={`flex h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-green-50 via-emerald-50/30 to-white'}`}>
      {/* Background Effects */}
      {!isDarkMode && (
        <div className="fixed inset-0 z-0">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-green-400/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-400/5 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]" />
        </div>
      )}

      {/* SIDEBAR */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} ${isDarkMode ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-r border-white/10' : 'bg-gradient-to-b from-green-600 to-emerald-700 border-r border-green-500/20'} text-white flex flex-col transition-all duration-300 shadow-2xl relative z-10`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-white to-green-50 rounded-lg flex items-center justify-center text-green-600 font-bold shadow-lg">
                P
              </div>
              <span className="font-bold text-white">Professor</span>
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
              {sidebarOpen && (
                <div className="flex-1 flex items-center justify-between">
                  <span className="font-medium">{item.label}</span>
                  {item.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      activeView === item.id ? 'bg-green-100 text-green-700' : 'bg-white/20'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </div>
              )}
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
              <div>ISU Clearance v2.0</div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* TOPBAR */}
        <div className={`h-16 ${isDarkMode ? 'bg-slate-800/80 border-b border-white/10' : 'bg-white/80 border-b border-green-100'} backdrop-blur-xl flex items-center justify-between px-6 shadow-sm`}>
          <div>
            <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Professor Dashboard</h1>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Isabela State University Campus</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenSettings}
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-green-50'}`}
              title="Settings"
            >
              <span className="text-xl">⚙️</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{professorInfo?.full_name}</p>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Professor</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                {professorInfo?.full_name?.charAt(0)}
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
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {activeView === 'pending' ? 'Pending Approvals' : 
                 activeView === 'approved' ? 'Approved Students' : 'Rejected Students'}
              </h2>
              <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                {activeView === 'pending' ? 'Review and approve graduation clearance requests' :
                 activeView === 'approved' ? 'Students you have approved' :
                 'Students you have rejected'}
              </p>
            </div>

            {loading ? (
              <GlassCard isDark={isDarkMode} className="p-12 text-center">
                <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>Loading students...</p>
              </GlassCard>
            ) : displayStudents.length === 0 ? (
              <GlassCard isDark={isDarkMode} className="p-12 text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'bg-slate-700' : 'bg-green-50'}`}>
                  <span className="text-4xl">📋</span>
                </div>
                <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>No students in this category</p>
              </GlassCard>
            ) : (
              <div className="grid gap-4">
                {displayStudents.map((approval) => (
                  <GlassCard key={approval.id} isDark={isDarkMode} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {approval.request?.student?.full_name?.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {approval.request?.student?.full_name}
                          </h3>
                          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            {approval.request?.student?.student_number} • {approval.request?.student?.course_year}
                          </p>
                          <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                            Applied: {new Date(approval.request?.created_at).toLocaleDateString()}
                          </p>
                          {approval.comments && (
                            <div className={`mt-2 p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                              <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}><strong>Comments:</strong> {approval.comments}</p>
                            </div>
                          )}
                          {approval.approved_at && (
                            <p className="text-xs text-green-600 mt-2">
                              ✓ Approved on {new Date(approval.approved_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {approval.status === 'pending' && (
                        <button
                          onClick={() => setSelectedStudent(approval)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-all shadow-md"
                        >
                          Review
                        </button>
                      )}
                      
                      {approval.status === 'approved' && (
                        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium border border-green-200">
                          ✓ Approved
                        </span>
                      )}
                      
                      {approval.status === 'rejected' && (
                        <span className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium border border-red-200">
                          ✗ Rejected
                        </span>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REVIEW MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <GlassCard isDark={isDarkMode} className="max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Review Student</h2>
                <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>{selectedStudent.request?.student?.full_name}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setComments('');
                }}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Student Number</p>
                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedStudent.request?.student?.student_number}</p>
              </div>
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Course/Year</p>
                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedStudent.request?.student?.course_year}</p>
              </div>
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Email</p>
                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedStudent.request?.student?.email}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                Comments (Optional for approval, Required for rejection)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none ${
                  isDarkMode 
                    ? 'bg-slate-700/50 border border-white/10 text-white placeholder-slate-500' 
                    : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
                rows="4"
                placeholder="Add any comments or feedback..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleApprove(selectedStudent.id)}
                disabled={actionLoading}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/25 transition-all"
              >
                {actionLoading ? 'Processing...' : '✓ Approve Student'}
              </button>
              <button
                onClick={() => handleReject(selectedStudent.id)}
                disabled={actionLoading}
                className="flex-1 py-3 bg-red-500/10 text-red-700 border border-red-500/20 rounded-lg font-medium hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {actionLoading ? 'Processing...' : '✗ Reject Student'}
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
