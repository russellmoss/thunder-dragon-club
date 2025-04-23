import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/Header';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import PasswordReset from '../../components/PasswordReset';
import '../../styles/global.css';

const MemberLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
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
            <button 
              type="button" 
              onClick={() => setShowPasswordReset(true)} 
              className="forgot-password-link"
            >
              Forgot Password?
            </button>
          </div>
        </form>
      </div>

      {showPasswordReset && (
        <PasswordReset onClose={() => setShowPasswordReset(false)} />
      )}

      <style>{`
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
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .signup-link {
          color: var(--accent-color);
          text-decoration: none;
          font-size: 0.9rem;
        }
        
        .signup-link:hover {
          text-decoration: underline;
        }

        .forgot-password-link {
          background: none;
          border: none;
          color: var(--accent-color);
          text-decoration: none;
          font-size: 0.9rem;
          cursor: pointer;
          padding: 0;
        }

        .forgot-password-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default MemberLogin; 