import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import PointAdjustmentModal from '../../components/PointAdjustmentModal';
import DeleteMemberModal from '../../components/DeleteMemberModal';

const MemberSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setMembers([]);

    try {
      if (!searchTerm.trim()) {
        setError('Please enter a search term');
        return;
      }

      const membersQuery = query(
        collection(db, 'members'),
        where('searchableName', '>=', searchTerm.toLowerCase()),
        where('searchableName', '<=', searchTerm.toLowerCase() + '\uf8ff')
      );

      const querySnapshot = await getDocs(membersQuery);
      const membersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (membersList.length === 0) {
        setError('No members found matching your search');
      }

      setMembers(membersList);
    } catch (error) {
      console.error('Error searching members:', error);
      setError('Failed to search members');
    } finally {
      setLoading(false);
    }
  };

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
    handleSearch({ preventDefault: () => {} });
  };

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false);
    handleSearch({ preventDefault: () => {} });
  };

  return (
    <div className="member-search">
      <h1>Member Search</h1>
      
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or email"
          className="search-input"
        />
        <button type="submit" className="search-button" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {members.length > 0 && (
        <div className="results-table">
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
      )}

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
        .member-search {
          padding: 20px;
        }

        h1 {
          margin-bottom: 20px;
          color: var(--text-color);
        }

        .search-form {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .search-input {
          flex: 1;
          padding: 10px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
        }

        .search-button {
          padding: 10px 20px;
          background-color: var(--accent-color);
          color: #000000;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }

        .search-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .results-table {
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

export default MemberSearch; 