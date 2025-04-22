import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const PointsChart = ({ data, title, color, backgroundColor }) => {
  const [filteredData, setFilteredData] = useState(data);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null);

  useEffect(() => {
    if (!data) return;

    let filtered = { ...data };
    
    // Filter by year
    if (selectedYear) {
      const yearLabels = data.labels.filter(label => label.includes(selectedYear));
      const yearIndices = yearLabels.map(label => data.labels.indexOf(label));
      
      filtered.labels = yearLabels;
      filtered.datasets = data.datasets.map(dataset => ({
        ...dataset,
        data: yearIndices.map(index => dataset.data[index])
      }));
    }

    // Filter by month if selected
    if (selectedMonth) {
      const monthLabels = filtered.labels.filter(label => {
        const [month] = label.split(' ');
        return month === selectedMonth;
      });
      const monthIndices = monthLabels.map(label => filtered.labels.indexOf(label));
      
      filtered.labels = monthLabels;
      filtered.datasets = filtered.datasets.map(dataset => ({
        ...dataset,
        data: monthIndices.map(index => dataset.data[index])
      }));
    }

    setFilteredData(filtered);
  }, [data, selectedYear, selectedMonth]);

  if (!data) {
    return <div className="no-data">No data available</div>;
  }

  // Get unique years from labels
  const years = [...new Set(data.labels.map(label => {
    const [, year] = label.split(' ');
    return year;
  }))].sort((a, b) => b - a);

  const chartData = {
    labels: filteredData.labels,
    datasets: filteredData.datasets.map(dataset => ({
      ...dataset,
      backgroundColor: backgroundColor || 'rgba(255, 215, 0, 0.2)',
      borderColor: color || 'rgba(255, 215, 0, 1)',
      borderWidth: 2
    }))
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title
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
  };

  return (
    <div className="chart-container">
      <div className="chart-filters">
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(e.target.value)}
          className="filter-select"
        >
          <option value="">All Years</option>
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        
        <select 
          value={selectedMonth || ''} 
          onChange={(e) => setSelectedMonth(e.target.value || null)}
          className="filter-select"
        >
          <option value="">All Months</option>
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
      </div>
      
      <Bar data={chartData} options={options} />
      
      <style jsx>{`
        .chart-container {
          background-color: rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .chart-filters {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .filter-select {
          background-color: rgba(255, 255, 255, 0.9);
          color: #000000;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }
        
        .filter-select option {
          color: #000000;
          background-color: #ffffff;
        }
        
        .filter-select:focus {
          outline: none;
          border-color: var(--accent-color);
        }
        
        .no-data {
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
          padding: 20px;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default PointsChart; 