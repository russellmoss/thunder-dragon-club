import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedMemberRoute = ({ children }) => {
  const { memberUser, isMember, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!memberUser || !isMember) {
    return <Navigate to="/" />;
  }
  
  return children;
};

export default ProtectedMemberRoute; 