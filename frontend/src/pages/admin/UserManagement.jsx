import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { PencilSquareIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';
import LoginHistoryModal from './LoginHistoryModal';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/admin/update-user/${editingId}`, {
          name: formData.name,
          email: formData.email,
          role_id: formData.role_id
        });
      } else {
        await api.post('/admin/create-user', formData);
      }
      setFormData({ name: '', email: '', password: '', role_id: '' });
      setIsEditing(false);
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error('Error saving user:', err);
      alert(err.response?.data?.message || 'Error saving user');
    }
  };

  const handleEdit = (user) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // do not populate password
      role_id: user.role_id
    });
    setIsEditing(true);
    setEditingId(user.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/admin/delete-user/${id}`);
        fetchData();
      } catch (err) {
        console.error('Error deleting user:', err);
        alert(err.response?.data?.message || 'Error deleting user');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.put(`/admin/toggle-user/${id}`);
      fetchData();
    } catch (err) {
      console.error('Error toggling status:', err);
      alert(err.response?.data?.message || 'Error toggling user status');
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
                <option key={r.id} value={r.id} className="capitalize">{r.role_name}</option>
              ))}
            </select>
          </div>
          <div>
            <button type="submit" className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition">
              {isEditing ? 'Update User' : 'Create User'}
            </button>
            {isEditing && (
              <button type="button" onClick={() => { setIsEditing(false); setFormData({ name: '', email: '', password: '', role_id: '' }); }} className="mt-2 w-full text-sm text-gray-500 underline">
                Cancel Edit
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
              {users.map(u => (
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
                    <button onClick={() => handleToggleStatus(u.id)} className={`px-2 py-1 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(u)} className="text-blue-600 hover:text-blue-900 mr-4" title="Edit"><PencilSquareIcon className="w-5 h-5 inline" /></button>
                    <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-900" title="Delete"><TrashIcon className="w-5 h-5 inline" /></button>
                  </td>
                </tr>
              ))}
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
