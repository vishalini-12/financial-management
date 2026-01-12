import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import './ReconciliationReports.css';

const ReconciliationReports = () => {
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchReconciliations();
  }, []);

  const fetchReconciliations = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/reconciliation`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReconciliations(response.data || []);
    } catch (err) {
      console.error('Error fetching reconciliations:', err);
      setError('Failed to load reconciliation reports. Please try again.');
      setReconciliations([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search reports
  const filteredReconciliations = useMemo(() => {
    return reconciliations.filter(rec => {
      const matchesSearch = !searchTerm ||
        rec.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.bankName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || rec.status === statusFilter;

      const matchesDateRange = (!fromDate || new Date(rec.createdAt) >= new Date(fromDate)) &&
                              (!toDate || new Date(rec.createdAt) <= new Date(toDate + 'T23:59:59'));

      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }, [reconciliations, searchTerm, statusFilter, fromDate, toDate]);

  // Pagination
  const totalPages = Math.ceil(filteredReconciliations.length / itemsPerPage);
  const paginatedReconciliations = filteredReconciliations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats calculations
  const stats = useMemo(() => {
    const totalReports = reconciliations.length;
    const matchedReports = reconciliations.filter(rec => rec.status === 'MATCHED').length;
    const unmatchedReports = reconciliations.filter(rec => rec.status === 'UNMATCHED').length;
    const totalDifference = reconciliations.reduce((sum, rec) => sum + Math.abs(rec.difference || 0), 0);

    return { totalReports, matchedReports, unmatchedReports, totalDifference };
  }, [reconciliations]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Format date and time
  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'MATCHED':
        return 'status-matched';
      case 'UNMATCHED':
        return 'status-unmatched';
      default:
        return 'status-default';
    }
  };

  // Export filtered reports as CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Client Name', 'Bank Name', 'From Date', 'To Date', 'System Balance', 'Bank Balance', 'Difference', 'Status', 'Created At'];
    const csvData = filteredReconciliations.map(rec => [
      rec.id,
      rec.clientName,
      rec.bankName,
      rec.fromDate,
      rec.toDate,
      formatCurrency(rec.systemBalance),
      formatCurrency(rec.bankBalance),
      formatCurrency(rec.difference),
      rec.status,
      formatDateTime(rec.createdAt)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell || ''}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reconciliation_reports_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="reconciliation-loading">
        <div className="loading-spinner"></div>
        <p>Loading reconciliation reports...</p>
      </div>
    );
  }

  return (
    <div className="reconciliation-reports">
      {/* Header */}
      <div className="reports-header">
        <h2>📊 Reconciliation Reports</h2>
        <div className="header-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by client or bank name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          <button onClick={exportToCSV} className="export-btn">
            📊 Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="reports-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-filter"
            >
              <option value="ALL">All Status</option>
              <option value="MATCHED">Matched</option>
              <option value="UNMATCHED">Unmatched</option>
            </select>
          </div>

          <div className="filter-group">
            <label>From Date:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="date-input"
            />
          </div>

          <div className="filter-group">
            <label>To Date:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="date-input"
            />
          </div>

          <div className="filter-group">
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="reports-stats">
        <div className="stat-card total-reports">
          <div className="stat-icon">📋</div>
          <h3>Total Reports</h3>
          <p className="stat-number">{stats.totalReports}</p>
        </div>
        <div className="stat-card matched-reports">
          <div className="stat-icon">✅</div>
          <h3>Matched</h3>
          <p className="stat-number">{stats.matchedReports}</p>
        </div>
        <div className="stat-card unmatched-reports">
          <div className="stat-icon">❌</div>
          <h3>Unmatched</h3>
          <p className="stat-number">{stats.unmatchedReports}</p>
        </div>
        <div className="stat-card total-difference">
          <div className="stat-icon">💰</div>
          <h3>Total Difference</h3>
          <p className="stat-number">{formatCurrency(stats.totalDifference)}</p>
        </div>
      </div>

      {/* Reconciliation Reports Table */}
      <div className="reports-table-container">
        {error ? (
          <div className="error-state">
            <span className="error-icon">⚠️</span>
            <h3>Error Loading Reports</h3>
            <p>{error}</p>
            <button onClick={fetchReconciliations} className="retry-btn">
              Try Again
            </button>
          </div>
        ) : filteredReconciliations.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📊</span>
            <h3>No Reconciliation Reports Found</h3>
            <p>{searchTerm || statusFilter !== 'ALL' || fromDate || toDate ?
                'Try adjusting your filters to see more results.' :
                'No reconciliation reports have been generated yet.'}</p>
          </div>
        ) : (
          <>
            <table className="reports-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Client Name</th>
                  <th>Bank Name</th>
                  <th>Date Range</th>
                  <th>System Balance</th>
                  <th>Bank Balance</th>
                  <th>Difference</th>
                  <th>Status</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReconciliations.map(rec => (
                  <tr key={rec.id}>
                    <td>{rec.id}</td>
                    <td className="client-cell">{rec.clientName}</td>
                    <td className="bank-cell">{rec.bankName}</td>
                    <td className="date-range-cell">
                      {rec.fromDate} to {rec.toDate}
                    </td>
                    <td className="amount-cell">{formatCurrency(rec.systemBalance)}</td>
                    <td className="amount-cell">{formatCurrency(rec.bankBalance)}</td>
                    <td className={`difference-cell ${Math.abs(rec.difference || 0) > 0.01 ? 'has-difference' : ''}`}>
                      {formatCurrency(rec.difference)}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(rec.status)}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td>{formatDateTime(rec.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination-container">
              <div className="pagination-info">
                <span>
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredReconciliations.length)} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredReconciliations.length)} of {filteredReconciliations.length} entries
                </span>
              </div>

              <div className="pagination-controls">
                <div className="items-per-page">
                  <label>Show:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="items-select"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="page-navigation">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="page-btn"
                  >
                    Previous
                  </button>

                  <span className="page-info">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="page-btn"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReconciliationReports;
