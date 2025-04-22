import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import '../styles/global.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const ReportingDashboard = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for totals
  const [totals, setTotals] = useState({
    totalMembers: 0,
    totalRevenue: 0,
    totalTradeMembers: 0,
    totalNonTradeMembers: 0,
    totalRedemptions: 0,
    totalReferrals: 0
  });

  // State for charts
  const [memberTypeData, setMemberTypeData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [referralData, setReferralData] = useState(null);
  const [newMembersData, setNewMembersData] = useState(null);
  const [referralFilter, setReferralFilter] = useState('total');
  const [newMembersFilter, setNewMembersFilter] = useState('total');
  const [allMembers, setAllMembers] = useState([]);
  const [allReferrals, setAllReferrals] = useState([]);
  const dashboardRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  // Separate effect for new members chart
  useEffect(() => {
    if (allMembers.length > 0) {
      updateNewMembersChart();
    }
  }, [newMembersFilter, allMembers]);

  // Separate effect for referrals chart
  useEffect(() => {
    if (allReferrals.length > 0 && allMembers.length > 0) {
      updateReferralChart();
    }
  }, [referralFilter, allReferrals, allMembers]);

  const updateNewMembersChart = () => {
    const filteredMembers = allMembers.filter(member => {
      if (newMembersFilter === 'total') return true;
      return member.memberType === newMembersFilter;
    });

    const newMembersByMonth = groupByMonth(filteredMembers);
    setNewMembersData({
      labels: Object.keys(newMembersByMonth).map(month => {
        const [year, monthNum] = month.split('-');
        return `${new Date(year, monthNum - 1).toLocaleString('default', { month: 'short' })} ${year}`;
      }),
      datasets: [{
        label: 'New Members by Month',
        data: Object.values(newMembersByMonth),
        backgroundColor: '#4A0404',
        borderColor: '#4A0404',
        borderWidth: 1
      }]
    });
  };

  const updateReferralChart = () => {
    // Filter referrals based on the referring member's type
    const filteredReferrals = allReferrals.filter(referral => {
      if (referralFilter === 'total') return true;
      
      // Find the referring member
      const referringMember = allMembers.find(member => member.id === referral.memberId);
      return referringMember?.memberType === referralFilter;
    });

    const referralsByMonth = groupByMonth(filteredReferrals);
    setReferralData({
      labels: Object.keys(referralsByMonth).map(month => {
        const [year, monthNum] = month.split('-');
        return `${new Date(year, monthNum - 1).toLocaleString('default', { month: 'short' })} ${year}`;
      }),
      datasets: [{
        label: 'Referrals by Month',
        data: Object.values(referralsByMonth),
        backgroundColor: '#8B0000',
        borderColor: '#8B0000',
        borderWidth: 1
      }]
    });
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetch members
      const membersQuery = query(collection(db, 'members'));
      const membersSnapshot = await getDocs(membersQuery);
      const members = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllMembers(members);

      // Fetch referrals
      let referralsQuery = query(collection(db, 'referrals'), orderBy('date', 'desc'));
      if (startDate) {
        const startDateTime = new Date(startDate);
        startDateTime.setHours(0, 0, 0, 0);
        referralsQuery = query(referralsQuery, where('date', '>=', startDateTime));
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        referralsQuery = query(referralsQuery, where('date', '<=', endDateTime));
      }
      const referralsSnapshot = await getDocs(referralsQuery);
      const referrals = referralsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllReferrals(referrals);

      // Calculate member totals - only include members with valid types
      const validMembers = members.filter(m => m.memberType === 'trade' || m.memberType === 'non-trade');
      const tradeMembers = validMembers.filter(m => m.memberType === 'trade');
      const nonTradeMembers = validMembers.filter(m => m.memberType === 'non-trade');

      // Fetch transactions
      let transactionsQuery = query(collection(db, 'transactions'), orderBy('date', 'desc'));
      if (startDate) {
        const startDateTime = new Date(startDate);
        startDateTime.setHours(0, 0, 0, 0);
        transactionsQuery = query(transactionsQuery, where('date', '>=', startDateTime));
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        transactionsQuery = query(transactionsQuery, where('date', '<=', endDateTime));
      }
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactions = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch redemptions
      let redemptionsQuery = query(collection(db, 'redemptions'), orderBy('date', 'desc'));
      if (startDate) {
        const startDateTime = new Date(startDate);
        startDateTime.setHours(0, 0, 0, 0);
        redemptionsQuery = query(redemptionsQuery, where('date', '>=', startDateTime));
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        redemptionsQuery = query(redemptionsQuery, where('date', '<=', endDateTime));
      }
      const redemptionsSnapshot = await getDocs(redemptionsQuery);
      const redemptions = redemptionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate totals
      const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

      setTotals({
        totalMembers: validMembers.length,
        totalRevenue,
        totalTradeMembers: tradeMembers.length,
        totalNonTradeMembers: nonTradeMembers.length,
        totalRedemptions: redemptions.length,
        totalReferrals: referrals.length
      });

      // Prepare member type pie chart data
      setMemberTypeData({
        labels: ['Trade Members', 'Non-Trade Members'],
        datasets: [{
          data: [tradeMembers.length, nonTradeMembers.length],
          backgroundColor: ['#FFD700', '#8B0000'],
          borderColor: ['#FFD700', '#8B0000'],
          borderWidth: 1
        }]
      });

      // Prepare revenue by month data
      const revenueByMonth = groupByMonth(transactions, 'amount');
      setRevenueData({
        labels: Object.keys(revenueByMonth),
        datasets: [{
          label: 'Revenue by Month',
          data: Object.values(revenueByMonth),
          backgroundColor: '#FFD700',
          borderColor: '#FFD700',
          borderWidth: 1
        }]
      });

      // Initialize both charts
      updateNewMembersChart();
      updateReferralChart();

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load reporting data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const groupByMonth = (items, valueKey = null) => {
    const months = {};
    items.forEach(item => {
      const date = item.date?.toDate ? item.date.toDate() : new Date(item.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (valueKey) {
        months[monthYear] = (months[monthYear] || 0) + (item[valueKey] || 0);
      } else {
        months[monthYear] = (months[monthYear] || 0) + 1;
      }
    });
    return months;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'BTN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const exportToPDF = async () => {
    if (!dashboardRef.current) return;

    setIsLoading(true);
    try {
      // Create a new PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Get the dashboard element
      const element = dashboardRef.current;
      
      // Temporarily change background for PDF capture
      const originalBackground = element.style.backgroundColor;
      element.style.backgroundColor = '#ffffff';
      
      // Create canvas from the dashboard
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Restore original background
      element.style.backgroundColor = originalBackground;

      // Calculate dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add the image to the PDF
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);

      // Add title and date range
      pdf.setFontSize(20);
      pdf.text('Thunder Dragon Club Report', 105, 15, { align: 'center' });
      
      pdf.setFontSize(12);
      const dateRange = startDate && endDate 
        ? `Date Range: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
        : 'All Time Report';
      pdf.text(dateRange, 105, 25, { align: 'center' });

      // Add timestamp
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 105, 285, { align: 'center' });

      // Save the PDF
      pdf.save('thunder-dragon-club-report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading reporting data...</div>;
  }

  return (
    <div className="reporting-dashboard" ref={dashboardRef}>
      <div className="dashboard-header">
        <h2>Reporting Dashboard</h2>
        <button 
          className="export-pdf-button"
          onClick={exportToPDF}
          disabled={isLoading}
        >
          {isLoading ? 'Generating PDF...' : 'Export to PDF'}
        </button>
      </div>

      <div className="date-filters">
        <div className="date-input">
          <label>Start Date:</label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="date-input">
          <label>End Date:</label>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="totals-grid">
        <div className="total-card">
          <h3>Total Club Members</h3>
          <p>{totals.totalMembers}</p>
        </div>
        <div className="total-card">
          <h3>Total Club Revenue</h3>
          <p>{formatCurrency(totals.totalRevenue)}</p>
        </div>
        <div className="total-card">
          <h3>Total Trade Members</h3>
          <p>{totals.totalTradeMembers}</p>
        </div>
        <div className="total-card">
          <h3>Total Non-Trade Members</h3>
          <p>{totals.totalNonTradeMembers}</p>
        </div>
        <div className="total-card">
          <h3>Total Redemptions</h3>
          <p>{totals.totalRedemptions}</p>
        </div>
        <div className="total-card">
          <h3>Total Referrals</h3>
          <p>{totals.totalReferrals}</p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-container">
          <h3>Member Type Distribution</h3>
          {memberTypeData && (
            <Pie 
              data={memberTypeData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          )}
        </div>

        <div className="chart-container">
          <h3>Revenue by Month</h3>
          {revenueData && (
            <Bar 
              data={revenueData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return formatCurrency(context.raw);
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return formatCurrency(value);
                      }
                    }
                  }
                }
              }}
            />
          )}
        </div>

        <div className="chart-container">
          <h3>Referrals by Month</h3>
          <div className="chart-filter">
            <select 
              value={referralFilter}
              onChange={(e) => setReferralFilter(e.target.value)}
            >
              <option value="total">Total</option>
              <option value="trade">Trade</option>
              <option value="non-trade">Non-Trade</option>
            </select>
          </div>
          {referralData && (
            <Bar 
              data={referralData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          )}
        </div>

        <div className="chart-container">
          <h3>New Members by Month</h3>
          <div className="chart-filter">
            <select 
              value={newMembersFilter}
              onChange={(e) => setNewMembersFilter(e.target.value)}
            >
              <option value="total">Total</option>
              <option value="trade">Trade</option>
              <option value="non-trade">Non-Trade</option>
            </select>
          </div>
          {newMembersData && (
            <Bar 
              data={newMembersData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1
                    }
                  }
                }
              }}
            />
          )}
        </div>
      </div>

      <style jsx>{`
        .reporting-dashboard {
          padding: 20px;
          background-color: rgba(0, 0, 0, 0.2);
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .export-pdf-button {
          padding: 10px 20px;
          background-color: var(--accent-color);
          color: #000000;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          transition: background-color 0.3s;
        }

        .export-pdf-button:hover {
          background-color: #FFD700;
        }

        .export-pdf-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }

        .date-filters {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }

        .date-input {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .date-input input {
          padding: 8px;
          border: 1px solid var(--accent-color);
          border-radius: 4px;
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
        }

        .totals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .total-card {
          background-color: rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }

        .total-card h3 {
          margin-bottom: 10px;
          color: var(--accent-color);
        }

        .total-card p {
          font-size: 1.5rem;
          font-weight: bold;
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
          margin-bottom: 15px;
          color: var(--accent-color);
        }

        .chart-filter {
          margin-bottom: 15px;
        }

        .chart-filter select {
          padding: 8px;
          border: 1px solid var(--accent-color);
          border-radius: 4px;
          background-color: rgba(255, 255, 255, 0.9);
          color: #000000;
          font-size: 14px;
          cursor: pointer;
          width: 100%;
          max-width: 200px;
        }

        .chart-filter select option {
          background-color: #ffffff;
          color: #000000;
        }

        @media (max-width: 768px) {
          .date-filters {
            flex-direction: column;
          }

          .totals-grid {
            grid-template-columns: 1fr;
          }

          .charts-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportingDashboard; 