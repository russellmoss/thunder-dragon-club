import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import Header from '../components/Header';
import Button from '../components/Button';
import MemberManager from '../components/MemberManager';
import TransactionManager from '../components/TransactionManager';
import ReferralManager from '../components/ReferralManager';
import RedemptionManager from '../components/RedemptionManager';
import ConfigManager from '../components/ConfigManager';
import CSVExport from '../components/CSVExport';
import DownloadGuide from '../components/DownloadGuide';
import BackupManager from '../components/BackupManager';
import '../styles/global.css';

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('members');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is authenticated
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/');
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="container">
      <Header />
      <div className="admin-header">
        <h1>Thunder Dragon Club Dashboard</h1>
        <Button 
          text="Logout" 
          onClick={handleLogout}
          className="secondary-button"
        />
      </div>
      
      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
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
              text="Settings" 
              onClick={() => setActiveSection('settings')}
              className={activeSection === 'settings' ? 'active' : ''}
            />
          </div>
          
          <div className="dashboard-content">
            {activeSection === 'members' && (
              <>
                <MemberManager />
                <CSVExport />
              </>
            )}
            {activeSection === 'transactions' && <TransactionManager />}
            {activeSection === 'referrals' && <ReferralManager />}
            {activeSection === 'redemptions' && <RedemptionManager />}
            {activeSection === 'settings' && (
              <>
                <ConfigManager />
                <BackupManager />
                <div className="settings-section">
                  <h2>Documentation</h2>
                  <DownloadGuide />
                </div>
              </>
            )}
          </div>
        </>
      )}
      <style>
        {`
          .admin-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            width: 100%;
          }
          
          .dashboard-nav {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-bottom: 20px;
            width: 100%;
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
        `}
      </style>
    </div>
  );
};

export default Dashboard; 