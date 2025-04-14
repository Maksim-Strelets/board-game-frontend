import { jwtDecode as Decode } from 'jwt-decode';
import api from '../utils/api';

// Track refresh state outside the service to maintain state between re-renders
const refreshState = {
  refreshInProgress: false,
  refreshPromise: null,
  lastRefreshAttempt: 0,
  refreshMinInterval: 60000, // 1 minute minimum between refresh attempts
  failedAttempts: 0,
  maxFailedAttempts: 3
};

export const authService = {
  /**
   * Log in a user
   * @param {string} username - User's username or email
   * @param {string} password - User's password
   * @returns {Promise<Object>} - User data including access token
   */
  async login(username, password) {
    try {
      // Reset refresh state on new login
      refreshState.refreshInProgress = false;
      refreshState.refreshPromise = null;
      refreshState.lastRefreshAttempt = 0;
      refreshState.failedAttempts = 0;

      // Use the login method from api.js
      const response = await api.login(username, password);
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Register a new user
   * @param {string} username - Desired username
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<Object>} - Registration response
   */
  async register(username, email, password) {
    try {
      const response = await api.post('/auth/register', {
        username,
        email,
        password
      });

      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  /**
   * Log out the current user
   */
  async logout() {
    try {
      // Use the logout method from api.js
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Reset refresh state on logout
      refreshState.refreshInProgress = false;
      refreshState.refreshPromise = null;
      refreshState.lastRefreshAttempt = 0;
      refreshState.failedAttempts = 0;
    }
  },

  /**
   * Decode the JWT token to get user information
   * @returns {Object|null} - Decoded token payload or null
   */
  decodeToken() {
    const token = this.getToken();
    if (!token) return null;

    try {
      return Decode(token);
    } catch (error) {
      console.error('Invalid token', error);
      return null;
    }
  },

  /**
   * Get the current user's token
   * @returns {string|null} - JWT token or null
   */
  getToken() {
    // First try authToken (new standard), then fall back to user_token (legacy)
    return localStorage.getItem('authToken') || localStorage.getItem('user_token') || null;
  },

  /**
   * Get the current user information
   * @returns {Object|null} - User information or null
   */
  getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;

    try {
      // Decode the token to get user information
      const decoded = Decode(token);

      // Check if token is expired
      const currentTime = Date.now() / 1000;
      if (decoded.exp && decoded.exp < currentTime) {
        // Token is expired, but don't trigger a refresh here
        // Let isAuthenticated handle the refresh logic
        return null;
      }

      // Handle missing standard fields
      const userId = decoded.sub || decoded.id;
      if (!userId) {
        console.warn('Token missing user ID');
        return null;
      }

      return {
        id: userId,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        token,
        ...decoded // Include any other fields
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  /**
   * Check if the user is authenticated
   * @returns {boolean} - True if authenticated, false otherwise
   */
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Check if token is expired
      const decoded = Decode(token);
      const currentTime = Date.now() / 1000;

      // If token is expired but we have a refresh mechanism, try refresh
      // but only if we're not already refreshing
      if (decoded.exp && decoded.exp < currentTime) {
        // Only attempt refresh if enough time has passed since last attempt
        const now = Date.now();
        const timeSinceLastRefresh = now - refreshState.lastRefreshAttempt;

        if (!refreshState.refreshInProgress &&
            timeSinceLastRefresh > refreshState.refreshMinInterval &&
            refreshState.failedAttempts < refreshState.maxFailedAttempts) {

          // Don't wait for the refresh to complete
          this._triggerTokenRefresh();
        }

        // Return false because the current token is expired
        return false;
      }

      return true;
    } catch (error) {
      // Invalid token
      return false;
    }
  },

  /**
   * Trigger token refresh without waiting (non-blocking)
   * @private
   */
  _triggerTokenRefresh() {
    if (refreshState.refreshInProgress) return;

    refreshState.refreshInProgress = true;
    refreshState.lastRefreshAttempt = Date.now();

    // Don't await this promise
    api.refreshToken()
      .then(newToken => {
        if (newToken) {
          refreshState.failedAttempts = 0;
          return true;
        } else {
          refreshState.failedAttempts++;
          return false;
        }
      })
      .catch(() => {
        refreshState.failedAttempts++;
        return false;
      })
      .finally(() => {
        // Reset refresh in progress after a short delay
        setTimeout(() => {
          refreshState.refreshInProgress = false;
        }, 1000);
      });
  },

  /**
   * Refresh the user token (blocking version)
   * @returns {Promise<boolean>} - True if refresh successful, false otherwise
   */
  async refreshUserToken() {
    // If refresh is already in progress, return the existing promise
    if (refreshState.refreshInProgress && refreshState.refreshPromise) {
      return refreshState.refreshPromise;
    }

    // If we've failed too many times, don't retry
    if (refreshState.failedAttempts >= refreshState.maxFailedAttempts) {
      console.log(`Not attempting refresh after ${refreshState.failedAttempts} failed attempts`);
      return Promise.resolve(false);
    }

    // Check time since last attempt
    const now = Date.now();
    const timeSinceLastRefresh = now - refreshState.lastRefreshAttempt;
    if (timeSinceLastRefresh < refreshState.refreshMinInterval) {
      console.log(`Too soon to refresh (${timeSinceLastRefresh}ms since last attempt)`);
      return Promise.resolve(false);
    }

    // Update refresh state
    refreshState.refreshInProgress = true;
    refreshState.lastRefreshAttempt = now;

    // Store the promise
    refreshState.refreshPromise = api.refreshToken()
      .then(newToken => {
        if (newToken) {
          refreshState.failedAttempts = 0;
          return true;
        } else {
          refreshState.failedAttempts++;
          return false;
        }
      })
      .catch(() => {
        refreshState.failedAttempts++;
        return false;
      })
      .finally(() => {
        // Reset refresh in progress after a short delay
        setTimeout(() => {
          refreshState.refreshInProgress = false;
          refreshState.refreshPromise = null;
        }, 1000);
      });

    return refreshState.refreshPromise;
  },

  /**
   * Get user ID from the token
   * @returns {string|null} - User ID or null
   */
  getUserId() {
    const decoded = this.decodeToken();
    return decoded ? decoded.sub || decoded.id || null : null;
  },

  /**
   * Get user role from the token
   * @returns {string|null} - User role or null
   */
  getUserRole() {
    const decoded = this.decodeToken();
    return decoded ? decoded.role || null : null;
  },

  /**
   * Reset the refresh state (useful for debugging)
   */
  resetRefreshState() {
    refreshState.refreshInProgress = false;
    refreshState.refreshPromise = null;
    refreshState.lastRefreshAttempt = 0;
    refreshState.failedAttempts = 0;
  }
};

export default authService;