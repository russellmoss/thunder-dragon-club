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