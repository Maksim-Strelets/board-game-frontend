import { useState, useEffect, useCallback, useRef } from 'react';
import authService from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use ref to prevent excessive effect triggers
  const checkIntervalRef = useRef(null);

  // Function to update auth state
  const updateAuthState = useCallback(() => {
    // Get current user without triggering refresh
    const currentUser = authService.getCurrentUser();

    // Check if authenticated without triggering refresh
    const isUserAuthenticated = authService.isAuthenticated();

    // Update state
    setUser(currentUser);
    setIsAuthenticated(isUserAuthenticated);

    return { currentUser, isUserAuthenticated };
  }, []);

  // Set up authentication checking on mount
  useEffect(() => {
    // Clean up any existing interval
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }

    // Check auth status on mount
    try {
      updateAuthState();
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }

    // Set up periodic auth check (every 5 minutes)
    // This is much less frequent than the previous implementation
    checkIntervalRef.current = setInterval(() => {
      try {
        updateAuthState();
      } catch (err) {
        console.error('Auth check error:', err);
      }
    }, 300000); // Check every 5 minutes

    // Listen for logout events (triggered by api.js on auth failures)
    const handleLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
    };

    window.addEventListener('auth:logout', handleLogout);

    // Clean up on unmount
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [updateAuthState]);

  const login = async (username, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await authService.login(username, password);
      updateAuthState();
      return userData;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username, email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await authService.register(username, email, password);
      return userData;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Explicit refresh function that returns a promise
  const refreshToken = async () => {
    setIsLoading(true);
    try {
      const success = await authService.refreshUserToken();
      if (success) {
        updateAuthState();
      }
      return success;
    } catch (err) {
      console.error('Token refresh error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshToken,
    isAuthenticated
  };
};