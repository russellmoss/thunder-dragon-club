const formatDate = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : date.toDate();
  return d.toISOString().split('T')[0];
};

const formatDateTime = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : date.toDate();
  return d.toISOString().replace('T', ' ').split('.')[0];
};

class BackupService {
  downloadCSV(data, filename) {
    // Convert data to CSV string
    const csvContent = this.convertToCSV(data);
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${formatDate(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  convertToCSV(data) {
    if (data.length === 0) return '';
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV rows
    const csvRows = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          let value = row[header];
          
          // Format dates
          if (value instanceof Date || (value && value.toDate)) {
            value = formatDateTime(value);
          }
          
          // Handle values that need escaping
          if (value === null || value === undefined) {
            return '';
          }
          value = value.toString();
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  }

  backupMembers(memberData) {
    const formattedData = memberData.map(member => ({
      ID: member.id,
      'First Name': member.firstName,
      'Last Name': member.lastName,
      Email: member.email,
      Phone: member.phone,
      'Member Type': member.memberType,
      Points: member.points || 0,
      'Created At': member.createdAt,
      'Last Updated': new Date()
    }));
    
    this.downloadCSV(formattedData, 'members');
  }

  backupTransactions(transactionData) {
    const formattedData = transactionData.map(transaction => ({
      ID: transaction.id,
      'Member ID': transaction.memberId,
      'Member Name': transaction.memberName,
      Amount: transaction.amount,
      'Points Earned': transaction.pointsEarned,
      Date: transaction.date,
      Notes: transaction.notes || '',
      'Created At': transaction.createdAt
    }));
    
    this.downloadCSV(formattedData, 'transactions');
  }

  backupReferrals(referralData) {
    const formattedData = referralData.map(referral => ({
      ID: referral.id,
      'Member ID': referral.memberId,
      'Member Name': referral.memberName,
      'Referral Name': referral.referralName,
      'Points Earned': referral.pointsEarned,
      Notes: referral.notes || '',
      Date: referral.date,
      'Created At': referral.createdAt
    }));
    
    this.downloadCSV(formattedData, 'referrals');
  }

  backupRedemptions(redemptionData) {
    const formattedData = redemptionData.map(redemption => ({
      ID: redemption.id,
      'Member ID': redemption.memberId,
      'Member Name': redemption.memberName,
      'Points Redeemed': redemption.points,
      Item: redemption.item,
      Date: redemption.date,
      'Created At': redemption.createdAt
    }));
    
    this.downloadCSV(formattedData, 'redemptions');
  }
}

const backupService = new BackupService();
export default backupService; 