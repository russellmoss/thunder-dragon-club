import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from './Button';
import '../styles/global.css';

const PasswordReset = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Send password reset email directly through Firebase Auth
      await resetPassword(email);
      setSuccess('If an account exists with this email, a password reset link will be sent.');
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Failed to send password reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Reset Password</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-buttons">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Reset Password'}
            </button>
          </div>
        </form>

        <style>{`
          .modal-overlay {
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

          .modal-content {
            background-color: var(--background-color);
            padding: 30px;
            border-radius: 8px;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }

          .modal-header h2 {
            margin: 0;
            color: var(--header-color);
            font-size: 1.4rem;
          }

          .close-button {
            background: none;
            border: none;
            color: var(--text-color);
            font-size: 24px;
            cursor: pointer;
          }

          .form-group {
            margin-bottom: 20px;
          }

          .form-group label {
            display: block;
            margin-bottom: 8px;
            color: var(--text-color);
          }

          .form-group input {
            width: 100%;
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

          .form-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
          }

          .cancel-button, .submit-button {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
          }

          .cancel-button {
            background-color: rgba(255, 255, 255, 0.1);
            color: var(--text-color);
          }

          .submit-button {
            background-color: var(--accent-color);
            color: #000000;
            font-weight: bold;
          }

          .submit-button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }

          .error-message {
            background-color: rgba(244, 67, 54, 0.1);
            color: #F44336;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
          }

          .success-message {
            background-color: rgba(76, 175, 80, 0.1);
            color: #4CAF50;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
          }
        `}</style>
      </div>
    </div>
  );
};

export default PasswordReset; 