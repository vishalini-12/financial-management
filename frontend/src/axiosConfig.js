import axios from 'axios';

// Configure axios with base URL from environment
const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
axios.defaults.baseURL = `${apiUrl}`;

// Global axios interceptor to handle authentication errors silently
axios.interceptors.response.use(
  (response) => {
    // Return response if successful
    return response;
  },
  (error) => {
    // Handle 403 Forbidden errors (authentication/authorization failures)
    if (error.response?.status === 403) {
      console.log('Authentication failed, clearing session and redirecting to login');

      // Clear invalid authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');

      // Redirect to login page silently
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

      // Return a resolved promise to prevent the error from propagating
      // This prevents console errors from showing up
      return Promise.resolve({
        data: null,
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config: error.config,
      });
    }

    // For other errors, reject normally
    return Promise.reject(error);
  }
);

export default axios;
