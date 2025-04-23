import React, { useState, useEffect } from 'react';
import { getUnsyncedTransactions, getUnsyncedRedemptions } from '../utils/indexedDB';

const BackgroundSync = () => {
  const [pendingCount, setPendingCount] = useState(0);
  
  useEffect(() => {
    const checkPendingItems = async () => {
      try {
        // Get both unsynced transactions and redemptions
        const [transactions, redemptions] = await Promise.all([
          getUnsyncedTransactions(),
          getUnsyncedRedemptions()
        ]);

        // Set total pending count
        setPendingCount(transactions.length + redemptions.length);
      } catch (error) {
        console.error('Error checking pending items:', error);
      }
    };
    
    // Check immediately
    checkPendingItems();
    
    // Check every 30 seconds
    const interval = setInterval(checkPendingItems, 30000);
    
    // Also check when coming back online
    const handleOnline = () => {
      checkPendingItems();
      
      // Trigger sync if service worker is supported
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(registration => {
          registration.sync.register('sync-transactions');
          registration.sync.register('sync-redemptions');
        });
      }
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
    };
  }, []);
  
  if (pendingCount === 0) return null;
  
  return (
    <div className="background-sync">
      <div className="sync-message">
        <span className="icon">↑</span>
        <span>Syncing {pendingCount} pending {pendingCount === 1 ? 'item' : 'items'}...</span>
      </div>
      
      <style jsx>{`
        .background-sync {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 10px 15px;
          border-radius: 6px;
          background-color: rgba(25, 118, 210, 0.9);
          color: white;
          z-index: 1000;
          animation: slideIn 0.3s ease-out;
        }
        
        .sync-message {
          display: flex;
          align-items: center;
          font-size: 0.9rem;
          white-space: nowrap;
        }
        
        .icon {
          margin-right: 8px;
          animation: bounce 1s infinite alternate;
        }
        
        @keyframes bounce {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-4px);
          }
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default BackgroundSync; 