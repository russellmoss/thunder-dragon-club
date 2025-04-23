import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import '../styles/global.css';

const ReferralForm = ({ onClose, onSuccess, referringMember }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    memberType: 'referral',
    points: 0
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pointsConfig, setPointsConfig] = useState({
    nonTradeReferralPoints: 10,
    tradeReferralPoints: 20
  });

  // Load points configuration on component mount
  useEffect(() => {
    loadPointsConfig();
  }, []);

  const loadPointsConfig = async () => {
    try {
      const configRef = doc(db, 'config', 'points');
      const configDoc = await getDoc(configRef);
      
      if (configDoc.exists()) {
        const data = configDoc.data();
        setPointsConfig({
          nonTradeReferralPoints: data.nonTradeReferralPoints || 10,
          tradeReferralPoints: data.tradeReferralPoints || 20
        });
      }
    } catch (error) {
      console.error('Error loading points configuration:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Check if email already exists
      const emailQuery = query(
        collection(db, 'members'),
        where('email', '==', formData.email.toLowerCase())
      );
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        setError('A member with this email already exists');
        setIsSubmitting(false);
        return;
      }

      // Get current admin's name
      const adminDoc = await getDoc(doc(db, 'admins', auth.currentUser.uid));
      const adminName = adminDoc.exists() ? `${adminDoc.data().firstName} ${adminDoc.data().lastName}` : 'Unknown Admin';

      // Calculate points to award based on referring member's type
      const pointsToAward = referringMember.memberType === 'trade' 
        ? pointsConfig.tradeReferralPoints 
        : pointsConfig.nonTradeReferralPoints;

      // Add the new referral member with explicit member type
      const memberDoc = await addDoc(collection(db, 'members'), {
        ...formData,
        memberType: 'referral', // Explicitly set member type
        email: formData.email.toLowerCase(),
        createdAt: new Date(),
        searchableName: `${formData.firstName.toLowerCase()} ${formData.lastName.toLowerCase()}`
      });

      // Create the referral record
      await addDoc(collection(db, 'referrals'), {
        memberId: referringMember.id,
        referredMemberId: memberDoc.id,
        referralName: `${formData.firstName} ${formData.lastName}`,
        date: new Date(),
        status: 'pending',
        pointsEarned: pointsToAward,
        createdBy: adminName
      });

      // Update referring member's points
      const referrerRef = doc(db, 'members', referringMember.id);
      await updateDoc(referrerRef, {
        points: (referringMember.points || 0) + pointsToAward
      });

      onSuccess(memberDoc.id);
      onClose();
    } catch (error) {
      console.error('Error adding referral:', error);
      setError('Failed to add referral. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="member-form-overlay">
      <div className="member-form-container">
        <div className="form-header">
          <h2>Referral Registration</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-step">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter first name"
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter last name"
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                required
              />
            </div>

            <div className="referral-info">
              <p>Thank you for your visit to the BWC Wine Bar. Tashi Delek</p>
            </div>

            <div className="form-buttons">
              <button type="button" onClick={onClose}>Cancel</button>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Register Referral'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style jsx>{`
        .member-form-overlay {
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

        .member-form-container {
          background-color: var(--background-color);
          padding: 40px;
          border-radius: 12px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .form-header h2 {
          margin: 0;
          color: var(--header-color);
          font-size: 1.8rem;
        }

        .close-button {
          background: none;
          border: none;
          color: var(--text-color);
          font-size: 24px;
          cursor: pointer;
        }

        .form-step {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          color: var(--text-color);
          font-size: 1rem;
        }

        .form-group input {
          padding: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
          font-size: 1rem;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--accent-color);
        }

        .referral-info {
          background-color: rgba(255, 215, 0, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 6px;
          padding: 15px;
          margin: 10px 0;
        }

        .referral-info p {
          margin: 5px 0;
          color: var(--text-color);
          font-size: 0.9rem;
        }

        .form-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          margin-top: 20px;
        }

        .form-buttons button {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          transition: background-color 0.3s;
        }

        .form-buttons button[type="button"] {
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
        }

        .form-buttons button[type="submit"] {
          background-color: var(--accent-color);
          color: #000000;
          font-weight: bold;
        }

        .form-buttons button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .error-message {
          background-color: rgba(244, 67, 54, 0.1);
          color: #F44336;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        @media (max-width: 600px) {
          .member-form-container {
            padding: 20px;
          }

          .form-header h2 {
            font-size: 1.5rem;
          }

          .form-buttons {
            flex-direction: column;
          }

          .form-buttons button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ReferralForm; 