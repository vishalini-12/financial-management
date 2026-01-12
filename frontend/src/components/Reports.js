import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Reports = ({ user }) => {
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    clientName: '',
    bankName: '',
    openingBalance: '75000', // Default opening balance
    bankBalance: '107000'    // Default bank balance
  });
  const [reconciliationResult, setReconciliationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
  const [availableClients, setAvailableClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Fixed list of banks as per requirements
  const availableBanks = [
    'State Bank of India (SBI)',
    'HDFC Bank',
    'ICICI Bank',
    'Axis Bank',
    'Canara Bank',
    'Indian Bank'
  ];

  // Load available clients on component mount
  useEffect(() => {
    fetchAvailableClients();
  }, []);

  // Check if user has permission (ADMIN or ACCOUNTANT only)
  if (!user || user.role === 'USER') {
    return (
      <div className="unauthorized-page">
        <div className="unauthorized-container">
          <div className="unauthorized-icon">🚫</div>
          <h1>Access Denied</h1>
          <p>You don't have permission to access Reports.</p>
          <p>This feature is only available for Accountants and Administrators.</p>
        </div>
      </div>
    );
  }

  const fetchAvailableClients = async () => {
    try {
      setLoadingClients(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/transactions/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setAvailableClients([]);
    } finally {
      setLoadingClients(false);
    }
  };



  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateFilters = () => {
    if (!filters.fromDate || !filters.toDate) {
      setError('From Date and To Date are required');
      return false;
    }

    // Validate date range
    const fromDate = new Date(filters.fromDate);
    const toDate = new Date(filters.toDate);

    if (fromDate > toDate) {
      setError('From Date cannot be later than To Date');
      return false;
    }

    // Validate bank selection
    if (!filters.bankName || filters.bankName.trim() === '') {
      setError('Please select a bank');
      return false;
    }

    return true;
  };

  const applyFilters = async () => {
    if (!validateFilters()) {
      return;
    }

    setError('');
    setLoading(true);
    setHasAppliedFilters(true);
    setReconciliationResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/transactions/reconciliation`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          client: filters.clientName || undefined,
          bank: filters.bankName,
          openingBalance: parseFloat(filters.openingBalance),
          bankBalance: parseFloat(filters.bankBalance)
        }
      });

      setReconciliationResult(response.data);
    } catch (err) {
      console.error('Error calculating reconciliation:', err);
      setError(err.response?.data?.message || 'Failed to calculate reconciliation');
      setHasAppliedFilters(false);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      fromDate: '',
      toDate: '',
      clientName: '',
      bankName: '',
      openingBalance: '75000',
      bankBalance: '107000'
    });
    setReconciliationResult(null);
    setHasAppliedFilters(false);
    setError('');
  };

  const downloadReport = async (format) => {
    if (!reconciliationResult) {
      setError('No reconciliation data available for export');
      return;
    }

    try {
      // Build query parameters for the export API - use the SAME values as the reconciliation calculation
      const params = new URLSearchParams();
      params.append('fromDate', filters.fromDate);
      params.append('toDate', filters.toDate);
      if (filters.clientName) params.append('client', filters.clientName);
      if (filters.bankName) params.append('bank', filters.bankName);
      params.append('openingBalance', filters.openingBalance);
      params.append('bankBalance', filters.bankBalance);

      const token = localStorage.getItem('token');

      // Determine the export endpoint based on format
      let url;
      let filename;
      switch (format) {
        case 'pdf':
          url = `${process.env.REACT_APP_API_BASE_URL}/api/transactions/reconciliation/export/pdf?${params.toString()}`;
          filename = `reconciliation_${filters.clientName || 'all_clients'}_${new Date().getTime()}.pdf`;
          break;
        case 'excel':
          url = `${process.env.REACT_APP_API_BASE_URL}/api/transactions/reconciliation/export/excel?${params.toString()}`;
          filename = `reconciliation_${filters.clientName || 'all_clients'}_${new Date().getTime()}.xls`;
          break;
        case 'csv':
        default:
          url = `${process.env.REACT_APP_API_BASE_URL}/api/transactions/reconciliation/export/csv?${params.toString()}`;
          filename = `reconciliation_${filters.clientName || 'all_clients'}_${new Date().getTime()}.csv`;
          break;
      }

      // Use fetch to download the file with proper authorization
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': format === 'pdf' ? 'application/pdf' :
                   format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv'
        }
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      // Convert response to blob and trigger download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error('Error downloading report:', error);
      setError('Failed to download report. Please try again.');
    }
  };

  // No longer need section determination logic - simplified UI

  return (
    <div className="reports-page">
      <div className="container">
        {/* Header */}
        <div className="header">
          <h1>Reconciliation Reports</h1>
          <p>Download filtered reconciliation reports</p>
        </div>

        {/* Filters */}
        <div className="filters-card">
          <h3>Report Filters</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label>From Date *</label>
              <input
                type="date"
                name="fromDate"
                value={filters.fromDate}
                onChange={handleFilterChange}
                required
              />
            </div>
            <div className="filter-group">
              <label>To Date *</label>
              <input
                type="date"
                name="toDate"
                value={filters.toDate}
                onChange={handleFilterChange}
                required
              />
            </div>
            <div className="filter-group">
              <label>Client Name</label>
              <select
                name="clientName"
                value={filters.clientName}
                onChange={handleFilterChange}
              >
                <option value="">All Clients (Optional)</option>
                {availableClients.map(client => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Bank Name *</label>
              <select
                name="bankName"
                value={filters.bankName}
                onChange={handleFilterChange}
                className="bank-dropdown"
              >
                <option value="" disabled>Select a bank</option>
                {availableBanks.map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="filter-actions">
            <button onClick={applyFilters} className="btn-primary" disabled={loading}>
              Apply Filters
            </button>
            <button onClick={clearFilters} className="btn-secondary">
              Clear Filters
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-card">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <div className="error-actions">
              <button onClick={applyFilters} className="btn-retry">Retry</button>
              <button onClick={clearFilters} className="btn-clear">Clear Filters</button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading reports...</p>
          </div>
        )}

        {/* Simple Count and Download Section - Only show after filters applied */}
        {hasAppliedFilters && !loading && reconciliationResult && (
          <>
            {/* Count Message */}
            <div className="count-message">
              1 reconciliation record available
            </div>

            {/* Download Buttons */}
            <div className="download-buttons-section">
              <button onClick={() => downloadReport('pdf')} className="btn-download pdf">
                PDF
              </button>
              <button onClick={() => downloadReport('csv')} className="btn-download csv">
                CSV
              </button>
              <button onClick={() => downloadReport('excel')} className="btn-download excel">
                Excel
              </button>
            </div>
          </>
        )}

        {/* No Data Message - Show when no reconciliation result exists */}
        {!reconciliationResult && hasAppliedFilters && !loading && (
          <div className="count-message">
            0 reconciliation records available
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          <div className="footer-info">
            <span>Report generated on {new Date().toLocaleString()}</span>
            <span>by {user?.username || 'Unknown'}</span>
            <span>{reconciliationResult ? '1 reconciliation result' : 'No results'}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .reports-page {
          padding: 24px 20px;
          background: #f8fafc;
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          margin-bottom: 32px;
        }

        .header h1 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 32px;
          font-weight: 700;
        }

        .header p {
          margin: 0;
          color: #6b7280;
          font-size: 16px;
        }

        .filters-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          margin-bottom: 24px;
        }

        .filters-card h3 {
          margin: 0 0 20px 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 600;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
        }

        .filter-group label {
          margin-bottom: 6px;
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }

        .filter-group input,
        .filter-group select {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .filter-group input:focus,
        .filter-group select:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .filter-group select {
          cursor: pointer;
        }

        .bank-dropdown {
          border-radius: 8px;
          border: 2px solid #e5e7eb;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .bank-dropdown:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .bank-dropdown:hover {
          border-color: #9ca3af;
        }

        .filter-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .btn-primary {
          background: #6366f1;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-primary:hover {
          background: #5850ec;
        }

        .btn-primary:disabled {
          background: #d1d5db;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: white;
          color: #6366f1;
          border: 1px solid #6366f1;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #6366f1;
          color: white;
        }

        .error-card {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .error-icon {
          color: #dc2626;
          font-size: 18px;
        }

        .error-actions {
          display: flex;
          gap: 8px;
        }

        .btn-retry {
          background: #dc2626;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
        }

        .btn-clear {
          background: #6b7280;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
        }

        .loading-state {
          text-align: center;
          background: white;
          padding: 48px 24px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          margin-bottom: 24px;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        .report-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          margin-bottom: 24px;
          overflow: hidden;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .section-icon {
          font-size: 20px;
        }

        .section-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .section-header p {
          margin: 4px 0 0 0;
          font-size: 14px;
          color: #6b7280;
        }

        .matched .section-title {
          background: linear-gradient(90deg, #f0fdf4 0%, #dcfce7 100%);
        }

        .unmatched .section-title {
          background: linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%);
        }

        .empty-state {
          text-align: center;
          padding: 48px 24px;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .download-section {
          padding: 24px;
        }

        .download-section p {
          margin: 0 0 16px 0;
          color: #6b7280;
          font-size: 14px;
        }

        .download-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .btn-download {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .btn-download.pdf {
          background: #dc2626;
          color: white;
        }

        .btn-download.csv {
          background: #059669;
          color: white;
        }

        .btn-download.excel {
          background: #f59e0b;
          color: white;
        }

        .btn-download:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .warning-notice {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 6px;
          margin-bottom: 16px;
        }

        .warning-notice .warning-icon {
          color: #d97706;
        }

        .warning-notice span {
          font-size: 14px;
          color: #92400e;
          font-weight: 500;
        }

        .count-message {
          font-size: 16px;
          color: #374151;
          text-align: center;
          margin-bottom: 10px;
          font-weight: 400;
        }

        .download-buttons-section {
          display: flex;
          gap: 12px;
          justify-content: center;
          align-items: center;
          margin-bottom: 24px;
        }

        .no-data-message {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          margin-bottom: 24px;
        }

        .no-data-message .empty-state {
          padding: 64px 24px;
        }

        .no-data-message .empty-state h3 {
          margin: 16px 0 8px 0;
          color: #1f2937;
          font-size: 20px;
          font-weight: 600;
        }

        .no-data-message .empty-state p {
          margin: 4px 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
        }

        .footer {
          background: white;
          padding: 16px 24px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          text-align: center;
        }

        .footer-info {
          font-size: 14px;
          color: #6b7280;
          display: flex;
          justify-content: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .unauthorized-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #f8fafc;
        }

        .unauthorized-container {
          text-align: center;
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          max-width: 400px;
        }

        .unauthorized-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .unauthorized-container h1 {
          margin: 0 0 8px 0;
          color: #1f2937;
        }

        .unauthorized-container p {
          margin: 0 0 20px 0;
          color: #6b7280;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .reports-page {
            padding: 16px;
          }

          .header h1 {
            font-size: 24px;
          }

          .filters-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            padding: 16px 20px;
          }

          .download-buttons,
          .download-buttons-section {
            flex-direction: column;
          }

          .footer-info {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default Reports;
