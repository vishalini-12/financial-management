// API Configuration

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
  },
  TRANSACTIONS: `${API_BASE_URL}/api/transactions`,
  RECONCILIATION: `${API_BASE_URL}/api/reconciliation`,
  USERS: `${API_BASE_URL}/api/admin/users`,
  AUDIT_LOGS: `${API_BASE_URL}/api/audit-logs`,
  REPORTS: `${API_BASE_URL}/api/reports`,
};

export default API_BASE_URL;
