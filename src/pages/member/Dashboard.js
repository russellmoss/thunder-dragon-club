import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { Line, Bar } from 'react-chartjs-2';
import '../../styles/global.css';
import PointsChart from '../../components/PointsChart';

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
  const { userData, memberSignOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  
  // Data states
  const [transactions, setTransactions] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState({
    totalPoints: 0,
    totalPointsEarned: 0,
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
        // First, get the member document using the email
        const memberQuery = query(
          collection(db, 'members'),
          where('email', '==', userData.email),
          limit(1)
        );
        const memberSnapshot = await getDocs(memberQuery);
        
        if (memberSnapshot.empty) {
          throw new Error('Member not found');
        }
        
        const memberDoc = memberSnapshot.docs[0];
        const memberId = memberDoc.id;
        
        // Fetch transactions
        const transactionsQuery = query(
          collection(db, 'transactions'),
          where('memberId', '==', memberId),
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
          where('memberId', '==', memberId),
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
          where('memberId', '==', memberId),
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
      await memberSignOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleProfileEditor = () => {
    setShowProfileEditor(!showProfileEditor);
  };

  const renderActivityItem = (activity) => {
    const date = activity.date?.toDate ? 
      activity.date.toDate().toLocaleDateString() : 
      new Date(activity.date).toLocaleDateString();
    
    let activityType = '';
    let description = '';
    let pointsChange = 0;
    let details = '';

    if ('type' in activity && activity.type === 'manual_adjustment') {
      activityType = 'adjustment';
      description = 'Points Adjustment';
      pointsChange = activity.pointsEarned;
      details = activity.notes || '';
    } else if ('pointsEarned' in activity) {
      activityType = 'transaction';
      description = `Purchase: ${activity.notes || 'Wine purchase'}`;
      pointsChange = activity.pointsEarned;
      if (activity.amount) {
        details = `Amount: Nu. ${activity.amount.toLocaleString()}`;
      }
    } else if ('points' in activity) {
      activityType = 'redemption';
      description = `Redemption: ${activity.item || 'Points redeemed'}`;
      pointsChange = -activity.points;
      details = activity.notes || '';
    } else if ('referralName' in activity) {
      activityType = 'referral';
      description = `Referral: ${activity.referralName}`;
      pointsChange = activity.pointsEarned;
      details = activity.notes || '';
    }

    return (
      <div className={`history-item ${activityType}`}>
        <div className="history-item-header">
          <span className="history-date">{date}</span>
          <span className={`history-points ${pointsChange >= 0 ? 'positive' : 'negative'}`}>
            {pointsChange >= 0 ? '+' : ''}{pointsChange} points
          </span>
        </div>
        <div className="history-description">
          {description}
          {details && <div className="history-details">{details}</div>}
          {activity.adjustedBy && (
            <div className="history-admin">Adjusted by: {activity.adjustedBy}</div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="loading">Loading your dashboard...</div>;
  }

  return (
    <div className="container member-dashboard">
      <Header />
      
      <div className="dashboard-header">
        <h1>Welcome {userData.firstName} to your Thunder Dragon Club Dashboard</h1>
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
          <PointsChart 
            data={pointsEarnedChartData}
            title="Points Earned by Month"
            color="rgba(255, 215, 0, 1)"
            backgroundColor="rgba(255, 215, 0, 0.2)"
          />
          
          <PointsChart 
            data={pointsRedeemedChartData}
            title="Points Redeemed by Month"
            color="rgba(139, 0, 0, 1)"
            backgroundColor="rgba(139, 0, 0, 0.2)"
          />
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
              .map((activity, index) => (
                <React.Fragment key={activity.id || index}>
                  {renderActivityItem(activity)}
                </React.Fragment>
              ))}
              
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
          margin-bottom: 10px;
        }
        
        .history-item.transaction {
          border-left-color: var(--accent-color);
        }
        
        .history-item.adjustment {
          border-left-color: #9C27B0;
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
          font-weight: 500;
        }
        
        .history-details {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
          margin-top: 4px;
        }
        
        .history-admin {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 4px;
          font-style: italic;
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
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { updateMemberProfile, updateMemberEmail, updatePassword } = useAuth();

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

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
      const hasProfileChanges = 
        firstName !== userData.firstName ||
        lastName !== userData.lastName ||
        email !== userData.email ||
        phone !== userData.phone;

      // Handle password change if requested
      if (showPasswordFields) {
        if (!currentPassword || !newPassword || !confirmPassword) {
          setError('All password fields are required');
          setIsLoading(false);
          return;
        }

        if (newPassword !== confirmPassword) {
          setError('New passwords do not match');
          setIsLoading(false);
          return;
        }

        const passwordError = validatePassword(newPassword);
        if (passwordError) {
          setError(passwordError);
          setIsLoading(false);
          return;
        }

        // Update password
        await updatePassword(currentPassword, newPassword);
        setSuccess('Password updated successfully');
      }

      // Handle profile changes
      if (hasProfileChanges) {
        // Update email if changed
        if (email !== userData.email) {
          await updateMemberEmail(email);
        }

        // Update profile
        await updateMemberProfile(userData.id, {
          firstName,
          lastName,
          email,
          phone
        });

        if (showPasswordFields) {
          setSuccess('Profile and password updated successfully');
        } else {
          setSuccess('Profile updated successfully');
        }
      } else if (!showPasswordFields) {
        setSuccess('No changes made');
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Failed to update: ' + error.message);
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
                disabled={isLoading}
              />
            </div>
            <div className="input-field">
              <label>Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
          
          <div className="input-field">
            <label>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="password-section">
            <button 
              type="button" 
              className="toggle-password-button"
              onClick={() => setShowPasswordFields(!showPasswordFields)}
              disabled={isLoading}
            >
              {showPasswordFields ? 'Hide Password Change' : 'Change Password'}
            </button>

            {showPasswordFields && (
              <>
                <div className="input-field">
                  <label>Current Password</label>
                  <div className="password-input-container">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <button 
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div className="input-field">
                  <label>New Password</label>
                  <div className="password-input-container">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <button 
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div className="input-field">
                  <label>Confirm New Password</label>
                  <div className="password-input-container">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <button 
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
              </>
            )}
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
          max-height: 90vh;
          overflow-y: auto;
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
        
        .input-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .input-field label {
          color: var(--text-color);
          font-size: 0.9rem;
        }
        
        .input-field input {
          padding: 10px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
          font-size: 1rem;
        }
        
        .input-field input:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .password-section {
          margin-top: 10px;
        }
        
        .toggle-password-button {
          background: none;
          border: none;
          color: var(--accent-color);
          cursor: pointer;
          padding: 10px 0;
          font-size: 0.9rem;
          text-align: left;
        }
        
        .toggle-password-button:hover {
          text-decoration: underline;
        }
        
        .password-input-container {
          position: relative;
        }
        
        .password-toggle {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-color);
          cursor: pointer;
          font-size: 18px;
        }
        
        .form-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          margin-top: 20px;
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
        
        .error-message {
          background-color: rgba(244, 67, 54, 0.2);
          color: #F44336;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
        }
        
        .success-message {
          background-color: rgba(76, 175, 80, 0.2);
          color: #4CAF50;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
        }
        
        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 15px;
          }
          
          .profile-editor-container {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default MemberDashboard; 