import axios from 'axios';

// ===========================================
// CENTRALIZED API CONFIGURATION
// ===========================================

// Get API base URL from environment variable
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

// ===========================================
// AXIOS INSTANCE WITH AUTHORIZATION
// ===========================================

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===========================================
// REQUEST INTERCEPTOR - Add JWT Token
// ===========================================

api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');

    // Add Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ===========================================
// RESPONSE INTERCEPTOR - Handle Auth Errors
// ===========================================

api.interceptors.response.use(
  (response) => {
    // Return successful response
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      console.log('Token expired or invalid, clearing session and redirecting to login');

      // Clear invalid authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');

      // Redirect to login page (avoid redirect loop)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

      // Return a resolved promise to prevent error propagation
      return Promise.resolve({
        data: null,
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config: error.config,
      });
    }

    // For other errors, reject normally
    return Promise.reject(error);
  }
);

// ===========================================
// API ENDPOINTS CONFIGURATION
// ===========================================

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
  },

  // Transactions
  TRANSACTIONS: '/api/transactions',
  TRANSACTION_CLIENTS: '/api/transactions/clients',
  TRANSACTION_RECONCILIATION: '/api/transactions/reconciliation',
  TRANSACTION_CSV_UPLOAD: '/api/transactions/upload-csv',

  // Reconciliation
  RECONCILIATION: '/api/reconciliation',
  RECONCILIATION_CALCULATE: '/api/reconciliation/calculate',

  // Reports
  REPORTS: '/api/reports',
  RECONCILIATION_REPORTS: '/api/reconciliation',
  EXPORT_PDF: '/api/transactions/reconciliation/export/pdf',
  EXPORT_CSV: '/api/transactions/reconciliation/export/csv',
  EXPORT_EXCEL: '/api/transactions/reconciliation/export/excel',

  // Users & Admin
  USERS: '/api/admin/users',
  USER_MANAGEMENT: '/api/users',

  // Audit Logs
  AUDIT_LOGS: '/api/audit-logs',

  // Health Check
  HEALTH: '/actuator/health',
  DB_STATUS: '/api/transactions/database/status',
};

// ===========================================
// EXPORT AXIOS INSTANCE AS DEFAULT
// ===========================================

export default api;

// ===========================================
// USAGE EXAMPLES
// ===========================================

/*
// Import the configured axios instance
import api, { API_BASE_URL, API_ENDPOINTS } from '../utils/api';

// GET request with automatic auth header
const response = await api.get(API_ENDPOINTS.TRANSACTION_CLIENTS);

// POST request with data
const response = await api.post(API_ENDPOINTS.TRANSACTIONS, transactionData);

// Direct URL construction
const fullUrl = `${API_BASE_URL}/api/transactions/clients`;
const response = await api.get('/api/transactions/clients');
*/
