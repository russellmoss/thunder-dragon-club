import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import '../styles/global.css';

const MemberForm = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    memberType: '',
    points: 0
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep1 = () => {
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
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.memberType) {
      setError('Please select a membership type');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const docRef = await addDoc(collection(db, 'members'), {
        ...formData,
        createdAt: new Date()
      });
      onSuccess(docRef.id);
      onClose();
    } catch (error) {
      console.error('Error adding member:', error);
      setError('Failed to add member. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="member-form-overlay">
      <div className="member-form-container">
        <div className="form-header">
          <h2>New Member Registration</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="step-indicator">
          <div className={`step ${step === 1 ? 'active' : ''}`}>1. Personal Information</div>
          <div className={`step ${step === 2 ? 'active' : ''}`}>2. Membership Type</div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {step === 1 && (
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
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  required
                />
              </div>
              <div className="form-buttons">
                <button type="button" onClick={onClose}>Cancel</button>
                <button type="button" onClick={handleNext}>Next</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-step">
              <div className="form-group">
                <label>Membership Type</label>
                <div className="membership-type-options">
                  <button
                    type="button"
                    className={`type-option ${formData.memberType === 'trade' ? 'selected' : ''}`}
                    onClick={() => handleChange({ target: { name: 'memberType', value: 'trade' } })}
                  >
                    <div className="type-header">Trade Member</div>
                    <div className="type-description">
                      For industry professionals and business partners
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`type-option ${formData.memberType === 'non-trade' ? 'selected' : ''}`}
                    onClick={() => handleChange({ target: { name: 'memberType', value: 'non-trade' } })}
                  >
                    <div className="type-header">Non-Trade Member</div>
                    <div className="type-description">
                      For regular customers and wine enthusiasts
                    </div>
                  </button>
                </div>
                <div className="type-note">
                  Note: Referral members can only be created through the referral process
                </div>
              </div>
              <div className="form-buttons">
                <button type="button" onClick={handleBack}>Back</button>
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          )}
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
          font-size: 28px;
          color: var(--text-color);
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 32px;
          color: var(--text-color);
          cursor: pointer;
          padding: 10px;
          line-height: 1;
        }

        .step-indicator {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding: 0 20px;
        }

        .step {
          flex: 1;
          text-align: center;
          padding: 15px;
          color: var(--text-color);
          opacity: 0.5;
          border-bottom: 3px solid var(--accent-color);
          font-size: 18px;
        }

        .step.active {
          opacity: 1;
          border-bottom: 3px solid var(--accent-color);
        }

        .form-step {
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .form-group label {
          color: var(--text-color);
          font-weight: bold;
          font-size: 18px;
        }

        .form-group input {
          padding: 16px;
          border: 2px solid var(--accent-color);
          border-radius: 8px;
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
          font-size: 18px;
          min-height: 50px;
        }

        .membership-type-options {
          display: flex;
          gap: 20px;
          margin-top: 20px;
        }

        .type-option {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 15px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          background-color: rgba(255, 255, 255, 0.1);
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
          width: 100%;
        }

        .type-option.selected {
          background-color: rgba(255, 215, 0, 0.1);
          border-color: var(--accent-color);
        }

        .type-header {
          font-size: 1.1rem;
          font-weight: bold;
          color: var(--header-color);
        }

        .type-description {
          font-size: 0.9rem;
          color: var(--text-color);
          opacity: 0.8;
        }

        .type-note {
          margin-top: 10px;
          font-size: 0.9rem;
          color: var(--text-color);
          opacity: 0.7;
          font-style: italic;
        }

        .form-buttons {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          gap: 20px;
        }

        .form-buttons button {
          padding: 16px 32px;
          border: none;
          border-radius: 8px;
          font-size: 18px;
          cursor: pointer;
          transition: background-color 0.3s;
          min-height: 60px;
          flex: 1;
        }

        .form-buttons button:first-child {
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
        }

        .form-buttons button:last-child {
          background-color: var(--accent-color);
          color: #000000;
        }

        .form-buttons button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .member-form-container {
            padding: 20px;
          }

          .membership-type-options {
            flex-direction: column;
          }

          .form-buttons {
            flex-direction: column;
            gap: 15px;
          }

          .form-buttons button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default MemberForm; 