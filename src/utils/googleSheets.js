import { GoogleSpreadsheet } from 'google-spreadsheet';

// These will come from your environment variables
const SPREADSHEET_ID = process.env.REACT_APP_GOOGLE_SHEETS_ID;
const CLIENT_EMAIL = process.env.REACT_APP_GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.REACT_APP_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const SHEETS = {
  MEMBERS: 'Members',
  TRANSACTIONS: 'Transactions',
  REFERRALS: 'Referrals',
  REDEMPTIONS: 'Redemptions'
};

class GoogleSheetsService {
  constructor() {
    this.doc = new GoogleSpreadsheet(SPREADSHEET_ID);
  }

  async init() {
    if (!SPREADSHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
      console.error('Missing Google Sheets credentials');
      return false;
    }

    try {
      await this.doc.useServiceAccountAuth({
        client_email: CLIENT_EMAIL,
        private_key: PRIVATE_KEY,
      });
      await this.doc.loadInfo();
      return true;
    } catch (error) {
      console.error('Error initializing Google Sheets:', error);
      return false;
    }
  }

  async getOrCreateSheet(sheetTitle) {
    try {
      let sheet = this.doc.sheetsByTitle[sheetTitle];
      if (!sheet) {
        sheet = await this.doc.addSheet({ title: sheetTitle });
      }
      return sheet;
    } catch (error) {
      console.error(`Error getting/creating sheet ${sheetTitle}:`, error);
      return null;
    }
  }

  async backupMembers(memberData) {
    const sheet = await this.getOrCreateSheet(SHEETS.MEMBERS);
    if (!sheet) return;

    try {
      // Set headers if sheet is empty
      if (sheet.rowCount <= 1) {
        await sheet.setHeaderRow([
          'ID',
          'First Name',
          'Last Name',
          'Email',
          'Phone',
          'Member Type',
          'Points',
          'Created At',
          'Last Updated'
        ]);
      }

      // Format data for sheet
      const rowData = {
        ID: memberData.id,
        'First Name': memberData.firstName,
        'Last Name': memberData.lastName,
        Email: memberData.email,
        Phone: memberData.phone,
        'Member Type': memberData.memberType,
        Points: memberData.points || 0,
        'Created At': memberData.createdAt?.toDate?.() || new Date(),
        'Last Updated': new Date()
      };

      // Add or update row
      await this.addOrUpdateRow(sheet, rowData, 'ID', memberData.id);
    } catch (error) {
      console.error('Error backing up member:', error);
    }
  }

  async backupTransaction(transactionData) {
    const sheet = await this.getOrCreateSheet(SHEETS.TRANSACTIONS);
    if (!sheet) return;

    try {
      if (sheet.rowCount <= 1) {
        await sheet.setHeaderRow([
          'ID',
          'Member ID',
          'Amount',
          'Points Earned',
          'Date',
          'Notes',
          'Created At'
        ]);
      }

      const rowData = {
        ID: transactionData.id,
        'Member ID': transactionData.memberId,
        Amount: transactionData.amount,
        'Points Earned': transactionData.pointsEarned,
        Date: transactionData.date?.toDate?.() || new Date(),
        Notes: transactionData.notes || '',
        'Created At': transactionData.createdAt?.toDate?.() || new Date()
      };

      await this.addOrUpdateRow(sheet, rowData, 'ID', transactionData.id);
    } catch (error) {
      console.error('Error backing up transaction:', error);
    }
  }

  async backupReferral(referralData) {
    const sheet = await this.getOrCreateSheet(SHEETS.REFERRALS);
    if (!sheet) return;

    try {
      if (sheet.rowCount <= 1) {
        await sheet.setHeaderRow([
          'ID',
          'Member ID',
          'Referral Name',
          'Points Earned',
          'Notes',
          'Date',
          'Created At'
        ]);
      }

      const rowData = {
        ID: referralData.id,
        'Member ID': referralData.memberId,
        'Referral Name': referralData.referralName,
        'Points Earned': referralData.pointsEarned,
        Notes: referralData.notes || '',
        Date: referralData.date?.toDate?.() || new Date(),
        'Created At': referralData.createdAt?.toDate?.() || new Date()
      };

      await this.addOrUpdateRow(sheet, rowData, 'ID', referralData.id);
    } catch (error) {
      console.error('Error backing up referral:', error);
    }
  }

  async backupRedemption(redemptionData) {
    const sheet = await this.getOrCreateSheet(SHEETS.REDEMPTIONS);
    if (!sheet) return;

    try {
      if (sheet.rowCount <= 1) {
        await sheet.setHeaderRow([
          'ID',
          'Member ID',
          'Points Redeemed',
          'Item',
          'Date',
          'Created At'
        ]);
      }

      const rowData = {
        ID: redemptionData.id,
        'Member ID': redemptionData.memberId,
        'Points Redeemed': redemptionData.points,
        Item: redemptionData.item,
        Date: redemptionData.date?.toDate?.() || new Date(),
        'Created At': redemptionData.createdAt?.toDate?.() || new Date()
      };

      await this.addOrUpdateRow(sheet, rowData, 'ID', redemptionData.id);
    } catch (error) {
      console.error('Error backing up redemption:', error);
    }
  }

  async addOrUpdateRow(sheet, rowData, idField, idValue) {
    try {
      // Load existing rows
      const rows = await sheet.getRows();
      const existingRow = rows.find(row => row[idField] === idValue);

      if (existingRow) {
        // Update existing row
        Object.keys(rowData).forEach(key => {
          existingRow[key] = rowData[key];
        });
        await existingRow.save();
      } else {
        // Add new row
        await sheet.addRow(rowData);
      }
    } catch (error) {
      console.error('Error adding/updating row:', error);
    }
  }
}

// Create and export a singleton instance
const googleSheetsService = new GoogleSheetsService();
export default googleSheetsService; 