import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useNotification } from '../../context/NotificationContext';

const PermissionManagement = () => {
  const { showSuccess, showError } = useNotification();
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Define the standard modules
  const ALL_MODULES = ['users', 'leads', 'approved_leads', 'opportunities', 'activities', 'reports'];

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await api.get('/admin/roles');
      setRoles(res.data);
      if (res.data.length > 0) {
        setSelectedRole(res.data[0].id);
        fetchPermissions(res.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async (roleId) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/permissions/${roleId}`);
      
      // Initialize modules if they don't exist in DB yet
      let dbPerms = res.data;
      const completePerms = ALL_MODULES.map(moduleName => {
        const existing = dbPerms.find(p => p.module === moduleName);
        if (existing) return existing;
        return {
          module: moduleName,
          can_view: false,
          can_create: false,
          can_edit: false,
          can_delete: false
        };
      });
      
      setPermissions(completePerms);
    } catch (err) {
      console.error('Error fetching permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (e) => {
    const roleId = e.target.value;
    setSelectedRole(roleId);
    fetchPermissions(roleId);
  };

  const handleCheckboxChange = (moduleIdx, field) => {
    const updated = [...permissions];
    updated[moduleIdx][field] = !updated[moduleIdx][field];
    setPermissions(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/permissions/${selectedRole}`, {
        permissions: permissions
      });
      showSuccess('Permissions saved successfully!');
    } catch (err) {
      console.error('Error saving permissions:', err);
      showError(err.response?.data?.message || 'Error saving permissions');
    } finally {
      setSaving(false);
    }
  };

  if (loading && roles.length === 0) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Permission Management</h1>
      
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="mb-6 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Role to Edit Permissions</label>
          <select 
            value={selectedRole} 
            onChange={handleRoleChange} 
            className="w-full border-gray-300 rounded-lg p-2 border focus:ring-blue-500 focus:border-blue-500"
          >
            {roles.map(r => (
              <option key={r.id} value={r.id} className="capitalize">{r.role_name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading permissions...</div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">View</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Create</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Edit</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Delete</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {permissions.map((perm, idx) => (
                    <tr key={perm.module}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                        {perm.module}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input 
                          type="checkbox" 
                          checked={perm.can_view} 
                          onChange={() => handleCheckboxChange(idx, 'can_view')}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input 
                          type="checkbox" 
                          checked={perm.can_create} 
                          onChange={() => handleCheckboxChange(idx, 'can_create')}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input 
                          type="checkbox" 
                          checked={perm.can_edit} 
                          onChange={() => handleCheckboxChange(idx, 'can_edit')}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input 
                          type="checkbox" 
                          checked={perm.can_delete} 
                          onChange={() => handleCheckboxChange(idx, 'can_delete')}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-blue-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PermissionManagement;
