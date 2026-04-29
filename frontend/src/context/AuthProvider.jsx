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
    // Admin has full access — check FIRST before anything else
    if (user?.role === 'admin') return true;
    
    if (!permissions || permissions.length === 0) return false;
    
    const perm = permissions.find(p => p.module === module);
    if (!perm) return false;

    // Map semantic actions to DB columns (matches backend roleMiddleware)
    const actionMap = {
      'view': 'can_view',
      'create': 'can_create',
      'edit': 'can_edit',
      'delete': 'can_delete',
      'approve': 'can_edit'
    };
    
    const column = actionMap[action] || `can_${action}`;
    return perm[column] === true;
  };

  /**
   * Get the dashboard path for the current user's role
   * Dynamically determines the path based on role_name
   */
  const getDashboardPath = (providedUser) => {
    const activeUser = providedUser || user;
    if (!activeUser || !activeUser.role) return '/login';
    
    if (activeUser.role === 'admin') return '/admin-dashboard';
    return '/dashboard';
  };

  return (
    <AuthContext.Provider value={{ user, permissions, login, logout, hasPermission, getDashboardPath }}>
      {children}
    </AuthContext.Provider>
  );
};