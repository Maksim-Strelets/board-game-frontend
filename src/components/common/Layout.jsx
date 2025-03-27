import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import NavigationMenu from './NavigationMenu';
import './layout.css';

const Layout = () => {
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-container">
          <Link to="/" className="site-logo">
            Online Board Games
          </Link>
          <NavigationMenu />
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        © {new Date().getFullYear()} Online Board Games
      </footer>
    </div>
  );
};

export default Layout;