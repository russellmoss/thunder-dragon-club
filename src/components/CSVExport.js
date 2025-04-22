import React, { useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import Button from './Button';
import '../styles/global.css';

const CSVExport = () => {
  // State for date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportType, setExportType] = useState('members'); // 'members', 'transactions', 'referrals', 'redemptions'
  
  // State for export status
  const [isExporting, setIsExporting] = useState(false);
  
  // State for feedback messages
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (date.toDate) {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount, includeSymbol = false) => {
    const formattedNumber = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return includeSymbol ? `Nu. ${formattedNumber}` : formattedNumber;
  };

  const getExportData = async (collectionName, filterByDate = true) => {
    let queryRef = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
    
    if (filterByDate && startDate) {
      const startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);
      queryRef = query(queryRef, where('createdAt', '>=', startDateTime));
    }
    
    if (filterByDate && endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      queryRef = query(queryRef, where('createdAt', '<=', endDateTime));
    }
    
    const snapshot = await getDocs(queryRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  };

  const formatDataForCSV = (data, type) => {
    let headers = [];
    let rows = [];

    switch (type) {
      case 'members':
        headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Member Type', 'Points', 'Created Date'];
        rows = data.map(member => [
          member.id,
          member.firstName || '',
          member.lastName || '',
          member.email || '',
          member.phone || '',
          member.memberType || 'non-trade',
          member.points || 0,
          formatDate(member.createdAt)
        ]);
        break;

      case 'transactions':
        headers = ['Date', 'Member ID', 'Member Name', 'Amount', 'Points Earned', 'Notes'];
        rows = data.map(transaction => [
          formatDate(transaction.date),
          transaction.memberId || '',
          transaction.memberName || '',
          formatCurrency(transaction.amount || 0, false),
          transaction.pointsEarned || 0,
          transaction.notes || ''
        ]);
        break;

      case 'referrals':
        headers = ['Date', 'Member ID', 'Member Name', 'Referred Person', 'Points Earned', 'Notes'];
        rows = data.map(referral => [
          formatDate(referral.date),
          referral.memberId || '',
          referral.memberName || '',
          referral.referralName || '',
          referral.pointsEarned || 0,
          referral.notes || ''
        ]);
        break;

      case 'redemptions':
        headers = ['Date', 'Member ID', 'Member Name', 'Points Redeemed', 'Item', 'Notes'];
        rows = data.map(redemption => [
          formatDate(redemption.date),
          redemption.memberId || '',
          redemption.memberName || '',
          redemption.points || 0,
          redemption.item || '',
          redemption.notes || ''
        ]);
        break;

      default:
        return [[], []];
    }

    return [headers, ...rows];
  };

  const downloadCSV = (data, filename) => {
    const csvContent = data.map(row => 
      row.map(cell => {
        const cellStr = String(cell).replace(/"/g, '""');
        return cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n') 
          ? `"${cellStr}"`
          : cellStr;
      }).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async (filterByDate = true) => {
    setError('');
    setSuccessMessage('');
    setIsExporting(true);

    try {
      const data = await getExportData(exportType, filterByDate);
      
      if (!data.length) {
        setError(`No ${exportType} found for the selected criteria.`);
        return;
      }

      const formattedData = formatDataForCSV(data, exportType);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `thunder-dragon-${exportType}-${timestamp}.csv`;
      
      downloadCSV(formattedData, filename);
      setSuccessMessage('Export completed successfully!');
    } catch (error) {
      console.error('Export error:', error);
      setError(`Failed to export ${exportType}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export-section">
      <h3>Export Data</h3>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <div className="export-controls">
        <div className="export-type-selector">
          <label>Export Type:</label>
          <select 
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
            className="export-select dark-select"
          >
            <option value="members">Members</option>
            <option value="transactions">Transactions</option>
            <option value="referrals">Referrals</option>
            <option value="redemptions">Redemptions</option>
          </select>
        </div>

        <div className="date-filters">
          <div className="date-input">
            <label>Start Date:</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          
          <div className="date-input">
            <label>End Date:</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="export-buttons">
          <Button 
            text={isExporting ? "Exporting..." : "Export Filtered Data"}
            onClick={() => handleExport(true)}
            disabled={isExporting || (!startDate && !endDate)}
            className="export-button"
          />
          <Button 
            text={isExporting ? "Exporting..." : "Export All Data"}
            onClick={() => handleExport(false)}
            disabled={isExporting}
            className="export-button direct-export"
          />
        </div>
      </div>
    </div>
  );
};

export default CSVExport; 