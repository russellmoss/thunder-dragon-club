import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { memberUser, adminUser, memberSignOut, adminSignOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Close the drawer when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);
  
  const handleLogout = async () => {
    try {
      if (adminUser) {
        await adminSignOut();
        navigate('/admin');
      } else if (memberUser) {
        await memberSignOut();
        navigate('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  // Admin navigation items
  const adminNavItems = [
    { label: 'Members', path: '/admin/dashboard', onClick: () => setActiveSection('members') },
    { label: 'Transactions', path: '/admin/dashboard', onClick: () => setActiveSection('transactions') },
    { label: 'Referrals', path: '/admin/dashboard', onClick: () => setActiveSection('referrals') },
    { label: 'Redemptions', path: '/admin/dashboard', onClick: () => setActiveSection('redemptions') },
    { label: 'Reports', path: '/admin/dashboard', onClick: () => setActiveSection('reports') },
    { label: 'Settings', path: '/admin/dashboard', onClick: () => setActiveSection('settings') },
  ];
  
  // Member navigation items
  const memberNavItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'My Points', path: '/dashboard#points' },
    { label: 'Activity', path: '/dashboard#activity' },
  ];
  
  // Determine which navigation items to show
  const navItems = adminUser ? adminNavItems : memberNavItems;
  
  // Helper function to set active section in admin dashboard
  const setActiveSection = (section) => {
    // You'll need to implement a global state or context for this
    // For now, just navigate to the dashboard
    navigate('/admin/dashboard');
  };
  
  if (!memberUser && !adminUser) return null;
  
  return (
    <>
      <button 
        className="menu-button" 
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <div className="menu-icon">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>
      
      <div className={`drawer-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)} />
      
      <div className={`drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2>Thunder Dragon Club</h2>
          <button 
            className="close-button" 
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>
        
        <nav className="drawer-navigation">
          <ul>
            {navItems.map((item, index) => (
              <li key={index}>
                <a 
                  href={item.path} 
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                    if (item.onClick) item.onClick();
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="drawer-footer">
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .menu-button {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background-color: var(--accent-color);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          cursor: pointer;
        }
        
        .menu-icon {
          width: 20px;
          height: 16px;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .menu-icon span {
          display: block;
          height: 2px;
          width: 100%;
          background-color: #000000;
          border-radius: 2px;
          transition: all 0.3s;
        }
        
        .drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 110;
          visibility: hidden;
          opacity: 0;
          transition: all 0.3s ease;
        }
        
        .drawer-overlay.open {
          visibility: visible;
          opacity: 1;
        }
        
        .drawer {
          position: fixed;
          top: 0;
          right: -80%;
          width: 80%;
          height: 100%;
          background-color: var(--background-color);
          z-index: 120;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease;
          box-shadow: -2px 0 10px rgba(0, 0, 0, 0.3);
        }
        
        .drawer.open {
          transform: translateX(-100%);
        }
        
        .drawer-header {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .drawer-header h2 {
          margin: 0;
          color: var(--header-color);
          font-size: 1.2rem;
        }
        
        .close-button {
          background: none;
          border: none;
          color: var(--text-color);
          font-size: 28px;
          cursor: pointer;
        }
        
        .drawer-navigation {
          flex: 1;
          overflow-y: auto;
          padding: 20px 0;
        }
        
        .drawer-navigation ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .drawer-navigation li {
          margin-bottom: 5px;
        }
        
        .drawer-navigation a {
          display: block;
          padding: 15px 20px;
          color: var(--text-color);
          text-decoration: none;
          font-size: 1.1rem;
          transition: background-color 0.2s;
        }
        
        .drawer-navigation a:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .drawer-footer {
          padding: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .logout-button {
          width: 100%;
          padding: 12px;
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .logout-button:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        @media (min-width: 769px) {
          .menu-button, .drawer, .drawer-overlay {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

export default MobileNavigation; 