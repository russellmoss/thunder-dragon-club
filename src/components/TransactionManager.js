import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, getDocs, doc, updateDoc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import InputField from './InputField';
import Button from './Button';
import '../styles/global.css';
import googleSheetsService from '../utils/googleSheets';
import { auth } from '../firebase/config';

const TransactionManager = () => {
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
      
      // Get current admin's name
      const adminDoc = await getDoc(doc(db, 'admins', auth.currentUser.uid));
      const adminName = adminDoc.exists() ? `${adminDoc.data().firstName} ${adminDoc.data().lastName}` : 'Unknown Admin';
      
      // Record the transaction with validated data
      const transactionData = {
        memberId: selectedMember.id,
        memberName: `${selectedMember.firstName} ${selectedMember.lastName}`,
        memberType: memberType,
        amount: transactionAmount,
        date: new Date(date),
        notes: notes.trim() || 'Wine purchase',
        pointsEarned: pointsEarned,
        createdAt: new Date(),
        createdBy: adminName
      };

      // Validate all required fields
      if (!transactionData.memberId || !transactionData.memberName) {
        throw new Error('Invalid member data. Please try selecting the member again.');
      }
      
      const transactionRef = await addDoc(collection(db, 'transactions'), transactionData);
      
      // Backup to Google Sheets
      await googleSheetsService.backupTransaction({
        id: transactionRef.id,
        ...transactionData
      });
      
      // Update member's points
      const memberRef = doc(db, 'members', selectedMember.id);
      await updateDoc(memberRef, {
        points: (selectedMember.points || 0) + pointsEarned,
        memberType: memberType
      });
      
      setSuccessMessage(`Transaction recorded successfully! ${pointsEarned} points awarded.`);
      
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

  return (
    <div className="transaction-manager-container">
      <div className="section-header">
        <h2>Transaction Management</h2>
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
    </div>
  );
};

export default TransactionManager; 