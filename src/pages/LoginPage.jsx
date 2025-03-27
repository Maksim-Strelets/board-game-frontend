import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './../hooks/useAuth';
import './loginpage.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);

    try {
      await login(username, password);
      // Redirect to home page after successful login
      navigate('/');
    } catch (error) {
      // Handle login error
      setLoginError(error.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Login</h2>
      {loginError && (
        <div className="error-message" style={{color: 'red', marginBottom: '1rem'}}>
          {loginError}
        </div>
      )}
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="username" className="form-label">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <button
          type="submit"
          className="submit-btn"
        >
          Login
        </button>
      </form>
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        Don't have an account?
        <Link
          to="/register"
          style={{
            marginLeft: '0.5rem',
            color: '#2c3e50',
            textDecoration: 'underline'
          }}
        >
          Register
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;