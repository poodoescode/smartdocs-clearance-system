import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase'; // ✅ Import shared Supabase client
import PasswordInput from './PasswordInput';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import { ConfirmModal } from './Modal';

export default function Settings({ user, profile, onClose }) {
  const [activeTab, setActiveTab] = useState('appearance');
  const [theme, setTheme] = useState(profile?.theme_preference || 'light');
  const [loading, setLoading] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    // Apply theme
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ theme_preference: newTheme })
        .eq('id', user.id);

      if (error) throw error;

      // Store in localStorage as backup
      localStorage.setItem('theme', newTheme);
      toast.success(`Switched to ${newTheme} mode`);
    } catch (error) {
      toast.error('Failed to save theme preference');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) {
        toast.error('Current password is incorrect');
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      toast.error('Failed to update password');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      // NOTE: Email verification has been intentionally disabled
      // Email is updated immediately without verification
      toast.success('Email updated successfully');
      setNewEmail('');
    } catch (error) {
      toast.error('Failed to update email');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);

    try {
      // In production, you'd call a backend endpoint to handle this
      toast.error('Account deletion must be requested through support');
      setShowDeleteModal(false);
    } catch (error) {
      toast.error('Failed to delete account');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-200 p-4">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('appearance')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'appearance'
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    Appearance
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('account')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'account'
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Account
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'security'
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Security
                  </div>
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleThemeChange('light')}
                        disabled={loading}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          theme === 'light'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white border border-gray-300 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">Light</p>
                            <p className="text-sm text-gray-500">Default theme</p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => handleThemeChange('dark')}
                        disabled={loading}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          theme === 'dark'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                            </svg>
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">Dark</p>
                            <p className="text-sm text-gray-500">Easy on the eyes</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={profile?.full_name || ''}
                          disabled
                          className="input-field bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="input-field bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                        <input
                          type="text"
                          value={profile?.role?.replace('_', ' ').toUpperCase() || ''}
                          disabled
                          className="input-field bg-gray-50 capitalize"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Change Email */}
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Email</h3>
                    <form onSubmit={handleEmailChange} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Email</label>
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="input-field"
                          placeholder="newemail@example.com"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Your email will be updated immediately
                        </p>
                      </div>
                      <button
                        type="submit"
                        disabled={loading || !newEmail}
                        className="btn-primary"
                      >
                        {loading ? 'Updating...' : 'Update Email'}
                      </button>
                    </form>
                  </div>

                  {/* Delete Account */}
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="btn-danger"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <PasswordInput
                        label="Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />

                      <PasswordInput
                        label="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                      <PasswordStrengthMeter password={newPassword} />

                      <PasswordInput
                        label="Confirm New Password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                        minLength={8}
                      />

                      {confirmNewPassword && newPassword !== confirmNewPassword && (
                        <p className="text-sm text-red-600">Passwords do not match</p>
                      )}

                      <button
                        type="submit"
                        disabled={loading || !currentPassword || !newPassword || newPassword !== confirmNewPassword}
                        className="btn-primary"
                      >
                        {loading ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently removed."
        confirmText="Delete Account"
        type="danger"
      />
    </div>
  );
}
