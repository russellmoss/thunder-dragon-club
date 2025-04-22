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
  const [nonTradeReferralPoints, setNonTradeReferralPoints] = useState(100);
  const [tradeReferralPoints, setTradeReferralPoints] = useState(200);
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
      const configRef = doc(db, 'config', 'points');
      const configDoc = await getDoc(configRef);
      
      if (configDoc.exists()) {
        const data = configDoc.data();
        setNonTradePointsRate(data.nonTradePointsRate || 1);
        setTradePointsRate(data.tradePointsRate || 2);
        setNonTradeReferralPoints(data.nonTradeReferralPoints || 100);
        setTradeReferralPoints(data.tradeReferralPoints || 200);
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      setError('Failed to load configuration. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      // Validate input values
      const nonTradeRate = parseFloat(nonTradePointsRate);
      const tradeRate = parseFloat(tradePointsRate);
      const nonTradeRef = parseInt(nonTradeReferralPoints);
      const tradeRef = parseInt(tradeReferralPoints);

      if (isNaN(nonTradeRate) || isNaN(tradeRate) || isNaN(nonTradeRef) || isNaN(tradeRef)) {
        throw new Error('All values must be valid numbers.');
      }

      if (nonTradeRate < 0 || tradeRate < 0 || nonTradeRef < 0 || tradeRef < 0) {
        throw new Error('All values must be non-negative.');
      }

      // Save configuration to Firestore
      await setDoc(doc(db, 'config', 'points'), {
        nonTradePointsRate: nonTradeRate,
        tradePointsRate: tradeRate,
        nonTradeReferralPoints: nonTradeRef,
        tradeReferralPoints: tradeRef,
        updatedAt: new Date()
      });

      setSuccessMessage('Configuration saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving configuration:', error);
      setError(error.message || 'Failed to save configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading configuration...</div>;
  }

  return (
    <div className="config-manager-container">
      <div className="section-header">
        <h2>Points Configuration</h2>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <form onSubmit={handleSubmit} className="config-form">
        <div className="config-section">
          <h3>Points Per Ngultrum Spent</h3>
          <div className="form-row">
            <InputField
              label="Non-Trade Members"
              type="number"
              value={nonTradePointsRate}
              onChange={(e) => setNonTradePointsRate(e.target.value)}
              placeholder="Enter points rate"
              required
              min="0"
              step="0.1"
            />
            <InputField
              label="Trade Members"
              type="number"
              value={tradePointsRate}
              onChange={(e) => setTradePointsRate(e.target.value)}
              placeholder="Enter points rate"
              required
              min="0"
              step="0.1"
            />
          </div>
          <p className="help-text">Points earned per Ngultrum spent on purchases</p>
        </div>

        <div className="config-section">
          <h3>Referral Bonus Points</h3>
          <div className="form-row">
            <InputField
              label="Non-Trade Members"
              type="number"
              value={nonTradeReferralPoints}
              onChange={(e) => setNonTradeReferralPoints(e.target.value)}
              placeholder="Enter referral points"
              required
              min="0"
              step="1"
            />
            <InputField
              label="Trade Members"
              type="number"
              value={tradeReferralPoints}
              onChange={(e) => setTradeReferralPoints(e.target.value)}
              placeholder="Enter referral points"
              required
              min="0"
              step="1"
            />
          </div>
          <p className="help-text">Points awarded for successful referrals</p>
        </div>

        <div className="config-summary">
          <h3>Current Configuration Summary</h3>
          <ul>
            <li>Non-trade members earn {nonTradePointsRate} points per Ngultrum</li>
            <li>Trade members earn {tradePointsRate} points per Ngultrum</li>
            <li>Non-trade members earn {nonTradeReferralPoints} points per referral</li>
            <li>Trade members earn {tradeReferralPoints} points per referral</li>
          </ul>
        </div>

        <Button
          text={isSaving ? "Saving..." : "Save Configuration"}
          type="submit"
          disabled={isSaving}
        />
      </form>
    </div>
  );
};

export default ConfigManager; 