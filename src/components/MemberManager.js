import React, { useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import InputField from './InputField';
import Button from './Button';
import MemberDetails from './MemberDetails';
import MemberForm from './MemberForm';
import '../styles/global.css';
import googleSheetsService from '../utils/googleSheets';

const MemberManager = () => {
  // State for searching members
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name'); // 'name' or 'email'
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberForm, setShowMemberForm] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setMembers([]);
    setIsLoading(true);
    
    try {
      // For fuzzy matching, we'll get a larger set of results and filter client-side
      let membersQuery;
      
      if (searchType === 'name') {
        // Get all members and filter by name
        membersQuery = query(
          collection(db, 'members'),
          orderBy('lastName'),
          limit(100) // Limit to 100 results for performance
        );
      } else {
        // Get all members and filter by email
        membersQuery = query(
          collection(db, 'members'),
          orderBy('email'),
          limit(100) // Limit to 100 results for performance
        );
      }
      
      const querySnapshot = await getDocs(membersQuery);
      
      if (querySnapshot.empty) {
        setError('No members found in the database.');
        setIsLoading(false);
        return;
      }
      
      const membersData = [];
      const searchTermLower = searchTerm.toLowerCase();
      
      // For each member, check if they match our search criteria
      for (const memberDoc of querySnapshot.docs) {
        const memberData = memberDoc.data();
        
        // Fuzzy matching logic
        let isMatch = false;
        
        if (searchType === 'name') {
          // Check if the name contains the search term (case insensitive)
          const fullName = `${memberData.firstName} ${memberData.lastName}`.toLowerCase();
          isMatch = fullName.includes(searchTermLower);
        } else {
          // Check if the email contains the search term (case insensitive)
          isMatch = memberData.email && 
                  memberData.email.toLowerCase().includes(searchTermLower);
        }
        
        if (isMatch) {
          membersData.push({
            id: memberDoc.id,
            ...memberData
          });
        }
      }
      
      if (membersData.length === 0) {
        setError('No members found matching your search criteria.');
      } else {
        setMembers(membersData);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Search error:', error);
      setError('An error occurred while searching. Please try again.');
      setIsLoading(false);
    }
  };

  const handleViewDetails = (member) => {
    setSelectedMember(member);
  };

  const handleMemberFormClose = () => {
    setShowMemberForm(false);
  };

  const handleMemberFormSuccess = (memberId) => {
    setShowMemberForm(false);
    setSuccessMessage('Member added successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="member-manager-container">
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <form onSubmit={handleSearch} className="search-form">
        <h3>Search Members</h3>
        <div className="search-container">
          <InputField 
            label="Search Term"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Enter member ${searchType}`}
            required
          />
          <div className="search-type-selector">
            <label>Search by:</label>
            <select 
              value={searchType} 
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="email">Email</option>
            </select>
          </div>
          <Button 
            text={isLoading ? "Searching..." : "Search"}
            type="submit"
            disabled={isLoading}
          />
        </div>
      </form>
      
      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : members.length > 0 ? (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Member Type</th>
                <th>Points</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.id}>
                  <td>{`${member.firstName} ${member.lastName}`}</td>
                  <td>{member.email}</td>
                  <td>{member.phone}</td>
                  <td>
                    <span className={`member-type ${member.memberType}`}>
                      {member.memberType === 'trade' ? 'Trade Member' :
                       member.memberType === 'referral' ? 'Referral Member' :
                       'Non-Trade Member'}
                    </span>
                  </td>
                  <td>{member.points || 0}</td>
                  <td>
                    <Button 
                      text="View Details"
                      onClick={() => handleViewDetails(member)}
                      className="small-button"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {selectedMember && (
        <MemberDetails 
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {showMemberForm && (
        <MemberForm 
          onClose={handleMemberFormClose}
          onSuccess={handleMemberFormSuccess}
        />
      )}

      <style jsx>{`
        .member-manager-container {
          padding: 20px;
        }

        .search-form {
          margin-bottom: 30px;
        }

        .search-container {
          display: flex;
          gap: 15px;
          align-items: flex-end;
        }

        .search-type-selector {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .search-type-selector select {
          padding: 10px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
        }

        .table-container {
          background-color: var(--background-color);
          border-radius: 8px;
          overflow: hidden;
          margin-top: 20px;
        }

        .member-type {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .member-type.trade {
          background-color: rgba(255, 215, 0, 0.2);
          color: var(--accent-color);
        }

        .member-type.non-trade {
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
        }

        .member-type.referral {
          background-color: rgba(139, 0, 0, 0.2);
          color: #F44336;
        }

        .error-message {
          background-color: rgba(244, 67, 54, 0.1);
          color: #F44336;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .success-message {
          background-color: rgba(76, 175, 80, 0.1);
          color: #4CAF50;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        @media (max-width: 768px) {
          .search-container {
            flex-direction: column;
            gap: 10px;
          }

          .search-container > * {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default MemberManager; 