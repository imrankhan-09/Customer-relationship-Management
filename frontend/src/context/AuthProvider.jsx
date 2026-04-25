// src/context/AuthProvider.jsx
import { createContext, useContext, useState } from 'react';
import React from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [permissions, setPermissions] = useState(() => {
    const saved = localStorage.getItem('permissions');
    return saved ? JSON.parse(saved) : [];
  });

  const login = (userData) => {
    const { permissions: userPerms, ...userInfo } = userData;
    setUser(userInfo);
    setPermissions(userPerms || []);
    localStorage.setItem('user', JSON.stringify(userInfo));
    localStorage.setItem('permissions', JSON.stringify(userPerms || []));
  };

  const logout = () => {
    setUser(null);
    setPermissions([]);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('permissions');
  };

  /**
   * Check if user has permission for a specific module and action
   * @param {string} module - e.g. 'users', 'leads', 'opportunities', 'activities'
   * @param {string} action - e.g. 'view', 'create', 'edit', 'delete'
   * @returns {boolean}
   */
  const hasPermission = (module, action) => {
    if (!permissions || permissions.length === 0) return false;
    // Admin has full access
    if (user?.role === 'admin') return true;
    
    const perm = permissions.find(p => p.module === module);
    if (!perm) return false;
    return perm[`can_${action}`] === true;
  };

  /**
   * Get the dashboard path for the current user's role
   * Dynamically determines the path based on role_name
   */
  const getDashboardPath = () => {
    if (!user || !user.role) return '/login';
    const role = user.role.toLowerCase();
    
    // Map roles to their dashboard paths
    const dashboardMap = {
      admin: '/admin-dashboard',
      manager: '/manager-dashboard',
      employee: '/employee-dashboard',
      hr: '/hr-dashboard',
      sales: '/sales-dashboard',
      creator: '/creator/dashboard',
      approver: '/approver/dashboard',
      worker: '/worker/dashboard',
    };

    return dashboardMap[role] || `/${role}-dashboard`;
  };

  return (
    <AuthContext.Provider value={{ user, permissions, login, logout, hasPermission, getDashboardPath }}>
      {children}
    </AuthContext.Provider>
  );
};