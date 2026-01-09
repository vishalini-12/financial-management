import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ClientReconciliation = ({ user }) => {
  const [reconciliationData, setReconciliationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clients, setClients] = useState([]);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    client: ''
  });

  // Bank Reconciliation state
  const [bankForm, setBankForm] = useState({
    fromDate: '',
    toDate: '',
    openingBalance: '',
    bankBalance: ''
  });
  const [bankResults, setBankResults] = useState(null);
  const [bankLoading, setBankLoading] = useState(false);

  useEffect(() => {
    // USER role should not access reconciliation
    if (user?.role === 'USER') {
      return;
    }

    fetchClients();
    fetchReconciliation();
  }, [user]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/transactions/clients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(response.data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  }

  const fetchReconciliation = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.fromDate.trim()) {
        params.append('fromDate', filters.fromDate.trim());
      }
      if (filters.toDate.trim()) {
        params.append('toDate', filters.toDate.trim());
      }
      if (filters.client.trim()) {
        params.append('client', filters.client.trim());
      }

      const url = `http://localhost:8080/api/transactions/reconciliation${params.toString() ? '?' + params.toString() : ''}`;

      console.log('Fetching reconciliation with URL:', url);

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setReconciliationData(response.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching reconciliation:', err);
      setError('Failed to load reconciliation data');
      setReconciliationData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    fetchReconciliation();
  };

  const clearFilters = () => {
    setFilters({
      fromDate: '',
      toDate: '',
      client: ''
    });
    // Fetch without filters after clearing
    setTimeout(() => {
      fetchReconciliation();
    }, 100);
  };

  const toggleReconciliationStatus = async (clientName, currentStatus) => {
    try {
      const token = localStorage.getItem('token');

      // Determine the new status based on current status
      let newStatus;
      if (currentStatus === 'MATCHED') {
        newStatus = 'UNMATCHED';
      } else {
        // For PENDING CONFIRM or any other zero-balance state, mark as matched
        newStatus = 'MATCHED';
      }

      const response = await axios.post(
        `http://localhost:8080/api/transactions/reconciliation/${encodeURIComponent(clientName)}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Refresh the reconciliation data to get updated status
        await fetchReconciliation();
        console.log(`Successfully updated ${clientName} to ${newStatus}`);
      }
    } catch (err) {
      console.error('Error updating reconciliation status:', err);
      setError('Failed to update reconciliation status');
    }
  };

  const confirmReconciliation = async (clientName) => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `http://localhost:8080/api/reconciliation/confirm`,
        { clientName: clientName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Refresh the reconciliation data to get updated status
        await fetchReconciliation();
        console.log(`Successfully confirmed reconciliation for ${clientName}`);
      }
    } catch (err) {
      console.error('Error confirming reconciliation:', err);
      setError('Failed to confirm reconciliation');
    }
  };

  // Bank Reconciliation handlers
  const handleBankFormChange = (e) => {
    const { name, value } = e.target;
    setBankForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateBankForm = () => {
    const { fromDate, toDate, openingBalance, bankBalance } = bankForm;

    if (!fromDate || !toDate) {
      setError('From date and To date are required');
      return false;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      setError('From date cannot be after To date');
      return false;
    }

    if (!openingBalance || isNaN(openingBalance)) {
      setError('Opening balance must be a valid number');
      return false;
    }

    if (!bankBalance || isNaN(bankBalance)) {
      setError('Bank balance must be a valid number');
      return false;
    }

    return true;
  };

  const handleBankReconciliation = async (e) => {
    e.preventDefault();

    if (!validateBankForm()) {
      return;
    }

    setBankLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8080/api/reconciliation/calculate', {
        fromDate: bankForm.fromDate,
        toDate: bankForm.toDate,
        openingBalance: parseFloat(bankForm.openingBalance),
        bankBalance: parseFloat(bankForm.bankBalance)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBankResults(response.data);
    } catch (err) {
      console.error('Error calculating bank reconciliation:', err);
      setError(err.response?.data?.message || 'Failed to calculate bank reconciliation');
    } finally {
      setBankLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // USER role access denied
  if (user?.role === 'USER') {
    return (
      <div className="reconciliation-page">
        <div className="modern-container">
          <div className="access-denied-modern">
            <div className="access-icon">🚫</div>
            <h2>Access Denied</h2>
            <p>You don't have permission to view client reconciliation.</p>
            <p>Client reconciliation is only available for Accountants and Administrators.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reconciliation-page">
      <div className="modern-container">
        {/* Modern Header */}
        <div className="reconciliation-header">
          <div className="header-content">
            <div className="header-icon-large">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="header-text">
              <h1>Client Reconciliation</h1>
              <p>Review and manage client account balances</p>
            </div>
          </div>
          <div className="header-metrics">
            <div className="metric-card">
              <span className="metric-number">{reconciliationData.length}</span>
              <span className="metric-label">Total Clients</span>
            </div>
            <div className="metric-card matched">
              <span className="metric-number">
                {reconciliationData.filter(item => item.matchStatus === 'MATCHED').length}
              </span>
              <span className="metric-label">✅ Matched</span>
            </div>
            <div className="metric-card pending">
              <span className="metric-number">
                {reconciliationData.filter(item => item.matchStatus === 'PENDING CONFIRM').length}
              </span>
              <span className="metric-label">⚠️ Pending Confirm</span>
            </div>
            <div className="metric-card unmatched">
              <span className="metric-number">
                {reconciliationData.filter(item => item.matchStatus === 'UNMATCHED').length}
              </span>
              <span className="metric-label">❌ Unmatched</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="modern-alert error">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <h4>Data Loading Error</h4>
              <p>{error}</p>
            </div>
            <button onClick={fetchReconciliation} className="alert-action">
              Retry
            </button>
          </div>
        )}

        {/* Filters Section */}
        <div className="reconciliation-filters">
          <div className="filters-header">
            <h3>🔍 Filter Clients</h3>
            <div className="filter-actions">
              <button onClick={applyFilters} className="filter-apply-btn">
                Apply Filters
              </button>
              <button onClick={clearFilters} className="filter-clear-btn">
                Clear All
              </button>
            </div>
          </div>
          <div className="filters-grid-modern">
            <div className="filter-item-modern">
              <label>From Date</label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                placeholder="Start date"
              />
            </div>

            <div className="filter-item-modern">
              <label>To Date</label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
                placeholder="End date"
              />
            </div>

            <div className="filter-item-modern">
              <label>Client Name</label>
              <input
                type="text"
                placeholder="Search by client name..."
                value={filters.client}
                onChange={(e) => handleFilterChange('client', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Reconciliation Cards */}
        <div className="reconciliation-content">
          {loading ? (
            <div className="reconciliation-loading">
              <div className="loading-spinner-large"></div>
              <p>Loading client reconciliation data...</p>
            </div>
          ) : reconciliationData.length === 0 ? (
            <div className="reconciliation-empty">
              <div className="empty-icon-large">📊</div>
              <h3>No Reconciliation Data</h3>
              <p>
                {filters.fromDate || filters.toDate || filters.client
                  ? 'No clients match your current filters. Try adjusting them.'
                  : 'Add some transactions to see client reconciliation data.'
                }
              </p>
              {(filters.fromDate || filters.toDate || filters.client) && (
                <button onClick={clearFilters} className="empty-action-btn">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="reconciliation-cards-grid">
              {reconciliationData.map((item, index) => {
                const matchStatus = item.matchStatus || 'UNMATCHED';
                return (
                  <div key={index} className={`reconciliation-card ${matchStatus === 'MATCHED' ? 'matched' : 'unmatched'} ${item.clientName === 'sam' || item.clientName === 'sri' ? 'special-purple' : ''}`}>
                    <div className="card-header">
                      <div className="client-info">
                        <h4 className="client-name">{item.clientName || 'Unknown Client'}</h4>
                        <span className={`status-indicator ${matchStatus.toLowerCase().replace(' ', '-')}`}>
                          {matchStatus === 'MATCHED' ? '✅' :
                           matchStatus === 'PENDING CONFIRM' ? '⚠️' :
                           '❌'} {matchStatus}
                        </span>
                      </div>
                    </div>

                    <div className="card-body">
                      <div className="balance-overview">
                        <div className="balance-item">
                          <span className="balance-label">Total Credit</span>
                          <span className="balance-value credit-amount">
                            {formatCurrency(item.totalCredit || 0)}
                          </span>
                        </div>
                        <div className="balance-item">
                          <span className="balance-label">Total Debit</span>
                          <span className="balance-value debit-amount">
                            {formatCurrency(item.totalDebit || 0)}
                          </span>
                        </div>
                        <div className="balance-item total">
                          <span className="balance-label">Net Balance</span>
                          <span className={`balance-value net-balance ${(item.netBalance || 0) >= 0 ? 'positive' : 'negative'}`}>
                            {formatCurrency(item.netBalance || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="card-footer">
                      <div className="reconciliation-status">
                        <span className={`status-badge-large ${matchStatus.toLowerCase().replace(' ', '-')}`}>
                          {matchStatus === 'MATCHED' ? 'Credit and Debit are fully settled' :
                           matchStatus === 'PENDING_CONFIRM' ? 'Client has no transactions in selected period' :
                           'Pending amount exists'}
                        </span>
                        {matchStatus === 'UNMATCHED' && (
                          <button
                            onClick={() => confirmReconciliation(item.clientName)}
                            className="status-toggle-btn to-matched"
                          >
                            MARK AS MATCHED
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bank Reconciliation Section */}
        <div className="bank-reconciliation-section">
          <div className="section-header">
            <h2>🏦 Bank Reconciliation</h2>
            <p>Reconcile your bank statements with system records</p>
          </div>

          {/* Bank Reconciliation Form */}
          <div className="bank-reconciliation-form">
            <form onSubmit={handleBankReconciliation}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="bankFromDate">From Date *</label>
                  <input
                    type="date"
                    id="bankFromDate"
                    name="fromDate"
                    value={bankForm.fromDate}
                    onChange={handleBankFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bankToDate">To Date *</label>
                  <input
                    type="date"
                    id="bankToDate"
                    name="toDate"
                    value={bankForm.toDate}
                    onChange={handleBankFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="openingBalance">Opening Balance *</label>
                  <input
                    type="number"
                    id="openingBalance"
                    name="openingBalance"
                    value={bankForm.openingBalance}
                    onChange={handleBankFormChange}
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bankBalance">Bank Balance *</label>
                  <input
                    type="number"
                    id="bankBalance"
                    name="bankBalance"
                    value={bankForm.bankBalance}
                    onChange={handleBankFormChange}
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="bank-reconcile-btn"
                  disabled={bankLoading}
                >
                  {bankLoading ? 'Calculating...' : '🔍 Reconcile Bank Statement'}
                </button>
              </div>
            </form>
          </div>

          {/* Bank Reconciliation Results */}
          {bankResults && (
            <div className="bank-reconciliation-results">
              <h3>Bank Reconciliation Results</h3>

              <div className="results-summary">
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Total Credit</span>
                    <span className="summary-value credit-amount">
                      {formatCurrency(bankResults.totalCredit)}
                    </span>
                  </div>

                  <div className="summary-item">
                    <span className="summary-label">Total Debit</span>
                    <span className="summary-value debit-amount">
                      {formatCurrency(bankResults.totalDebit)}
                    </span>
                  </div>

                  <div className="summary-item">
                    <span className="summary-label">System Balance</span>
                    <span className="summary-value">
                      {formatCurrency(bankResults.systemBalance)}
                    </span>
                  </div>

                  <div className="summary-item">
                    <span className="summary-label">Bank Balance</span>
                    <span className="summary-value">
                      {formatCurrency(bankResults.bankBalance)}
                    </span>
                  </div>

                  <div className="summary-item">
                    <span className="summary-label">Difference</span>
                    <span className={`summary-value ${Math.abs(bankResults.difference) < 0.01 ? 'balanced' : 'unbalanced'}`}>
                      {formatCurrency(bankResults.difference)}
                    </span>
                  </div>

                  <div className="summary-item status">
                    <span className="summary-label">Status</span>
                    <span className={`status-badge ${bankResults.status === 'MATCHED' ? 'reconciled' : 'not-reconciled'}`}>
                      {bankResults.status === 'MATCHED' ? '✅' : '❌'} {bankResults.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientReconciliation;
