// src/config.js
const config = {
  development: {
    apiUrl: 'http://10.200.42.235:8000',
    wsUrl: 'ws://10.200.42.235:8000/ws'
  },
  production: {
    apiUrl: 'https://board-game-backend-q2mc.onrender.com',
    wsUrl: 'wss://board-game-backend-q2mc.onrender.com/ws'
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