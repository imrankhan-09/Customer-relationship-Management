// src/routes/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import React from 'react';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, getDashboardPath } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the user's own dashboard dynamically
    return <Navigate to={getDashboardPath()} replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute;