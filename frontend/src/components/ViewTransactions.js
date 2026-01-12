import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ViewTransactions = ({ user }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clients, setClients] = useState([]);

  // Filters
  const [typeFilter, setTypeFilter] = useState('All');
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  useEffect(() => {
    if (!user) return; // Don't fetch if not authenticated
    fetchClients();
    fetchTransactions();
  }, [user]);
  useEffect(() => {
    // Re-fetch when filters change
    fetchTransactions();
  }, [typeFilter, clientFilter, statusFilter, dateFromFilter, dateToFilter]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/transactions/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(response.data);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('=== VIEW TRANSACTIONS: FETCHING DATA ===');
      console.log('User:', user);
      console.log('Token exists:', !!token);

      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('API Response Status:', response.status);
      console.log('Raw Response Data:', response.data);
      console.log('Response Data Type:', typeof response.data);
      console.log('Response Data Length:', Array.isArray(response.data) ? response.data.length : 'N/A');

      if (Array.isArray(response.data)) {
        console.log('First 3 transactions from API:');
        response.data.slice(0, 3).forEach((t, i) => {
          console.log(`  ${i+1}. ID: ${t.id}, Date: ${t.date}, Description: ${t.description}, Amount: ${t.amount}`);
        });
      }

      const transactionData = response.data || [];
      console.log('Setting transactions to:', transactionData.length, 'items');
      setTransactions(transactionData);
      setError('');
    } catch (err) {
      console.error('=== VIEW TRANSACTIONS: FETCH ERROR ===');
      console.error('Error details:', err);
      console.error('Response:', err.response);
      setError('Failed to load transactions from database');
      // DO NOT clear transactions on error - keep existing data
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      // Type filter
      if (typeFilter !== 'All' && t.type !== typeFilter) return false;

      // Client filter - only apply if clientFilter is not empty (for all users)
      if (clientFilter.trim() && t.clientName && !t.clientName.toLowerCase().includes(clientFilter.toLowerCase())) return false;

      // Status filter
      if (statusFilter !== 'All' && (t.status || 'COMPLETED') !== statusFilter) return false;

      // Date range filter
      if (dateFromFilter) {
        const fromDate = new Date(dateFromFilter);
        const txnDate = new Date(t.date);
        if (txnDate < fromDate) return false;
      }

      if (dateToFilter) {
        const toDate = new Date(dateToFilter);
        toDate.setHours(23, 59, 59, 999); // End of day
        const txnDate = new Date(t.date);
        if (txnDate > toDate) return false;
      }

      return true;
    });
  };

  const clearFilters = () => {
    setTypeFilter('All');
    setClientFilter('');
    setStatusFilter('All');
    setDateFromFilter('');
    setDateToFilter('');
  };

  const filteredTransactions = getFilteredTransactions();

  // Require authentication to access transaction management
  if (!user) {
    return (
      <div className="view-transactions-page">
        <div className="modern-container">
          <div className="modern-header">
            <div className="header-content">
              <div className="header-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="header-text">
                <h1>Authentication Required</h1>
                <p>Please login to access transaction management.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="view-transactions-page">
      <div className="modern-container">
        {/* Header Section */}
        <div className="modern-header">
          <div className="header-content">
            <div className="header-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="header-text">
              <h1>Transaction Ledger</h1>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <span className="stat-number">{transactions.length}</span>
              <span className="stat-label">Total Transactions</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{filteredTransactions.length}</span>
              <span className="stat-label">Filtered Results</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="modern-alert error">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <h4>Database Connection Issue</h4>
              <p>{error}</p>
            </div>
            <button onClick={fetchTransactions} className="alert-action">
              Retry Connection
            </button>
          </div>
        )}

        {/* Filters Section */}
        {(user?.role === 'ACCOUNTANT' || user?.role === 'ADMIN') && (
          <div className="modern-filters">
            <div className="filters-header">
              <h3>🔍 Advanced Filters</h3>
              <button onClick={clearFilters} className="clear-all-btn">
                Clear All Filters
              </button>
            </div>
            <div className="filters-grid">
              <div className="filter-item">
                <label>Transaction Type</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="All">All Types</option>
                  <option value="CREDIT">💰 Credit</option>
                  <option value="DEBIT">💸 Debit</option>
                </select>
              </div>

              <div className="filter-item">
                <label>Client Name</label>
                <input
                  type="text"
                  placeholder="Search by client name..."
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                />
              </div>

              <div className="filter-item">
                <label>Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">All Status</option>
                  <option value="COMPLETED">✅ Completed</option>
                  <option value="PENDING">⏳ Pending</option>
                </select>
              </div>

              <div className="filter-item">
                <label>From Date</label>
                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                />
              </div>

              <div className="filter-item">
                <label>To Date</label>
                <input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="modern-table-section">
          {loading ? (
            <div className="modern-loading">
              <div className="loading-spinner"></div>
              <p>Loading transactions from MySQL database...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="modern-empty-state">
              <div className="empty-icon">📊</div>
              <h3>No Transactions Found</h3>
              <p>
                {transactions.length === 0
                  ? 'Start by adding your first transaction to see it here.'
                  : 'Try adjusting your filters to see more results.'
                }
              </p>
              {transactions.length > 0 && (
                <button onClick={clearFilters} className="empty-action">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="modern-table-container">
              <div className="table-header">
                <h3>📋 Transaction Records</h3>
                <div className="table-info">
                  Showing <strong>{filteredTransactions.length}</strong> of <strong>{transactions.length}</strong> transactions
                </div>
              </div>

              <div className="responsive-table-wrapper">
                <table className="modern-transactions-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Date</th>
                      <th>Client Name</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Type</th>
                      <th>Status</th>
                      {user?.role === 'ADMIN' && <th>Creator</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map(t => (
                      <tr key={t.id} className="transaction-row">
                        <td>
                          <span className="transaction-id">#{t.id}</span>
                        </td>
                        <td>
                          <div className="date-cell">
                            <div className="date-main">{formatDate(t.date)}</div>
                          </div>
                        </td>
                        <td>
                          <div className="client-name-cell">
                            <span className="client-name-text">{t.clientName || '—'}</span>
                          </div>
                        </td>
                        <td>
                          <div className="description-cell">
                            <div className="description-text">{t.description}</div>
                          </div>
                        </td>
                        <td>
                          <span className="category-tag">{t.category || 'Miscellaneous'}</span>
                        </td>
                        <td>
                          <div className={`amount-cell ${t.type.toLowerCase()}`}>
                            <span className="amount-value">${parseFloat(t.amount).toFixed(2)}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`type-badge ${t.type.toLowerCase()}`}>
                            {t.type === 'CREDIT' ? '💰' : '💸'} {t.type}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${(t.status || 'COMPLETED').toLowerCase()}`}>
                            {(t.status || 'COMPLETED') === 'COMPLETED' ? '✅' : '⏳'} {t.status || 'COMPLETED'}
                          </span>
                        </td>
                        {user?.role === 'ADMIN' && (
                          <td>
                            <span className="creator-info">User #{t.userId}</span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewTransactions;
