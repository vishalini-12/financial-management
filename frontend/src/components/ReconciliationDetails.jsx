import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { API_ENDPOINTS } from '../utils/api';

const ReconciliationDetails = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reconciliation, setReconciliation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user has permission (ADMIN or ACCOUNTANT only)
    if (!user || user.role === 'USER') {
      navigate('/unauthorized');
      return;
    }

    fetchReconciliationDetails();
  }, [id, user, navigate]);

  const fetchReconciliationDetails = async () => {
    try {
      setLoading(true);
      // 🔍 DEBUG: Log API call
      console.log('🔍 RECONCILIATION DETAILS - Fetching details for ID:', id);

      const response = await api.get(`${API_ENDPOINTS.RECONCILIATION}/${id}`);

      console.log('🔍 RECONCILIATION DETAILS - Response received:', response.data);
      setReconciliation(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching reconciliation details:', err);
      if (err.response?.status === 404) {
        setError('Reconciliation record not found');
      } else {
        setError('Failed to load reconciliation details');
      }
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="reconciliation-details-page">
        <div className="page-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading reconciliation details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reconciliation-details-page">
        <div className="page-container">
          <div className="error-container">
            <div className="error-icon">❌</div>
            <h2>Error Loading Details</h2>
            <p>{error}</p>
            <div className="error-actions">
              <button onClick={() => navigate('/bank-reconciliation')} className="primary-btn">
                Back to Reconciliation
              </button>
              <button onClick={fetchReconciliationDetails} className="secondary-btn">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!reconciliation) {
    return (
      <div className="reconciliation-details-page">
        <div className="page-container">
          <div className="not-found-container">
            <div className="not-found-icon">🔍</div>
            <h2>Reconciliation Not Found</h2>
            <p>The reconciliation record you're looking for doesn't exist.</p>
            <button onClick={() => navigate('/bank-reconciliation')} className="primary-btn">
              Start New Reconciliation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reconciliation-details-page">
      <div className="page-container">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <div className="header-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="header-text">
              <h1>Bank Reconciliation Details</h1>
              <p>Reconciliation ID: #{reconciliation.id}</p>
            </div>
          </div>
          <div className="header-actions">
            <button onClick={() => navigate('/bank-reconciliation')} className="secondary-btn">
              New Reconciliation
            </button>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`status-banner ${reconciliation.status === 'MATCHED' ? 'reconciled' : 'not-reconciled'}`}>
          <div className="status-icon">
            {reconciliation.status === 'MATCHED' ? '✅' : '❌'}
          </div>
          <div className="status-content">
            <h2>Status: {reconciliation.status}</h2>
            <p>
              {reconciliation.status === 'MATCHED'
                ? 'Bank balance matches system calculations perfectly!'
                : 'There is a difference between bank balance and system calculations.'
              }
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-grid">
          <div className="summary-card">
            <div className="card-icon">📅</div>
            <div className="card-content">
              <h3>Period</h3>
              <p className="period-dates">
                {formatDate(reconciliation.fromDate)} - {formatDate(reconciliation.toDate)}
              </p>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">💰</div>
            <div className="card-content">
              <h3>Opening Balance</h3>
              <p className="balance-amount">{formatCurrency(reconciliation.openingBalance)}</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">🏦</div>
            <div className="card-content">
              <h3>Bank Balance</h3>
              <p className="balance-amount">{formatCurrency(reconciliation.bankBalance)}</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">⚖️</div>
            <div className="card-content">
              <h3>Difference</h3>
              <p className={`balance-amount ${Math.abs(reconciliation.difference) < 0.01 ? 'balanced' : 'unbalanced'}`}>
                {formatCurrency(reconciliation.difference)}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="breakdown-section">
          <h3>Calculation Breakdown</h3>

          <div className="calculation-steps">
            <div className="calculation-step">
              <div className="step-label">Opening Balance</div>
              <div className="step-value">{formatCurrency(reconciliation.openingBalance)}</div>
            </div>

            <div className="calculation-step">
              <div className="step-label">+ Total Credits</div>
              <div className="step-value credit-amount">+{formatCurrency(reconciliation.totalCredit)}</div>
            </div>

            <div className="calculation-step">
              <div className="step-label">- Total Debits</div>
              <div className="step-value debit-amount">-{formatCurrency(reconciliation.totalDebit)}</div>
            </div>

            <div className="calculation-separator">=</div>

            <div className="calculation-step total">
              <div className="step-label">System Balance</div>
              <div className="step-value">{formatCurrency(reconciliation.systemBalance)}</div>
            </div>

            <div className="calculation-step">
              <div className="step-label">Bank Balance</div>
              <div className="step-value">{formatCurrency(reconciliation.bankBalance)}</div>
            </div>

            <div className="calculation-separator">=</div>

            <div className={`calculation-step total ${Math.abs(reconciliation.difference) < 0.01 ? 'balanced' : 'unbalanced'}`}>
              <div className="step-label">Difference</div>
              <div className="step-value">{formatCurrency(reconciliation.difference)}</div>
            </div>
          </div>

          {/* Status Explanation */}
          <div className="status-explanation">
            <h4>Status Explanation</h4>
            <div className={`explanation-box ${reconciliation.status.toLowerCase()}`}>
              <div className="explanation-icon">
                {reconciliation.status === 'MATCHED' ? '🎉' : '⚠️'}
              </div>
              <div className="explanation-content">
                <p>
                  {reconciliation.status === 'MATCHED'
                    ? `Perfect match! The net amount (${formatCurrency(reconciliation.totalCredit - reconciliation.totalDebit)}) exactly matches the bank balance (${formatCurrency(reconciliation.bankBalance)}).`
                    : `There is a discrepancy of ${formatCurrency(Math.abs((reconciliation.totalCredit - reconciliation.totalDebit) - reconciliation.bankBalance))} between the net amount (${formatCurrency(reconciliation.totalCredit - reconciliation.totalDebit)}) and bank balance (${formatCurrency(reconciliation.bankBalance)}).`
                  }
                </p>
                {reconciliation.status !== 'MATCHED' && (
                  <div className="recommendations">
                    <h5>Recommended Actions:</h5>
                    <ul>
                      <li>Check for outstanding checks or deposits</li>
                      <li>Verify bank fees or interest not recorded in the system</li>
                      <li>Review transaction dates and amounts</li>
                      <li>Contact your bank for any unrecorded transactions</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="metadata-section">
          <h4>Reconciliation Information</h4>
          <div className="metadata-grid">
            <div className="metadata-item">
              <span className="metadata-label">Reconciliation ID:</span>
              <span className="metadata-value">#{reconciliation.id}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Created:</span>
              <span className="metadata-value">{formatDateTime(reconciliation.createdAt)}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Status:</span>
              <span className={`metadata-value status-${reconciliation.status.toLowerCase()}`}>
                {reconciliation.status}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="actions-section">
          <button onClick={() => navigate('/bank-reconciliation')} className="primary-btn">
            Run Another Reconciliation
          </button>
          <button onClick={() => navigate('/dashboard')} className="secondary-btn">
            Back to Dashboard
          </button>
        </div>
      </div>

      <style jsx>{`
        .reconciliation-details-page {
          padding: 20px;
          background-color: #f8fafc;
          min-height: 100vh;
        }

        .page-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .page-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 30px;
          color: white;
          margin-bottom: 30px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .header-icon svg {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          padding: 12px;
        }

        .header-text h1 {
          margin: 0 0 5px 0;
          font-size: 2rem;
          font-weight: 700;
        }

        .header-text p {
          margin: 0;
          opacity: 0.9;
          font-size: 1rem;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .primary-btn, .secondary-btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .primary-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        .secondary-btn {
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
        }

        .secondary-btn:hover {
          background: #667eea;
          color: white;
          transform: translateY(-2px);
        }

        .status-banner {
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 30px;
          display: flex;
          align-items: center;
          gap: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .status-banner.reconciled {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .status-banner.not-reconciled {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }

        .status-icon {
          font-size: 2.5rem;
        }

        .status-content h2 {
          margin: 0 0 8px 0;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .status-content p {
          margin: 0;
          font-size: 1.1rem;
          opacity: 0.9;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .summary-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .card-icon {
          font-size: 2rem;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border-radius: 8px;
        }

        .card-content h3 {
          margin: 0 0 4px 0;
          font-size: 0.9rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .card-content .balance-amount {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .card-content .period-dates {
          font-size: 1.1rem;
          font-weight: 600;
          color: #374151;
          margin: 0;
        }

        .breakdown-section {
          background: white;
          border-radius: 12px;
          padding: 30px;
          margin-bottom: 30px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .breakdown-section h3 {
          margin: 0 0 24px 0;
          color: #1f2937;
          font-size: 1.25rem;
        }

        .calculation-steps {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 30px;
          padding: 24px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .calculation-step {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }

        .calculation-step.total {
          border-top: 2px solid #e5e7eb;
          padding-top: 16px;
          margin-top: 8px;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .calculation-step.balanced .step-value {
          color: #059669;
        }

        .calculation-step.unbalanced .step-value {
          color: #dc2626;
        }

        .step-label {
          font-weight: 500;
          color: #374151;
        }

        .step-value {
          font-weight: 600;
          color: #1f2937;
        }

        .step-value.credit-amount {
          color: #059669;
        }

        .step-value.debit-amount {
          color: #dc2626;
        }

        .calculation-separator {
          text-align: center;
          font-size: 1.2rem;
          font-weight: 700;
          color: #6b7280;
          margin: 8px 0;
        }

        .status-explanation {
          margin-top: 30px;
        }

        .status-explanation h4 {
          margin: 0 0 16px 0;
          color: #1f2937;
          font-size: 1.1rem;
        }

        .explanation-box {
          padding: 20px;
          border-radius: 8px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .explanation-box.reconciled {
          background: #d1fae5;
          border: 1px solid #a7f3d0;
        }

        .explanation-box.not-reconciled {
          background: #fef3c7;
          border: 1px solid #fde68a;
        }

        .explanation-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .explanation-content p {
          margin: 0 0 16px 0;
          color: #374151;
          line-height: 1.6;
        }

        .recommendations h5 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 0.95rem;
          font-weight: 600;
        }

        .recommendations ul {
          margin: 0;
          padding-left: 20px;
        }

        .recommendations li {
          color: #4b5563;
          margin-bottom: 4px;
          font-size: 0.9rem;
        }

        .metadata-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 30px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .metadata-section h4 {
          margin: 0 0 16px 0;
          color: #1f2937;
          font-size: 1.1rem;
        }

        .metadata-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .metadata-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: #f9fafb;
          border-radius: 6px;
        }

        .metadata-label {
          font-weight: 500;
          color: #6b7280;
        }

        .metadata-value {
          font-weight: 600;
          color: #1f2937;
        }

        .metadata-value.status-matched {
          color: #059669;
        }

        .metadata-value.status-unmatched {
          color: #dc2626;
        }

        .actions-section {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .loading-container, .error-container, .not-found-container {
          text-align: center;
          background: white;
          padding: 60px 40px;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        .error-icon, .not-found-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .error-actions, .error-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 24px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }

          .metadata-grid {
            grid-template-columns: 1fr;
          }

          .page-header {
            flex-direction: column;
            gap: 20px;
            text-align: center;
          }

          .status-banner {
            flex-direction: column;
            text-align: center;
            gap: 16px;
          }

          .calculation-steps {
            padding: 16px;
          }

          .actions-section {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default ReconciliationDetails;
