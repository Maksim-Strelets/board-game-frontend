// src/utils/api.js
import config from '../config';

/**
 * Custom fetch wrapper that adds authorization headers and handles common tasks
 * @param {string} endpoint - The API endpoint (without base URL)
 * @param {Object} options - Fetch options (method, body, etc.)
 * @returns {Promise} - Response from the API
 */
const fetchWithAuth = async (endpoint, options = {}) => {
  // Get authentication token from localStorage or elsewhere
  const token = localStorage.getItem('authToken');

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

    // Check if the response is successful
    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        // Optional: Clear token and redirect to login
        localStorage.removeItem('authToken');
        // window.location.href = '/login';
      }

      // Parse error response if possible
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `API error: ${response.status}`);
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

  /**
   * Connect to a WebSocket endpoint
   * @param {string} endpoint - The WebSocket endpoint (without base URL)
   * @param {Object} options - Connection options (optional)
   * @returns {Promise} - Resolves when connection is established
   */
  connect(endpoint, options = {}) {
    if (this.isConnecting) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // Get authentication token
        const token = localStorage.getItem('user_token');

        if (!token) {
          throw new Error('No authentication token available');
        }

        // Build the full URL (token is sent in the WebSocket connection)
        const fullUrl = `${config.wsUrl}${endpoint}`;

        const authProtocol = `token.${token}`;
        const protocols = [...(options.protocols || []), authProtocol];

        console.log(`Connecting to WebSocket at ${fullUrl}`);
        this.socket = new WebSocket(fullUrl, protocols);

        // Add token to first message - this technique works for servers that can't
        // access Authorization headers during the handshake
        this.socket.onopen = () => {
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

  /**
   * Send a message through the WebSocket connection
   * @param {Object|string} data - The data to send
   * @returns {boolean} - Whether the message was sent or queued
   */
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

  /**
   * Add an event listener for specific message types
   * @param {string} type - Event type or message type to listen for
   * @param {Function} callback - Function to call when the event occurs
   */
  on(type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  }

  /**
   * Remove an event listener
   * @param {string} type - Event type
   * @param {Function} callback - The callback to remove
   */
  off(type, callback) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
    }
  }

  /**
   * Close the WebSocket connection
   * @param {number} code - Close code
   * @param {string} reason - Close reason
   */
  disconnect(code = 1000, reason = 'Client disconnected') {
    if (this.socket) {
      this.socket.close(code, reason);
      this.socket = null;
    }
  }

  /**
   * Process any queued messages
   */
  _processQueue() {
    while (this.messageQueue.length > 0 && this.socket?.readyState === WebSocket.OPEN) {
      const data = this.messageQueue.shift();
      this.send(data);
    }
  }

  /**
   * Handle reconnection attempts
   */
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

  // WebSocket manager
  getWs: () => getWsManager(),
  newWs: () => newWsManager(),
};

export default api;