import React, { useState } from 'react';
import { doc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';

const DeleteMemberModal = ({ member, onClose, onSuccess }) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const deleteAssociatedRecords = async (memberId) => {
    const batch = writeBatch(db);
    const collections = ['transactions', 'redemptions', 'referrals'];
    
    for (const collectionName of collections) {
      const q = query(
        collection(db, collectionName),
        where('memberId', '==', memberId)
      );
      
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
    }
    
    // Also check for referrals where this member was referred
    const referredQuery = query(
      collection(db, 'referrals'),
      where('referredMemberId', '==', memberId)
    );
    const referredSnapshot = await getDocs(referredQuery);
    referredSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (confirmationText !== 'DELETE') {
        throw new Error('Please type "DELETE" to confirm');
      }

      // First delete all associated records
      await deleteAssociatedRecords(member.id);

      // Then delete the member document
      const memberRef = doc(db, 'members', member.id);
      await deleteDoc(memberRef);

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error deleting member:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Delete Member</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="warning-message">
          <h3>Warning: This action cannot be undone!</h3>
          <p>You are about to delete {member.firstName} {member.lastName} from the system.</p>
          <p>This will permanently remove:</p>
          <ul>
            <li>Member profile</li>
            <li>All transaction history</li>
            <li>All redemption history</li>
            <li>All referral records</li>
            <li>Points balance</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Type "DELETE" to confirm
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Type DELETE to confirm"
              required
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button 
              type="submit" 
              className="delete-button" 
              disabled={isLoading || confirmationText !== 'DELETE'}
            >
              {isLoading ? 'Deleting...' : 'Delete Member'}
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
            color: #F44336;
            font-size: 1.4rem;
          }

          .close-button {
            background: none;
            border: none;
            color: var(--text-color);
            font-size: 24px;
            cursor: pointer;
          }

          .warning-message {
            background-color: rgba(244, 67, 54, 0.1);
            border: 1px solid rgba(244, 67, 54, 0.3);
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 20px;
          }

          .warning-message h3 {
            color: #F44336;
            margin: 0 0 10px 0;
          }

          .warning-message p {
            margin: 5px 0;
            color: var(--text-color);
            font-size: 0.9rem;
          }

          .warning-message ul {
            margin: 10px 0;
            padding-left: 20px;
            color: var(--text-color);
            font-size: 0.9rem;
          }

          .warning-message li {
            margin: 5px 0;
          }

          .form-group {
            margin-bottom: 20px;
          }

          .form-group label {
            display: block;
            margin-bottom: 8px;
            color: var(--text-color);
          }

          input {
            width: 100%;
            padding: 10px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            background-color: rgba(255, 255, 255, 0.1);
            color: var(--text-color);
          }

          .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 20px;
          }

          .cancel-button, .delete-button {
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

          .delete-button {
            background-color: #F44336;
            color: #FFFFFF;
            font-weight: bold;
          }

          .delete-button:disabled {
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

export default DeleteMemberModal; 