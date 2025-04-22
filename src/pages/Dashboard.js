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
        <button onClick={handleLogout} className="button secondary-button">Logout</button>
      </div>
      
      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="dashboard-nav" style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '20px',
            width: '100%'
          }}>
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
              text="Configuration" 
              onClick={() => setActiveSection('config')}
              className={activeSection === 'config' ? 'active' : ''}
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
            {activeSection === 'config' && <ConfigManager />}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard; 