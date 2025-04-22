import React, { useState } from 'react';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import InputField from './InputField';
import Button from './Button';
import MemberDetails from './MemberDetails';
import '../styles/global.css';

const MemberManager = () => {
  // State for adding new members
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [memberType, setMemberType] = useState('non-trade'); // 'trade' or 'non-trade'
  const [isAddingMember, setIsAddingMember] = useState(false);
  
  // State for searching members
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name'); // 'name' or 'email'
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // State for feedback messages
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // State for showing or hiding the add member form
  const [showAddForm, setShowAddForm] = useState(false);

  const [selectedMember, setSelectedMember] = useState(null);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsAddingMember(true);
    
    try {
      // Check if member with this email already exists
      const emailCheck = query(
        collection(db, 'members'),
        where('email', '==', email)
      );
      
      const emailSnapshot = await getDocs(emailCheck);
      
      if (!emailSnapshot.empty) {
        setError('A member with this email already exists.');
        setIsAddingMember(false);
        return;
      }
      
      // Add the new member to Firestore
      await addDoc(collection(db, 'members'), {
        firstName,
        lastName,
        phone,
        email,
        memberType,
        points: 0,
        createdAt: new Date()
      });
      
      // Reset form
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setMemberType('non-trade');
      
      setSuccessMessage('Member added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding member:', error);
      setError('Failed to add member. Please try again.');
    } finally {
      setIsAddingMember(false);
    }
  };

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

  return (
    <div className="member-manager-container">
      <div className="section-header">
        <h2>Member Management</h2>
        <Button 
          text={showAddForm ? "Cancel" : "Add New Member"} 
          onClick={() => setShowAddForm(!showAddForm)}
        />
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      {showAddForm && (
        <form onSubmit={handleAddMember} className="add-member-form">
          <h3>Add New Member</h3>
          <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
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
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number"
            required
          />
          <InputField 
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            required
          />
          <div className="input-field">
            <label>Member Type</label>
            <select 
              value={memberType} 
              onChange={(e) => setMemberType(e.target.value)}
              required
            >
              <option value="non-trade">Non-Trade</option>
              <option value="trade">Trade</option>
            </select>
          </div>
          <Button 
            text={isAddingMember ? "Adding..." : "Add Member"}
            type="submit"
            disabled={isAddingMember}
          />
        </form>
      )}
      
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
                  <td>{member.memberType === 'trade' ? 'Trade' : 'Non-Trade'}</td>
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
    </div>
  );
};

export default MemberManager; 