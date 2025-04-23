import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notificationUtils } from '../utils/notificationService';

const NotificationSettings = () => {
  const { userData } = useAuth();
  const [settings, setSettings] = useState({
    points: true,
    referrals: true,
    promotions: true,
    system: true
  });
  const [permissionStatus, setPermissionStatus] = useState('default');
  
  useEffect(() => {
    if (userData) {
      // Load saved settings from user data
      setSettings(userData.notificationSettings || settings);
    }
    
    // Check notification permission status
    setPermissionStatus(notificationUtils.permissionStatus());
  }, [userData]);
  
  const handleToggle = async (setting) => {
    if (permissionStatus !== 'granted') {
      // If notifications are not enabled, show a message
      alert('Please enable notifications in your browser settings to use this feature.');
      return;
    }
    
    const newSettings = {
      ...settings,
      [setting]: !settings[setting]
    };
    
    setSettings(newSettings);
    
    // Update settings in the database
    if (userData) {
      try {
        await updateDoc(doc(db, 'users', userData.id), {
          notificationSettings: newSettings
        });
      } catch (error) {
        console.error('Error updating notification settings:', error);
        // Revert the change if update fails
        setSettings(settings);
      }
    }
  };
  
  const handleOpenSettings = () => {
    if (window.Notification && window.Notification.permission === 'denied') {
      // Open browser settings
      if (window.chrome) {
        window.open('chrome://settings/content/notifications');
      } else if (window.safari) {
        window.open('safari://settings/notifications');
      } else {
        alert('Please enable notifications in your browser settings.');
      }
    }
  };
  
  return (
    <div className="notification-settings">
      <h2>Notification Settings</h2>
      
      {permissionStatus === 'denied' && (
        <div className="permission-warning">
          <p>Notifications are currently disabled in your browser settings.</p>
          <button onClick={handleOpenSettings}>
            Open Browser Settings
          </button>
        </div>
      )}
      
      <div className="settings-list">
        <div className="setting-item">
          <div className="setting-info">
            <h3>Points Updates</h3>
            <p>Get notified when you earn or redeem points</p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.points}
              onChange={() => handleToggle('points')}
              disabled={permissionStatus !== 'granted'}
            />
            <span className="slider"></span>
          </label>
        </div>
        
        <div className="setting-item">
          <div className="setting-info">
            <h3>Referral Bonuses</h3>
            <p>Get notified when someone uses your referral code</p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.referrals}
              onChange={() => handleToggle('referrals')}
              disabled={permissionStatus !== 'granted'}
            />
            <span className="slider"></span>
          </label>
        </div>
        
        <div className="setting-item">
          <div className="setting-info">
            <h3>Promotions</h3>
            <p>Get notified about special offers and promotions</p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.promotions}
              onChange={() => handleToggle('promotions')}
              disabled={permissionStatus !== 'granted'}
            />
            <span className="slider"></span>
          </label>
        </div>
        
        <div className="setting-item">
          <div className="setting-info">
            <h3>System Updates</h3>
            <p>Get notified about important system updates</p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.system}
              onChange={() => handleToggle('system')}
              disabled={permissionStatus !== 'granted'}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>
      
      <style jsx>{`
        .notification-settings {
          padding: 20px;
          max-width: 600px;
          margin: 0 auto;
        }
        
        h2 {
          color: var(--header-color);
          margin-bottom: 20px;
        }
        
        .permission-warning {
          background-color: rgba(255, 0, 0, 0.1);
          border: 1px solid rgba(255, 0, 0, 0.2);
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .permission-warning button {
          background-color: var(--accent-color);
          color: #000000;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          margin-top: 10px;
          cursor: pointer;
        }
        
        .settings-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }
        
        .setting-info {
          flex: 1;
        }
        
        .setting-info h3 {
          margin: 0 0 5px 0;
          color: var(--header-color);
        }
        
        .setting-info p {
          margin: 0;
          font-size: 0.9rem;
          color: var(--text-color);
        }
        
        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }
        
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.1);
          transition: .4s;
          border-radius: 24px;
        }
        
        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        
        input:checked + .slider {
          background-color: var(--accent-color);
        }
        
        input:checked + .slider:before {
          transform: translateX(26px);
        }
        
        input:disabled + .slider {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default NotificationSettings; 