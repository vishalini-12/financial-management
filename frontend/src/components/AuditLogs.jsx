import React, { useEffect, useState, useMemo } from 'react';
import api, { API_ENDPOINTS } from '../utils/api';
import './AuditLogs.css';

const AuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      // 🔍 DEBUG: Log API call
      console.log('🔍 AUDIT LOGS - Fetching audit logs from:', API_ENDPOINTS.AUDIT_LOGS);

      const response = await api.get(API_ENDPOINTS.AUDIT_LOGS);
      setAuditLogs(response.data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to load audit logs. Please try again.');
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = !searchTerm ||
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.module?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

      const matchesDateRange = (!fromDate || new Date(log.timestamp) >= new Date(fromDate)) &&
                              (!toDate || new Date(log.timestamp) <= new Date(toDate + 'T23:59:59'));

      return matchesSearch && matchesAction && matchesDateRange;
    });
  }, [auditLogs, searchTerm, actionFilter, fromDate, toDate]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats calculations
  const stats = useMemo(() => {
    const totalLogs = auditLogs.length;
    const todayLogs = auditLogs.filter(log => {
      const today = new Date().toDateString();
      return new Date(log.timestamp).toDateString() === today;
    }).length;
    const successfulActions = auditLogs.filter(log => log.status === 'SUCCESS').length;
    const failedActions = auditLogs.filter(log => log.status === 'FAILED').length;

    return { totalLogs, todayLogs, successfulActions, failedActions };
  }, [auditLogs]);

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
      case 'SUCCESS':
        return 'status-success';
      case 'FAILED':
        return 'status-failed';
      default:
        return 'status-default';
    }
  };

  // Export filtered logs as CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Date & Time', 'Action', 'Module', 'Description', 'Status'];
    const csvData = filteredLogs.map(log => [
      log.id,
      formatDateTime(log.timestamp),
      log.action,
      log.module,
      log.description,
      log.status
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell || ''}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setActionFilter('ALL');
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="audit-loading">
        <div className="loading-spinner"></div>
        <p>Loading audit logs...</p>
      </div>
    );
  }

  return (
    <div className="audit-logs">
      {/* Header */}
      <div className="audit-header">
        <h2>System Audit Logs</h2>
        <div className="header-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by action, module, or description..."
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
      <div className="audit-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Action:</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="action-filter"
            >
              <option value="ALL">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="ADD_TRANSACTION">Add Transaction</option>
              <option value="CSV_UPLOAD">CSV Upload</option>
              <option value="PDF_UPLOAD">PDF Upload</option>
              <option value="RECONCILIATION">Reconciliation</option>
              <option value="EXPORT_REPORT">Export Report</option>
              <option value="VIEW_DASHBOARD">View Dashboard</option>
              <option value="FAILED_LOGIN">Failed Login</option>
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
      <div className="audit-stats">
        <div className="stat-card total-logs">
          <div className="stat-icon">📋</div>
          <h3>Total Logs</h3>
          <p className="stat-number">{stats.totalLogs}</p>
        </div>
        <div className="stat-card today-activities">
          <div className="stat-icon">📅</div>
          <h3>Today Activities</h3>
          <p className="stat-number">{stats.todayLogs}</p>
        </div>
        <div className="stat-card successful-actions">
          <div className="stat-icon">✅</div>
          <h3>Successful Actions</h3>
          <p className="stat-number">{stats.successfulActions}</p>
        </div>
        <div className="stat-card failed-actions">
          <div className="stat-icon">🚫</div>
          <h3>Failed Actions</h3>
          <p className="stat-number">{stats.failedActions}</p>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="audit-table-container">
        {error ? (
          <div className="error-state">
            <span className="error-icon">⚠️</span>
            <h3>Error Loading Audit Logs</h3>
            <p>{error}</p>
            <button onClick={fetchAuditLogs} className="retry-btn">
              Try Again
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <h3>No Audit Logs Found</h3>
            <p>{searchTerm || actionFilter !== 'ALL' || fromDate || toDate ?
                'Try adjusting your filters to see more results.' :
                'No audit logs have been recorded yet.'}</p>
          </div>
        ) : (
          <>
            <table className="audit-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date & Time</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map(log => (
                  <tr key={log.id}>
                    <td>{log.id}</td>
                    <td>{formatDateTime(log.timestamp)}</td>
                    <td>
                      <span className={`action-badge action-${log.action?.toLowerCase().replace('_', '-')}`}>
                        {log.action?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{log.module}</td>
                    <td className="description-cell">{log.description}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination-container">
              <div className="pagination-info">
                <span>
                  Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredLogs.length)} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
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

export default AuditLogs;
