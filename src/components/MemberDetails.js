import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import Button from './Button';
import '../styles/global.css';

const MemberDetails = ({ member, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [activeTab, setActiveTab] = useState('transactions');
  const [error, setError] = useState('');

  useEffect(() => {
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

      } catch (error) {
        console.error('Error fetching member data:', error);
        setError('Failed to load member details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

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
            <span>{member.points || 0}</span>
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
      ['Name', `${member.firstName} ${member.lastName}`],
      ['Email', member.email],
      ['Phone', member.phone],
      ['Member Type', member.memberType === 'trade' ? 'Trade' : 'Non-Trade'],
      ['Current Points', member.points || 0],
      ['Member Since', formatDate(member.createdAt)],
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
      ['Current Points Balance', member.points || 0]
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
    const fileName = `${member.firstName.toLowerCase()}-${member.lastName.toLowerCase()}-member-details.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="member-details-modal">
      <div className="member-details-content">
        <div className="member-details-header">
          <h2>Member Details</h2>
          <div className="header-buttons">
            <Button 
              text="Export to CSV"
              onClick={handleExportCSV}
              className="export-button"
            />
            <Button 
              text="Close" 
              onClick={onClose}
              className="close-button"
            />
          </div>
        </div>

        <div className="member-info-section">
          <div className="member-basic-info">
            <h3>Basic Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Name:</label>
                <span>{`${member.firstName} ${member.lastName}`}</span>
              </div>
              <div className="info-item">
                <label>Email:</label>
                <span>{member.email}</span>
              </div>
              <div className="info-item">
                <label>Phone:</label>
                <span>{member.phone}</span>
              </div>
              <div className="info-item">
                <label>Member Type:</label>
                <span>{member.memberType === 'trade' ? 'Trade' : 'Non-Trade'}</span>
              </div>
              <div className="info-item">
                <label>Member Since:</label>
                <span>{formatDate(member.createdAt)}</span>
              </div>
            </div>
          </div>

          {renderSummary()}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="member-details-tabs">
          <Button 
            text="Transactions"
            onClick={() => setActiveTab('transactions')}
            className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
          />
          <Button 
            text="Redemptions"
            onClick={() => setActiveTab('redemptions')}
            className={`tab-button ${activeTab === 'redemptions' ? 'active' : ''}`}
          />
          <Button 
            text="Referrals"
            onClick={() => setActiveTab('referrals')}
            className={`tab-button ${activeTab === 'referrals' ? 'active' : ''}`}
          />
        </div>

        <div className="member-details-content">
          {isLoading ? (
            <div className="loading">Loading member details...</div>
          ) : (
            <>
              {activeTab === 'transactions' && renderTransactions()}
              {activeTab === 'redemptions' && renderRedemptions()}
              {activeTab === 'referrals' && renderReferrals()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberDetails; 