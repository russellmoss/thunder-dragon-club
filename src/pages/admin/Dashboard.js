import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import Button from '../../components/Button';
import MemberManager from '../../components/MemberManager';
import TransactionManager from '../../components/TransactionManager';
import ReferralManager from '../../components/ReferralManager';
import RedemptionManager from '../../components/RedemptionManager';
import ConfigManager from '../../components/ConfigManager';
import BackupManager from '../../components/BackupManager';
import DownloadGuide from '../../components/DownloadGuide';
import CSVExport from '../../components/CSVExport';
import ReportingDashboard from '../../components/ReportingDashboard';
import MemberForm from '../../components/MemberForm';
import AdminManager from '../../components/AdminManager';
import '../../styles/global.css';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('members');
  const [showMemberForm, setShowMemberForm] = useState(false);
  const { adminUser, isAdmin, loading, adminSignOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!adminUser || !isAdmin)) {
      navigate('/admin');
    }
  }, [adminUser, isAdmin, loading, navigate]);

  const handleLogout = async () => {
    try {
      await adminSignOut();
      navigate('/admin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAddMember = () => {
    setShowMemberForm(true);
  };

  const handleMemberFormClose = () => {
    setShowMemberForm(false);
  };

  const handleMemberFormSuccess = (memberId) => {
    setShowMemberForm(false);
    // You can add any success handling here, like showing a notification
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <Header />
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <Button 
          text="Logout" 
          onClick={handleLogout}
          className="secondary-button"
        />
      </div>

      <div className="dashboard-nav">
        <Button 
          text="Members" 
          onClick={() => setActiveSection('members')}
          className={activeSection === 'members' ? 'active' : ''}
        />
        <Button 
          text="Transactions" 
          onClick={() => setActiveSection('transactions')}
          className={activeSection === 'transactions' ? 'active' : ''}
        />
        <Button 
          text="Referrals" 
          onClick={() => setActiveSection('referrals')}
          className={activeSection === 'referrals' ? 'active' : ''}
        />
        <Button 
          text="Redemptions" 
          onClick={() => setActiveSection('redemptions')}
          className={activeSection === 'redemptions' ? 'active' : ''}
        />
        <Button 
          text="Reports" 
          onClick={() => setActiveSection('reports')}
          className={activeSection === 'reports' ? 'active' : ''}
        />
        <Button 
          text="Settings" 
          onClick={() => setActiveSection('settings')}
          className={activeSection === 'settings' ? 'active' : ''}
        />
      </div>

      <div className="dashboard-content">
        {activeSection === 'members' && (
          <div className="section-content">
            <div className="section-header">
              <h2>Member Management</h2>
              <Button 
                text="Add Member" 
                onClick={handleAddMember}
                className="primary-button"
              />
            </div>
            <MemberManager />
          </div>
        )}

        {activeSection === 'transactions' && (
          <div className="section-content">
            <h2>Transaction Management</h2>
            <TransactionManager />
          </div>
        )}

        {activeSection === 'referrals' && (
          <div className="section-content">
            <h2>Referral Management</h2>
            <ReferralManager />
          </div>
        )}

        {activeSection === 'redemptions' && (
          <div className="section-content">
            <h2>Redemption Management</h2>
            <RedemptionManager />
          </div>
        )}

        {activeSection === 'reports' && (
          <div className="section-content">
            <h2>Reports</h2>
            <ReportingDashboard />
          </div>
        )}

        {activeSection === 'settings' && (
          <div className="section-content">
            <h2>Settings</h2>
            <ConfigManager />
            <div className="settings-section">
              <h2>Backup & Restore</h2>
              <BackupManager />
            </div>
            <div className="settings-section">
              <h2>Admin Management</h2>
              <AdminManager />
            </div>
            <div className="settings-section">
              <h2>Export Data</h2>
              <CSVExport />
            </div>
            <div className="settings-section">
              <h2>Documentation</h2>
              <DownloadGuide />
            </div>
          </div>
        )}
      </div>

      {showMemberForm && (
        <MemberForm 
          onClose={handleMemberFormClose}
          onSuccess={handleMemberFormSuccess}
        />
      )}

      <style>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          width: 100%;
          box-sizing: border-box;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          width: 100%;
          flex-wrap: wrap;
          gap: 10px;
        }

        .admin-header h1 {
          font-size: 1.5rem;
          margin: 0;
        }
        
        .dashboard-nav {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-bottom: 20px;
          width: 100%;
          flex-wrap: wrap;
        }

        .dashboard-content {
          background-color: rgba(0, 0, 0, 0.2);
          padding: 20px;
          border-radius: 8px;
          width: 100%;
          box-sizing: border-box;
        }

        .section-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .primary-button {
          background-color: var(--accent-color);
          color: #000000;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          transition: background-color 0.3s;
        }

        .primary-button:hover {
          background-color: #FFD700;
        }

        .settings-section {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .settings-section h2 {
          margin-bottom: 20px;
          color: var(--header-color);
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-size: 1.2rem;
          color: var(--text-color);
        }

        @media (max-width: 768px) {
          .container {
            padding: 10px;
          }

          .admin-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .admin-header h1 {
            font-size: 1.2rem;
          }

          .dashboard-nav {
            flex-direction: column;
            align-items: stretch;
          }

          .dashboard-nav .button {
            width: 100%;
          }

          .dashboard-content {
            padding: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard; 