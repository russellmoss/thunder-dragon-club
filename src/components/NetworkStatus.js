import React, { useState, useEffect } from 'react';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    // Function to update online status
    const handleStatusChange = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      // Show message when status changes
      setShowMessage(true);
      
      // Hide message after 5 seconds
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    };

    // Add event listeners
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    // Clean up
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  // Only render when there's a message to show
  if (!showMessage) return null;

  return (
    <div className={`network-status ${isOnline ? 'online' : 'offline'}`}>
      {isOnline ? (
        <div className="status-message online">
          <span className="icon">✓</span>
          <span>You're back online!</span>
        </div>
      ) : (
        <div className="status-message offline">
          <span className="icon">!</span>
          <span>You're offline. Some features may be limited.</span>
        </div>
      )}
      
      <style jsx>{`
        .network-status {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 20px;
          border-radius: 8px;
          z-index: 1000;
          display: flex;
          align-items: center;
          animation: slideIn 0.3s ease-out forwards;
          max-width: 90%;
        }
        
        .online {
          background-color: rgba(76, 175, 80, 0.9);
        }
        
        .offline {
          background-color: rgba(255, 152, 0, 0.9);
        }
        
        .status-message {
          display: flex;
          align-items: center;
          color: white;
          font-weight: 500;
        }
        
        .icon {
          margin-right: 10px;
          font-size: 1.2rem;
        }
        
        @keyframes slideIn {
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

export default NetworkStatus; 