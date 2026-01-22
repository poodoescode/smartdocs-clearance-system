import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase'; // ✅ Import shared Supabase client
import { ConfirmModal } from './Modal';

export default function SuperAdminDashboard({ adminId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, students, admins, inactive
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateUser = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Log admin action
      await logAdminAction('deactivate_user', selectedUser.id);

      toast.success(`User ${selectedUser.full_name} deactivated`);
      fetchUsers();
      setShowDeactivateModal(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error('Failed to deactivate user');
      console.error(error);
    }
  };

  const handleReactivateUser = async (user) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', user.id);

      if (error) throw error;

      // Log admin action
      await logAdminAction('reactivate_user', user.id);

      toast.success(`User ${user.full_name} reactivated`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to reactivate user');
      console.error(error);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    // Prevent self-deletion
    if (selectedUser.id === adminId) {
      toast.error('You cannot delete your own account');
      return;
    }

    try {
      // Delete user from auth (this will cascade to profiles)
      const { error } = await supabase.auth.admin.deleteUser(selectedUser.id);

      if (error) throw error;

      // Log admin action
      await logAdminAction('delete_user', selectedUser.id);

      toast.success(`User ${selectedUser.full_name} deleted permanently`);
      fetchUsers();
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error('Failed to delete user');
      console.error(error);
    }
  };

  const logAdminAction = async (actionType, targetUserId) => {
    try {
      await supabase.from('admin_actions').insert({
        admin_id: adminId,
        action_type: actionType,
        target_user_id: targetUserId,
        details: { timestamp: new Date().toISOString() }
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    // Filter by status
    if (filter === 'students' && user.role !== 'student') return false;
    if (filter === 'admins' && user.role === 'student') return false;
    if (filter === 'inactive' && user.is_active) return false;

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        user.full_name?.toLowerCase().includes(search) ||
        user.student_number?.toLowerCase().includes(search) ||
        user.role?.toLowerCase().includes(search)
      );
    }

    return true;
  });

  const getRoleBadge = (role) => {
    const badges = {
      student: 'bg-blue-100 text-blue-800',
      library_admin: 'bg-purple-100 text-purple-800',
      cashier_admin: 'bg-green-100 text-green-800',
      registrar_admin: 'bg-orange-100 text-orange-800',
      super_admin: 'bg-red-100 text-red-800'
    };
    return badges[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-red-500 to-pink-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Super Admin Dashboard</h2>
            <p className="text-red-100">Manage all users and administrators</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{users.length}</div>
            <div className="text-sm text-red-100">Total Users</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'student').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role !== 'student').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => !u.is_active).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, student number, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('students')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'students'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Students
            </button>
            <button
              onClick={() => setFilter('admins')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'admins'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Admins
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'inactive'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                      {user.student_number && (
                        <div className="text-sm text-gray-500">{user.student_number}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.is_active ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {user.is_active ? (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeactivateModal(true);
                          }}
                          disabled={user.id === adminId}
                          className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Deactivate user"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivateUser(user)}
                          className="text-green-600 hover:text-green-900"
                          title="Reactivate user"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDeleteModal(true);
                        }}
                        disabled={user.id === adminId}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete user permanently"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500 text-lg">No users found</p>
          </div>
        )}
      </div>

      {/* Deactivate Modal */}
      <ConfirmModal
        isOpen={showDeactivateModal}
        onClose={() => {
          setShowDeactivateModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeactivateUser}
        title="Deactivate User"
        message={`Are you sure you want to deactivate ${selectedUser?.full_name}? They will not be able to log in until reactivated.`}
        confirmText="Deactivate"
        type="warning"
      />

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteUser}
        title="Delete User Permanently"
        message={`Are you sure you want to permanently delete ${selectedUser?.full_name}? This action cannot be undone and all their data will be removed.`}
        confirmText="Delete Permanently"
        type="danger"
      />
    </div>
  );
}
