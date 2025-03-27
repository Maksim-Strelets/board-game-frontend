import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './../../hooks/useAuth';
import './layout.css';

const NavigationMenu = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="nav-menu">
      <Link to="/" className="nav-link">Home</Link>
      <Link to="/games" className="nav-link">Game List</Link>
      {isAuthenticated ? (
        <>
          {user && <span className="nav-link">Welcome, {user.username}</span>}
          <button
            onClick={handleLogout}
            className="logout-btn"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link
            to="/login"
            className="login-btn"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="register-btn"
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              textDecoration: 'none'
            }}
          >
            Register
          </Link>
        </>
      )}
    </nav>
  );
};

export default NavigationMenu;