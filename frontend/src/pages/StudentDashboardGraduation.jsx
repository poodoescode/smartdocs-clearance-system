import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import axios from 'axios';
import GraduationCertificate from '../components/features/GraduationCertificate';

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

export default function StudentDashboardGraduation({ studentId, studentInfo, onSignOut, onOpenSettings, isDarkMode = false }) {
  const [clearanceStatus, setClearanceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState('status');

  useEffect(() => {
    document.title = "Student Dashboard | ISU Graduation Clearance";
    fetchClearanceStatus();
  }, []);

  const fetchClearanceStatus = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/graduation/status/${studentId}`);
      if (response.data.success) {
        setClearanceStatus(response.data);
      }
    } catch (error) {
      console.error('Error fetching clearance status:', error);
      toast.error('Failed to load clearance status');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const response = await axios.post(`${API_URL}/graduation/apply`, {
        student_id: studentId
      });

      if (response.data.success) {
        toast.success('Graduation clearance application submitted!');
        fetchClearanceStatus();
      }
    } catch (error) {
      console.error('Error applying for clearance:', error);
      toast.error(error.response?.data?.error || 'Failed to apply for clearance');
    } finally {
      setApplying(false);
    }
  };

  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your graduation clearance request? This action cannot be undone.')) {
      return;
    }

    setCancelling(true);
    try {
      const response = await axios.delete(`${API_URL}/graduation/cancel/${studentId}`);

      if (response.data.success) {
        toast.success('Graduation clearance request cancelled');
        fetchClearanceStatus();
      }
    } catch (error) {
      console.error('Error cancelling clearance:', error);
      toast.error(error.response?.data?.error || 'Failed to cancel clearance');
    } finally {
      setCancelling(false);
    }
  };

  const menuItems = [
    { id: 'status', label: 'Clearance Status', icon: '📊' },
    { id: 'certificate', label: 'Certificate', icon: '🎓' },
  ];

  const getStageStatus = (status) => {
    if (status === 'approved') return { color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200', icon: '✓' };
    if (status === 'rejected') return { color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', icon: '✗' };
    return { color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200', icon: '⏳' };
  };

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
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-white to-green-50 rounded-lg flex items-center justify-center text-green-600 font-bold shadow-lg">
                SC
              </div>
              <span className="font-bold text-white">ISU Clearance</span>
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
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === item.id
                ? 'bg-white text-green-600 shadow-lg shadow-green-900/20 font-semibold'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

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
            <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Student Dashboard</h1>
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
                <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{studentInfo?.full_name}</p>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{studentInfo?.student_number}</p>
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
          <div className="max-w-5xl mx-auto">
            {activeView === 'status' && (
              <div className="space-y-6">
                <div>
                  <h2 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Graduation Clearance</h2>
                  <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>Track your graduation clearance progress</p>
                </div>

                {loading ? (
                  <GlassCard isDark={isDarkMode} className="p-12 text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>Loading clearance status...</p>
                  </GlassCard>
                ) : !clearanceStatus?.hasRequest ? (
                  <GlassCard isDark={isDarkMode} className="p-8">
                    <div className="text-center">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'bg-slate-700' : 'bg-green-50'}`}>
                        <span className="text-4xl">🎓</span>
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Apply for Graduation Clearance</h3>
                      <p className={`mb-6 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                        Start your graduation clearance process. All professors and offices must approve before you can graduate.
                      </p>
                      <button
                        onClick={handleApply}
                        disabled={applying}
                        className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/25 transition-all"
                      >
                        {applying ? 'Submitting...' : 'Apply for Graduation Clearance'}
                      </button>
                    </div>
                  </GlassCard>
                ) : (
                  <>
                    {/* Current Stage */}
                    <GlassCard isDark={isDarkMode} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Current Stage</h3>
                        <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium border border-green-200">
                          {clearanceStatus.request.current_stage}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                          Applied on: {new Date(clearanceStatus.request.created_at).toLocaleDateString()}
                        </p>
                        <button
                          onClick={handleCancel}
                          disabled={cancelling}
                          className="px-4 py-2 bg-red-500/10 text-red-600 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancelling ? 'Cancelling...' : '✗ Cancel Request'}
                        </button>
                      </div>
                    </GlassCard>

                    {/* Progress Steps */}
                    <GlassCard isDark={isDarkMode} className="p-6">
                      <h3 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Clearance Progress</h3>

                      <div className="space-y-6">
                        {/* Step 1: Professors */}
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-12 h-12 rounded-full ${getStageStatus(clearanceStatus.request.professors_status).bg} ${getStageStatus(clearanceStatus.request.professors_status).border} border-2 flex items-center justify-center font-bold ${getStageStatus(clearanceStatus.request.professors_status).color}`}>
                              {getStageStatus(clearanceStatus.request.professors_status).icon}
                            </div>
                            {clearanceStatus.request.professors_status !== 'approved' && (
                              <div className="w-0.5 h-16 bg-gray-200"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-8">
                            <h4 className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Professors Approval</h4>
                            <p className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                              {clearanceStatus.request.professors_approved_count} of {clearanceStatus.request.professors_total_count} professors approved
                            </p>
                            {clearanceStatus.professorApprovals && clearanceStatus.professorApprovals.length > 0 && (
                              <div className="space-y-2 mt-3">
                                {clearanceStatus.professorApprovals.map((approval) => (
                                  <div key={approval.id} className={`flex items-center justify-between p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                                    <div>
                                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{approval.professor?.full_name}</p>
                                      {approval.comments && (
                                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{approval.comments}</p>
                                      )}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStageStatus(approval.status).bg} ${getStageStatus(approval.status).color} ${getStageStatus(approval.status).border} border`}>
                                      {approval.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Step 2: Library */}
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-12 h-12 rounded-full ${getStageStatus(clearanceStatus.request.library_status).bg} ${getStageStatus(clearanceStatus.request.library_status).border} border-2 flex items-center justify-center font-bold ${getStageStatus(clearanceStatus.request.library_status).color}`}>
                              {getStageStatus(clearanceStatus.request.library_status).icon}
                            </div>
                            {clearanceStatus.request.library_status !== 'approved' && (
                              <div className="w-0.5 h-16 bg-gray-200"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-8">
                            <h4 className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Library Clearance</h4>
                            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Check for unsettled books and obligations</p>
                            {clearanceStatus.request.library_comments && (
                              <p className={`text-sm mt-2 p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50 text-slate-300' : 'bg-gray-50 text-gray-700'}`}>
                                <strong>Comments:</strong> {clearanceStatus.request.library_comments}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Step 3: Cashier */}
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-12 h-12 rounded-full ${getStageStatus(clearanceStatus.request.cashier_status).bg} ${getStageStatus(clearanceStatus.request.cashier_status).border} border-2 flex items-center justify-center font-bold ${getStageStatus(clearanceStatus.request.cashier_status).color}`}>
                              {getStageStatus(clearanceStatus.request.cashier_status).icon}
                            </div>
                            {clearanceStatus.request.cashier_status !== 'approved' && (
                              <div className="w-0.5 h-16 bg-gray-200"></div>
                            )}
                          </div>
                          <div className="flex-1 pb-8">
                            <h4 className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Cashier Clearance</h4>
                            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Verify financial obligations</p>
                            {clearanceStatus.request.cashier_comments && (
                              <p className={`text-sm mt-2 p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50 text-slate-300' : 'bg-gray-50 text-gray-700'}`}>
                                <strong>Comments:</strong> {clearanceStatus.request.cashier_comments}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Step 4: Registrar */}
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-12 h-12 rounded-full ${getStageStatus(clearanceStatus.request.registrar_status).bg} ${getStageStatus(clearanceStatus.request.registrar_status).border} border-2 flex items-center justify-center font-bold ${getStageStatus(clearanceStatus.request.registrar_status).color}`}>
                              {getStageStatus(clearanceStatus.request.registrar_status).icon}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Registrar Final Approval</h4>
                            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Final validation and certificate generation</p>
                            {clearanceStatus.request.registrar_comments && (
                              <p className={`text-sm mt-2 p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50 text-slate-300' : 'bg-gray-50 text-gray-700'}`}>
                                <strong>Comments:</strong> {clearanceStatus.request.registrar_comments}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </>
                )}
              </div>
            )}

            {activeView === 'certificate' && (
              <div className="space-y-6">
                <div>
                  <h2 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Graduation Certificate</h2>
                  <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>Download or print your graduation clearance certificate</p>
                </div>

                {clearanceStatus?.request?.certificate_generated ? (
                  <GraduationCertificate
                    requestId={clearanceStatus.request.request_id}
                    studentId={studentId}
                  />
                ) : (
                  <GlassCard isDark={isDarkMode} className="p-12 text-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                      <span className="text-4xl">📜</span>
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Certificate Not Yet Available</h3>
                    <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                      Your certificate will be generated once the Registrar approves your clearance.
                    </p>
                  </GlassCard>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
