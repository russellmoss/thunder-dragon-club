import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase/config';
import Button from './Button';
import InputField from './InputField';
import backupService from '../utils/backupService';

const COLLECTIONS = {
  members: 'members',
  transactions: 'transactions',
  referrals: 'referrals',
  redemptions: 'redemptions'
};

const BackupManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [backupInterval, setBackupInterval] = useState(localStorage.getItem('backupInterval') || '24');
  const [isAutomatedBackupEnabled, setIsAutomatedBackupEnabled] = useState(
    localStorage.getItem('isAutomatedBackupEnabled') === 'true'
  );
  const [lastBackupDate, setLastBackupDate] = useState(localStorage.getItem('lastBackupDate') || null);

  // Initialize Firebase Storage with error handling
  let storage;
  try {
    storage = getStorage();
    if (!storage) {
      throw new Error('Failed to initialize Firebase Storage');
    }
  } catch (error) {
    console.error('Storage initialization error:', error);
    setError('Failed to initialize storage. Please check your Firebase configuration.');
  }

  useEffect(() => {
    localStorage.setItem('backupInterval', backupInterval);
    localStorage.setItem('isAutomatedBackupEnabled', isAutomatedBackupEnabled);
  }, [backupInterval, isAutomatedBackupEnabled]);

  useEffect(() => {
    const checkAndRunBackup = async () => {
      if (!isAutomatedBackupEnabled || !storage) return;

      const now = new Date();
      const lastBackup = lastBackupDate ? new Date(lastBackupDate) : null;
      const intervalHours = parseInt(backupInterval);

      if (!lastBackup || (now - lastBackup) / (1000 * 60 * 60) >= intervalHours) {
        await handleBackupAll(true);
      }
    };

    checkAndRunBackup();
    const intervalId = setInterval(checkAndRunBackup, 1000 * 60 * 5);
    return () => clearInterval(intervalId);
  }, [isAutomatedBackupEnabled, backupInterval, lastBackupDate]);

  const handleBackupAll = async (isAutomatic = false) => {
    if (!storage) {
      setError('Storage is not initialized. Please check your Firebase configuration.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const backupData = {};
      
      // Fetch all data
      for (const [key, collectionName] of Object.entries(COLLECTIONS)) {
        try {
          const collectionRef = collection(db, collectionName);
          const querySnapshot = await getDocs(collectionRef);
          backupData[key] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log(`Successfully fetched ${querySnapshot.docs.length} records from ${collectionName}`);
        } catch (error) {
          console.error(`Error fetching ${collectionName}:`, error);
          throw new Error(`Failed to fetch ${collectionName} data: ${error.message}`);
        }
      }

      // Generate backup folder path with timestamp and ensure valid characters
      const timestamp = new Date().toISOString()
        .replace(/[:.]/g, '-')  // Replace invalid path characters
        .split('T')[0];
      const backupFolder = `backups/${timestamp}`;

      // Track successful uploads
      const uploadedFiles = [];

      for (const [collectionName, data] of Object.entries(backupData)) {
        try {
          const csvContent = backupService.convertToCSV(data);
          const fileName = `${collectionName}.csv`;
          const filePath = `${backupFolder}/${fileName}`;
          const fileRef = ref(storage, filePath);

          console.log(`Uploading ${fileName} to ${filePath}...`);

          // Upload to Firebase Storage
          await uploadString(fileRef, csvContent, 'raw', {
            contentType: 'text/csv',
            customMetadata: {
              timestamp: new Date().toISOString(),
              recordCount: data.length.toString()
            }
          });

          // Get and verify the download URL
          const downloadURL = await getDownloadURL(fileRef);
          console.log(`Successfully uploaded ${fileName}. Available at: ${downloadURL}`);
          uploadedFiles.push(fileName);

          // If it's not an automatic backup, also trigger download
          if (!isAutomatic) {
            backupService.downloadCSV(data, collectionName);
          }
        } catch (error) {
          console.error(`Error processing ${collectionName}:`, error);
          throw new Error(`Failed to process ${collectionName} backup: ${error.message}`);
        }
      }

      // Update last backup date
      const now = new Date();
      setLastBackupDate(now.toISOString());
      localStorage.setItem('lastBackupDate', now.toISOString());

      setSuccessMessage(
        isAutomatic 
          ? `Automated backup completed successfully! Files: ${uploadedFiles.join(', ')}` 
          : `Backup completed! Uploaded files: ${uploadedFiles.join(', ')}`
      );
    } catch (error) {
      console.error('Error backing up data:', error);
      setError(`Failed to backup data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAutomatedBackup = () => {
    setIsAutomatedBackupEnabled(!isAutomatedBackupEnabled);
  };

  return (
    <div className="backup-manager">
      <h2>Data Backup</h2>
      <p>Configure and manage automated cloud backups.</p>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="backup-options">
        <div className="backup-section">
          <h3>Backup Settings</h3>
          <div className="backup-settings">
            <InputField
              label="Backup Interval (hours)"
              type="number"
              value={backupInterval}
              onChange={(e) => setBackupInterval(e.target.value)}
              min="1"
              max="168"
            />
            <div className="automated-backup-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={isAutomatedBackupEnabled}
                  onChange={toggleAutomatedBackup}
                />
                Enable Automated Backup
              </label>
            </div>
          </div>
          {lastBackupDate && (
            <p className="last-backup">
              Last backup: {new Date(lastBackupDate).toLocaleString()}
            </p>
          )}
        </div>

        <div className="backup-section">
          <h3>Manual Backup</h3>
          <Button
            text={isLoading ? "Backing up..." : "Backup Now"}
            onClick={() => handleBackupAll(false)}
            disabled={isLoading}
            className="backup-button"
          />
        </div>
      </div>

      <style>
        {`
          .backup-manager {
            margin-top: 40px;
            padding: 20px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
          }

          .backup-manager h2 {
            margin-bottom: 10px;
            color: var(--header-color);
          }

          .backup-manager p {
            margin-bottom: 20px;
            color: var(--text-color);
          }

          .backup-options {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .backup-section {
            background-color: rgba(0, 0, 0, 0.2);
            padding: 20px;
            border-radius: 8px;
          }

          .backup-section h3 {
            margin-bottom: 15px;
            color: var(--header-color);
          }

          .backup-settings {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .automated-backup-toggle {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 10px;
          }

          .automated-backup-toggle label {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
          }

          .last-backup {
            margin-top: 10px;
            font-size: 0.9em;
            color: rgba(255, 255, 255, 0.7);
          }

          .backup-button {
            background-color: var(--accent-color);
            color: black;
            font-weight: bold;
          }

          .backup-button:hover {
            background-color: #FFE44D;
          }
        `}
      </style>
    </div>
  );
};

export default BackupManager; 