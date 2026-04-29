// src/routes/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import React from 'react';

const ProtectedRoute = ({ module, action, allowedRoles }) => {
  const { user, hasPermission, getDashboardPath } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  
  // If allowedRoles is provided, check it (legacy support)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath()} replace />;
  }

  // If module/action is provided, check permissions
  if (module && action && !hasPermission(module, action)) {
    console.warn(`Access denied for ${user?.role} to ${module}.${action}. Redirecting to login.`);
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute;