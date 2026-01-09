import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Dashboard = ({ user }) => {
  // Initialize with cached values for immediate display
  const getCachedSummary = () => {
    try {
      const cached = localStorage.getItem('dashboardSummary');
      return cached ? JSON.parse(cached) : null; // Return null if no cache
    } catch {
      return null;
    }
  };

  // Initialize with null - NEVER show fake $0.00 values
  const [summary, setSummary] = useState(null);
  const [transactionCounts, setTransactionCounts] = useState({ creditCount: 0, debitCount: 0 });
  const [transactions, setTransactions] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [dataUnavailable, setDataUnavailable] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [clientFilter, setClientFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Force refresh function for testing
  const forceRefresh = async () => {
    console.log('=== FORCE REFRESH TRIGGERED ===');
    await fetchDashboardData();
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      console.log('Fetching dashboard summary...');
      let newSummary = null;

      try {
        const summaryResponse = await axios.get('http://localhost:8080/api/transactions/dashboard/summary', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Dashboard summary response:', summaryResponse.data);

        const summaryData = summaryResponse.data || {};
        newSummary = {
          totalCredit: parseFloat(summaryData.totalCredit) || 0,
          totalDebit: parseFloat(summaryData.totalDebit) || 0,
          balance: parseFloat(summaryData.balance) || 0,
          pendingAmount: parseFloat(summaryData.pendingAmount) || 0,
          pendingCount: parseInt(summaryData.pendingCount) || 0
        };
        console.log('Setting summary data:', newSummary);
      } catch (summaryError) {
        console.error('Dashboard summary API call failed:', summaryError);
        console.error('Error details:', summaryError.response?.data || summaryError.message);
        // Continue with null summary - dashboard will show 0 values
        newSummary = null;
      }

      setSummary(newSummary);

      // Cache the summary data for immediate display on next load
      try {
        localStorage.setItem('dashboardSummary', JSON.stringify(newSummary));
      } catch (error) {
        console.warn('Failed to cache dashboard summary:', error);
      }

      // Fetch ALL transactions from transactions table ONLY
      const allTransactionsResponse = await axios.get('http://localhost:8080/api/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allTransactions = allTransactionsResponse.data || [];
      setTransactions(allTransactions);

      // Calculate transaction counts
      const completedTransactions = allTransactions.filter(t => (t.status || 'COMPLETED') === 'COMPLETED');
      const creditCount = completedTransactions.filter(t => t.type === 'CREDIT').length;
      const debitCount = completedTransactions.filter(t => t.type === 'DEBIT').length;
      setTransactionCounts({ creditCount, debitCount });

      // Process chart data from transactions - ONLY COMPLETED transactions
      processChartData(allTransactions);

    } catch (err) {
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
      setChartsLoaded(true);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh when navigating back to dashboard (detects transaction additions)
  useEffect(() => {
    const shouldRefresh = location.state?.refresh || location.state?.transactionAdded;
    if (shouldRefresh) {
      console.log('Detected navigation with refresh flag, updating dashboard data...');
      fetchDashboardData();
      // Clear the state to prevent infinite refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Monitor summary state changes
  useEffect(() => {
    console.log('Summary state changed:', summary);
  }, [summary]);

  // Process chart data from transactions table
  const processChartData = (transactionsData) => {
    try {
      // Filter only COMPLETED transactions
      const completedTransactions = transactionsData.filter(t => (t.status || 'COMPLETED') === 'COMPLETED');

      // Process Monthly Credit vs Debit data
      const monthlyMap = new Map();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      completedTransactions.forEach(t => {
        const date = new Date(t.date);
        const year = date.getFullYear();
        const month = date.getMonth();
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        const monthLabel = `${monthNames[month]} ${year}`;

        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { month: monthLabel, year: year, monthNum: month, credit: 0, debit: 0 });
        }

        const amount = parseFloat(t.amount) || 0;
        if (t.type === 'CREDIT') {
          monthlyMap.get(monthKey).credit += amount;
        } else if (t.type === 'DEBIT') {
          monthlyMap.get(monthKey).debit += amount;
        }
      });

      // Sort chronologically by year-month and get all months (not limited to 12)
      const monthlyArray = Array.from(monthlyMap.entries())
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, data]) => ({
          month: data.month,
          credit: data.credit,
          debit: data.debit
        }));

      setMonthlyData(monthlyArray);

      // Process Category Expense data (only DEBIT transactions)
      const categoryMap = new Map();
      completedTransactions
        .filter(t => t.type === 'DEBIT')
        .forEach(t => {
          const category = t.category || 'Miscellaneous';
          const amount = parseFloat(t.amount) || 0;

          if (categoryMap.has(category)) {
            categoryMap.set(category, categoryMap.get(category) + amount);
          } else {
            categoryMap.set(category, amount);
          }
        });

      const categoryArray = Array.from(categoryMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8); // Top 8 categories

      setCategoryData(categoryArray);

    } catch (error) {
      console.error('Error processing chart data:', error);
      setMonthlyData([]);
      setCategoryData([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const handleMouseEnter = (event, text) => {
    const rect = event.target.getBoundingClientRect();
    setTooltip({
      visible: true,
      text: text,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, text: '', x: 0, y: 0 });
  };

  // Generate reports for USER role
  const generateReport = async (format) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/transactions/user/reports?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: format === 'PDF' ? 'blob' : 'text'
      });

      if (format === 'PDF') {
        // Create blob and download PDF
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `financial_report_${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else if (format === 'CSV') {
        // Download CSV
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `financial_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  const getMenuItems = () => {
    const role = user?.role;
    const baseItems = [
      { label: 'Dashboard', path: '/dashboard', icon: '📊' }
    ];

    if (role === 'ADMIN') {
      return [
        ...baseItems,
        { label: 'Users Management', path: '/admin', icon: '👥' },
        { label: 'Transactions', path: '/transactions', icon: '💰' },
        { label: 'Bank Reconciliation', path: '/bank-reconciliation', icon: '🏦' },
        { label: 'Reports', path: '/reports', icon: '📈' },
        { label: 'Audit Logs', path: '/audit', icon: '📝' }
      ];
    } else if (role === 'ACCOUNTANT') {
      return [
        ...baseItems,
        { label: 'Add Transaction', path: '/add-transaction', icon: '➕' },
        { label: 'View Transactions', path: '/transactions', icon: '💰' },
        { label: 'Bank Reconciliation', path: '/bank-reconciliation', icon: '🏦' },
        { label: 'Reports', path: '/reports', icon: '📈' }
      ];
    }

    return baseItems;
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1>Financial Ledger Dashboard</h1>
        <div className="header-actions">
          <div className="user-info">
            <span className="user-icon">👤</span>
            <span>Welcome, {user?.username || 'User'} ({user?.role})</span>
          </div>
          <button onClick={forceRefresh} className="refresh-btn" title="Refresh Data">
            🔄
          </button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
            {getMenuItems().map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="icon">{item.icon}</span>
                <span className="label">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-icon">📉</div>
              <h3>TOTAL DEBIT</h3>
              {loading ? (
                <div className="card-loading">
                  <div className="loading-spinner-small"></div>
                </div>
              ) : summary ? (
                <p className="amount debit-amount">${(summary.totalDebit || 0).toFixed(2)}</p>
              ) : (
                <p className="data-unavailable">Data unavailable</p>
              )}
            </div>
            <div className="summary-card">
              <div className="card-icon">📈</div>
              <h3>TOTAL CREDIT</h3>
              {loading ? (
                <div className="card-loading">
                  <div className="loading-spinner-small"></div>
                </div>
              ) : summary ? (
                <p className="amount credit-amount">${(summary.totalCredit || 0).toFixed(2)}</p>
              ) : (
                <p className="data-unavailable">Data unavailable</p>
              )}
            </div>
            <div className="summary-card">
              <div className="card-icon">⚖️</div>
              <h3>NET BALANCE</h3>
              {loading ? (
                <div className="card-loading">
                  <div className="loading-spinner-small"></div>
                </div>
              ) : summary ? (
                <p className="amount profit-amount">${(summary.balance || 0).toFixed(2)}</p>
              ) : (
                <p className="data-unavailable">Data unavailable</p>
              )}
            </div>
            <div className="summary-card count-card">
              <div className="card-icon">📊</div>
              <h3>DEBIT COUNT</h3>
              {loading ? (
                <div className="card-loading">
                  <div className="loading-spinner-small"></div>
                </div>
              ) : (
                <p className="amount count-amount">{transactionCounts.debitCount}</p>
              )}
            </div>
            <div className="summary-card count-card">
              <div className="card-icon">💳</div>
              <h3>CREDIT COUNT</h3>
              {loading ? (
                <div className="card-loading">
                  <div className="loading-spinner-small"></div>
                </div>
              ) : (
                <p className="amount count-amount">{transactionCounts.creditCount}</p>
              )}
            </div>
          </div>



          {/* Global Empty State Card */}
          {!loading && transactions.length === 0 && (
            <div className="global-empty-state-card">
              <div className="card-header">
                <h3>📊 Dashboard Overview</h3>
              </div>
              <div className="card-divider"></div>
              <div className="empty-state-content">
                <span className="empty-icon">💡</span>
                <h4>No Transactions Recorded Yet</h4>
                <p>Start by adding your first transaction to see dashboard analytics and insights.</p>
              </div>
            </div>
          )}

          {/* Monthly Chart */}
          <div className="compact-chart-section">
            <div className="compact-chart-card">
              <div className="chart-header">
                <h4>Monthly Credit vs Debit</h4>
                <p className="chart-subtitle">Month-wise financial summary</p>
              </div>

              {loading && !chartsLoaded ? (
                <div className="compact-chart-loading">
                  <div className="loading-spinner-small"></div>
                  <p>Loading data...</p>
                </div>
              ) : monthlyData.length > 0 ? (
                <div className="compact-bar-chart-container">
                  <svg className="compact-bar-chart" viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <linearGradient id="creditGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.9"/>
                        <stop offset="100%" stopColor="#059669" stopOpacity="0.7"/>
                      </linearGradient>
                      <linearGradient id="debitGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity="0.9"/>
                        <stop offset="100%" stopColor="#DC2626" stopOpacity="0.7"/>
                      </linearGradient>
                    </defs>

                    {/* Compact grid lines */}
                    {[0, 1, 2, 3, 4].map(i => (
                      <line
                        key={i}
                        x1="30"
                        y1={15 + i * 18}
                        x2="290"
                        y2={15 + i * 18}
                        stroke="#f3f4f6"
                        strokeWidth="1"
                        opacity="0.3"
                      />
                    ))}

                    {/* Compact Y-axis labels: 0, 5k, 10k, 15k, 20k */}
                    {(() => {
                      const maxValue = Math.max(...monthlyData.flatMap(d => [d.credit, d.debit]), 1);
                      // Calculate compact 5k intervals
                      const getCompactTickValue = (maxVal, tickIndex, totalTicks) => {
                        if (maxVal >= 100000) { // 100k+
                          return (totalTicks - tickIndex) * 25000; // 0, 25k, 50k, 75k, 100k
                        } else if (maxVal >= 50000) { // 50k+
                          return (totalTicks - tickIndex) * 12500; // 0, 12.5k, 25k, 37.5k, 50k
                        } else if (maxVal >= 25000) { // 25k+
                          return (totalTicks - tickIndex) * 6250; // 0, 6.25k, 12.5k, 18.75k, 25k
                        } else if (maxVal >= 10000) { // 10k+
                          return (totalTicks - tickIndex) * 2500; // 0, 2.5k, 5k, 7.5k, 10k
                        } else {
                          return (totalTicks - tickIndex) * (Math.ceil(maxVal / 4000) * 1000); // Round to nearest 1k
                        }
                      };

                      return [0, 1, 2, 3, 4].map(i => {
                        const value = getCompactTickValue(maxValue, i, 4);
                        const displayValue = value >= 1000 ? `${(value/1000).toFixed(0)}k` : value.toString();
                        return (
                          <text
                            key={i}
                            x="25"
                            y={20 + i * 18}
                            textAnchor="end"
                            fontSize="6"
                            fill="#9ca3af"
                            fontWeight="400"
                          >
                            {displayValue}
                          </text>
                        );
                      });
                    })()}

                    {/* Compact bars */}
                    {(() => {
                      const maxValue = Math.max(...monthlyData.flatMap(d => [d.credit, d.debit]), 1);
                      const chartWidth = 260; // Available width for bars
                      const barWidth = Math.max(18, Math.min(24, chartWidth / monthlyData.length)); // Thinner bars
                      const barSpacing = Math.max(1, barWidth * 0.08); // Minimal spacing
                      const singleBarWidth = (barWidth - barSpacing) / 2;
                      const maxBarHeight = 72; // Reduced height for chart area

                      return monthlyData.map((data, index) => {
                        const x = monthlyData.length === 1
                          ? 140 // Center for single month
                          : 30 + index * barWidth;

                        const creditHeight = maxValue > 0 ? (data.credit / maxValue) * maxBarHeight : 0;
                        const debitHeight = maxValue > 0 ? (data.debit / maxValue) * maxBarHeight : 0;

                        return (
                          <g key={index}>
                            {/* Credit bar */}
                            <rect
                              x={x}
                              y={87 - creditHeight}
                              width={singleBarWidth}
                              height={creditHeight}
                              fill="url(#creditGradient)"
                              rx="0.5"
                              className="bar-hover"
                              onMouseEnter={(e) => handleMouseEnter(e, `Credit: $${data.credit.toFixed(2)}`)}
                              onMouseLeave={handleMouseLeave}
                            />
                            {/* Debit bar */}
                            <rect
                              x={x + singleBarWidth + barSpacing}
                              y={87 - debitHeight}
                              width={singleBarWidth}
                              height={debitHeight}
                              fill="url(#debitGradient)"
                              rx="0.5"
                              className="bar-hover"
                              onMouseEnter={(e) => handleMouseEnter(e, `Debit: $${data.debit.toFixed(2)}`)}
                              onMouseLeave={handleMouseLeave}
                            />

                            {/* Month label */}
                            <text
                              x={x + barWidth / 2}
                              y="105"
                              textAnchor="middle"
                              fontSize="6"
                              fill="#6b7280"
                              fontWeight="500"
                            >
                              {data.month}
                            </text>
                          </g>
                        );
                      });
                    })()}
                  </svg>

                  {/* Compact Legend */}
                  <div className="compact-chart-legend">
                    <div className="compact-legend-item">
                      <div className="compact-legend-dot" style={{ backgroundColor: '#10B981' }}></div>
                      <span>Credit</span>
                    </div>
                    <div className="compact-legend-item">
                      <div className="compact-legend-dot" style={{ backgroundColor: '#EF4444' }}></div>
                      <span>Debit</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="compact-chart-empty-state">
                  <span className="empty-chart-icon">📊</span>
                  <p>No transaction data available</p>
                </div>
              )}
            </div>

            {/* Tooltip */}
            {tooltip.visible && (
              <div
                className="chart-tooltip"
                style={{
                  left: tooltip.x,
                  top: tooltip.y,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                {tooltip.text}
              </div>
            )}
          </div>

          {/* Category Pie Chart */}
          <div className="chart-section">
            <h3>Expense by Category</h3>
            <div className="chart-card">
              {loading && !chartsLoaded ? (
                <div className="chart-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading chart data...</p>
                </div>
              ) : categoryData.length > 0 ? (
                <div className="pie-chart-container">
                  <div className="simple-pie">
                    {categoryData.map((data, index) => (
                      <div key={index} className="pie-slice" style={{ backgroundColor: `hsl(${index * 45}, 70%, 50%)` }}>
                        <div className="pie-label">
                          <span className="category-name">{data.category}</span>
                          <span className="category-amount">${data.amount.toFixed(2)}</span>
                        </div>
                        <div className="pie-percentage">
                          {((data.amount / categoryData.reduce((sum, d) => sum + d.amount, 0)) * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pie-legend">
                    {categoryData.map((data, index) => (
                      <div key={index} className="legend-item">
                        <div className="legend-color-box" style={{ backgroundColor: `hsl(${index * 45}, 70%, 50%)` }}></div>
                        <span>{data.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="chart-empty-state">
                  <span className="empty-icon">📊</span>
                  <p>No data available for the selected period</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="recent-transactions-section">
            <h3>Recent Transactions</h3>
            {user?.role === 'ACCOUNTANT' && (
              <div className="dashboard-filters">
                <div className="filter-group">
                  <label>Client:</label>
                  <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
                    <option value="">All Clients</option>
                    {[...new Set(transactions.map(t => t.clientUsername).filter(Boolean))].map(client => (
                      <option key={client} value={client}>{client}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Date:</label>
                  <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                </div>
                <div className="filter-group">
                  <label>Type:</label>
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="">All Types</option>
                    <option value="CREDIT">Credit</option>
                    <option value="DEBIT">Debit</option>
                  </select>
                </div>
              </div>
            )}
            <div className="transactions-table-container">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Type</th>
                    {user?.role === 'ADMIN' && <th>Created By</th>}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let filtered = transactions;
                    if (user?.role === 'ACCOUNTANT') {
                      if (clientFilter) filtered = filtered.filter(t => t.clientUsername === clientFilter);
                      if (dateFilter) filtered = filtered.filter(t => t.date.startsWith(dateFilter));
                      if (typeFilter) filtered = filtered.filter(t => t.type === typeFilter);
                    }

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={user?.role === 'ADMIN' ? 8 : 7} style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            No transactions found.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map(t => {
                      const descText = t.description;
                      return (
                        <tr key={t.id}>
                          <td>TXN-{t.id}</td>
                          <td>{new Date(t.date).toLocaleDateString()}</td>
                          <td>{t.clientUsername || 'N/A'}</td>
                          <td className="description-cell">{descText}</td>
                          <td>{t.category || 'Miscellaneous'}</td>
                          <td className={`amount ${t.type.toLowerCase()}`}>
                            ${parseFloat(t.amount).toFixed(2)}
                          </td>
                          <td>
                            <span className={`type-badge ${t.type.toLowerCase()}`}>
                              {t.type}
                            </span>
                          </td>
                          {user?.role === 'ADMIN' && <td>{user.username}</td>}
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

<style jsx>{`
  /* Dashboard Styles */
  .dashboard-container {
    min-height: 100vh;
    background: #f8fafc;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .dashboard-header {
    background: white;
    padding: 20px 32px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }

  .dashboard-header h1 {
    margin: 0;
    color: #1f2937;
    font-size: 24px;
    font-weight: 700;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .user-icon {
    font-size: 18px;
    color: #6b7280;
  }

  .header-actions span {
    color: #6b7280;
    font-size: 14px;
  }

  .logout-btn {
    background: #dc2626;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .refresh-btn {
    background: #10b981;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .refresh-btn:hover {
    background: #059669;
    transform: translateY(-1px);
  }

  .logout-btn {
    background: #dc2626;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .logout-btn:hover {
    background: #b91c1c;
  }

  .dashboard-content {
    display: flex;
    min-height: calc(100vh - 80px);
  }

  .dashboard-sidebar {
    width: 240px;
    background: white;
    border-right: 1px solid #e5e7eb;
    padding: 24px 0;
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
  }

  .sidebar-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 24px;
    border: none;
    background: none;
    color: #6b7280;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
  }

  .sidebar-item:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .sidebar-item.active {
    background: #dbeafe;
    color: #2563eb;
    border-right: 3px solid #2563eb;
  }

  .sidebar-item .icon {
    font-size: 18px;
  }

  .dashboard-main {
    flex: 1;
    padding: 16px;
    max-width: calc(100vw - 240px);
    overflow-x: auto;
  }

  .summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
    width: 100%;
    justify-items: center;
  }

  .summary-card {
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    text-align: center;
    width: 100%;
    max-width: 300px;
  }

  .summary-card:nth-child(1) {
    background: #dbeafe;
  }

  .summary-card:nth-child(2) {
    background: #dbeafe;
  }

  .summary-card:nth-child(3) {
    background: #f3e8ff;
  }

  .summary-card:nth-child(5) {
    background: #ffedd5;
  }

  .card-icon {
    font-size: 32px;
    margin-bottom: 12px;
  }

  .summary-card h3 {
    margin: 0 0 8px 0;
    color: #6b7280;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .amount {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
  }

  .credit-amount {
    color: #10b981;
  }

  .debit-amount {
    color: #ef4444;
  }

  .profit-amount {
    color: #2563eb;
    font-weight: 900;
  }

  .pending-amount {
    color: #f59e0b;
  }

  .card-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 40px;
  }

  .loading-spinner-small {
    width: 24px;
    height: 24px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .empty-transactions-notice {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    padding: 24px;
    text-align: center;
    margin-bottom: 24px;
  }

  .notice-icon {
    font-size: 32px;
    margin-bottom: 8px;
  }

  .empty-transactions-notice p {
    margin: 0;
    color: #6b7280;
    font-size: 16px;
  }

  /* Global Empty State Card */
  .global-empty-state-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    margin-bottom: 24px;
    overflow: hidden;
  }

  .global-empty-state-card .card-header {
    padding: 24px 32px;
    background: #f8fafc;
    border-bottom: 1px solid #e5e7eb;
  }

  .global-empty-state-card .card-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }

  .global-empty-state-card .card-divider {
    height: 1px;
    background: #e5e7eb;
  }

  .empty-state-content {
    padding: 48px 32px;
    text-align: center;
  }

  .empty-state-content .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    display: block;
  }

  .empty-state-content h4 {
    margin: 0 0 8px 0;
    color: #1f2937;
    font-size: 20px;
    font-weight: 600;
  }

  .empty-state-content p {
    margin: 4px 0;
    color: #6b7280;
    font-size: 14px;
    line-height: 1.5;
  }

  /* Bank Reconciliation Card - USER ONLY */
  .bank-reconciliation-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    padding: 24px;
    margin-bottom: 24px;
    border: 1px solid #e5e7eb;
  }

  .bank-reconciliation-card h3 {
    margin: 0 0 20px 0;
    color: #1f2937;
    font-size: 20px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .reconciliation-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .reconciliation-row {
    display: flex;
    gap: 32px;
    flex-wrap: wrap;
  }

  .reconciliation-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .reconciliation-item .label {
    font-size: 14px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .reconciliation-item .value {
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
  }

  .reconciliation-status {
    padding: 16px;
    border-radius: 8px;
    background: #f8fafc;
    border: 1px solid #e5e7eb;
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .status-icon {
    font-size: 20px;
  }

  .status-text {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
  }

  .difference-amount {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .difference-amount .label {
    font-size: 14px;
    font-weight: 600;
    color: #ef4444;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .difference-amount .value {
    font-size: 18px;
    font-weight: 700;
    color: #ef4444;
  }

  /* User Reports Card - USER ONLY */
  .user-reports-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    padding: 24px;
    margin-bottom: 24px;
    border: 1px solid #e5e7eb;
  }

  .user-reports-card h3 {
    margin: 0 0 16px 0;
    color: #1f2937;
    font-size: 20px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .reports-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .reports-description {
    color: #6b7280;
    font-size: 14px;
    line-height: 1.5;
    margin: 0;
  }

  .reports-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .report-btn {
    padding: 12px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
  }

  .pdf-btn {
    background: #dc2626;
    color: white;
  }

  .pdf-btn:hover:not(:disabled) {
    background: #b91c1c;
    transform: translateY(-1px);
  }

  .csv-btn {
    background: #059669;
    color: white;
  }

  .csv-btn:hover:not(:disabled) {
    background: #047857;
    transform: translateY(-1px);
  }

  .report-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .no-reports-message {
    color: #6b7280;
    font-size: 14px;
    font-style: italic;
    margin: 8px 0 0 0;
  }

  .compact-chart-section {
    margin-bottom: 16px;
    display: inline-block;
    vertical-align: top;
  }

  .compact-chart-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    width: 240px;
    height: 160px;
    overflow: hidden;
    border: 1px solid #f3f4f6;
  }

  .chart-header {
    padding: 12px 16px 6px;
    background: #fafafa;
    border-bottom: 1px solid #f3f4f6;
  }

  .chart-header h4 {
    margin: 0 0 4px 0;
    color: #1f2937;
    font-size: 14px;
    font-weight: 600;
  }

  .chart-subtitle {
    margin: 0;
    color: #6b7280;
    font-size: 12px;
    font-weight: 400;
  }

  .compact-chart-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 140px;
  }

  .compact-chart-loading p {
    margin: 8px 0 0 0;
    color: #6b7280;
    font-size: 12px;
  }

  .compact-bar-chart-container {
    padding: 8px 12px 12px;
    position: relative;
  }

  .compact-bar-chart {
    width: 100%;
    height: 120px;
  }

  .bar-hover {
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .bar-hover:hover {
    opacity: 0.8;
  }

  .compact-chart-legend {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 8px;
    padding: 0 16px;
  }

  .compact-legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #6b7280;
    font-weight: 500;
  }

  .compact-legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .compact-chart-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 140px;
    color: #9ca3af;
  }

  .compact-chart-empty-state p {
    margin: 8px 0 0 0;
    font-size: 12px;
  }

  .empty-chart-icon {
    font-size: 24px;
  }

  .chart-section {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    margin-bottom: 16px;
    overflow: hidden;
  }

  .chart-section h3 {
    margin: 0;
    padding: 16px 20px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    color: #1f2937;
    font-size: 18px;
    font-weight: 600;
  }

  .chart-card {
    padding: 12px;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .bar-chart-container {
    width: 100%;
    max-width: 70%;
    margin: 0 auto;
    position: relative;
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

  .chart-empty-state {
    text-align: center;
    color: #6b7280;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  .line-chart-container {
    width: 100%;
    position: relative;
  }

  .line-chart {
    width: 100%;
    height: 300px;
  }

  .chart-legend {
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-top: 16px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #374151;
  }

  .legend-color-box {
    width: 12px;
    height: 12px;
    border-radius: 2px;
  }

  .pie-chart-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .simple-pie {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    width: 100%;
    max-width: 600px;
    margin-bottom: 20px;
  }

  .pie-slice {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    font-size: 14px;
  }

  .pie-label {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .category-name {
    font-weight: 600;
  }

  .category-amount {
    font-size: 12px;
    opacity: 0.9;
  }

  .pie-percentage {
    font-size: 12px;
    opacity: 0.8;
  }

  .pie-legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 16px;
    margin-top: 16px;
  }

  .recent-transactions-section {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    overflow: hidden;
  }

  .recent-transactions-section h3 {
    margin: 0;
    padding: 20px 24px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    color: #1f2937;
    font-size: 18px;
    font-weight: 600;
  }

  .dashboard-filters {
    padding: 20px 24px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .filter-group label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }

  .filter-group select,
  .filter-group input {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
  }

  .transactions-table-container {
    overflow-x: auto;
  }

  .transactions-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  .transactions-table th {
    background: #f9fafb;
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    color: #374151;
    border-bottom: 1px solid #e5e7eb;
    white-space: nowrap;
  }

  .transactions-table td {
    padding: 12px 16px;
    border-bottom: 1px solid #f3f4f6;
    vertical-align: top;
  }

  .transactions-table tbody tr:hover {
    background: #f9fafb;
  }

  .transaction-id {
    font-family: monospace;
    font-weight: 600;
    color: #2563eb;
  }

  .description-cell {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .amount {
    font-family: monospace;
    font-weight: 600;
  }

  .amount.credit {
    color: #10b981;
  }

  .amount.debit {
    color: #ef4444;
  }

  .type-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .type-badge.credit {
    background: #dcfce7;
    color: #166534;
  }

  .type-badge.debit {
    background: #fef2c7;
    color: #92400e;
  }

  .creator-info {
    color: #6b7280;
    font-size: 13px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 1024px) {
    .dashboard-sidebar {
      width: 200px;
    }

    .dashboard-main {
      max-width: calc(100vw - 200px);
    }
  }

  @media (max-width: 768px) {
    .dashboard-content {
      flex-direction: column;
    }

    .dashboard-sidebar {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid #e5e7eb;
    }

    .sidebar-nav {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
      padding: 16px;
    }

    .sidebar-item {
      padding: 8px 12px;
      justify-content: center;
    }

    .dashboard-main {
      max-width: 100%;
      padding: 16px;
    }

    .summary-cards {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .dashboard-filters {
      flex-direction: column;
      gap: 12px;
    }

    .simple-pie {
      grid-template-columns: 1fr;
    }

    .chart-legend {
      flex-direction: column;
      gap: 8px;
    }
  }

  /* Loading Spinner */
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading-spinner-small {
    width: 24px;
    height: 24px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* Transaction Count Indicators */
  .transaction-count-indicators {
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-bottom: 16px;
    padding: 12px 0;
  }

  .count-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .combined-count {
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .count-text {
    font-weight: 700;
    letter-spacing: 0.5px;
  }

  /* Chart Tooltip */
  .chart-tooltip {
    position: fixed;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    z-index: 2000;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
  }

  .chart-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -6px;
    border: 6px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.9);
  }

  @media (max-width: 768px) {
    .transaction-count-indicators {
      flex-direction: column;
      gap: 12px;
      align-items: center;
    }

    .count-indicator {
      font-size: 13px;
      padding: 6px 12px;
    }

    .count-value {
      font-size: 14px;
    }
  }
`}</style>
