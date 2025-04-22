# Thunder Dragon Club - Client Facing Implementation Guide

This guide details the steps to implement a client-facing portal for the Thunder Dragon Club application that allows members to log in, view their membership information, points, and transaction history.

## Table of Contents

1. [Update Routing Structure](#1-update-routing-structure)
2. [Create Member Authentication Flow](#2-create-member-authentication-flow)
3. [Create Member Login Page](#3-create-member-login-page)
4. [Implement New Account Setup](#4-implement-new-account-setup)
5. [Create Member Dashboard](#5-create-member-dashboard)
6. [Add Profile Update Functionality](#6-add-profile-update-functionality)
7. [Add Data Visualization Components](#7-add-data-visualization-components)
8. [Deploy the Updated Application](#8-deploy-the-updated-application)

## 1. Update Routing Structure

First, we need to reorganize the application's routing structure to move the admin pages to `/admin` and create the client-facing pages.

### Cursor.ai Prompt:
```
Please update the routing structure in our React app. Currently, we have the admin page as the main route, but we want to move it to "/admin". Then we need a new route "/" for member login and "/dashboard" for the member dashboard. We're using react-router-dom v6.
```

### Implementation Steps:

1. Update the App.js file to include the new routes:

```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import MemberLogin from './pages/member/Login';
import MemberDashboard from './pages/member/Dashboard';
import MemberSignup from './pages/member/Signup';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import ProtectedMemberRoute from './components/ProtectedMemberRoute';
import './styles/global.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Member Routes */}
        <Route path="/" element={<MemberLogin />} />
        <Route path="/signup" element={<MemberSignup />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedMemberRoute>
              <MemberDashboard />
            </ProtectedMemberRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          } 
        />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
```

2. Create a ProtectedAdminRoute component:

```jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedAdminRoute = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!currentUser || !isAdmin) {
    return <Navigate to="/admin" />;
  }
  
  return children;
};

export default ProtectedAdminRoute;
```

3. Create a ProtectedMemberRoute component:

```jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedMemberRoute = ({ children }) => {
  const { currentUser, isMember, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!currentUser || !isMember) {
    return <Navigate to="/" />;
  }
  
  return children;
};

export default ProtectedMemberRoute;
```

4. Move existing components to admin folder structure:

```
mkdir -p src/pages/admin
mv src/pages/Login.js src/pages/admin/
mv src/pages/Dashboard.js src/pages/admin/
```

## 2. Create Member Authentication Flow

Next, we need to enhance the authentication system to handle both admin and member users.

### Cursor.ai Prompt:
```
Create an AuthContext for our React app that handles different user types (admin vs member). It should provide login, logout, password creation for members, and check if a user exists in the members collection when signing up. We're using Firebase authentication.
```

### Implementation Steps:

1. Create an AuthContext file:

```jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateEmail
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
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'admin' or 'member'
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  async function adminLogin(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // You would need to have a way to identify admin users
      // This could be a separate admins collection or a field in the user document
      const userDoc = await getDoc(doc(db, 'admins', userCredential.user.uid));
      if (!userDoc.exists()) {
        throw new Error('User is not an admin');
      }
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
        throw new Error('User is not a member');
      }
      
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  async function signOut() {
    return firebaseSignOut(auth);
  }

  async function checkMemberExists(email) {
    try {
      const memberQuery = query(collection(db, 'members'), where('email', '==', email));
      const memberSnapshot = await getDocs(memberQuery);
      return !memberSnapshot.empty;
    } catch (error) {
      console.error('Error checking member existence:', error);
      return false;
    }
  }

  async function getMemberData(email) {
    try {
      const memberQuery = query(collection(db, 'members'), where('email', '==', email));
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
      console.error('Error getting member data:', error);
      return null;
    }
  }

  async function createMemberPassword(email, password) {
    try {
      // First check if the member exists in the database
      const exists = await checkMemberExists(email);
      if (!exists) {
        throw new Error('No member account found with this email');
      }
      
      // Create the authentication account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  async function updateMemberProfile(memberId, data) {
    try {
      const memberRef = doc(db, 'members', memberId);
      await updateDoc(memberRef, data);
      
      // If email was updated, update the authentication email as well
      if (data.email && currentUser && data.email !== currentUser.email) {
        await updateEmail(currentUser, data.email);
      }
      
      // Update local user data
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
    if (!currentUser) return;
    try {
      await updateEmail(currentUser, newEmail);
      return true;
    } catch (error) {
      console.error('Error updating email:', error);
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Try to determine if the user is an admin
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (adminDoc.exists()) {
          setUserType('admin');
          setLoading(false);
          return;
        }
        
        // If not an admin, check if they're a member
        const memberData = await getMemberData(user.email);
        if (memberData) {
          setUserType('member');
          setUserData(memberData);
        } else {
          // If neither admin nor member, sign out
          await firebaseSignOut(auth);
          setUserType(null);
        }
      } else {
        setUserType(null);
        setUserData(null);
      }
      
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    isAdmin: userType === 'admin',
    isMember: userType === 'member',
    loading,
    adminLogin,
    memberLogin,
    signOut,
    checkMemberExists,
    createMemberPassword,
    updateMemberProfile,
    updateMemberEmail,
    getMemberData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
```

2. Update the index.js file to wrap the app with the AuthProvider:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './contexts/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();
```

## 3. Create Member Login Page

Now, let's create the member login page that will be the entry point for the application.

### Cursor.ai Prompt:
```
Create a login page for members at the root route. It should have email/password fields and handle login via Firebase. Also include a "Create Account" button that directs to a signup page. Use the existing styles and components like Button and Header that we already have.
```

### Implementation Steps:

1. Create the MemberLogin component:

```jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import '../../styles/global.css';

const MemberLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { memberLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await memberLogin(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="container">
      <Header />
      <div className="login-container">
        <h1>Thunder Dragon Club</h1>
        <p className="login-subtitle">Member Login</p>
        
        <form onSubmit={handleLogin}>
          {error && <div className="error-message">{error}</div>}
          
          <InputField 
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
          
          <div className="password-field-container">
            <InputField 
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <button 
              type="button" 
              className="password-toggle-button" 
              onClick={togglePasswordVisibility}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          
          <Button 
            text={isLoading ? "Logging in..." : "Login"}
            type="submit"
            disabled={isLoading}
          />
          
          <div className="login-links">
            <Link to="/signup" className="signup-link">Don't have an account? Set one up</Link>
          </div>
        </form>
      </div>

      <style jsx>{`
        .login-container {
          max-width: 400px;
          margin: 40px auto;
          padding: 30px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        h1 {
          text-align: center;
          margin-bottom: 10px;
          color: var(--header-color);
        }
        
        .login-subtitle {
          text-align: center;
          margin-bottom: 30px;
          color: var(--text-color);
          opacity: 0.8;
        }
        
        form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .password-field-container {
          position: relative;
        }
        
        .password-toggle-button {
          position: absolute;
          right: 10px;
          top: 38px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
        }
        
        .login-links {
          text-align: center;
          margin-top: 20px;
        }
        
        .signup-link {
          color: var(--accent-color);
          text-decoration: none;
          font-size: 0.9rem;
        }
        
        .signup-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default MemberLogin;
```

2. Update the styles for the login page in global.css:

```css
/* Add this to your global.css file */

.password-field-container {
  position: relative;
}

.password-toggle-button {
  position: absolute;
  right: 10px;
  top: 38px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
}

.login-links {
  text-align: center;
  margin-top: 20px;
}

.signup-link {
  color: var(--accent-color);
  text-decoration: none;
  font-size: 0.9rem;
}

.signup-link:hover {
  text-decoration: underline;
}
```

## 4. Implement New Account Setup

Now, let's create the functionality for members to set up their accounts.

### Cursor.ai Prompt:
```
Create a signup page that allows existing members to set up their passwords. The page should check if the email exists in the members collection, and if so, allow them to create a password. Include password verification (confirm password) and password visibility toggles.
```

### Implementation Steps:

1. Create the MemberSignup component:

```jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import '../../styles/global.css';

const MemberSignup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = email check, 2 = password creation
  const [memberData, setMemberData] = useState(null);
  
  const { checkMemberExists, createMemberPassword, getMemberData } = useAuth();
  const navigate = useNavigate();

  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const exists = await checkMemberExists(email);
      if (!exists) {
        setError("No member account found with this email. Please contact the winery if you believe this is an error.");
        setIsLoading(false);
        return;
      }
      
      // Get member data to display their name
      const data = await getMemberData(email);
      setMemberData(data);
      
      // Move to password creation step
      setStep(2);
    } catch (error) {
      console.error('Error checking email:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);

    try {
      await createMemberPassword(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Account creation error:', error);
      setError('Failed to create account. ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  return (
    <div className="container">
      <Header />
      <div className="signup-container">
        <h1>Thunder Dragon Club</h1>
        <p className="signup-subtitle">Create Your Account</p>
        
        {step === 1 ? (
          <form onSubmit={handleCheckEmail}>
            {error && <div className="error-message">{error}</div>}
            
            <p className="info-text">
              Enter the email address registered with your Thunder Dragon Club membership.
            </p>
            
            <InputField 
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
            
            <Button 
              text={isLoading ? "Checking..." : "Continue"}
              type="submit"
              disabled={isLoading}
            />
            
            <div className="login-links">
              <Link to="/" className="login-link">Already have an account? Login</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateAccount}>
            {error && <div className="error-message">{error}</div>}
            
            {memberData && (
              <div className="welcome-message">
                Welcome, {memberData.firstName} {memberData.lastName}!
              </div>
            )}
            
            <p className="info-text">
              Please create a password for your account.
            </p>
            
            <div className="password-field-container">
              <InputField 
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
              />
              <button 
                type="button" 
                className="password-toggle-button" 
                onClick={() => togglePasswordVisibility('password')}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            
            <div className="password-field-container">
              <InputField 
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
              <button 
                type="button" 
                className="password-toggle-button" 
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showConfirmPassword ? "🙈" : "👁️"}
              </button>
            </div>
            
            <Button 
              text={isLoading ? "Creating Account..." : "Create Account"}
              type="submit"
              disabled={isLoading}
            />
            
            <div className="login-links">
              <Link to="/" className="login-link">Back to Login</Link>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .signup-container {
          max-width: 400px;
          margin: 40px auto;
          padding: 30px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        h1 {
          text-align: center;
          margin-bottom: 10px;
          color: var(--header-color);
        }
        
        .signup-subtitle {
          text-align: center;
          margin-bottom: 30px;
          color: var(--text-color);
          opacity: 0.8;
        }
        
        form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .info-text {
          color: var(--text-color);
          font-size: 0.9rem;
          text-align: center;
          margin-bottom: 10px;
        }
        
        .welcome-message {
          background-color: rgba(255, 215, 0, 0.2);
          color: var(--accent-color);
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          font-size: 1.1rem;
          margin-bottom: 15px;
        }
        
        .login-link {
          color: var(--accent-color);
          text-decoration: none;
          font-size: 0.9rem;
        }
        
        .login-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default MemberSignup;
```

## 5. Create Member Dashboard

Next, we'll create the member dashboard that displays the member's information and statistics.

### Cursor.ai Prompt:
```
Create a member dashboard page that displays membership information (name, member ID, email, phone), total points, points earned by month, referrals redeemed, total points redeemed, and points redeemed by month. Use responsive design and Chart.js for visualizations.
```

### Implementation Steps:

1. Create the MemberDashboard component:

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { Line, Bar } from 'react-chartjs-2';
import '../../styles/global.css';

// Import Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MemberDashboard = () => {
  const { userData, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  
  // Data states
  const [transactions, setTransactions] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState({
    totalPoints: 0,
    totalPointsRedeemed: 0,
    totalReferrals: 0,
    pointsEarnedByMonth: {},
    pointsRedeemedByMonth: {}
  });
  
  // Chart states
  const [pointsEarnedChartData, setPointsEarnedChartData] = useState(null);
  const [pointsRedeemedChartData, setPointsRedeemedChartData] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData) return;
    
    const fetchMemberData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // Fetch transactions
        const transactionsQuery = query(
          collection(db, 'transactions'),
          where('memberId', '==', userData.id),
          orderBy('date', 'desc')
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const transactionsData = transactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTransactions(transactionsData);
        
        // Fetch redemptions
        const redemptionsQuery = query(
          collection(db, 'redemptions'),
          where('memberId', '==', userData.id),
          orderBy('date', 'desc')
        );
        const redemptionsSnapshot = await getDocs(redemptionsQuery);
        const redemptionsData = redemptionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRedemptions(redemptionsData);
        
        // Fetch referrals
        const referralsQuery = query(
          collection(db, 'referrals'),
          where('memberId', '==', userData.id),
          orderBy('date', 'desc')
        );
        const referralsSnapshot = await getDocs(referralsQuery);
        const referralsData = referralsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReferrals(referralsData);
        
        // Calculate statistics
        calculateStats(transactionsData, redemptionsData, referralsData);
      } catch (error) {
        console.error('Error fetching member data:', error);
        setError('Failed to load your data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMemberData();
  }, [userData]);

  const calculateStats = (transactions, redemptions, referrals) => {
    // Calculate total points earned from transactions
    const totalPointsEarned = transactions.reduce((sum, t) => sum + (t.pointsEarned || 0), 0);
    
    // Add points from referrals
    const totalReferralPoints = referrals.reduce((sum, r) => sum + (r.pointsEarned || 0), 0);
    
    // Calculate total points redeemed
    const totalPointsRedeemed = redemptions.reduce((sum, r) => sum + (r.points || 0), 0);
    
    // Group by month for charts
    const pointsEarnedByMonth = groupByMonth(transactions, 'pointsEarned');
    const pointsRedeemedByMonth = groupByMonth(redemptions, 'points');
    
    // Prepare chart data
    prepareChartData(pointsEarnedByMonth, pointsRedeemedByMonth);
    
    setStats({
      totalPoints: (userData.points || 0),
      totalPointsEarned: totalPointsEarned + totalReferralPoints,
      totalPointsRedeemed,
      totalReferrals: referrals.length,
      pointsEarnedByMonth,
      pointsRedeemedByMonth
    });
  };

  const groupByMonth = (items, valueKey) => {
    const months = {};
    items.forEach(item => {
      const date = item.date?.toDate ? item.date.toDate() : new Date(item.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      months[monthYear] = (months[monthYear] || 0) + (item[valueKey] || 0);
    });
    return months;
  };

  const prepareChartData = (pointsEarnedByMonth, pointsRedeemedByMonth) => {
    // Get all months from both datasets
    const allMonths = [...new Set([
      ...Object.keys(pointsEarnedByMonth),
      ...Object.keys(pointsRedeemedByMonth)
    ])].sort();
    
    // Format month labels
    const labels = allMonths.map(month => {
      const [year, monthNum] = month.split('-');
      return `${new Date(year, monthNum - 1).toLocaleString('default', { month: 'short' })} ${year}`;
    });
    
    // Prepare points earned chart data
    setPointsEarnedChartData({
      labels,
      datasets: [{
        label: 'Points Earned',
        data: allMonths.map(month => pointsEarnedByMonth[month] || 0),
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        borderColor: 'rgba(255, 215, 0, 1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    });
    
    // Prepare points redeemed chart data
    setPointsRedeemedChartData({
      labels,
      datasets: [{
        label: 'Points Redeemed',
        data: allMonths.map(month => pointsRedeemedByMonth[month] || 0),
        backgroundColor: 'rgba(139, 0, 0, 0.2)',
        borderColor: 'rgba(139, 0, 0, 1)',
        borderWidth: 2
      }]
    });
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleProfileEditor = () => {
    setShowProfileEditor(!showProfileEditor);
  };

  if (isLoading) {
    return <div className="loading">Loading your dashboard...</div>;
  }

  return (
    <div className="container member-dashboard">
      <Header />
      
      <div className="dashboard-header">
        <h1>Welcome to Thunder Dragon Club</h1>
        <div className="header-buttons">
          <Button 
            text="Edit Profile" 
            onClick={toggleProfileEditor}
            className="secondary-button edit-profile-button"
          />
          <Button 
            text="Logout" 
            onClick={handleLogout}
            className="secondary-button"
          />
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="dashboard-content">
        <div className="membership-card">
          <div className="membership-header">
            <h2>Membership Information</h2>
          </div>
          <div className="membership-details">
            <div className="detail-item">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{userData.firstName} {userData.lastName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Member ID:</span>
              <span className="detail-value">{userData.id}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{userData.email}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Phone:</span>
              <span className="detail-value">{userData.phone || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Member Type:</span>
              <span className="detail-value member-type">
                {userData.memberType === 'trade' ? 'Trade Member' : 'Non-Trade Member'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Member Since:</span>
              <span className="detail-value">
                {userData.createdAt?.toDate ? 
                  userData.createdAt.toDate().toLocaleDateString() : 
                  new Date(userData.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Current Points</h3>
            <p className="stat-value">{stats.totalPoints}</p>
          </div>
          <div className="stat-card">
            <h3>Total Points Earned</h3>
            <p className="stat-value">{stats.totalPointsEarned}</p>
          </div>
          <div className="stat-card">
            <h3>Total Points Redeemed</h3>
            <p className="stat-value">{stats.totalPointsRedeemed}</p>
          </div>
          <div className="stat-card">
            <h3>Referrals Made</h3>
            <p className="stat-value">{stats.totalReferrals}</p>
          </div>
        </div>
        
        <div className="charts-grid">
          <div className="chart-container">
            <h3>Points Earned by Month</h3>
            {pointsEarnedChartData ? (
              <Line 
                data={pointsEarnedChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    tooltip: {
                      mode: 'index',
                      intersect: false,
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                      },
                      ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                      }
                    },
                    x: {
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                      },
                      ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                      }
                    }
                  },
                  interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                  }
                }}
              />
            ) : (
              <p className="no-data-message">No points earned yet</p>
            )}
          </div>
          
          <div className="chart-container">
            <h3>Points Redeemed by Month</h3>
            {pointsRedeemedChartData && redemptions.length > 0 ? (
              <Bar 
                data={pointsRedeemedChartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                      },
                      ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                      }
                    },
                    x: {
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                      },
                      ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                      }
                    }
                  }
                }}
              />
            ) : (
              <p className="no-data-message">No points redeemed yet</p>
            )}
          </div>
        </div>
        
        <div className="history-section">
          <h2>Recent Activity</h2>
          <div className="history-tabs">
            <button className="tab-button active">All Activity</button>
          </div>
          
          <div className="history-list">
            {[...transactions, ...redemptions, ...referrals]
              .sort((a, b) => {
                const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
                return dateB - dateA;
              })
              .slice(0, 10)
              .map((activity, index) => {
                const date = activity.date?.toDate ? 
                  activity.date.toDate().toLocaleDateString() : 
                  new Date(activity.date).toLocaleDateString();
                
                let activityType = '';
                let description = '';
                let pointsChange = 0;
                
                if ('pointsEarned' in activity) {
                  activityType = 'transaction';
                  description = `Purchase: ${activity.notes || 'Wine purchase'}`;
                  pointsChange = activity.pointsEarned;
                } else if ('points' in activity) {
                  activityType = 'redemption';
                  description = `Redemption: ${activity.item || 'Points redeemed'}`;
                  pointsChange = -activity.points;
                } else if ('referralName' in activity) {
                  activityType = 'referral';
                  description = `Referral: ${activity.referralName}`;
                  pointsChange = activity.pointsEarned;
                }
                
                return (
                  <div key={index} className={`history-item ${activityType}`}>
                    <div className="history-item-header">
                      <span className="history-date">{date}</span>
                      <span className={`history-points ${pointsChange >= 0 ? 'positive' : 'negative'}`}>
                        {pointsChange >= 0 ? '+' : ''}{pointsChange} points
                      </span>
                    </div>
                    <div className="history-description">
                      {description}
                    </div>
                  </div>
                );
              })}
              
            {[...transactions, ...redemptions, ...referrals].length === 0 && (
              <p className="no-data-message">No activity recorded yet</p>
            )}
          </div>
        </div>
      </div>

      {showProfileEditor && (
        <ProfileEditor 
          userData={userData}
          onClose={toggleProfileEditor}
        />
      )}

      <style jsx>{`
        .member-dashboard {
          max-width: 1200px;
          padding: 20px;
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          width: 100%;
        }
        
        .header-buttons {
          display: flex;
          gap: 10px;
        }
        
        .dashboard-content {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        
        .membership-card {
          background-color: rgba(139, 0, 0, 0.2);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .membership-header {
          background-color: rgba(139, 0, 0, 0.8);
          padding: 15px;
          border-bottom: 2px solid var(--accent-color);
        }
        
        .membership-header h2 {
          color: var(--accent-color);
          margin: 0;
          font-size: 1.4rem;
        }
        
        .membership-details {
          padding: 20px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
        }
        
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .detail-label {
          color: var(--accent-color);
          font-size: 0.9rem;
          opacity: 0.8;
        }
        
        .detail-value {
          color: var(--text-color);
          font-size: 1.1rem;
        }
        
        .member-type {
          color: var(--accent-color);
          font-weight: bold;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }
        
        .stat-card {
          background-color: rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
        }
        
        .stat-card h3 {
          margin: 0 0 10px 0;
          color: var(--header-color);
          font-size: 1.1rem;
        }
        
        .stat-value {
          color: var(--text-color);
          font-size: 2rem;
          font-weight: bold;
          margin: 0;
        }
        
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 30px;
        }
        
        .chart-container {
          background-color: rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 8px;
        }
        
        .chart-container h3 {
          margin: 0 0 15px 0;
          color: var(--header-color);
          font-size: 1.2rem;
          text-align: center;
        }
        
        .history-section {
          background-color: rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 8px;
        }
        
        .history-section h2 {
          margin: 0 0 20px 0;
          color: var(--header-color);
        }
        
        .history-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 10px;
        }
        
        .tab-button {
          background: none;
          border: none;
          color: var(--text-color);
          font-size: 1rem;
          padding: 8px 16px;
          cursor: pointer;
          border-radius: 4px;
          opacity: 0.7;
        }
        
        .tab-button.active {
          background-color: var(--accent-color);
          color: #000000;
          opacity: 1;
        }
        
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .history-item {
          background-color: rgba(255, 255, 255, 0.05);
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid transparent;
        }
        
        .history-item.transaction {
          border-left-color: var(--accent-color);
        }
        
        .history-item.redemption {
          border-left-color: var(--primary-color);
        }
        
        .history-item.referral {
          border-left-color: #4CAF50;
        }
        
        .history-item-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .history-date {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .history-points {
          font-weight: bold;
          font-size: 0.9rem;
        }
        
        .history-points.positive {
          color: #4CAF50;
        }
        
        .history-points.negative {
          color: #F44336;
        }
        
        .history-description {
          color: var(--text-color);
        }
        
        .no-data-message {
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          padding: 20px;
          font-style: italic;
        }
        
        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .header-buttons {
            width: 100%;
          }
          
          .header-buttons .button {
            flex: 1;
          }
          
          .charts-grid {
            grid-template-columns: 1fr;
          }
          
          .membership-details {
            grid-template-columns: 1fr;
          }
          
          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        
        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

const ProfileEditor = ({ userData, onClose }) => {
  const [firstName, setFirstName] = useState(userData.firstName || '');
  const [lastName, setLastName] = useState(userData.lastName || '');
  const [email, setEmail] = useState(userData.email || '');
  const [phone, setPhone] = useState(userData.phone || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { updateMemberProfile } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    try {
      // Basic validation
      if (!firstName.trim() || !lastName.trim() || !email.trim()) {
        setError('Name and email are required');
        setIsLoading(false);
        return;
      }
      
      // Check if any fields changed
      if (
        firstName === userData.firstName &&
        lastName === userData.lastName &&
        email === userData.email &&
        phone === userData.phone
      ) {
        setSuccess('No changes made');
        setIsLoading(false);
        return;
      }
      
      // Update profile
      await updateMemberProfile(userData.id, {
        firstName,
        lastName,
        email,
        phone
      });
      
      setSuccess('Profile updated successfully');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Failed to update profile: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-editor-overlay">
      <div className="profile-editor-container">
        <div className="editor-header">
          <h2>Edit Profile</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="input-field">
              <label>First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="input-field">
              <label>Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="input-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-field">
            <label>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          
          <div className="form-buttons">
            <button 
              type="button" 
              onClick={onClose}
              className="cancel-button"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isLoading}
              className="save-button"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .profile-editor-overlay {
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
          padding: 20px;
        }
        
        .profile-editor-container {
          background-color: var(--background-color);
          border-radius: 8px;
          width: 100%;
          max-width: 600px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
          padding: 30px;
        }
        
        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .editor-header h2 {
          margin: 0;
          color: var(--header-color);
        }
        
        .close-button {
          background: none;
          border: none;
          color: var(--text-color);
          font-size: 24px;
          cursor: pointer;
        }
        
        form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .form-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          margin-top: 10px;
        }
        
        .cancel-button, .save-button {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
        }
        
        .cancel-button {
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
        }
        
        .save-button {
          background-color: var(--accent-color);
          color: #000000;
          font-weight: bold;
        }
        
        button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default MemberDashboard;
```

## 6. Add Profile Update Functionality

We'll add the ability for members to update their profile information.

### Cursor.ai Prompt:
```
Create a ProfileEditor component that lets members update their profile information (name, email, phone). It should be a modal overlay and update the user's information in Firestore when submitted.
```

### Implementation Steps:

This component is already included as a subcomponent in the MemberDashboard above. It's rendered conditionally when the user clicks the "Edit Profile" button.

## 7. Add Data Visualization Components

Let's enhance the dashboard with data visualization components.

### Cursor.ai Prompt:
```
Create reusable chart components for the dashboard that display points earned by month and points redeemed by month. Use Chart.js and make them responsive with proper styling.
```

### Implementation Steps:

These are already implemented as part of the MemberDashboard component above.

## 8. Deploy the Updated Application

Finally, let's update the deployment configuration to make sure our new routes work correctly with Netlify.

### Cursor.ai Prompt:
```
Update the Netlify configuration to handle our new React Router routes properly. We need to ensure that all routes redirect to index.html for client-side routing to work.
```

### Implementation Steps:

1. The Netlify configuration in your codebase already includes the necessary redirects. Here's the `netlify.toml` file:

```toml
[build]
  command = "CI=false npm run build"
  publish = "build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200 
```

2. Also, the `_redirects` file in the `public` directory:

```
/* /index.html 200 
```

These configurations ensure that all routes redirect to index.html, which is what we need for client-side routing to work properly.

## Summary

This implementation guide has outlined the necessary steps to create a client-facing portal for the Thunder Dragon Club application. The portal allows members to:

1. Log in with their email and password
2. Set up an account by creating a password if they are already registered as a member
3. View their membership information, points balance, and activity history
4. Edit their profile information

The implementation leverages Firebase Authentication and Firestore to handle user authentication and data persistence. The UI follows the existing design system and is fully responsive.

To deploy the updated application, simply push the changes to your repository, and Netlify will automatically build and deploy the application with the new functionality.