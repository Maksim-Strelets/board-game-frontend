// src/config.js
const config = {
  development: {
    apiUrl: 'http://10.200.32.57:8000',
    wsUrl: 'ws://10.200.32.57:8000/ws'
  },
  production: {
    apiUrl: 'https://your-production-api.com',
    wsUrl: 'wss://your-production-api.com/ws'
  },
  test: {
    apiUrl: 'http://localhost:8000',
    wsUrl: 'ws://localhost:8000/ws'
  }
};

// Determine which environment we're in
const env = process.env.NODE_ENV || 'development';

// Export the config for the current environment
export default config[env];