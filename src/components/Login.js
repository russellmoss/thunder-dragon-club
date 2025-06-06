import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import Header from './Header';
import InputField from './InputField';
import Button from './Button';
import '../styles/global.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <Header />
      <div className="login-container">
        <h1>Thunder Dragon Club Admin</h1>
        <form onSubmit={handleLogin}>
          {error && <div className="error-message">{error}</div>}
          <InputField 
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your admin email"
            required
          />
          <InputField 
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
          <Button 
            text={isLoading ? "Logging in..." : "Login"}
            type="submit"
            disabled={isLoading}
          />
        </form>
      </div>

      <style jsx>{`
        .login-container {
          max-width: 400px;
          margin: 40px auto;
          padding: 20px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
        }

        h1 {
          text-align: center;
          margin-bottom: 30px;
          color: var(--header-color);
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
      `}</style>
    </div>
  );
};

export default Login; 