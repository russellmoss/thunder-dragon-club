import React, { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, deleteDoc, doc, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import InputField from './InputField';
import Button from './Button';
import '../styles/global.css';

const AdminManager = () => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [uid, setUid] = useState('');
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'admins'));
      const adminList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAdmins(adminList);
    } catch (error) {
      console.error('Error fetching admins:', error);
      setError('Failed to fetch admin list');
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // First check if user is already an admin
      const adminQuery = query(collection(db, 'admins'), where('email', '==', email));
      const adminSnapshot = await getDocs(adminQuery);
      if (!adminSnapshot.empty) {
        throw new Error('This user is already an admin');
      }

      // Get the current user's UID from Firebase Auth
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('You must be logged in as an admin to add new admins');
      }

      // Add admin to Firestore with UID as document ID
      const adminData = {
        firstName,
        lastName,
        name: firstName,
        email,
        role: 'admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Use setDoc with the UID as the document ID
      await setDoc(doc(db, 'admins', uid), adminData);
      setSuccessMessage('Admin added successfully');

      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setUid('');
      
      // Refresh admin list
      fetchAdmins();
    } catch (error) {
      console.error('Error adding admin:', error);
      setError('Failed to add admin: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAdmin = (admin) => {
    setEditingAdmin(admin);
    setFirstName(admin.firstName);
    setLastName(admin.lastName);
    setEmail(admin.email);
    setShowEditForm(true);
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      // First update Firestore document
      await updateDoc(doc(db, 'admins', editingAdmin.id), {
        firstName,
        lastName,
        email,
        updatedAt: serverTimestamp()
      });

      setSuccessMessage('Admin updated successfully!');
      setShowEditForm(false);
      setEditingAdmin(null);
      setEmail('');
      setFirstName('');
      setLastName('');
      fetchAdmins();
    } catch (error) {
      console.error('Error updating admin:', error);
      setError('Failed to update admin: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to remove this admin?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'admins', adminId));
      setSuccessMessage('Admin removed successfully!');
      fetchAdmins();
    } catch (error) {
      console.error('Error deleting admin:', error);
      setError('Failed to remove admin');
    }
  };

  const cancelEdit = () => {
    setShowEditForm(false);
    setEditingAdmin(null);
    setEmail('');
    setFirstName('');
    setLastName('');
  };

  return (
    <div className="admin-manager">
      <h2>Admin Management</h2>
      <p>Add and manage admin users for the Thunder Dragon Club system.</p>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {!showEditForm ? (
        <form onSubmit={handleAddAdmin} className="admin-form">
          <div className="form-row">
            <InputField
              label="First Name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <InputField
              label="Last Name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <InputField
            label="Firebase UID"
            type="text"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            required
          />
          <Button
            text={isLoading ? "Adding Admin..." : "Add Admin"}
            type="submit"
            disabled={isLoading}
          />
        </form>
      ) : (
        <form onSubmit={handleUpdateAdmin} className="admin-form">
          <h3>Edit Admin</h3>
          <div className="form-row">
            <InputField
              label="First Name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <InputField
              label="Last Name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="form-buttons">
            <Button
              text="Cancel"
              type="button"
              onClick={cancelEdit}
              className="secondary-button"
            />
            <Button
              text={isLoading ? "Updating..." : "Update Admin"}
              type="submit"
              disabled={isLoading}
            />
          </div>
        </form>
      )}

      <div className="admin-list">
        <h3>Current Admins</h3>
        {admins.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Added On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => (
                <tr key={admin.id}>
                  <td>{`${admin.firstName} ${admin.lastName}`}</td>
                  <td>{admin.email}</td>
                  <td>{new Date(admin.createdAt?.toDate ? admin.createdAt.toDate() : admin.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <Button
                        text="Edit"
                        onClick={() => handleEditAdmin(admin)}
                        className="edit-button"
                      />
                      <Button
                        text="Remove"
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="danger-button"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-admins">No admins found</p>
        )}
      </div>

      <style jsx>{`
        .admin-manager {
          background-color: rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .admin-manager h2 {
          margin-bottom: 10px;
          color: var(--header-color);
        }

        .admin-manager h3 {
          margin-bottom: 20px;
          color: var(--header-color);
        }

        .admin-manager p {
          margin-bottom: 20px;
          color: var(--text-color);
        }

        .admin-form {
          margin-bottom: 30px;
        }

        .form-row {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }

        .form-row .input-field {
          flex: 1;
        }

        .form-buttons {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .admin-list {
          margin-top: 20px;
        }

        .admin-list h3 {
          margin-bottom: 15px;
          color: var(--header-color);
        }

        .no-admins {
          text-align: center;
          color: var(--text-color);
          opacity: 0.7;
          padding: 20px;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
        }

        .edit-button {
          background-color: var(--accent-color);
          color: black;
        }

        .edit-button:hover {
          background-color: #FFE44D;
        }

        .danger-button {
          background-color: #dc3545;
          color: white;
        }

        .danger-button:hover {
          background-color: #c82333;
        }

        .secondary-button {
          background-color: #6c757d;
          color: white;
        }

        .secondary-button:hover {
          background-color: #5a6268;
        }

        @media (max-width: 768px) {
          .form-row {
            flex-direction: column;
            gap: 15px;
          }

          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminManager; 