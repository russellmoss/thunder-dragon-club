import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateEmail,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  updateDoc 
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [memberUser, setMemberUser] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function adminLogin(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const adminDoc = await getDoc(doc(db, 'admins', userCredential.user.uid));
      if (!adminDoc.exists()) {
        await firebaseSignOut(auth);
        throw new Error('User is not an admin');
      }
      setAdminUser(userCredential.user);
      setAdminData(adminDoc.data());
      setMemberUser(null);
      setUserData(null);
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  async function memberLogin(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const memberQuery = query(collection(db, 'members'), where('email', '==', email));
      const memberSnapshot = await getDocs(memberQuery);
      
      if (memberSnapshot.empty) {
        await firebaseSignOut(auth);
        throw new Error('User is not a member');
      }
      
      const memberDoc = memberSnapshot.docs[0];
      setMemberUser(userCredential.user);
      setUserData({
        id: memberDoc.id,
        ...memberDoc.data()
      });
      setAdminUser(null);
      setAdminData(null);
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  async function adminSignOut() {
    try {
      if (adminUser) {
        await firebaseSignOut(auth);
        setAdminUser(null);
        setAdminData(null);
      }
    } catch (error) {
      console.error('Error signing out admin:', error);
      throw error;
    }
  }

  async function memberSignOut() {
    try {
      if (memberUser) {
        await firebaseSignOut(auth);
        setMemberUser(null);
        setUserData(null);
      }
    } catch (error) {
      console.error('Error signing out member:', error);
      throw error;
    }
  }

  async function checkMemberExists(email) {
    try {
      // Add retry logic for Edge's security features
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const memberQuery = query(
            collection(db, 'members'), 
            where('email', '==', email.toLowerCase())
          );
          const memberSnapshot = await getDocs(memberQuery);
          return !memberSnapshot.empty;
        } catch (error) {
          if (error.code === 'permission-denied' && retryCount < maxRetries - 1) {
            retryCount++;
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          throw error;
        }
      }
    } catch (error) {
      console.error('Error checking member existence:', error);
      throw error; // Throw the error instead of returning false
    }
  }

  async function getMemberData(email) {
    try {
      // Add retry logic for Edge's security features
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const memberQuery = query(
            collection(db, 'members'), 
            where('email', '==', email.toLowerCase())
          );
          const memberSnapshot = await getDocs(memberQuery);
          
          if (memberSnapshot.empty) {
            return null;
          }
          
          const memberDoc = memberSnapshot.docs[0];
          return {
            id: memberDoc.id,
            ...memberDoc.data()
          };
        } catch (error) {
          if (error.code === 'permission-denied' && retryCount < maxRetries - 1) {
            retryCount++;
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          throw error;
        }
      }
    } catch (error) {
      console.error('Error getting member data:', error);
      throw error; // Throw the error instead of returning null
    }
  }

  async function createMemberPassword(email, password) {
    try {
      const exists = await checkMemberExists(email);
      if (!exists) {
        throw new Error('No member account found with this email');
      }
      
      // Add retry logic for Edge's security features
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          return userCredential;
        } catch (error) {
          if (error.code === 'permission-denied' && retryCount < maxRetries - 1) {
            retryCount++;
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          throw error;
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async function updateMemberProfile(memberId, data) {
    try {
      const memberRef = doc(db, 'members', memberId);
      await updateDoc(memberRef, data);
      
      if (data.email && memberUser && data.email !== memberUser.email) {
        await updateEmail(memberUser, data.email);
      }
      
      setUserData(prevData => ({
        ...prevData,
        ...data
      }));
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async function updateMemberEmail(newEmail) {
    if (!memberUser) return;
    try {
      await updateEmail(memberUser, newEmail);
      return true;
    } catch (error) {
      console.error('Error updating email:', error);
      throw error;
    }
  }

  async function updatePassword(currentPassword, newPassword) {
    if (!memberUser) return;
    try {
      const credential = EmailAuthProvider.credential(
        memberUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(memberUser, credential);
      await firebaseUpdatePassword(memberUser, newPassword);
      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user is an admin
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (adminDoc.exists()) {
          setAdminUser(user);
          setAdminData(adminDoc.data());
          setMemberUser(null);
          setUserData(null);
        } else {
          // Check if user is a member
          const memberData = await getMemberData(user.email);
          if (memberData) {
            setMemberUser(user);
            setUserData(memberData);
            setAdminUser(null);
            setAdminData(null);
          } else {
            // If neither admin nor member, sign out
            await firebaseSignOut(auth);
            setAdminUser(null);
            setMemberUser(null);
            setAdminData(null);
            setUserData(null);
          }
        }
      } else {
        setAdminUser(null);
        setMemberUser(null);
        setAdminData(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    adminUser,
    memberUser,
    userData,
    adminData,
    isAdmin: !!adminUser,
    isMember: !!memberUser,
    loading,
    adminLogin,
    memberLogin,
    adminSignOut,
    memberSignOut,
    checkMemberExists,
    createMemberPassword,
    updateMemberProfile,
    updateMemberEmail,
    updatePassword,
    getMemberData,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 