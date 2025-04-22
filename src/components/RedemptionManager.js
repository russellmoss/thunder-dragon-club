import React, { useState } from 'react';
import { collection, addDoc, query, getDocs, doc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import InputField from './InputField';
import Button from './Button';
import '../styles/global.css';
import googleSheetsService from '../utils/googleSheets';

const RedemptionManager = () => {
  // State for member selection
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // State for redemption form
  const [points, setPoints] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setSearchTerm('');
    setMembers([]);
  };

  const handleSubmitRedemption = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const pointsToRedeem = parseInt(points);
      
      if (isNaN(pointsToRedeem) || pointsToRedeem <= 0) {
        throw new Error('Please enter a valid number of points to redeem.');
      }
      
      if (pointsToRedeem > selectedMember.points) {
        throw new Error('Member does not have enough points for this redemption.');
      }
      
      // Add redemption record
      const redemptionData = {
        memberId: selectedMember.id,
        memberName: `${selectedMember.firstName} ${selectedMember.lastName}`,
        points: pointsToRedeem,
        item: description,
        notes: description,
        date: new Date(),
        createdAt: new Date()
      };
      
      const redemptionRef = await addDoc(collection(db, 'redemptions'), redemptionData);
      
      // Backup to Google Sheets
      await googleSheetsService.backupRedemption({
        id: redemptionRef.id,
        ...redemptionData
      });
      
      // Update member's points
      const memberRef = doc(db, 'members', selectedMember.id);
      await updateDoc(memberRef, {
        points: selectedMember.points - pointsToRedeem
      });
      
      setSuccessMessage('Points redeemed successfully!');
      setPoints('');
      setDescription('');
      setSelectedMember(null);
    } catch (error) {
      console.error('Redemption error:', error);
      setError(error.message || 'Failed to process redemption. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="redemption-manager-container">
      <div className="section-header">
        <h2>Points Redemption</h2>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      {!selectedMember ? (
        <form onSubmit={handleSearch} className="search-form">
          <h3>Search Member</h3>
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
          <h3>Selected Member</h3>
          <p>Name: {selectedMember.firstName} {selectedMember.lastName}</p>
          <p>Email: {selectedMember.email}</p>
          <p>Current Points: {selectedMember.points}</p>
          <Button 
            text="Change Member"
            onClick={() => setSelectedMember(null)}
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
                <th>Points</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.id}>
                  <td>{`${member.firstName} ${member.lastName}`}</td>
                  <td>{member.email}</td>
                  <td>{member.points || 0}</td>
                  <td>
                    <Button 
                      text="Select"
                      onClick={() => handleSelectMember(member)}
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
        <form onSubmit={handleSubmitRedemption} className="redemption-form">
          <h3>Redeem Points</h3>
          <InputField 
            label="Points to Redeem"
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="Enter number of points"
            required
          />
          <InputField 
            label="Description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are these points being redeemed for?"
            required
          />
          <Button 
            text={isSubmitting ? "Processing..." : "Redeem Points"}
            type="submit"
            disabled={isSubmitting}
          />
        </form>
      )}
    </div>
  );
};

export default RedemptionManager; 