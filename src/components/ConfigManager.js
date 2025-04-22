import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import InputField from './InputField';
import Button from './Button';
import '../styles/global.css';

const ConfigManager = () => {
  // State for points configuration
  const [nonTradePointsRate, setNonTradePointsRate] = useState(1);
  const [tradePointsRate, setTradePointsRate] = useState(2);
  const [nonTradeReferralPoints, setNonTradeReferralPoints] = useState(10);
  const [tradeReferralPoints, setTradeReferralPoints] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load current configuration on component mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const configDoc = await getDoc(doc(db, 'config', 'points'));
      if (configDoc.exists()) {
        const data = configDoc.data();
        setNonTradePointsRate(data.nonTradePointsRate || 1);
        setTradePointsRate(data.tradePointsRate || 2);
        setNonTradeReferralPoints(data.nonTradeReferralPoints || 10);
        setTradeReferralPoints(data.tradeReferralPoints || 20);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      setError('Failed to load configuration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      await setDoc(doc(db, 'config', 'points'), {
        nonTradePointsRate: Number(nonTradePointsRate),
        tradePointsRate: Number(tradePointsRate),
        nonTradeReferralPoints: Number(nonTradeReferralPoints),
        tradeReferralPoints: Number(tradeReferralPoints),
        updatedAt: new Date()
      });

      setSuccessMessage('Configuration saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      setError('Failed to save configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading configuration...</div>;
  }

  return (
    <div className="config-manager">
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <form onSubmit={handleSave}>
        <div className="config-section">
          <h3>Points Per Ngultrum Spent</h3>
          <div className="form-row">
            <InputField
              label="Non-Trade Members"
              type="number"
              value={nonTradePointsRate}
              onChange={(e) => setNonTradePointsRate(e.target.value)}
              min="0"
              step="1"
              required
            />
            <InputField
              label="Trade Members"
              type="number"
              value={tradePointsRate}
              onChange={(e) => setTradePointsRate(e.target.value)}
              min="0"
              step="1"
              required
            />
          </div>
        </div>

        <div className="config-section">
          <h3>Points Per Referral</h3>
          <div className="form-row">
            <InputField
              label="Non-Trade Members"
              type="number"
              value={nonTradeReferralPoints}
              onChange={(e) => setNonTradeReferralPoints(e.target.value)}
              min="0"
              step="1"
              required
            />
            <InputField
              label="Trade Members"
              type="number"
              value={tradeReferralPoints}
              onChange={(e) => setTradeReferralPoints(e.target.value)}
              min="0"
              step="1"
              required
            />
          </div>
        </div>

        <Button
          text={isSaving ? "Saving..." : "Save Configuration"}
          type="submit"
          disabled={isSaving}
        />
      </form>

      <style jsx>{`
        .config-manager {
          width: 100%;
        }

        .config-section {
          margin-bottom: 20px;
        }

        .config-section h3 {
          margin-bottom: 15px;
          color: var(--header-color);
        }

        .form-row {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
        }

        .form-row .input-field {
          flex: 1;
        }

        .loading {
          text-align: center;
          padding: 20px;
          color: var(--text-color);
        }
      `}</style>
    </div>
  );
};

export default ConfigManager; 