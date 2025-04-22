import React, { useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import PointAdjustmentModal from '../../components/PointAdjustmentModal';
import DeleteMemberModal from '../../components/DeleteMemberModal';

const MemberManagement = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchMembers = async () => {
    try {
      const membersQuery = query(collection(db, 'members'), orderBy('lastName'));
      const querySnapshot = await getDocs(membersQuery);
      const membersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(membersList);
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMembers();
  }, []);

  const handleAdjustPoints = (member) => {
    setSelectedMember(member);
    setShowAdjustmentModal(true);
  };

  const handleDeleteMember = (member) => {
    setSelectedMember(member);
    setShowDeleteModal(true);
  };

  const handleAdjustmentSuccess = () => {
    setShowAdjustmentModal(false);
    fetchMembers();
  };

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false);
    fetchMembers();
  };

  if (loading) {
    return <div>Loading members...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="member-management">
      <h1>Member Management</h1>
      
      <div className="members-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Points</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map(member => (
              <tr key={member.id}>
                <td>{member.firstName} {member.lastName}</td>
                <td>{member.email}</td>
                <td>{member.phone}</td>
                <td>{member.points || 0}</td>
                <td>
                  <button 
                    className="adjust-button"
                    onClick={() => handleAdjustPoints(member)}
                  >
                    Adjust Points
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => handleDeleteMember(member)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdjustmentModal && selectedMember && (
        <PointAdjustmentModal
          member={selectedMember}
          onClose={() => setShowAdjustmentModal(false)}
          onSuccess={handleAdjustmentSuccess}
        />
      )}

      {showDeleteModal && selectedMember && (
        <DeleteMemberModal
          member={selectedMember}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={handleDeleteSuccess}
        />
      )}

      <style jsx>{`
        .member-management {
          padding: 20px;
        }

        h1 {
          margin-bottom: 20px;
          color: var(--text-color);
        }

        .members-table {
          background-color: var(--background-color);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        th {
          background-color: rgba(255, 255, 255, 0.05);
          color: var(--text-color);
          font-weight: 600;
        }

        td {
          color: var(--text-color);
        }

        tr:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }

        .adjust-button, .delete-button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          margin-right: 8px;
        }

        .adjust-button {
          background-color: #4CAF50;
          color: white;
        }

        .delete-button {
          background-color: #F44336;
          color: white;
        }

        .error-message {
          color: #F44336;
          padding: 10px;
          background-color: rgba(244, 67, 54, 0.1);
          border-radius: 4px;
          margin-bottom: 20px;
        }
      `}</style>
    </div>
  );
};

export default MemberManagement; 