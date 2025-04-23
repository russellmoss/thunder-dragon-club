import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, getDocs, doc, updateDoc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import InputField from './InputField';
import Button from './Button';
import { addTransaction, getUnsyncedTransactions, markTransactionSynced } from '../utils/indexedDB';
import '../styles/global.css';
import googleSheetsService from '../utils/googleSheets';
import { useAuth } from '../contexts/AuthContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import '../styles/mobile.css';

const TransactionManager = () => {
  const { currentUser } = useAuth();
  const isOnline = useNetworkStatus();
  // State for member selection
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // State for transaction recording
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for points configuration
  const [pointsConfig, setPointsConfig] = useState({
    nonTradePointsRate: 1,
    tradePointsRate: 2
  });

  // Add sync status state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Add pending transactions count state
  const [pendingTransactionsCount, setPendingTransactionsCount] = useState(0);

  // Add success animation state
  const [showSuccess, setShowSuccess] = useState(false);

  // Load points configuration on component mount
  useEffect(() => {
    loadPointsConfig();
  }, []);

  const loadPointsConfig = async () => {
    try {
      const configRef = doc(db, 'config', 'points');
      const configDoc = await getDoc(configRef);
      
      if (configDoc.exists()) {
        const data = configDoc.data();
        setPointsConfig({
          nonTradePointsRate: data.nonTradePointsRate || 1,
          tradePointsRate: data.tradePointsRate || 2
        });
      }
    } catch (error) {
      console.error('Error loading points configuration:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setMembers([]);
    setIsLoading(true);
    
    try {
      let membersQuery;
      
      if (searchType === 'name') {
        membersQuery = query(
          collection(db, 'members'),
          orderBy('lastName'),
          limit(100)
        );
      } else {
        membersQuery = query(
          collection(db, 'members'),
          orderBy('email'),
          limit(100)
        );
      }
      
      const querySnapshot = await getDocs(membersQuery);
      
      if (querySnapshot.empty) {
        setError('No members found in the database.');
        setIsLoading(false);
        return;
      }
      
      const membersData = [];
      const searchTermLower = searchTerm.toLowerCase();
      
      for (const memberDoc of querySnapshot.docs) {
        const memberData = memberDoc.data();
        
        let isMatch = false;
        
        if (searchType === 'name') {
          const fullName = `${memberData.firstName} ${memberData.lastName}`.toLowerCase();
          isMatch = fullName.includes(searchTermLower);
        } else {
          isMatch = memberData.email && 
                  memberData.email.toLowerCase().includes(searchTermLower);
        }
        
        if (isMatch) {
          membersData.push({
            id: memberDoc.id,
            ...memberData
          });
        }
      }
      
      if (membersData.length === 0) {
        setError('No members found matching your search criteria.');
      } else {
        setMembers(membersData);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Search error:', error);
      setError('An error occurred while searching. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setSearchTerm('');
    setMembers([]);
  };

  const calculatePoints = (amount, memberType) => {
    const pointsRate = memberType === 'trade' 
      ? pointsConfig.tradePointsRate 
      : pointsConfig.nonTradePointsRate;
    return Math.floor(parseFloat(amount) * pointsRate);
  };

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      if (!selectedMember) {
        throw new Error('Please select a member first.');
      }

      const transactionAmount = parseFloat(amount);
      
      if (isNaN(transactionAmount) || transactionAmount <= 0) {
        throw new Error('Please enter a valid transaction amount.');
      }

      // Ensure we have a valid memberType
      const memberType = selectedMember.memberType || 'non-trade';
      
      const pointsEarned = calculatePoints(amount, memberType);
      
      // Create transaction object
      const transactionData = {
        memberId: selectedMember.id,
        memberName: `${selectedMember.firstName} ${selectedMember.lastName}`,
        memberType: memberType,
        amount: transactionAmount,
        date: new Date(date),
        notes: notes.trim() || 'Wine purchase',
        pointsEarned: pointsEarned,
        createdAt: new Date(),
        status: isOnline ? 'synced' : 'pending'
      };

      if (isOnline) {
        // Online - submit directly to Firebase
        const transactionRef = await addDoc(collection(db, 'transactions'), transactionData);
        
        // Update member's points
        const memberRef = doc(db, 'members', selectedMember.id);
        await updateDoc(memberRef, {
          points: (selectedMember.points || 0) + pointsEarned
        });
        
        // Backup to Google Sheets
        await googleSheetsService.backupTransaction({
          id: transactionRef.id,
          ...transactionData
        });
        
        setSuccessMessage(`Transaction recorded successfully! ${pointsEarned} points awarded.`);
      } else {
        // Offline - store in IndexedDB
        await addTransaction(transactionData);
        
        // Update local UI to reflect change
        setSuccessMessage(`Transaction saved offline. ${pointsEarned} points will be awarded when you're back online.`);
      }
      
      // Reset form
      setAmount('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
      setSelectedMember(null);
    } catch (error) {
      console.error('Transaction error:', error);
      setError(error.message || 'Failed to record transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return `Nu. ${new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)}`;
  };

  // Function to sync offline transactions
  const syncOfflineTransactions = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setShowSuccess(false);
    setSyncMessage('Syncing offline transactions...');
    
    try {
      // Get all unsynced transactions from IndexedDB
      const unsyncedTransactions = await getUnsyncedTransactions();
      
      if (unsyncedTransactions.length === 0) {
        setSyncMessage('All transactions are synced!');
        setIsSyncing(false);
        return;
      }
      
      let successCount = 0;
      let errorCount = 0;
      
      // Process each unsynced transaction
      for (const transaction of unsyncedTransactions) {
        try {
          // Submit to Firebase
          const transactionRef = await addDoc(collection(db, 'transactions'), {
            ...transaction,
            status: 'synced'
          });
          
          // Update member's points
          const memberRef = doc(db, 'members', transaction.memberId);
          await updateDoc(memberRef, {
            points: (transaction.points || 0) + transaction.pointsEarned
          });
          
          // Backup to Google Sheets
          await googleSheetsService.backupTransaction({
            id: transactionRef.id,
            ...transaction
          });
          
          // Mark as synced in IndexedDB
          await markTransactionSynced(transaction.localId, transactionRef.id);
          
          successCount++;
        } catch (error) {
          console.error('Error syncing transaction:', error);
          errorCount++;
        }
      }
      
      setSyncMessage(`Synced ${successCount} transactions. ${errorCount} failed.`);
      
      // Show success animation if all transactions were synced successfully
      if (errorCount === 0 && successCount > 0) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
        }, 2000); // Hide after 2 seconds
      }
    } catch (error) {
      console.error('Error during sync:', error);
      setSyncMessage('Error syncing transactions. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Function to check for pending transactions
  const checkPendingTransactions = async () => {
    try {
      const unsyncedTransactions = await getUnsyncedTransactions();
      setPendingTransactionsCount(unsyncedTransactions.length);
    } catch (error) {
      console.error('Error checking pending transactions:', error);
    }
  };

  // Update the useEffect to include checking pending transactions
  useEffect(() => {
    const handleOnline = () => {
      if (navigator.onLine) {
        syncOfflineTransactions();
      }
    };

    window.addEventListener('online', handleOnline);
    
    // Initial check if we're online
    if (navigator.onLine) {
      syncOfflineTransactions();
    }
    
    // Check for pending transactions periodically
    checkPendingTransactions();
    const interval = setInterval(checkPendingTransactions, 30000); // Check every 30 seconds
    
    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="transaction-manager-container">
      <div className="section-header">
        <h2>Transaction Management</h2>
        {pendingTransactionsCount > 0 && (
          <div className="sync-button-container">
            <Button
              text={
                showSuccess ? (
                  <span className="sync-button-content">
                    <span className="success-check"></span>
                    <span>Synced!</span>
                  </span>
                ) : isSyncing ? (
                  <span className="sync-button-content">
                    <span className="spinner"></span>
                    <span>Syncing...</span>
                  </span>
                ) : (
                  `Sync ${pendingTransactionsCount} Pending Transaction${pendingTransactionsCount > 1 ? 's' : ''}`
                )
              }
              onClick={syncOfflineTransactions}
              disabled={isSyncing || !navigator.onLine}
              className={`sync-button ${isSyncing ? 'syncing' : ''} ${showSuccess ? 'success' : ''}`}
            />
          </div>
        )}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      {!selectedMember ? (
        <form onSubmit={handleSearch} className="search-form">
          <h3>Search Member</h3>
          <div className="search-container">
            <InputField 
              label="Search Term"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Enter member ${searchType}`}
              required
            />
            <div className="search-type-selector">
              <label>Search by:</label>
              <select 
                value={searchType} 
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value="name">Name</option>
                <option value="email">Email</option>
              </select>
            </div>
            <Button 
              text={isLoading ? "Searching..." : "Search"}
              type="submit"
              disabled={isLoading}
            />
          </div>
        </form>
      ) : (
        <div className="selected-member">
          <h3>Selected Member</h3>
          <p>Name: {selectedMember.firstName} {selectedMember.lastName}</p>
          <p>Email: {selectedMember.email}</p>
          <p>Member Type: {selectedMember.memberType === 'trade' ? 'Trade' : 'Non-Trade'}</p>
          <p>Current Points: {selectedMember.points || 0}</p>
          <Button 
            text="Change Member"
            onClick={() => setSelectedMember(null)}
            className="secondary-button"
          />
        </div>
      )}
      
      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : members.length > 0 ? (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Member Type</th>
                <th>Points</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.id}>
                  <td>{`${member.firstName} ${member.lastName}`}</td>
                  <td>{member.email}</td>
                  <td>{member.memberType === 'trade' ? 'Trade' : 'Non-Trade'}</td>
                  <td>{member.points || 0}</td>
                  <td>
                    <Button 
                      text="Select"
                      onClick={() => handleSelectMember(member)}
                      className="small-button"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      
      {selectedMember && (
        <form onSubmit={handleSubmitTransaction} className="transaction-form">
          <h3>Record Transaction</h3>
          <div className="form-row">
            <InputField 
              label="Amount (Ngultrum)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter transaction amount"
              required
              min="0.01"
              step="0.01"
            />
            <InputField 
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="input-field">
            <label>Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional notes"
              rows="3"
            />
          </div>
          
          {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
            <div className="points-preview">
              <p>Points to be earned: {calculatePoints(amount, selectedMember.memberType)}</p>
              <p className="help-text">
                {selectedMember.memberType === 'trade' 
                  ? `Trade members earn ${pointsConfig.tradePointsRate} points per Ngultrum`
                  : `Non-trade members earn ${pointsConfig.nonTradePointsRate} points per Ngultrum`}
              </p>
            </div>
          )}
          
          <Button 
            text={isSubmitting ? "Processing..." : "Record Transaction"}
            type="submit"
            disabled={isSubmitting}
          />
        </form>
      )}
      
      {/* Add sync status display */}
      {syncMessage && (
        <div className={`sync-message ${isSyncing ? 'syncing' : ''}`}>
          {syncMessage}
        </div>
      )}
      
      <style jsx>{`
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .sync-button-container {
          display: flex;
          align-items: center;
        }
        
        .sync-button {
          background-color: var(--accent-color);
          color: #000000;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 0.9rem;
          transition: all 0.2s;
          min-width: 180px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .sync-button.syncing {
          background-color: rgba(255, 152, 0, 0.8);
        }
        
        .sync-button.success {
          background-color: rgba(76, 175, 80, 0.8);
          animation: success-pulse 0.5s ease-out;
        }
        
        .sync-button:disabled {
          background-color: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.5);
          cursor: not-allowed;
        }
        
        .sync-button:not(:disabled):hover {
          background-color: var(--accent-color-hover);
          transform: translateY(-1px);
        }
        
        .sync-button-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top-color: #000000;
          animation: spin 1s linear infinite;
        }
        
        .success-check {
          width: 16px;
          height: 16px;
          position: relative;
        }
        
        .success-check:before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          width: 8px;
          height: 4px;
          border: 2px solid #000000;
          border-top: none;
          border-right: none;
          transform: translateY(-50%) rotate(-45deg);
          animation: check-draw 0.3s ease-out forwards;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes check-draw {
          0% {
            width: 0;
            height: 0;
            opacity: 0;
          }
          50% {
            width: 8px;
            height: 0;
            opacity: 1;
          }
          100% {
            width: 8px;
            height: 4px;
            opacity: 1;
          }
        }
        
        @keyframes success-pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
        
        .sync-message {
          margin: 10px 0;
          padding: 10px;
          border-radius: 4px;
          background-color: rgba(25, 118, 210, 0.1);
          color: var(--text-color);
          text-align: center;
        }
        
        .sync-message.syncing {
          background-color: rgba(255, 152, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default TransactionManager; 