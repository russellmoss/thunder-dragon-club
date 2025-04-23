import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import InputField from './InputField';
import Button from './Button';
import ReferralForm from './ReferralForm';
import '../styles/global.css';

const ReferralManager = () => {
  // State for referrer selection
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [members, setMembers] = useState([]);
  const [selectedReferrer, setSelectedReferrer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [referredBy, setReferredBy] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add state for points configuration
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

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setMembers([]);
    setIsLoading(true);
    
    try {
      let membersQuery;
      
      if (searchType === 'name') {
        membersQuery = query(
          collection(db, 'members'),
          orderBy('lastName'),
          limit(100)
        );
      } else {
        membersQuery = query(
          collection(db, 'members'),
          orderBy('email'),
          limit(100)
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
      
      for (const memberDoc of querySnapshot.docs) {
        const memberData = memberDoc.data();
        
        let isMatch = false;
        
        if (searchType === 'name') {
          const fullName = `${memberData.firstName} ${memberData.lastName}`.toLowerCase();
          isMatch = fullName.includes(searchTermLower);
        } else {
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

  const handleSelectReferrer = (member) => {
    setSelectedReferrer(member);
    setSearchTerm('');
    setMembers([]);
    setShowReferralForm(true);
  };

  const handleReferralSuccess = () => {
    setShowReferralForm(false);
    setSelectedReferrer(null);
    setSuccessMessage('Referral registered successfully!');
  };

  const handleSubmitReferral = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      if (!selectedMember) {
        throw new Error('Please select a member first.');
      }

      // Get current admin's name
      const adminDoc = await getDoc(doc(db, 'admins', auth.currentUser.uid));
      const adminName = adminDoc.exists() ? `${adminDoc.data().firstName} ${adminDoc.data().lastName}` : 'Unknown Admin';
      
      // Record the referral
      const referralData = {
        memberId: selectedMember.id,
        memberName: `${selectedMember.firstName} ${selectedMember.lastName}`,
        referredBy: referredBy.trim(),
        date: new Date(date),
        notes: notes.trim() || 'Referral recorded',
        createdAt: new Date(),
        createdBy: adminName
      };

      await addDoc(collection(db, 'referrals'), referralData);
      
      setSuccessMessage('Referral recorded successfully!');
      
      // Reset form
      setReferredBy('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
      setSelectedMember(null);
    } catch (error) {
      console.error('Referral error:', error);
      setError(error.message || 'Failed to record referral. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="referral-manager-container">
      <div className="section-header">
        <h2>Referral Management</h2>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      {!selectedReferrer ? (
        <form onSubmit={handleSearch} className="search-form">
          <h3>Search Referring Member</h3>
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
      ) : (
        <div className="selected-member">
          <h3>Selected Referring Member</h3>
          <p>Name: {selectedReferrer.firstName} {selectedReferrer.lastName}</p>
          <p>Email: {selectedReferrer.email}</p>
          <p>Member Type: {selectedReferrer.memberType === 'trade' ? 'Trade' : 'Non-Trade'}</p>
          <p>Current Points: {selectedReferrer.points || 0}</p>
          <Button 
            text="Change Member"
            onClick={() => {
              setSelectedReferrer(null);
              setShowReferralForm(false);
            }}
            className="secondary-button"
          />
        </div>
      )}
      
      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : members.length > 0 ? (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
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
                  <td>{member.memberType === 'trade' ? 'Trade' : 'Non-Trade'}</td>
                  <td>{member.points || 0}</td>
                  <td>
                    <Button 
                      text="Select"
                      onClick={() => handleSelectReferrer(member)}
                      className="small-button"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {showReferralForm && selectedReferrer && (
        <ReferralForm
          referringMember={selectedReferrer}
          onClose={() => setShowReferralForm(false)}
          onSuccess={handleReferralSuccess}
        />
      )}

      <style jsx>{`
        .referral-manager-container {
          padding: 20px;
        }

        .section-header {
          margin-bottom: 20px;
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

        .selected-member {
          background-color: rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .selected-member h3 {
          margin: 0 0 15px 0;
          color: var(--header-color);
        }

        .selected-member p {
          margin: 5px 0;
          color: var(--text-color);
        }

        .table-container {
          margin-top: 20px;
          background-color: var(--background-color);
          border-radius: 8px;
          overflow: hidden;
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

export default ReferralManager; 