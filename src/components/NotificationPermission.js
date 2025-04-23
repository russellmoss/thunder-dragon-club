import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { requestNotificationPermission, registerDeviceToken, notificationUtils } from '../utils/notificationService';

const NotificationPermission = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [status, setStatus] = useState('default');
  const { userData } = useAuth();
  
  useEffect(() => {
    // Only show for logged-in users who haven't been asked recently
    if (!userData || !notificationUtils.isSupported()) return;
    
    const lastPrompted = localStorage.getItem('notificationPromptTime');
    const now = Date.now();
    
    // Don't prompt if already granted or denied
    if (notificationUtils.permissionStatus() !== 'default') {
      setStatus(notificationUtils.permissionStatus());
      return;
    }
    
    // Don't prompt if prompted in the last 7 days
    if (lastPrompted && now - parseInt(lastPrompted) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }
    
    // Show the prompt
    setShowPrompt(true);
  }, [userData]);
  
  const handleRequestPermission = async () => {
    setShowPrompt(false);
    
    // Store that we prompted the user
    localStorage.setItem('notificationPromptTime', Date.now().toString());
    
    const token = await requestNotificationPermission();
    
    if (token && userData) {
      // Register the token with your backend
      await registerDeviceToken(userData.id, token);
      setStatus('granted');
    } else {
      setStatus('denied');
    }
  };
  
  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notificationPromptTime', Date.now().toString());
  };
  
  if (!showPrompt) return null;
  
  return (
    <div className="notification-prompt">
      <div className="notification-content">
        <div className="notification-icon">🔔</div>
        <div className="notification-text">
          <h3>Stay Updated</h3>
          <p>Get notified about new points, referral bonuses, and special promotions.</p>
        </div>
        <div className="notification-actions">
          <button 
            className="allow-button"
            onClick={handleRequestPermission}
          >
            Allow
          </button>
          <button 
            className="dismiss-button"
            onClick={handleDismiss}
          >
            Not Now
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .notification-prompt {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 500px;
          background-color: var(--background-color);
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
          z-index: 1000;
          animation: slideUp 0.3s ease-out;
        }
        
        .notification-content {
          padding: 20px;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .notification-icon {
          font-size: 2rem;
          margin-right: 15px;
        }
        
        .notification-text {
          flex: 1;
          min-width: 150px;
        }
        
        .notification-text h3 {
          margin: 0 0 5px 0;
          color: var(--header-color);
        }
        
        .notification-text p {
          margin: 0;
          font-size: 0.9rem;
          color: var(--text-color);
        }
        
        .notification-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
          width: 100%;
        }
        
        .allow-button, .dismiss-button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          flex: 1;
        }
        
        .allow-button {
          background-color: var(--accent-color);
          color: #000000;
          font-weight: bold;
        }
        
        .dismiss-button {
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
        }
        
        @keyframes slideUp {
          from {
            transform: translate(-50%, 100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationPermission; 