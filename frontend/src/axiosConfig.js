import axios from 'axios';

// Configure axios with base URL from environment
const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
axios.defaults.baseURL = `${apiUrl}`;

// Global axios interceptor to handle authentication errors - LESS AGGRESSIVE
axios.interceptors.response.use(
  (response) => {
    // Return response if successful
    return response;
  },
  (error) => {
    // Only handle 401 Unauthorized errors (token expired/invalid)
    // 403 Forbidden errors are handled by individual components
    if (error.response?.status === 401) {
      console.log('Token expired or invalid, clearing session and redirecting to login');

      // Clear invalid authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');

      // Redirect to login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

      // Return a resolved promise to prevent the error from propagating
      return Promise.resolve({
        data: null,
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config: error.config,
      });
    }

    // For 403 and other errors, reject normally - let components handle them
    return Promise.reject(error);
  }
);

export default axios;
