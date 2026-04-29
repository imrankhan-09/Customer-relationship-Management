import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { PencilSquareIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';
import LoginHistoryModal from './LoginHistoryModal';
import { useAuth } from '../../context/AuthProvider';
import { useSearchParams } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError, showInfo } = useNotification();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: ''
  });
  const [userPermissions, setUserPermissions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingRoleName, setEditingRoleName] = useState('');

  const MODULES = ['users', 'leads', 'approved_leads', 'opportunities', 'activities', 'reports'];

  // Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const statusFilter = (searchParams.get('status') || 'all').toLowerCase();
  const filteredUsers = users.filter((u) => {
    if (statusFilter === 'active') return u.is_active === true;
    if (statusFilter === 'inactive' || statusFilter === 'deactivated') return u.is_active === false;
    return true;
  });

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/admin/users-with-last-login'),
        api.get('/admin/roles')
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize permissions
    setUserPermissions(MODULES.map(m => ({
      module: m,
      can_view: false,
      can_create: false,
      can_edit: false,
      can_delete: false
    })));
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePermissionChange = (moduleName, field) => {
    setUserPermissions(prev => prev.map(p => 
      p.module === moduleName ? { ...p, [field]: !p[field] } : p
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing && parseInt(editingId, 10) === parseInt(currentUser?.id, 10)) {
        showError('Admin cannot modify their own role or status');
        return;
      }
      if (isEditing) {
        await api.put(`/admin/update-user/${editingId}`, {
          ...formData,
          permissions: userPermissions
        });
        showSuccess('User Updated Successfully');
      } else {
        await api.post('/admin/create-user', {
          ...formData,
          permissions: userPermissions
        });
        showSuccess('User Created Successfully');
      }
      setFormData({ name: '', email: '', password: '', role_id: '' });
      setUserPermissions(MODULES.map(m => ({
        module: m,
        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false
      })));
      setIsEditing(false);
      setEditingId(null);
      setEditingRoleName('');
      fetchData();
    } catch (err) {
      console.error('Error saving user:', err);
      showError(err.response?.data?.message || 'Error saving user');
    }
  };

  const handleEdit = async (user) => {
    if (parseInt(user.id, 10) === parseInt(currentUser?.id, 10)) {
      showError('Admin cannot modify their own role or status');
      return;
    }
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // do not populate password
      role_id: user.role_id
    });
    setIsEditing(true);
    setEditingId(user.id);
    setEditingRoleName(user.role_name || '');

    // Fetch user permissions
    try {
      const res = await api.get(`/admin/user-permissions/${user.id}`);
      const dbPerms = res.data;
      const completePerms = MODULES.map(m => {
        const existing = dbPerms.find(p => p.module === m);
        return existing ? {
          module: m,
          can_view: existing.can_view,
          can_create: existing.can_create,
          can_edit: existing.can_edit,
          can_delete: existing.can_delete
        } : {
          module: m,
          can_view: false,
          can_create: false,
          can_edit: false,
          can_delete: false
        };
      });
      setUserPermissions(completePerms);
    } catch (err) {
      console.error('Error fetching user permissions:', err);
    }
  };

  const handleDelete = async (id) => {
    if (parseInt(id, 10) === parseInt(currentUser?.id, 10)) {
      showError('Admin cannot modify their own role or status');
      return;
    }
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/admin/delete-user/${id}`);
        showSuccess('User Deleted Successfully');
        fetchData();
      } catch (err) {
        console.error('Error deleting user:', err);
        showError(err.response?.data?.message || 'Error deleting user');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    if (parseInt(id, 10) === parseInt(currentUser?.id, 10)) {
      showError('Admin cannot modify their own role or status');
      return;
    }
    try {
      await api.put(`/admin/toggle-user/${id}`);
      showInfo('User Status Updated');
      fetchData();
    } catch (err) {
      console.error('Error toggling status:', err);
      showError(err.response?.data?.message || 'Error toggling user status');
    }
  };

  const openHistoryModal = (user) => {
    setSelectedUserId(user.id);
    setSelectedUserName(user.name);
    setIsHistoryModalOpen(true);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never Logged In';
    return new Date(timestamp).toLocaleString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">User Management</h1>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">{isEditing ? 'Edit User' : 'Create New User'}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full border-gray-300 rounded-lg p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full border-gray-300 rounded-lg p-2 border" />
          </div>
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleInputChange} required className="w-full border-gray-300 rounded-lg p-2 border" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select name="role_id" value={formData.role_id} onChange={handleInputChange} required className="w-full border-gray-300 rounded-lg p-2 border">
              <option value="">Select Role</option>
              {roles.map(r => (
                <option
                  key={r.id}
                  value={r.id}
                  className="capitalize"
                  disabled={isEditing && editingRoleName === 'admin' && r.role_name !== 'admin'}
                >
                  {r.role_name}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-4 mt-4 border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Custom Permissions (Overrides Role)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead>
                  <tr>
                    <th className="px-2 py-1 text-left font-semibold text-gray-600">Module</th>
                    <th className="px-2 py-1 text-center font-semibold text-gray-600">View</th>
                    <th className="px-2 py-1 text-center font-semibold text-gray-600">Create</th>
                    <th className="px-2 py-1 text-center font-semibold text-gray-600">Edit</th>
                    <th className="px-2 py-1 text-center font-semibold text-gray-600">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {userPermissions.map((perm) => (
                    <tr key={perm.module}>
                      <td className="px-2 py-2 font-medium text-gray-800 capitalize">{perm.module}</td>
                      <td className="px-2 py-2 text-center">
                        <input type="checkbox" checked={perm.can_view} onChange={() => handlePermissionChange(perm.module, 'can_view')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <input type="checkbox" checked={perm.can_create} onChange={() => handlePermissionChange(perm.module, 'can_create')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <input type="checkbox" checked={perm.can_edit} onChange={() => handlePermissionChange(perm.module, 'can_edit')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <input type="checkbox" checked={perm.can_delete} onChange={() => handlePermissionChange(perm.module, 'can_delete')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-4 flex gap-4 mt-4">
            <button type="submit" className="flex-1 bg-blue-600 text-white font-medium py-2.5 px-4 rounded-xl hover:bg-blue-700 transition shadow-sm">
              {isEditing ? 'Update User & Permissions' : 'Create User with Permissions'}
            </button>
            {isEditing && (
              <button 
                type="button" 
                onClick={() => { 
                  setIsEditing(false); 
                  setEditingRoleName(''); 
                  setFormData({ name: '', email: '', password: '', role_id: '' });
                  setUserPermissions(MODULES.map(m => ({
                    module: m,
                    can_view: false,
                    can_create: false,
                    can_edit: false,
                    can_delete: false
                  })));
                }} 
                className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{u.role_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <span>{formatTime(u.last_login)}</span>
                      <button
                        onClick={() => openHistoryModal(u)}
                        className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 hover:bg-blue-100 rounded transition"
                        title="View Login History"
                      >
                        <ClockIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleToggleStatus(u.id)}
                      disabled={parseInt(u.id, 10) === parseInt(currentUser?.id, 10)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} disabled:opacity-60 disabled:cursor-not-allowed`}
                      title={parseInt(u.id, 10) === parseInt(currentUser?.id, 10) ? 'Admin cannot modify their own role or status' : ''}
                    >
                      {u.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(u)}
                      disabled={parseInt(u.id, 10) === parseInt(currentUser?.id, 10)}
                      className="text-blue-600 hover:text-blue-900 mr-4 disabled:opacity-40 disabled:cursor-not-allowed"
                      title={parseInt(u.id, 10) === parseInt(currentUser?.id, 10) ? 'Admin cannot modify their own role or status' : 'Edit'}
                    >
                      <PencilSquareIcon className="w-5 h-5 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      disabled={parseInt(u.id, 10) === parseInt(currentUser?.id, 10)}
                      className="text-red-600 hover:text-red-900 disabled:opacity-40 disabled:cursor-not-allowed"
                      title={parseInt(u.id, 10) === parseInt(currentUser?.id, 10) ? 'Admin cannot modify their own role or status' : 'Delete'}
                    >
                      <TrashIcon className="w-5 h-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-6 text-center text-sm text-gray-500">No users found for selected filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LoginHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        userId={selectedUserId}
        userName={selectedUserName}
      />
    </div>
  );
};

export default UserManagement;
