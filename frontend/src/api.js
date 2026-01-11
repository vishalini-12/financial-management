import axios from './axiosConfig';

export const api = {
  // Authentication
  login: (credentials) => axios.post('/auth/login', credentials),
  register: (userData) => axios.post('/auth/register', userData),

  // Transactions
  getTransactions: (params) => axios.get('/transactions', { params }),
  createTransaction: (transaction) => axios.post('/transactions', transaction),
  updateTransaction: (id, transaction) => axios.put(`/transactions/${id}`, transaction),
  deleteTransaction: (id) => axios.delete(`/transactions/${id}`),

  // Users
  getUsers: () => axios.get('/admin/users'),
  createUser: (user) => axios.post('/admin/users', user),
  updateUser: (id, user) => axios.put(`/admin/users/${id}`, user),
  deleteUser: (id) => axios.delete(`/admin/users/${id}`),

  // Audit Logs
  getAuditLogs: (params) => axios.get('/audit/logs', { params }),

  // Reconciliation
  getReconciliations: () => axios.get('/reconciliation'),
  createReconciliation: (reconciliation) => axios.post('/reconciliation', reconciliation),
  getReconciliationDetails: (id) => axios.get(`/reconciliation/${id}`),
  exportReconciliation: (id) => axios.get(`/reconciliation/${id}/export`, { responseType: 'blob' }),

  // Reports
  getTransactionReports: (params) => axios.get('/reports/transactions', { params }),
  exportReports: (params) => axios.get('/reports/export', { params, responseType: 'blob' })
};

export default api;
