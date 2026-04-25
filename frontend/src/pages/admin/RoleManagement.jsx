import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({ role_name: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await api.get('/admin/roles');
      setRoles(res.data);
    } catch (err) {
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/admin/update-role/${editingId}`, formData);
      } else {
        await api.post('/admin/create-role', formData);
      }
      setFormData({ role_name: '' });
      setIsEditing(false);
      setEditingId(null);
      fetchRoles();
    } catch (err) {
      console.error('Error saving role:', err);
      alert(err.response?.data?.message || 'Error saving role');
    }
  };

  const handleEdit = (role) => {
    setFormData({ role_name: role.role_name });
    setIsEditing(true);
    setEditingId(role.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this role? This cannot be undone.')) {
      try {
        await api.delete(`/admin/delete-role/${id}`);
        fetchRoles();
      } catch (err) {
        console.error('Error deleting role:', err);
        alert(err.response?.data?.message || 'Error deleting role');
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
      
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm max-w-xl">
        <h2 className="text-lg font-semibold mb-4">{isEditing ? 'Edit Role' : 'Create New Role'}</h2>
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
            <input type="text" name="role_name" value={formData.role_name} onChange={handleInputChange} required className="w-full border-gray-300 rounded-lg p-2 border" placeholder="e.g. support" />
          </div>
          <div>
            <button type="submit" className="bg-blue-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-blue-700 transition">
              {isEditing ? 'Update Role' : 'Add Role'}
            </button>
          </div>
        </form>
        {isEditing && (
          <button type="button" onClick={() => { setIsEditing(false); setFormData({role_name:''}); }} className="mt-3 text-sm text-gray-500 underline">
            Cancel Edit
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden max-w-3xl">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users Assigned</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.map(r => (
              <tr key={r.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">{r.role_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.user_count}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(r)} className="text-blue-600 hover:text-blue-900 mr-4"><PencilSquareIcon className="w-5 h-5 inline"/></button>
                  <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5 inline"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoleManagement;
