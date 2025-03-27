import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './../hooks/useAuth';
import './loginpage.css'; // Reusing login page styles

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationError, setRegistrationError] = useState(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegistrationError(null);

    // Basic validation
    if (password !== confirmPassword) {
      setRegistrationError('Passwords do not match');
      return;
    }

    try {
      await register(username, email, password);
      // Redirect to login page after successful registration
      navigate('/login');
    } catch (error) {
      // Handle registration error
      setRegistrationError(
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Registration failed'
      );
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Register New Account</h2>
      {registrationError && (
        <div className="error-message" style={{color: 'red', marginBottom: '1rem'}}>
          {registrationError}
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
            minLength="3"
          />
        </div>
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            minLength="6"
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirm-password" className="form-label">Confirm Password</label>
          <input
            type="password"
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="form-input"
            required
            minLength="6"
          />
        </div>
        <button
          type="submit"
          className="submit-btn"
        >
          Register
        </button>
      </form>
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        Already have an account?
        <a
          href="/login"
          style={{
            marginLeft: '0.5rem',
            color: '#2c3e50',
            textDecoration: 'underline'
          }}
        >
          Login
        </a>
      </div>
    </div>
  );
};

export default RegisterPage;