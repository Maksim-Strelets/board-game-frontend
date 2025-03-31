import axios from 'axios';
import { jwtDecode as Decode } from 'jwt-decode';
import config from '../config';

export const authService = {
  async login(username, password) {
    try {
      // FormData for proper content type
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axios.post(`${config.apiUrl}/auth/login`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Store token in localStorage
      if (response.data.access_token) {
        localStorage.setItem('user_token', response.data.access_token);
        localStorage.setItem('token_type', response.data.token_type);
      }

      return response.data;
    } catch (error) {
      console.error('Login error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  async register(username, email, password) {
    try {
      const response = await axios.post(`${config.apiUrl}/auth/register`, {
        username,
        email,
        password
      });

      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response ? error.response.data : error.message);
      throw error;
    }
  },

  logout() {
    // Remove token from localStorage
    localStorage.removeItem('user_token');
    localStorage.removeItem('token_type');
  },

  // Decode JWT token
  decodeToken(): JwtPayload | null {
    const user = this.getCurrentUser();
    if (!user) return null;

    try {
      return Decode(user.token);
    } catch (error) {
      console.error('Invalid token', error);
      return null;
    }
  },

  getCurrentUser() {
    const token = localStorage.getItem('user_token');
    return token ? { token } : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('user_token');
  }
};

export default authService;