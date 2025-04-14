// src/utils/api.js
import config from '../config';

// Flags to manage token renewal state
let isRefreshingToken = false;
let pendingRequests = [];
let lastRefreshAttempt = 0;
const MIN_REFRESH_INTERVAL = 30000; // 30 seconds

/**
 * Process queued requests after token refresh
 * @param {string} newToken - The new token to use
 */
const processQueue = (newToken) => {
  pendingRequests.forEach(request => {
    // Replace the old token with the new one
    request.headers['Authorization'] = `Bearer ${newToken}`;
    // Retry the request
    fetch(`${config.apiUrl}${request.endpoint}`, request)
      .then(response => request.resolve(response))
      .catch(error => request.reject(error));
  });

  // Clear the queue
  pendingRequests = [];
};

/**
 * Parse cookies from document.cookie
 * @returns {Object} - Object with cookie name-value pairs
 */
const parseCookies = () => {
  return document.cookie
    .split(';')
    .map(cookie => cookie.trim())
    .reduce((cookies, cookie) => {
      const [name, value] = cookie.split('=');
      if (name && value) cookies[name] = decodeURIComponent(value);
      return cookies;
    }, {});
};

/**
 * Refresh the access token using the refresh token
 * @returns {Promise<string>} - The new access token
 */
const refreshToken = async () => {
  try {
    // Check if we've tried to refresh too recently
    const now = Date.now();
    if (now - lastRefreshAttempt < MIN_REFRESH_INTERVAL) {
      console.log('Token refresh attempted too recently, skipping');
      return null;
    }

    lastRefreshAttempt = now;
    console.log('Attempting to refresh token');

    // Try to get refresh token from cookies AND localStorage
    const cookies = parseCookies();
    const refreshTokenFromCookie = cookies['refresh_token'];
    const refreshTokenFromStorage = localStorage.getItem('refresh_token');
    const refreshToken = refreshTokenFromStorage || refreshTokenFromCookie;

    if (!refreshToken) {
      console.error('No refresh token available');
      return null;
    }

    // Make a request to the refresh token endpoint with refresh token in the body
    const response = await fetch(`${config.apiUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Still include cookies as fallback
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();
    const newToken = data.access_token;

    if (!newToken) {
      throw new Error('No access token in refresh response');
    }

    console.log('Token refresh successful');

    // Store the new token
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('user_token', newToken); // For backward compatibility

    // Process any pending requests
    processQueue(newToken);

    return newToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear auth token on refresh failure
    localStorage.removeItem('authToken');
    localStorage.removeItem('user_token');

    // Don't automatically redirect to login - let calling code decide
    // window.location.href = '/login';

    return null;
  } finally {
    // Reset refresh state after a delay to prevent immediate retry
    setTimeout(() => {
      isRefreshingToken = false;
    }, 1000);
  }
};

/**
 * Custom fetch wrapper that adds authorization headers and handles token renewal
 * @param {string} endpoint - The API endpoint (without base URL)
 * @param {Object} options - Fetch options (method, body, etc.)
 * @returns {Promise} - Response from the API
 */
const fetchWithAuth = async (endpoint, options = {}) => {
  // Get authentication token from localStorage
  const token = localStorage.getItem('authToken') || localStorage.getItem('user_token');

  // Merge default headers with any provided headers
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  // Build the request config
  const _config = {
    ...options,
    headers,
  };

  // Make the request
  try {
    const response = await fetch(`${config.apiUrl}${endpoint}`, _config);

    // Check for token renewal header
    const newToken = response.headers.get('X-New-Access-Token');
    if (newToken) {
      console.log('Received new access token from response headers');
      localStorage.setItem('authToken', newToken);
      localStorage.setItem('user_token', newToken);
    }

    // Check if the response is successful
    if (!response.ok) {
      // Handle authentication errors
        if (response.status === 401) {
          // Token might be expired - attempt to refresh
          if (!isRefreshingToken) {
            isRefreshingToken = true;

            try {
              const newToken = await refreshToken();

              if (newToken) {
                // Retry the original request with the new token
                const updatedHeaders = {
                  ...headers,
                  'Authorization': `Bearer ${newToken}`
                };

                return fetchWithAuth(endpoint, {
                  ...options,
                  headers: updatedHeaders
                });
              } else {
                // If refresh failed but we have queued requests
                if (pendingRequests.length > 0) {
                  return new Promise((resolve, reject) => {
                    pendingRequests.push({
                      endpoint,
                      ...options,
                      headers: {
                        ...headers,
                        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
                      },
                      resolve,
                      reject
                    });
                  });
                }

                // Otherwise, propagate the authentication error
                throw new Error('Authentication failed and token refresh was unsuccessful');
              }
            } finally {
              // Ensure we reset the refreshing flag
              setTimeout(() => {
                isRefreshingToken = false;
              }, 1000);
            }
          } else {
            // If already refreshing, queue this request to retry after refresh completes
            return new Promise((resolve, reject) => {
              pendingRequests.push({
                endpoint,
                ...options,
                headers,
                resolve,
                reject
              });
            });
          }
        }

      // Parse error response if possible
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || errorData?.message || `API error: ${response.status}`);
    }

    // Check if response is empty
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * WebSocket connection manager
 */
class WebSocketManager {
  constructor() {
    this.socket = null;
    this.listeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second delay
    this.isConnecting = false;
    this.messageQueue = [];
    this.connectionPromise = null;
  }

  // WebSocket methods unchanged...
  // The rest of the WebSocketManager implementation remains the same
  connect(endpoint, options = {}) {
    if (this.isConnecting) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // Get authentication token
        const token = localStorage.getItem('authToken');

        if (!token) {
          throw new Error('No authentication token available');
        }

        // Build the full URL (token is sent in the WebSocket connection)
        const fullUrl = `${config.wsUrl}${endpoint}?token=${encodeURIComponent(token)}`;

        console.log(`Connecting to WebSocket at ${fullUrl}`);
        this.socket = new WebSocket(fullUrl);

        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.isConnecting = false;

          // Process any messages that were queued while connecting
          this._processQueue();

          // Resolve the connection promise
          resolve(this.socket);
        };

        this.socket.onclose = (event) => {
          console.log(`WebSocket closed: ${event.code} ${event.reason}`);
          this.socket = null;

          // Notify any registered close listeners
          if (this.listeners.close) {
            this.listeners.close.forEach(callback => callback(event));
          }
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);

          // Notify any registered error listeners
          if (this.listeners.error) {
            this.listeners.error.forEach(callback => callback(error));
          }

          // If we're still connecting, reject the connection promise
          if (this.isConnecting) {
            this.isConnecting = false;
            reject(error);
          }
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Handle different message types
            if (data.type && this.listeners[data.type]) {
              this.listeners[data.type].forEach(callback => callback(data));
            }

            // Also dispatch to generic message listeners
            if (this.listeners.message) {
              this.listeners.message.forEach(callback => callback(data));
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };
      } catch (error) {
        this.isConnecting = false;
        console.error('Error setting up WebSocket:', error);
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  send(data) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      // Queue the message if the socket isn't ready
      this.messageQueue.push(data);
      return false;
    }

    // Format the data if it's an object
    const message = typeof data === 'object' ? JSON.stringify(data) : data;
    this.socket.send(message);
    return true;
  }

  on(type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  }

  off(type, callback) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
    }
  }

  disconnect(code = 1000, reason = 'Client disconnected') {
    if (this.socket) {
      this.socket.close(code, reason);
      this.socket = null;
    }
  }

  _processQueue() {
    while (this.messageQueue.length > 0 && this.socket?.readyState === WebSocket.OPEN) {
      const data = this.messageQueue.shift();
      this.send(data);
    }
  }

  _handleReconnect(endpoint, options) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;

      // Exponential backoff for reconnect attempts
      const delay = Math.min(30000, this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1));

      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
          this.connect(endpoint, options);
        }
      }, delay);
    } else {
      console.error(`Failed to reconnect after ${this.maxReconnectAttempts} attempts`);

      // Notify any registered reconnect-failed listeners
      if (this.listeners['reconnect-failed']) {
        this.listeners['reconnect-failed'].forEach(callback => callback());
      }
    }
  }
}

let wsManagerInstance = null;

const getWsManager = () => {
  if (!wsManagerInstance) {
    wsManagerInstance = new WebSocketManager();
  }
  return wsManagerInstance;
};

const newWsManager = () => {
  return new WebSocketManager()
}

// Authentication methods
const login = async (username, password) => {
  try {
    // Create form data - IMPORTANT: backend expects form data, not JSON
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${config.apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      credentials: 'include', // Important for storing HttpOnly cookies
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || errorData?.message || `Login failed: ${response.status}`);
    }

    const data = await response.json();

    // Store the access token and refresh token
    if (data.access_token) {
      localStorage.setItem('authToken', data.access_token);
      localStorage.setItem('user_token', data.access_token); // For backward compatibility
      localStorage.setItem('token_type', data.token_type || 'bearer');

      // Store refresh token if it's included in the response
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
    } else {
      throw new Error('No access token received');
    }

    return data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

const logout = async () => {
  try {
    // Call logout endpoint to invalidate tokens on server
    await fetchWithAuth('/auth/logout', {
      method: 'POST',
      credentials: 'include'  // Include cookies for refresh token
    });
  } catch (error) {
    console.error('Logout API call failed:', error);
  } finally {
    // Always clear local storage - including refresh token
    localStorage.removeItem('authToken');
    localStorage.removeItem('user_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('refresh_token'); // Also clear the refresh token

    // Clear refresh token cookie
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    // Redirect to login page
    window.location.href = '/login';
  }
};

// Export convenience methods for different HTTP methods
export const api = {
  get: (endpoint, options = {}) =>
    fetchWithAuth(endpoint, { ...options, method: 'GET' }),

  post: (endpoint, data, options = {}) =>
    fetchWithAuth(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    }),

  put: (endpoint, data, options = {}) =>
    fetchWithAuth(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  delete: (endpoint, options = {}) =>
    fetchWithAuth(endpoint, { ...options, method: 'DELETE' }),

  // Direct access to the base fetchWithAuth function
  fetch: fetchWithAuth,

  // Authentication methods
  login,
  logout,
  refreshToken,

  // WebSocket manager
  getWs: () => getWsManager(),
  newWs: () => newWsManager(),
};

export default api;