import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedAdminRoute = ({ children }) => {
  const { adminUser, isAdmin, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!adminUser || !isAdmin) {
    return <Navigate to="/admin" />;
  }
  
  return children;
};

export default ProtectedAdminRoute; 