import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import InputField from './InputField';
import Button from './Button';
import '../styles/global.css';
import googleSheetsService from '../utils/googleSheets';

const ReferralManager = () => {
  // State for referrer selection
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [members, setMembers] = useState([]);
  const [selectedReferrer, setSelectedReferrer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // State for new member form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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
  };

  const handleSubmitReferral = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      // Check if member with this email already exists
      const emailCheck = query(
        collection(db, 'members'),
        where('email', '==', email)
      );
      
      const emailSnapshot = await getDocs(emailCheck);
      
      if (!emailSnapshot.empty) {
        throw new Error('A member with this email already exists.');
      }

      // Calculate points based on member type
      const pointsToAward = selectedReferrer.memberType === 'trade' 
        ? pointsConfig.tradeReferralPoints 
        : pointsConfig.nonTradeReferralPoints;
      
      // Add the new member to Firestore
      const newMemberRef = await addDoc(collection(db, 'members'), {
        firstName,
        lastName,
        phone,
        email,
        points: 0,
        createdAt: new Date()
      });
      
      // Record the referral
      const referralData = {
        memberId: selectedReferrer.id,
        memberName: `${selectedReferrer.firstName} ${selectedReferrer.lastName}`,
        referralName: `${firstName} ${lastName}`,
        notes: `Referred new member: ${firstName} ${lastName}`,
        pointsEarned: pointsToAward,
        date: new Date(),
        createdAt: new Date()
      };
      
      const referralRef = await addDoc(collection(db, 'referrals'), referralData);
      
      // Backup to Google Sheets
      await googleSheetsService.backupReferral({
        id: referralRef.id,
        ...referralData
      });
      
      // Update referrer's points
      const referrerRef = doc(db, 'members', selectedReferrer.id);
      await updateDoc(referrerRef, {
        points: (selectedReferrer.points || 0) + pointsToAward
      });
      
      setSuccessMessage(`Referral processed successfully! ${pointsToAward} points awarded.`);
      
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setSelectedReferrer(null);
    } catch (error) {
      console.error('Referral error:', error);
      setError(error.message || 'Failed to process referral. Please try again.');
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
          <h3>Search Referrer</h3>
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
        <div className="selected-referrer">
          <h3>Selected Referrer</h3>
          <p>Name: {selectedReferrer.firstName} {selectedReferrer.lastName}</p>
          <p>Email: {selectedReferrer.email}</p>
          <p>Current Points: {selectedReferrer.points || 0}</p>
          <Button 
            text="Change Referrer"
            onClick={() => setSelectedReferrer(null)}
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
      
      {selectedReferrer && (
        <form onSubmit={handleSubmitReferral} className="referral-form">
          <h3>New Member Details</h3>
          <div className="form-row">
            <InputField 
              label="First Name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
              required
            />
            <InputField 
              label="Last Name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
              required
            />
          </div>
          <InputField 
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            required
          />
          <InputField 
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
            required
          />
          <Button 
            text={isSubmitting ? "Processing..." : "Submit Referral"}
            type="submit"
            disabled={isSubmitting}
          />
        </form>
      )}
    </div>
  );
};

export default ReferralManager; 