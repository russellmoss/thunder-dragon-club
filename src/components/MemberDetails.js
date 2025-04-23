import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Button from './Button';
import '../styles/global.css';
import PointAdjustmentModal from './PointAdjustmentModal';
import DeleteMemberModal from './DeleteMemberModal';

const MemberDetails = ({ member, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [activeTab, setActiveTab] = useState('transactions');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberData, setMemberData] = useState(member);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone || '',
    memberType: member.memberType || 'non-trade'
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchMemberData = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Log the member ID we're querying for
      console.log('Fetching data for member ID:', member.id);

      // Fetch transactions
      const transactionsQuery = query(
        collection(db, 'transactions'),
        where('memberId', '==', member.id),
        orderBy('date', 'desc')
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactionsData = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Transactions found:', transactionsData.length);
      setTransactions(transactionsData);

      // Fetch redemptions
      const redemptionsQuery = query(
        collection(db, 'redemptions'),
        where('memberId', '==', member.id),
        orderBy('date', 'desc')
      );
      const redemptionsSnapshot = await getDocs(redemptionsQuery);
      const redemptionsData = redemptionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Redemptions found:', redemptionsData.length);
      setRedemptions(redemptionsData);

      // Fetch referrals
      const referralsQuery = query(
        collection(db, 'referrals'),
        where('memberId', '==', member.id),
        orderBy('date', 'desc')
      );
      const referralsSnapshot = await getDocs(referralsQuery);
      const referralsData = referralsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Referrals found:', referralsData.length);
      setReferrals(referralsData);

      const memberDoc = await getDoc(doc(db, 'members', member.id));
      if (memberDoc.exists()) {
        setMemberData({ id: memberDoc.id, ...memberDoc.data() });
      } else {
        setError('Member not found');
      }

    } catch (error) {
      console.error('Error fetching member data:', error);
      setError('Failed to load member details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (member.id) {
      fetchMemberData();
    }
  }, [member.id]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (date.toDate) {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount, includeSymbol = true) => {
    const formattedNumber = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return includeSymbol ? `Nu. ${formattedNumber}` : formattedNumber;
  };

  const calculateTotals = () => {
    const totalTransactions = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalPointsEarned = transactions.reduce((sum, t) => sum + (t.pointsEarned || 0), 0) +
                             referrals.reduce((sum, r) => sum + (r.pointsEarned || 0), 0);
    const totalPointsRedeemed = redemptions.reduce((sum, r) => sum + (r.points || 0), 0);

    return {
      totalTransactions,
      totalPointsEarned,
      totalPointsRedeemed
    };
  };

  const renderSummary = () => {
    const totals = calculateTotals();
    return (
      <div className="member-summary">
        <h3>Activity Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <label>Total Spent:</label>
            <span>{formatCurrency(totals.totalTransactions)}</span>
          </div>
          <div className="summary-item">
            <label>Total Points Earned:</label>
            <span>{totals.totalPointsEarned}</span>
          </div>
          <div className="summary-item">
            <label>Total Points Redeemed:</label>
            <span>{totals.totalPointsRedeemed}</span>
          </div>
          <div className="summary-item">
            <label>Current Points Balance:</label>
            <span>{memberData.points || 0}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderTransactions = () => (
    <div className="details-table-container">
      <h3>Transactions History</h3>
      {transactions.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Points Earned</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => (
              <tr key={transaction.id}>
                <td>{formatDate(transaction.date)}</td>
                <td>{formatCurrency(transaction.amount || 0)}</td>
                <td>{transaction.pointsEarned}</td>
                <td>{transaction.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No transactions found</p>
      )}
    </div>
  );

  const renderRedemptions = () => (
    <div className="details-table-container">
      <h3>Redemptions History</h3>
      {redemptions.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Points Redeemed</th>
              <th>Item</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {redemptions.map(redemption => (
              <tr key={redemption.id}>
                <td>{formatDate(redemption.date)}</td>
                <td>{redemption.points}</td>
                <td>{redemption.item}</td>
                <td>{redemption.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No redemptions found</p>
      )}
    </div>
  );

  const renderReferrals = () => (
    <div className="details-table-container">
      <h3>Referrals History</h3>
      {referrals.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Referred Person</th>
              <th>Points Earned</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map(referral => (
              <tr key={referral.id}>
                <td>{formatDate(referral.date)}</td>
                <td>{referral.referralName}</td>
                <td>{referral.pointsEarned}</td>
                <td>{referral.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No referrals found</p>
      )}
    </div>
  );

  const handleExportCSV = () => {
    // Create CSV content for each section
    const basicInfo = [
      ['Basic Information'],
      ['Name', `${memberData.firstName} ${memberData.lastName}`],
      ['Email', memberData.email],
      ['Phone', memberData.phone],
      ['Member Type', memberData.memberType === 'trade' ? 'Trade' : 'Non-Trade'],
      ['Current Points', memberData.points || 0],
      ['Member Since', formatDate(memberData.createdAt)],
      [],  // Empty row for spacing
    ];

    const transactionsHeader = [
      ['Transactions History'],
      ['Date', 'Amount', 'Points Earned', 'Notes']
    ];
    const transactionsData = transactions.map(t => [
      formatDate(t.date),
      formatCurrency(t.amount || 0, false),
      t.pointsEarned,
      t.notes || ''
    ]);

    const redemptionsHeader = [
      [],  // Empty row for spacing
      ['Redemptions History'],
      ['Date', 'Points Redeemed', 'Item', 'Notes']
    ];
    const redemptionsData = redemptions.map(r => [
      formatDate(r.date),
      r.points,
      r.item || '',
      r.notes || ''
    ]);

    const referralsHeader = [
      [],  // Empty row for spacing
      ['Referrals History'],
      ['Date', 'Referred Person', 'Points Earned', 'Notes']
    ];
    const referralsData = referrals.map(r => [
      formatDate(r.date),
      r.referralName,
      r.pointsEarned,
      r.notes || ''
    ]);

    // Calculate totals
    const totals = calculateTotals();
    const summarySection = [
      [],  // Empty row for spacing
      ['Summary'],
      ['Total Spent', formatCurrency(totals.totalTransactions, false)],
      ['Total Points Earned', totals.totalPointsEarned],
      ['Total Points Redeemed', totals.totalPointsRedeemed],
      ['Current Points Balance', memberData.points || 0]
    ];

    // Combine all sections
    const csvContent = [
      ...basicInfo,
      ...summarySection,
      [],  // Empty row for spacing
      ...transactionsHeader,
      ...transactionsData,
      ...redemptionsHeader,
      ...redemptionsData,
      ...referralsHeader,
      ...referralsData
    ];

    // Convert to CSV string
    const csvString = csvContent.map(row => 
      row.map(cell => {
        const cellStr = String(cell).replace(/"/g, '""');
        return cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n') 
          ? `"${cellStr}"`
          : cellStr;
      }).join(',')
    ).join('\n');

    // Create and download the file
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = `${memberData.firstName.toLowerCase()}-${memberData.lastName.toLowerCase()}-member-details.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAdjustPoints = () => {
    setShowAdjustmentModal(true);
  };

  const handleDeleteMember = () => {
    setShowDeleteModal(true);
  };

  const handleAdjustmentSuccess = () => {
    setShowAdjustmentModal(false);
    fetchMemberData();
  };

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false);
    onClose();
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // If we're canceling the edit, reset the form
      setEditedData({
        firstName: memberData.firstName,
        lastName: memberData.lastName,
        email: memberData.email,
        phone: memberData.phone || '',
        memberType: memberData.memberType || 'non-trade'
      });
    }
    setIsEditing(!isEditing);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setIsSaving(true);
    
    try {
      // Basic validation
      if (!editedData.firstName.trim() || !editedData.lastName.trim() || !editedData.email.trim()) {
        setError('Name and email are required fields');
        setIsSaving(false);
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editedData.email)) {
        setError('Please enter a valid email address');
        setIsSaving(false);
        return;
      }

      // Phone validation (optional)
      if (editedData.phone && !/^\+?[\d\s-()]+$/.test(editedData.phone)) {
        setError('Please enter a valid phone number');
        setIsSaving(false);
        return;
      }

      const memberRef = doc(db, 'members', memberData.id);
      await updateDoc(memberRef, {
        firstName: editedData.firstName.trim(),
        lastName: editedData.lastName.trim(),
        email: editedData.email.trim(),
        phone: editedData.phone.trim(),
        memberType: editedData.memberType,
        searchableName: `${editedData.firstName.toLowerCase()} ${editedData.lastName.toLowerCase()}`
      });

      setSuccess('Member details updated successfully');
      setMemberData(prev => ({
        ...prev,
        ...editedData,
        searchableName: `${editedData.firstName.toLowerCase()} ${editedData.lastName.toLowerCase()}`
      }));
      
      // Exit edit mode after successful save
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating member:', error);
      setError('Failed to update member details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getMemberTypeDisplay = (type) => {
    switch (type) {
      case 'trade':
        return 'Trade Member';
      case 'non-trade':
        return 'Non-Trade Member';
      case 'referral':
        return 'Referral Member';
      default:
        return 'Unknown Member Type';
    }
  };

  const renderPersonalInfo = () => (
    <div className="info-section">
      <div className="section-header">
        <h3>Personal Information</h3>
        {!isEditing && (
          <Button
            text="Edit"
            onClick={handleEditToggle}
            className="small-button"
          />
        )}
      </div>
      {isEditing ? (
        <div className="edit-form">
          <div className="form-group">
            <label>First Name:</label>
            <input
              type="text"
              value={editedData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Last Name:</label>
            <input
              type="text"
              value={editedData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={editedData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Phone:</label>
            <input
              type="tel"
              value={editedData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Member Type:</label>
            <div className="custom-select">
              <select
                value={editedData.memberType}
                onChange={(e) => handleInputChange('memberType', e.target.value)}
                disabled={isSaving}
              >
                <option value="trade">Trade Member</option>
                <option value="non-trade">Non-Trade Member</option>
                <option value="referral">Referral Member</option>
              </select>
              <div className="select-arrow"></div>
            </div>
          </div>
          <div className="edit-buttons">
            <Button 
              text="Cancel" 
              onClick={handleEditToggle} 
              className="secondary-button"
              disabled={isSaving}
            />
            <Button 
              text={
                isSaving ? (
                  <span className="loading-text">
                    <span className="spinner"></span>
                    Saving...
                  </span>
                ) : "Save"
              }
              onClick={handleSave}
              disabled={isSaving}
            />
          </div>
        </div>
      ) : (
        <div className="info-grid">
          <div className="info-item">
            <label>First Name:</label>
            <span>{memberData.firstName}</span>
          </div>
          <div className="info-item">
            <label>Last Name:</label>
            <span>{memberData.lastName}</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>{memberData.email}</span>
          </div>
          <div className="info-item">
            <label>Phone:</label>
            <span>{memberData.phone || 'Not provided'}</span>
          </div>
          <div className="info-item">
            <label>Member ID:</label>
            <span>{memberData.id}</span>
          </div>
          <div className="info-item">
            <label>Member Since:</label>
            <span>{formatDate(memberData.createdAt)}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderPointsInfo = () => (
    <div className="info-section">
      <h3>Points Information</h3>
      <div className="info-grid">
        <div className="info-item">
          <label>Current Points:</label>
          <span>{memberData.points || 0}</span>
        </div>
        <div className="info-item">
          <label>Member Type:</label>
          <span className={`member-type ${memberData.memberType}`}>
            {getMemberTypeDisplay(memberData.memberType)}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="member-details-overlay">
      <div className="member-details-container">
        <div className="details-header">
          <h2>Member Details</h2>
          <div className="header-buttons">
            <Button 
              text="Adjust Points" 
              onClick={handleAdjustPoints}
              className="secondary-button"
            />
            <Button 
              text="Delete Member" 
              onClick={handleDeleteMember}
              className="delete-button"
            />
            <button className="close-button" onClick={onClose}>×</button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {renderPersonalInfo()}
        {renderPointsInfo()}
        {renderSummary()}

        <div className="activity-tabs">
          <button
            className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </button>
          <button
            className={`tab-button ${activeTab === 'redemptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('redemptions')}
          >
            Redemptions
          </button>
          <button
            className={`tab-button ${activeTab === 'referrals' ? 'active' : ''}`}
            onClick={() => setActiveTab('referrals')}
          >
            Referrals
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'transactions' && renderTransactions()}
          {activeTab === 'redemptions' && renderRedemptions()}
          {activeTab === 'referrals' && renderReferrals()}
        </div>

        {showAdjustmentModal && (
          <PointAdjustmentModal
            member={memberData}
            onClose={() => setShowAdjustmentModal(false)}
            onSuccess={handleAdjustmentSuccess}
          />
        )}

        {showDeleteModal && (
          <DeleteMemberModal
            member={memberData}
            onClose={() => setShowDeleteModal(false)}
            onSuccess={handleDeleteSuccess}
          />
        )}
      </div>

      <style jsx>{`
        .member-details-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }

        .member-details-container {
          background-color: var(--background-color);
          border-radius: 8px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
        }

        .details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 30px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .details-header h2 {
          margin: 0;
          color: var(--header-color);
        }

        .header-buttons {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .adjust-button, .delete-button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .adjust-button {
          background-color: #4CAF50;
          color: white;
        }

        .delete-button {
          background-color: #F44336;
          color: white;
        }

        .close-button {
          background: none;
          border: none;
          color: var(--text-color);
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          margin-left: 10px;
        }

        .details-content {
          padding: 30px;
        }

        .info-section {
          padding: 0 30px;
          margin-bottom: 30px;
        }

        .member-summary {
          padding: 0 30px;
          margin-bottom: 30px;
        }

        .activity-tabs {
          display: flex;
          gap: 15px;
          padding: 0 30px;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 15px;
        }

        .tab-button {
          padding: 12px 24px;
          background-color: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 6px;
          color: var(--text-color);
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 140px;
          font-weight: 500;
        }

        .tab-button:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        .tab-button.active {
          background-color: var(--accent-color);
          color: #000000;
          font-weight: bold;
        }

        .tab-content {
          padding: 0 30px 30px 30px;
        }

        .details-table-container {
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 20px;
          margin-top: 20px;
        }

        .details-table-container h3 {
          margin: 0 0 20px 0;
          color: var(--header-color);
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th {
          text-align: left;
          padding: 12px;
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
          color: var(--accent-color);
        }

        .admin-table td {
          padding: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .admin-table tr:last-child td {
          border-bottom: none;
        }

        .detail-section {
          margin-bottom: 30px;
        }

        .detail-section h3 {
          color: var(--header-color);
          margin: 0 0 15px 0;
          font-size: 1.2rem;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .detail-label {
          color: var(--accent-color);
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .detail-value {
          color: var(--text-color);
          font-size: 1.1rem;
        }

        .points {
          color: var(--accent-color);
          font-weight: bold;
        }

        .member-type {
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
        }

        .member-type.trade {
          background-color: rgba(255, 215, 0, 0.2);
          color: var(--accent-color);
        }

        .member-type.non-trade {
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
        }

        .member-type.referral {
          background-color: rgba(139, 0, 0, 0.2);
          color: #F44336;
        }

        .error-message {
          color: #F44336;
          padding: 10px;
          background-color: rgba(244, 67, 54, 0.1);
          border-radius: 4px;
          margin: 20px;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: var(--text-color);
        }

        @media (max-width: 600px) {
          .header-buttons {
            flex-direction: column;
            align-items: flex-end;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .edit-button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          background-color: var(--accent-color);
          color: #000000;
        }

        .edit-button.active {
          background-color: #666;
        }

        .edit-input {
          width: 100%;
          padding: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
          font-size: 1rem;
        }

        .edit-input:focus {
          outline: none;
          border-color: var(--accent-color);
        }

        select.edit-input {
          appearance: none;
          padding-right: 24px;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 8px center;
          background-size: 16px;
          background-color: white;
          color: black;
        }

        select.edit-input option {
          color: black;
          background-color: white;
        }

        .save-section {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .save-button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          background-color: #4CAF50;
          color: white;
          font-weight: bold;
        }

        .success-message {
          color: #4CAF50;
          padding: 10px;
          background-color: rgba(76, 175, 80, 0.1);
          border-radius: 4px;
          margin: 20px;
        }

        .custom-select {
          position: relative;
          width: 100%;
        }

        .custom-select select {
          appearance: none;
          width: 100%;
          padding: 12px;
          padding-right: 30px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          background-color: rgba(255, 255, 255, 0.9);
          color: #000000;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .custom-select select:hover {
          background-color: rgba(255, 255, 255, 1);
        }

        .custom-select select:focus {
          outline: none;
          border-color: var(--accent-color);
          background-color: rgba(255, 255, 255, 1);
        }

        .custom-select .select-arrow {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid #000000;
          pointer-events: none;
        }

        .custom-select select:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          background-color: rgba(255, 255, 255, 0.7);
        }

        .custom-select select option {
          background-color: white;
          color: black;
        }

        .loading-text {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top-color: currentColor;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .edit-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          margin-top: 20px;
        }

        .edit-buttons button {
          min-width: 100px;
        }

        .edit-buttons button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default MemberDetails; 