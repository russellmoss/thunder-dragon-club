import React, { useState } from 'react';
import { doc, updateDoc, increment, addDoc, collection, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

const PointAdjustmentModal = ({ member, onClose, onSuccess }) => {
  const [points, setPoints] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { adminUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!points || isNaN(points)) {
        throw new Error('Please enter a valid number of points');
      }

      if (!note.trim()) {
        throw new Error('Please provide a reason for the adjustment');
      }

      if (!adminUser) {
        throw new Error('Admin authentication required');
      }

      // Get current admin's name
      const adminDoc = await getDoc(doc(db, 'admins', auth.currentUser.uid));
      const adminName = adminDoc.exists() ? `${adminDoc.data().firstName} ${adminDoc.data().lastName}` : 'Unknown Admin';

      const pointsNum = parseInt(points);
      const memberRef = doc(db, 'members', member.id);

      // Update points
      await updateDoc(memberRef, {
        points: increment(pointsNum)
      });

      // Add to transactions collection
      await addDoc(collection(db, 'transactions'), {
        memberId: member.id,
        pointsEarned: pointsNum,
        amount: 0, // Set to 0 for manual adjustments
        date: new Date(),
        notes: note.trim(),
        type: 'manual_adjustment',
        createdBy: adminName,
        memberType: member.memberType || 'non-trade' // Include member type
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adjusting points:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Adjust Points for {member.firstName} {member.lastName}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Points Adjustment</label>
            <div className="points-input">
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                placeholder="Enter points (use negative for deduction)"
                required
              />
              <span className="current-points">Current Points: {member.points || 0}</span>
            </div>
          </div>

          <div className="form-group">
            <label>Reason for Adjustment</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter the reason for this points adjustment"
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? 'Adjusting...' : 'Adjust Points'}
            </button>
          </div>
        </form>

        <style jsx>{`
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
          }

          .modal-content {
            background-color: var(--background-color);
            border-radius: 8px;
            padding: 20px;
            width: 100%;
            max-width: 500px;
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

          .points-input {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .current-points {
            color: var(--accent-color);
            font-size: 0.9rem;
          }

          input, textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            background-color: rgba(255, 255, 255, 0.1);
            color: var(--text-color);
          }

          textarea {
            min-height: 100px;
            resize: vertical;
          }

          .modal-footer {
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
            background-color: rgba(244, 67, 54, 0.2);
            color: #F44336;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
          }
        `}</style>
      </div>
    </div>
  );
};

export default PointAdjustmentModal; 