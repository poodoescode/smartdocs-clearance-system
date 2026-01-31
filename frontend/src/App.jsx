import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './lib/supabase';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import EnvironmentalImpact from './components/features/EnvironmentalImpact';
import Settings from './components/features/Settings';
import Loader from './components/ui/Loader';
import LandingPage from './pages/LandingPage';
import PixelTrail from './components/visuals/PixelTrail';
import AuthPage from './pages/auth/AuthPage';
import RoleSelectionPage from './pages/auth/RoleSelectionPage';
import logo from './assets/logo.png';

function App() {
  // --- EXISTING STATE & LOGIC ---
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const fetchingProfileRef = useRef(false);

  // --- NEW UI STATE ---
  const [appMode, setAppMode] = useState(() => {
    const savedMode = sessionStorage.getItem('currentAppMode');
    if (savedMode) return savedMode;
    return sessionStorage.getItem('hasSeenLoader') ? 'landing' : 'loader';
  });

  const [selectedRole, setSelectedRole] = useState(() => {
    return sessionStorage.getItem('selectedRole') || null;
  });

  // --- UI SEQUENCE EFFECT ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      return newMode;
    });
  };

  useEffect(() => {
    if (appMode === 'loader') {
      // Show Loader for 3 seconds, then switch to Landing Page and mark as seen
      const timer = setTimeout(() => {
        setAppMode('landing');
        sessionStorage.setItem('hasSeenLoader', 'true');
        sessionStorage.setItem('currentAppMode', 'landing');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [appMode]);

  const enterSystem = () => {
    setAppMode('roleSelection');
    sessionStorage.setItem('currentAppMode', 'roleSelection');
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    sessionStorage.setItem('selectedRole', role);
    setAppMode('app');
    sessionStorage.setItem('currentAppMode', 'app');
  };

  const backToRoleSelection = () => {
    setSelectedRole(null);
    sessionStorage.removeItem('selectedRole');
    setAppMode('roleSelection');
    sessionStorage.setItem('currentAppMode', 'roleSelection');
  };

  // --- EXISTING AUTH EFFECTS & FUNCTIONS ---
  useEffect(() => {
    let isMounted = true;
    checkUser(isMounted);
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id, isMounted);
        await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', session.user.id);
      } else if (event === 'SIGNED_OUT') {
        // Clear all state on sign out
        setUser(null);
        setProfile(null);
        setSelectedRole(null);
        sessionStorage.removeItem('selectedRole');
        
        // Redirect to role selection if not already there
        if (appMode !== 'roleSelection' && appMode !== 'landing') {
          setAppMode('roleSelection');
          sessionStorage.setItem('currentAppMode', 'roleSelection');
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async (isMounted = true) => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error && error.name !== 'AbortError') console.error('Error getting session:', error);
      
      if (isMounted && session?.user) {
        setUser(session.user);
        try {
          await fetchProfile(session.user.id, isMounted);
        } catch (e) { console.error(e); }
      }
    } catch (error) {
      if (error.name !== 'AbortError') console.error(error);
    } finally {
      if (isMounted) setInitializing(false);
    }
  };

  const fetchProfile = async (userId, isMounted = true) => {
    if (fetchingProfileRef.current) return;
    fetchingProfileRef.current = true;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, student_number, course_year, is_active')
        .eq('id', userId)
        .single()
        .abortSignal(AbortSignal.timeout(3000));

      if (error) throw error;
      if (!isMounted) return;
      if (!data) throw new Error('No profile data');
      if (!data.is_active) {
        toast.error('Account deactivated');
        await supabase.auth.signOut();
        return;
      }
      setProfile(data);
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error('Failed to load profile');
        if (isMounted) {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
        }
      }
    } finally {
      fetchingProfileRef.current = false;
    }
  };

  const handleSignOut = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear all state
      setUser(null);
      setProfile(null);
      setSelectedRole(null);
      
      // Clear session storage
      sessionStorage.removeItem('selectedRole');
      sessionStorage.removeItem('currentAppMode');
      
      // Redirect to role selection
      setAppMode('roleSelection');
      sessionStorage.setItem('currentAppMode', 'roleSelection');
      
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error signing out');
    }
  };

  // --- MAIN RENDER ---

  // 1. Initial Loading State (Backend check)
  if (initializing && appMode === 'app') {
     return <Loader />;
  }

  return (
    <div className={`min-h-screen w-full font-sans transition-colors duration-500 ${appMode === 'app' && user ? 'bg-[#021205] text-white' : (isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#f8fafc] text-slate-800')}`}>
      {appMode === 'app' && user && <div className="fixed inset-0 z-0 grid-bg opacity-20 pointer-events-none"></div>}
      
      <AnimatePresence mode="wait">
        
        {/* PHASE 1: LOADER */}
        {appMode === 'loader' && (
          <motion.div key="loader" exit={{ opacity: 0 }} className="absolute inset-0 z-50">
            <Loader />
          </motion.div>
        )}

        {/* PHASE 2: LANDING PAGE */}
        {appMode === 'landing' && (
          <motion.div key="landing" exit={{ opacity: 0, y: -100 }} className={`relative z-40 ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}>
            <LandingPage onEnter={enterSystem} isDark={isDarkMode} toggleTheme={toggleTheme} />
          </motion.div>
        )}

        {/* PHASE 2.5: ROLE SELECTION */}
        {appMode === 'roleSelection' && (
          <motion.div 
            key="roleSelection" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`relative z-40 ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}
          >
            <RoleSelectionPage 
              onRoleSelect={handleRoleSelect}
              onBackToHome={() => {
                setAppMode('landing');
                sessionStorage.setItem('currentAppMode', 'landing');
              }}
              isDark={isDarkMode}
            />
          </motion.div>
        )}

        {/* PHASE 3: MAIN APP (Auth or Dashboard) */}
        {appMode === 'app' && (
          <motion.div 
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="relative z-10 min-h-screen"
          >
            {!user || !profile ? (
              // --- AUTH SCREEN ---
              <AuthPage 
                isDark={isDarkMode}
                selectedRole={selectedRole}
                onBackToHome={backToRoleSelection} 
              />
            ) : (
              // --- DASHBOARD (ISU GLASSMORPHISM) ---
              <div className="min-h-screen relative">
                {['library_admin', 'cashier_admin', 'registrar_admin'].includes(profile.role) ? (
                   // --- STANDALONE ADMIN DASHBOARD ---
                   <AdminDashboard adminId={user.id} adminRole={profile.role} onSignOut={handleSignOut} />
                ) : (
                  // --- STANDARD LAYOUT (Green/Nature Theme) ---
                  <>
                     <div className="absolute inset-0 z-0 opacity-50 pointer-events-none">
                        <PixelTrail 
                          gridSize={60} 
                          trailSize={0.2} 
                          maxAge={300} 
                          interpolate={8} 
                          color="#22c55e" 
                          glProps={{ antialias: false, powerPreference: 'high-performance', alpha: true }}
                        />
                     </div>
                    <header className="glass-panel sticky top-0 z-50 border-b border-white/10">
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-20">
                          <div className="flex items-center gap-4">
                            <img src={logo} alt="SmartDocs Logo" className="w-12 h-12 object-contain" />
                            <div>
                              <h1 className="font-display text-xl font-bold text-white tracking-wider">SMARTDOCS</h1>
                              <div className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-secondary-500 animate-pulse"></span>
                                <p className="text-[10px] text-primary-400/80 tracking-widest uppercase">System Online</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <button onClick={() => setShowSettings(true)} className="text-gray-400 hover:text-primary-400 transition-colors">
                               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </button>
                            
                            <div className="text-right hidden sm:block border-l border-white/10 pl-6">
                              <p className="text-sm font-bold text-white tracking-wide">{profile.full_name}</p>
                              <p className="text-[10px] text-primary-400 uppercase tracking-widest">{profile.role.replace('_', ' ')}</p>
                            </div>
                            
                            <button onClick={handleSignOut} className="rounded-none border border-red-500/50 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition-all">
                              LOGOUT
                            </button>
                          </div>
                        </div>
                      </div>
                    </header>

                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                      <div className="mb-8 glass-card rounded-xl p-6 border-l-4 border-l-secondary-500">
                        <EnvironmentalImpact studentId={profile.role === 'student' ? user.id : null} />
                      </div>

                      {profile.role === 'student' ? (
                        <StudentDashboard 
                          studentId={user.id} 
                          studentInfo={profile} 
                          onSignOut={handleSignOut}
                          onOpenSettings={() => setShowSettings(true)}
                        />
                      ) : (
                        <SuperAdminDashboard adminId={user.id} />
                      )}
                    </main>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal (Overlay) */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
           <div className="glass-card p-1">
             <Settings
               user={user}
               profile={profile}
               onClose={() => setShowSettings(false)}
             />
           </div>
        </div>
      )}
    </div>
  );
}

export default App;