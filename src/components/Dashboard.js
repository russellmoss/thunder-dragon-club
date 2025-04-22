import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import Header from './Header';
import Button from './Button';
import MemberManager from './MemberManager';
import TransactionManager from './TransactionManager';
import ReferralManager from './ReferralManager';
import RedemptionManager from './RedemptionManager';
import ConfigManager from './ConfigManager';
import BackupManager from './BackupManager';
import DownloadGuide from './DownloadGuide';
import CSVExport from './CSVExport';
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

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

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
          <div className="section-content">
            <MemberManager />
            <CSVExport />
          </div>
        )}
        {activeSection === 'transactions' && <TransactionManager />}
        {activeSection === 'referrals' && <ReferralManager />}
        {activeSection === 'redemptions' && <RedemptionManager />}
        {activeSection === 'settings' && (
          <div className="section-content">
            <ConfigManager />
            <BackupManager />
            <div className="settings-section">
              <h2>Documentation</h2>
              <DownloadGuide />
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

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

        .dashboard-content {
          background-color: rgba(0, 0, 0, 0.2);
          padding: 20px;
          border-radius: 8px;
        }

        .section-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
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
      `}</style>
    </div>
  );
};

export default Dashboard; 