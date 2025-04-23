import React, { useState } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import Button from './Button';
import '../styles/global.css';

const CSVExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedExport, setSelectedExport] = useState('members');

  const EXPORT_TYPES = {
    members: 'Member Information',
    referrals: 'Referral Data',
    transactions: 'Transaction Data',
    redemptions: 'Redemption Data'
  };

  const formatDate = (date) => {
    if (!date) return '';
    if (date.toDate) {
      date = date.toDate();
    } else if (date._seconds) {
      date = new Date(date._seconds * 1000);
    } else if (!(date instanceof Date)) {
      date = new Date(date);
    }
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return '0.00';
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleExport = async () => {
    setError('');
    setSuccessMessage('');
    setIsExporting(true);

    try {
      // Fetch members first as we need them for all exports
      const members = await fetchCollection('members');
      const timestamp = new Date().toISOString().split('T')[0];
      
      switch (selectedExport) {
        case 'members':
          const memberData = members.map(member => ({
            Date: formatDate(new Date()),
            Email: member.email || '',
            ID: member.id,
            'Member Information': '',
            'Member Since': formatDate(member.createdAt),
            'Member Type': member.memberType === 'trade' ? 'Trade' : 'Non-Trade',
            'Member Name': `${member.firstName} ${member.lastName}`,
            'Current Points': member.points || 0
          }));
          await downloadCSV(memberData, `thunder-dragon-members-${timestamp}.csv`);
          break;

        case 'referrals':
          const referrals = await fetchCollection('referrals');
          const referralData = [];
          referrals.forEach(referral => {
            const member = members.find(m => m.id === referral.memberId);
            if (member) {
              referralData.push({
                Date: formatDate(new Date()),
                Email: member.email || '',
                ID: member.id,
                'Member Name': `${member.firstName} ${member.lastName}`,
                'Member Type': member.memberType === 'trade' ? 'Trade' : 'Non-Trade',
                'Referred Person': referral.referralName || '',
                'Date of Referral': formatDate(referral.date),
                'Points Earned': referral.pointsEarned || 0
              });
            }
          });
          await downloadCSV(referralData, `thunder-dragon-referrals-${timestamp}.csv`);
          break;

        case 'transactions':
          const transactions = await fetchCollection('transactions');
          const transactionData = [];
          transactions.forEach(transaction => {
            const member = members.find(m => m.id === transaction.memberId);
            if (member) {
              transactionData.push({
                Date: formatDate(new Date()),
                Email: member.email || '',
                ID: member.id,
                'Member Name': `${member.firstName} ${member.lastName}`,
                'Member Type': member.memberType === 'trade' ? 'Trade' : 'Non-Trade',
                'Date of Transaction': formatDate(transaction.date),
                Amount: formatCurrency(transaction.amount),
                'Points Earned': transaction.pointsEarned || 0,
                Notes: transaction.notes || ''
              });
            }
          });
          await downloadCSV(transactionData, `thunder-dragon-transactions-${timestamp}.csv`);
          break;

        case 'redemptions':
          const redemptions = await fetchCollection('redemptions');
          const redemptionData = [];
          redemptions.forEach(redemption => {
            const member = members.find(m => m.id === redemption.memberId);
            if (member) {
              redemptionData.push({
                Date: formatDate(new Date()),
                Email: member.email || '',
                ID: member.id,
                'Member Name': `${member.firstName} ${member.lastName}`,
                'Member Type': member.memberType === 'trade' ? 'Trade' : 'Non-Trade',
                'Date of Redemption': formatDate(redemption.date),
                'Points Redeemed': redemption.points || 0,
                Item: redemption.item || '',
                Notes: redemption.notes || ''
              });
            }
          });
          await downloadCSV(redemptionData, `thunder-dragon-redemptions-${timestamp}.csv`);
          break;

        default:
          console.warn(`Unsupported data type: ${selectedExport}`);
          break;
      }

      setSuccessMessage(`${EXPORT_TYPES[selectedExport]} exported successfully!`);
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const fetchCollection = async (collectionName) => {
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  };

  const downloadCSV = async (data, filename) => {
    if (data.length === 0) {
      setError('No data available to export.');
      return;
    }

    // Get headers from the first object
    const headers = Object.keys(data[0]);

    // Convert data to CSV rows
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const cell = row[header];
          const str = cell === null || cell === undefined ? '' : String(cell);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        }).join(',')
      )
    ];

    // Create and download file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="export-section">
      <div className="export-container">
        <h3>Export Club Data</h3>
        <p>Select the type of data you want to export as CSV.</p>
        
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        
        <div className="export-controls">
          <select
            value={selectedExport}
            onChange={(e) => setSelectedExport(e.target.value)}
            className="export-select"
          >
            {Object.entries(EXPORT_TYPES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          
          <Button 
            text={isExporting ? "Exporting..." : "Export Selected Data"}
            onClick={handleExport}
            disabled={isExporting}
            className="export-button"
          />
        </div>

        <div className="export-info">
          <p>Available exports:</p>
          <ul>
            <li><strong>Member Information:</strong> Basic member details and current points</li>
            <li><strong>Referral Data:</strong> All referral records with member details</li>
            <li><strong>Transaction Data:</strong> All transaction records with member details</li>
            <li><strong>Redemption Data:</strong> All redemption records with member details</li>
          </ul>
        </div>
      </div>
      
      <style jsx>{`
        .export-section {
          margin-top: 40px;
          padding: 20px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          border: 1px solid var(--accent-color);
        }
        
        .export-container {
          text-align: center;
        }
        
        .export-section h3 {
          margin-bottom: 10px;
          color: var(--header-color);
          font-size: 1.5em;
        }
        
        .export-section p {
          margin-bottom: 20px;
          color: var(--text-color);
        }

        .export-controls {
          display: flex;
          gap: 15px;
          justify-content: center;
          align-items: center;
          margin-bottom: 20px;
        }

        .export-select {
          padding: 10px;
          font-size: 1em;
          border: 1px solid var(--accent-color);
          border-radius: 4px;
          background-color: rgba(0, 0, 0, 0.2);
          color: var(--text-color);
          min-width: 200px;
        }

        .export-select:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 5px var(--accent-color);
        }
        
        .export-button {
          background-color: var(--accent-color);
          color: black;
          font-weight: bold;
          padding: 12px 24px;
          font-size: 1.1em;
          min-width: 200px;
        }
        
        .export-button:hover {
          background-color: #FFE44D;
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }

        .export-info {
          margin-top: 20px;
          text-align: left;
          padding: 15px;
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        .export-info ul {
          list-style-type: none;
          margin-left: 0;
          margin-top: 10px;
        }

        .export-info li {
          margin-bottom: 10px;
          color: var(--text-color);
          padding-left: 20px;
          position: relative;
        }

        .export-info li:before {
          content: "•";
          position: absolute;
          left: 0;
          color: var(--accent-color);
        }

        .export-info strong {
          color: var(--accent-color);
        }

        .error-message, .success-message {
          margin-bottom: 20px;
        }
      `}</style>
    </div>
  );
};

export default CSVExport; 