import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import MemberLogin from './pages/member/Login';
import MemberDashboard from './pages/member/Dashboard';
import MemberSignup from './pages/member/Signup';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import ProtectedMemberRoute from './components/ProtectedMemberRoute';
import NetworkStatus from './components/NetworkStatus';
import BackgroundSync from './components/BackgroundSync';
import MobileNavigation from './components/MobileNavigation';
import InstallPrompt from './components/InstallPrompt';
import NotificationPermission from './components/NotificationPermission';
import InstallPage from './components/InstallPage';
import './styles/global.css';
import './styles/mobile.css';

function App() {
  return (
    <Router>
      <NetworkStatus />
      <BackgroundSync />
      <MobileNavigation />
      <InstallPrompt />
      <NotificationPermission />
      <Routes>
        {/* Member Routes */}
        <Route path="/" element={<MemberLogin />} />
        <Route path="/signup" element={<MemberSignup />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedMemberRoute>
              <MemberDashboard />
            </ProtectedMemberRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          } 
        />
        
        {/* Install Page */}
        <Route path="/install" element={<InstallPage />} />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
