import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Reconciliation = ({ user }) => {
  const [formData, setFormData] = useState({
    fromDate: '',
    toDate: '',
    openingBalance: '',
    bankBalance: ''
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user has permission (ADMIN or ACCOUNTANT only)
  useEffect(() => {
    if (user && user.role === 'USER') {
      setError('Access denied. Only ADMIN and ACCOUNTANT can access reconciliation.');
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear results when form changes
    if (results) {
      setResults(null);
    }
  };

  const validateForm = () => {
    const { fromDate, toDate, openingBalance, bankBalance } = formData;

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8080/api/transactions/reconciliation/calculate', {
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        openingBalance: parseFloat(formData.openingBalance),
        bankBalance: parseFloat(formData.bankBalance)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setResults(response.data);
    } catch (err) {
      console.error('Error calculating reconciliation:', err);
      setError(err.response?.data?.message || 'Failed to calculate reconciliation');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Access denied for USER role
  if (user && user.role === 'USER') {
    return (
      <div className="reconciliation-page">
        <div className="modern-container">
          <div className="access-denied-modern">
            <div className="access-icon">🚫</div>
            <h2>Access Denied</h2>
            <p>You don't have permission to access bank reconciliation.</p>
            <p>Bank reconciliation is only available for Accountants and Administrators.</p>
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
              <h1>Bank Reconciliation</h1>
              <p>Reconcile your bank statements with system records</p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="modern-alert error">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <h4>Error</h4>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Reconciliation Form */}
        <div className="reconciliation-form">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="fromDate">From Date *</label>
                <input
                  type="date"
                  id="fromDate"
                  name="fromDate"
                  value={formData.fromDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="toDate">To Date *</label>
                <input
                  type="date"
                  id="toDate"
                  name="toDate"
                  value={formData.toDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="openingBalance">Opening Balance *</label>
                <input
                  type="number"
                  id="openingBalance"
                  name="openingBalance"
                  value={formData.openingBalance}
                  onChange={handleInputChange}
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
                  value={formData.bankBalance}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="reconcile-btn"
                disabled={loading}
              >
                {loading ? 'Calculating...' : '🔍 Reconcile'}
              </button>
            </div>
          </form>
        </div>

        {/* MATCHED Section */}
        {results && results.status === 'MATCHED' && (
          <div className="reconciliation-results matched-section">
            <h3>✅ Reconciliation Matched</h3>

            <div className="results-summary">
              <div className="matched-message">
                <div className="success-icon">🎉</div>
                <h4>Perfect Match!</h4>
                <p>Your system calculations exactly match the bank balance.</p>
              </div>

              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Total Credit</span>
                  <span className="summary-value credit-amount">
                    {formatCurrency(results.totalCredit)}
                  </span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">Total Debit</span>
                  <span className="summary-value debit-amount">
                    {formatCurrency(results.totalDebit)}
                  </span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">Net Amount</span>
                  <span className="summary-value">
                    {formatCurrency(results.totalCredit - results.totalDebit)}
                  </span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">Bank Balance</span>
                  <span className="summary-value">
                    {formatCurrency(results.bankBalance)}
                  </span>
                </div>

                <div className="summary-item status">
                  <span className="summary-label">Status</span>
                  <span className="status-badge reconciled">
                    ✅ MATCHED
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UNMATCHED Section */}
        {results && results.status === 'UNMATCHED' && (
          <div className="reconciliation-results unmatched-section">
            <h3>❌ Reconciliation Unmatched</h3>

            <div className="results-summary">
              <div className="unmatched-message">
                <div className="warning-icon">⚠️</div>
                <h4>Difference Found</h4>
                <p>There is a discrepancy between your system calculations and the bank balance.</p>
              </div>

              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Total Credit</span>
                  <span className="summary-value credit-amount">
                    {formatCurrency(results.totalCredit)}
                  </span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">Total Debit</span>
                  <span className="summary-value debit-amount">
                    {formatCurrency(results.totalDebit)}
                  </span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">Net Amount</span>
                  <span className="summary-value">
                    {formatCurrency(results.totalCredit - results.totalDebit)}
                  </span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">Bank Balance</span>
                  <span className="summary-value">
                    {formatCurrency(results.bankBalance)}
                  </span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">Difference</span>
                  <span className="summary-value unbalanced">
                    {formatCurrency((results.totalCredit - results.totalDebit) - results.bankBalance)}
                  </span>
                </div>

                <div className="summary-item status">
                  <span className="summary-label">Status</span>
                  <span className="status-badge not-reconciled">
                    ❌ UNMATCHED
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .reconciliation-page {
          padding: 20px;
          background-color: #f8fafc;
          min-height: 100vh;
        }

        .modern-container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .reconciliation-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .header-icon-large svg {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          padding: 10px;
        }

        .header-text h1 {
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
        }

        .header-text p {
          margin: 5px 0 0 0;
          opacity: 0.9;
        }

        .modern-alert {
          margin: 20px;
          padding: 15px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .modern-alert.error {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        .alert-icon {
          font-size: 1.5rem;
        }

        .reconciliation-form {
          padding: 30px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 8px;
          font-weight: 600;
          color: #374151;
        }

        .form-group input {
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-actions {
          display: flex;
          justify-content: center;
        }

        .reconcile-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .reconcile-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }

        .reconcile-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .reconciliation-results {
          padding: 30px;
          background-color: #f8fafc;
          border-top: 2px solid #e5e7eb;
        }

        .reconciliation-results h3 {
          margin: 0 0 20px 0;
          color: #1f2937;
          font-size: 1.5rem;
        }

        .results-summary {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .summary-item {
          text-align: center;
          padding: 15px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .summary-item.status {
          grid-column: 1 / -1;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .summary-label {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 8px;
          color: #6b7280;
        }

        .summary-item.status .summary-label {
          color: rgba(255, 255, 255, 0.8);
        }

        .summary-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
        }

        .summary-value.credit-amount {
          color: #059669;
        }

        .summary-value.debit-amount {
          color: #dc2626;
        }

        .summary-value.balanced {
          color: #059669;
        }

        .summary-value.unbalanced {
          color: #dc2626;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 1rem;
        }

        .status-badge.reconciled {
          background-color: #d1fae5;
          color: #065f46;
        }

        .status-badge.not-reconciled {
          background-color: #fef2f2;
          color: #dc2626;
        }

        .access-denied-modern {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .access-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .access-denied-modern h2 {
          margin: 0 0 10px 0;
          color: #374151;
        }

        .access-denied-modern p {
          margin: 5px 0;
          font-size: 1.1rem;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .summary-grid {
            grid-template-columns: 1fr;
          }

          .header-content {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Reconciliation;
