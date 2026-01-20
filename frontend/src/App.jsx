import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import ReCAPTCHA from 'react-google-recaptcha';
import toast from 'react-hot-toast';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import EnvironmentalImpact from './components/EnvironmentalImpact';
import PasswordInput from './components/PasswordInput';
import PasswordStrengthMeter from './components/PasswordStrengthMeter';
import Settings from './components/Settings';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// reCAPTCHA Site Key
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpData, setSignUpData] = useState({
    firstName: '',
    lastName: '',
    role: 'student',
    studentNumber: '',
    courseYear: ''
  });
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const recaptchaRef = useRef(null);

  // Check for existing session on mount
  useEffect(() => {
    checkUser();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
        
        // Update last_login
        if (event === 'SIGNED_IN') {
          await supabase
            .from('profiles')
            .update({ last_login: new Date().toISOString() })
            .eq('id', session.user.id);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      await fetchProfile(session.user.id);
    }
    setLoading(false);
  };

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      // Check if account is active
      if (!data.is_active) {
        toast.error('Your account has been deactivated. Please contact support.');
        await supabase.auth.signOut();
        return;
      }
      setProfile(data);
      
      // Apply saved theme
      const theme = data.theme_preference || localStorage.getItem('theme') || 'light';
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          toast.error('Please verify your email before signing in. Check your inbox for the verification link.');
        } else {
          toast.error(error.message);
        }
        throw error;
      }
      
      setUser(data.user);
      await fetchProfile(data.user.id);
      toast.success('Welcome back!');
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate first name and last name
      if (!signUpData.firstName.trim() || signUpData.firstName.trim().length < 2) {
        throw new Error('First name must be at least 2 characters');
      }

      if (!signUpData.lastName.trim() || signUpData.lastName.trim().length < 2) {
        throw new Error('Last name must be at least 2 characters');
      }

      // Validate password confirmation
      if (!confirmPassword) {
        throw new Error('Please confirm your password');
      }
      
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Validate password strength
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[^A-Za-z0-9]/.test(password);

      if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
        throw new Error('Password must contain uppercase, lowercase, number, and special character');
      }

      // Validate reCAPTCHA
      if (!recaptchaToken) {
        throw new Error('Please complete the reCAPTCHA verification');
      }

      // Call backend signup endpoint with reCAPTCHA token
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName: signUpData.firstName.trim(),
          lastName: signUpData.lastName.trim(),
          role: signUpData.role,
          studentNumber: signUpData.role === 'student' ? signUpData.studentNumber : null,
          courseYear: signUpData.role === 'student' ? signUpData.courseYear : null,
          recaptchaToken: recaptchaToken
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Signup failed');
      }

      // Success - show message and switch to sign in
      toast.success('Account created! Check your email to verify your account before signing in.', {
        duration: 6000
      });
      setIsSignUp(false);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setSignUpData({
        firstName: '',
        lastName: '',
        role: 'student',
        studentNumber: '',
        courseYear: ''
      });
      setRecaptchaToken(null);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }

    } catch (error) {
      toast.error(error.message);
      // Reset reCAPTCHA on error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setRecaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    toast.success('Signed out successfully');
  };

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  const handleRecaptchaExpired = () => {
    setRecaptchaToken(null);
    toast.error('reCAPTCHA expired. Please verify again.');
  };

  const handleRecaptchaError = () => {
    setRecaptchaToken(null);
    toast.error('reCAPTCHA error. Please try again.');
  };

  // Loading state
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-600 text-xl font-medium">Loading SmartDocs...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login/signup
  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">SmartDocs</h1>
            <p className="text-gray-600">Digital Document Request & Clearance System</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Paperless
              </span>
            </div>
          </div>

          {/* Auth Form */}
          <div className="card animate-slide-up">
            {!isSignUp ? (
              // Sign In Form
              <form onSubmit={handleSignIn} className="space-y-5">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-field"
                    placeholder="you@school.edu"
                  />
                </div>

                <PasswordInput
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-base"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(true)}
                      className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                      Sign Up
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              // Sign Up Form with reCAPTCHA
              <form onSubmit={handleSignUp} className="space-y-5">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h2>
                
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={signUpData.firstName}
                    onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                    required
                    minLength={2}
                    className="input-field"
                    placeholder="Juan"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={signUpData.lastName}
                    onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                    required
                    minLength={2}
                    className="input-field"
                    placeholder="Dela Cruz"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-field"
                    placeholder="you@school.edu"
                  />
                </div>

                {/* Password */}
                <PasswordInput
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <PasswordStrengthMeter password={password} />

                {/* Confirm Password */}
                <PasswordInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                )}

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={signUpData.role}
                    onChange={(e) => setSignUpData({ ...signUpData, role: e.target.value })}
                    className="input-field"
                  >
                    <option value="student">Student</option>
                    <option value="library_admin">Library Admin</option>
                    <option value="cashier_admin">Cashier Admin</option>
                    <option value="registrar_admin">Registrar Admin</option>
                  </select>
                </div>

                {/* Student-specific fields */}
                {signUpData.role === 'student' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Student Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={signUpData.studentNumber}
                        onChange={(e) => setSignUpData({ ...signUpData, studentNumber: e.target.value })}
                        required
                        className="input-field"
                        placeholder="2021-12345"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course & Year <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={signUpData.courseYear}
                        onChange={(e) => setSignUpData({ ...signUpData, courseYear: e.target.value })}
                        required
                        className="input-field"
                        placeholder="BSCS 4th Year"
                      />
                    </div>
                  </>
                )}

                {/* reCAPTCHA v2 - Placed ABOVE the Sign Up button */}
                <div className="flex justify-center pt-2">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={RECAPTCHA_SITE_KEY}
                    onChange={handleRecaptchaChange}
                    onExpired={handleRecaptchaExpired}
                    onErrored={handleRecaptchaError}
                    theme="light"
                  />
                </div>

                {/* Sign Up Button */}
                <button
                  type="submit"
                  disabled={loading || !recaptchaToken}
                  className="btn-primary w-full py-3 text-base"
                >
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>

                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(false);
                        setRecaptchaToken(null);
                        if (recaptchaRef.current) {
                          recaptchaRef.current.reset();
                        }
                      }}
                      className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            🌱 Going paperless, one document at a time
          </p>
        </div>
      </div>
    );
  }

  // Authenticated - show dashboard based on role
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SmartDocs</h1>
                <p className="text-xs text-gray-500">Digital Clearance System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSettings(true)}
                className="text-gray-600 hover:text-gray-900 transition-colors"
                title="Settings"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{profile.role.replace('_', ' ')}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="btn-secondary text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Environmental Impact Dashboard - visible to all */}
        <div className="mb-8">
          <EnvironmentalImpact studentId={profile.role === 'student' ? user.id : null} />
        </div>

        {/* Role-based Dashboard */}
        {profile.role === 'student' ? (
          <StudentDashboard studentId={user.id} studentInfo={profile} />
        ) : profile.role === 'super_admin' ? (
          <SuperAdminDashboard adminId={user.id} />
        ) : (
          <AdminDashboard adminId={user.id} adminRole={profile.role} />
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          user={user}
          profile={profile}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
