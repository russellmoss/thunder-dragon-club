/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { onSchedule } = require("firebase-functions/v2/scheduler");
admin.initializeApp();

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.backup = onRequest(async (req, res) => {
  const db = admin.firestore();
  const storage = admin.storage();
  const bucket = storage.bucket();

  try {
    // Collections to backup
    const collections = ['members', 'transactions', 'referrals', 'redemptions'];
    const timestamp = new Date().toISOString().split('T')[0];
    
    for (const collectionName of collections) {
      // Get all documents from collection
      const snapshot = await db.collection(collectionName).get();
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Convert to CSV
      const headers = Object.keys(data[0] || {});
      const csvRows = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            let value = row[header];
            // Format dates
            if (value && value._seconds) {
              value = new Date(value._seconds * 1000).toISOString();
            }
            // Handle values that need escaping
            if (value === null || value === undefined) {
              return '';
            }
            value = String(value);
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Upload to storage
      const file = bucket.file(`backups/${timestamp}/${collectionName}.csv`);
      await file.save(csvRows, {
        contentType: 'text/csv',
        metadata: {
          contentType: 'text/csv',
          metadata: {
            timestamp: timestamp,
            collection: collectionName
          }
        }
      });

      console.log(`Backed up ${collectionName} to backups/${timestamp}/${collectionName}.csv`);
    }

    // Update last backup timestamp in Firestore
    await db.collection('config').doc('backup').set({
      lastBackup: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('Backup completed successfully');
    res.json({ success: true, message: 'Backup completed successfully' });
  } catch (error) {
    console.error('Backup failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Scheduled backup function that runs every 24 hours
exports.scheduledBackup = onSchedule({
  // Run at midnight every day
  schedule: "0 0 * * *",
  // Use Bhutan timezone
  timeZone: "Asia/Thimphu",
  // Retry up to 3 times if the function fails
  retryCount: 3,
  // Set memory to 256MB
  memory: "256MiB"
}, async (event) => {
  const db = admin.firestore();
  const storage = admin.storage();
  const bucket = storage.bucket();

  try {
    // Collections to backup
    const collections = ['members', 'transactions', 'referrals', 'redemptions'];
    const timestamp = new Date().toISOString().split('T')[0];
    
    for (const collectionName of collections) {
      // Get all documents from collection
      const snapshot = await db.collection(collectionName).get();
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Convert to CSV
      const headers = Object.keys(data[0] || {});
      const csvRows = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            let value = row[header];
            // Format dates
            if (value && value._seconds) {
              value = new Date(value._seconds * 1000).toISOString();
            }
            // Handle values that need escaping
            if (value === null || value === undefined) {
              return '';
            }
            value = String(value);
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Upload to storage
      const file = bucket.file(`backups/${timestamp}/${collectionName}.csv`);
      await file.save(csvRows, {
        contentType: 'text/csv',
        metadata: {
          contentType: 'text/csv',
          metadata: {
            timestamp: timestamp,
            collection: collectionName
          }
        }
      });

      console.log(`Backed up ${collectionName} to backups/${timestamp}/${collectionName}.csv`);
    }

    // Update last backup timestamp in Firestore
    await db.collection('config').doc('backup').set({
      lastBackup: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('Backup completed successfully');
    return null;
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  }
});
