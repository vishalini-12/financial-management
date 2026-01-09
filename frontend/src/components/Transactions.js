import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Transactions = ({ user }) => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    clientName: '',
    description: '',
    amount: '',
    type: 'CREDIT',
    category: 'Miscellaneous',
    status: 'COMPLETED',
    clientUsername: '',
    bankName: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(''); // For add transaction errors
  const [fetchError, setFetchError] = useState(''); // For fetch transaction errors
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [uploadingCsv, setUploadingCsv] = useState(false);
  const [csvError, setCsvError] = useState('');
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState('');

  useEffect(() => {
    if (!user) return; // Don't fetch if not authenticated
    fetchTransactions();
    fetchClients();
    if (user.role !== 'USER') {
      fetchUsers();
    }
  }, [user]);

  // Handle click outside, ESC key, and window resize/scroll to close/reposition popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDeleteConfirm) {
        const popover = document.querySelector('.delete-confirm-popover');
        if (popover && !popover.contains(event.target)) {
          setShowDeleteConfirm(false);
          setDeletingTransaction(null);
        }
      }
    };

    const handleKeyDown = (event) => {
      if (showDeleteConfirm && event.key === 'Escape') {
        setShowDeleteConfirm(false);
        setDeletingTransaction(null);
      }
    };

    const handleResizeScroll = () => {
      if (showDeleteConfirm) {
        // Reposition popover when window resizes or scrolls
        setTimeout(() => {
          const popover = document.querySelector('.delete-confirm-popover');
          const anchor = document.querySelector('.filter-action-anchor');

          if (popover && anchor) {
            const popoverWidth = 270;
            const anchorRect = anchor.getBoundingClientRect();

            let top = anchorRect.bottom + 8;
            let left = anchorRect.right - popoverWidth;

            left = Math.max(10, Math.min(left, window.innerWidth - popoverWidth - 10));
            top = Math.max(10, Math.min(top, window.innerHeight - 200));

            popover.style.top = `${top}px`;
            popover.style.left = `${left}px`;
          }
        }, 0);
      }
    };

    if (showDeleteConfirm) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('resize', handleResizeScroll);
      window.addEventListener('scroll', handleResizeScroll);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResizeScroll);
      window.removeEventListener('scroll', handleResizeScroll);
    };
  }, [showDeleteConfirm]);

  // DO NOT re-fetch when filters change - user must explicitly apply filters
  // This ensures all data is always displayed by default

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/transactions/clients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // API now returns array of strings (client names)
      setClients(response.data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setClients([]);
    }
  };

  const fetchUsers = async () => {
    if (user?.role === 'ADMIN') {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8080/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(response.data);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // First, try to get database status to verify connection
      console.log('=== CHECKING DATABASE STATUS ===');
      try {
        const statusResponse = await axios.get('http://localhost:8080/api/transactions/database/status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Database status:', statusResponse.data);
      } catch (statusErr) {
        console.error('Database status check failed:', statusErr.response?.data || statusErr.message);
      }

      // Build query parameters - only apply filters when user explicitly applies them
      const params = new URLSearchParams();

      // Only apply filters when they are meaningful (not default values)
      // This ensures ALL data is shown by default
      if (typeFilter && typeFilter !== 'All') {
        params.append('type', typeFilter);
      }
      if (dateFromFilter && dateFromFilter.trim()) {
        params.append('fromDate', dateFromFilter.trim());
      }
      if (dateToFilter && dateToFilter.trim()) {
        params.append('toDate', dateToFilter.trim());
      }
      if (clientFilter && clientFilter.trim()) {
        params.append('client', clientFilter.trim());
      }

      const url = `http://localhost:8080/api/transactions${params.toString() ? '?' + params.toString() : ''}`;

      console.log('=== FETCHING TRANSACTIONS ===');
      console.log('URL:', url);
      console.log('Current filters (DISABLED for debugging):', { typeFilter, dateFromFilter, dateToFilter, clientFilter });

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const fetchedTransactions = response.data || [];
      console.log('=== RESPONSE RECEIVED ===');
      console.log('Fetched transactions count:', fetchedTransactions.length);
      console.log('Raw response data type:', typeof response.data);
      console.log('Raw response data:', response.data);

      // Debug: Log first few transactions if any
      if (fetchedTransactions.length > 0) {
        console.log('=== SAMPLE TRANSACTIONS ===');
        for (let i = 0; i < Math.min(5, fetchedTransactions.length); i++) {
          const t = fetchedTransactions[i];
          console.log(`Transaction ${i+1}: ID=${t.id}, Date=${t.date}, Client=${t.clientName}, Amount=${t.amount}, Type=${t.type}, Description=${t.description}`);
        }
      } else {
        console.log('=== NO TRANSACTIONS FOUND ===');
        console.log('This means either:');
        console.log('1. Database is empty');
        console.log('2. No transactions match the filters');
        console.log('3. Backend query is failing');
        console.log('4. Authentication is failing');
      }

      setTransactions(fetchedTransactions);
      setError('');
      setFetchError(''); // Clear any previous fetch errors on success
    } catch (err) {
      console.error('=== ERROR FETCHING TRANSACTIONS ===');
      console.error('Error object:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      console.error('Error message:', err.message);

      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setFetchError('Your session has expired. Please login again.');
        setTimeout(() => window.location.href = '/login', 2000);
      } else if (err.response?.status === 403) {
        setFetchError('Please login again to view transactions.');
      } else {
        setFetchError('Failed to load transactions: ' + (err.response?.data?.message || err.message));
      }
      // DO NOT clear transactions on error - keep existing data
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    console.log('=== ADD TRANSACTION DEBUG ===');
    console.log('Current user:', user);
    console.log('Form data:', newTransaction);

    try {
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      console.log('Token length:', token?.length || 0);

      if (!token) {
        alert('You are not logged in. Please login again.');
        window.location.href = '/login';
        return;
      }

      // Ensure amount is a valid number
      const amountValue = parseFloat(newTransaction.amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        setError('Please enter a valid amount greater than 0');
        setSubmitting(false);
        return;
      }

      const requestData = {
        date: newTransaction.date, // Already in yyyy-MM-dd format
        type: newTransaction.type,
        clientName: newTransaction.clientName.trim(),
        description: newTransaction.description.trim(),
        category: newTransaction.category,
        status: newTransaction.status,
        bankName: newTransaction.bankName.trim(),
        amount: amountValue
      };

      console.log('Sending request to:', 'http://localhost:8080/api/transactions');
      console.log('Request data:', requestData);

      const response = await axios.post('http://localhost:8080/api/transactions', requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Raw response:', response);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      // Check for success response format
      if (response.data && response.data.success === true) {
        console.log('Transaction added successfully with ID:', response.data.transactionId);

        // Reset form
        setNewTransaction({
          date: new Date().toISOString().split('T')[0],
          clientName: '',
          description: '',
          amount: '',
          type: 'CREDIT',
          category: 'Miscellaneous',
          status: 'COMPLETED',
          clientUsername: ''
        });

        // Clear any existing error
        setError('');

        // Refresh transactions list from unified data source
        console.log('Refreshing transaction history after adding new transaction...');
        await fetchTransactions();
        console.log('Transaction list refreshed successfully');

        // Navigate to dashboard with refresh state to trigger auto-refresh
        console.log('Navigating to dashboard with refresh state...');
        navigate('/dashboard', { state: { transactionAdded: true } });

        alert('Transaction added successfully!');
      } else {
        // Handle unexpected response format
        console.error('Unexpected add transaction response:', response.data);
        setError('Unexpected response from server. Please try again.');
      }
    } catch (err) {
      console.error('=== ADD TRANSACTION ERROR ===');
      console.error('Error object:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);

      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        console.error('Response headers:', err.response.headers);

        if (err.response.status === 401) {
          setError('Authentication failed. Please login again.');
          localStorage.removeItem('token');
          setTimeout(() => window.location.href = '/login', 2000);
        } else if (err.response.status === 403) {
          // Show the actual backend error message for 403
          const errorMessage = err.response.data?.message || err.response.data || 'Access denied';
          setError(`Access denied: ${errorMessage}`);
        } else if (err.response.data && typeof err.response.data === 'string') {
          setError(err.response.data);
        } else if (err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError('Server error occurred. Please try again.');
        }
      } else if (err.request) {
        console.error('No response received:', err.request);
        setError('Unable to connect to server. Please check your connection.');
      } else {
        console.error('Request setup error:', err.message);
        setError('Request failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canAdd = user; // Any authenticated user can add transactions

  // Require authentication to access transaction management
  if (!user) {
    return (
      <div className="transactions-page">
        <div className="page-container">
          <div className="page-header">
            <h2>Authentication Required</h2>
            <p className="page-subtitle">
              Please login to access transaction management and add new transactions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleCsvUpload = async (file) => {
    if (!file) return false;

    // Validate file type
    if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
      setCsvError('Please select a CSV file only.');
      return false;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setCsvError('File size must be less than 10MB.');
      return false;
    }

    setCsvError('');
    setUploadingCsv(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading CSV file:', file.name);
      const response = await axios.post('http://localhost:8080/api/transactions/upload-csv', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('CSV upload response:', response.data);

      // Check for success response format
      if (response.data.success === true) {
        // Show success message
        alert(`Successfully processed ${response.data.transactionsSaved} transactions from CSV!`);

        // Clear any existing error
        setError('');
        setCsvError('');

        // Immediately refresh transactions list (don't set loading to true to avoid UI flicker)
        try {
          console.log('Refreshing transactions after CSV upload...');

          // Reset filters to show all transactions including new ones
          setTypeFilter('All');
          setDateFromFilter('');
          setDateToFilter('');
          setClientFilter('');

          // Fetch transactions will automatically use the cleared filters
          await fetchTransactions();

        } catch (refreshErr) {
          console.error('Error refreshing transactions after CSV upload:', refreshErr);
          // Still consider upload successful, just couldn't refresh the UI
        }

        return true;
      } else {
        // Handle unexpected response format
        console.error('Unexpected CSV upload response:', response.data);
        setCsvError(response.data.message || 'Unexpected response from server. Please try again.');
        return false;
      }
    } catch (err) {
      console.error('Error uploading CSV:', err);
      // Extract error message properly from response
      let errorMessage = 'Failed to process CSV file.';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else {
          errorMessage = 'Server error occurred while processing CSV file.';
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setCsvError(errorMessage);
      return false;
    } finally {
      setUploadingCsv(false);
    }
  };

  const getUserName = (userId) => {
    if (user?.role === 'ADMIN') {
      const u = users.find(u => u.id === userId);
      return u ? u.username : 'Unknown';
    } else {
      return user.username;
    }
  };

  // Function to position the popover
  const positionPopover = () => {
    const popover = document.querySelector('.delete-confirm-popover');
    const anchor = document.querySelector('.filter-action-anchor');

    if (popover && anchor) {
      const popoverWidth = 270; // Fixed width (260-280px range)
      const anchorRect = anchor.getBoundingClientRect();

      // Position calculation: directly below, aligned to right side with 8px gap
      let top = anchorRect.bottom + 8;
      let left = anchorRect.right - popoverWidth;

      // Prevent going outside viewport bounds
      left = Math.max(10, Math.min(left, window.innerWidth - popoverWidth - 10));
      top = Math.max(10, Math.min(top, window.innerHeight - 200)); // Approximate height

      popover.style.top = `${top}px`;
      popover.style.left = `${left}px`;
    }
  };

  const handleDeleteClick = (transaction, event) => {
    event.preventDefault();
    event.stopPropagation();

    setDeletingTransaction(transaction);

    // Position the popover relative to the filter-action-anchor
    setTimeout(() => {
      positionPopover();
    }, 0); // Allow DOM to update first

    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingTransaction) {
      console.error('No transaction to delete');
      return;
    }

    console.log('=== CONFIRM DELETE DEBUG ===');
    console.log('Deleting transaction:', deletingTransaction);
    console.log('Transaction ID:', deletingTransaction.id);

    try {
      const token = localStorage.getItem('token');
      console.log('Auth token exists:', !!token);
      console.log('Auth token length:', token?.length || 0);

      if (!token) {
        console.error('No auth token found');
        setError('Authentication required. Please login again.');
        return;
      }

      const deleteUrl = `http://localhost:8080/api/transactions/${deletingTransaction.id}`;
      console.log('DELETE API call to:', deleteUrl);

      const response = await axios.delete(deleteUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('DELETE API response:', response);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      if (response.status === 200 && response.data.success === true) {
        console.log('✅ Transaction deleted successfully from backend');

        // Success - refresh the transaction list and dashboard
        setDeleteSuccess('Transaction deleted successfully');
        console.log('Refreshing transaction list...');
        await fetchTransactions();
        console.log('Transaction list refreshed');

        // Navigate to dashboard to refresh totals
        console.log('Navigating to dashboard...');
        navigate('/dashboard', { state: { transactionDeleted: true } });

        // Clear success message after 3 seconds
        setTimeout(() => {
          setDeleteSuccess('');
          console.log('Success message cleared');
        }, 3000);

      } else {
        console.error('Unexpected response:', response.data);
        setError('Unexpected response from server');
      }

    } catch (err) {
      console.error('=== DELETE ERROR ===');
      console.error('Error object:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      console.error('Error message:', err.message);

      if (err.response?.status === 403) {
        setError('Access denied. Only accountants can delete transactions.');
      } else if (err.response?.status === 404) {
        setError('Transaction not found.');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        localStorage.removeItem('token');
      } else if (!err.response) {
        setError('Cannot connect to server. Please check if backend is running.');
      } else {
        setError('Failed to delete transaction: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      console.log('Closing delete confirmation popup');
      setShowDeleteConfirm(false);
      setDeletingTransaction(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingTransaction(null);
  };

  // Debug logging for role-based rendering
  console.log('=== TABLE RENDER DEBUG ===');
  console.log('Current user:', user);
  console.log('User role:', user?.role);
  console.log('Show Actions column:', user?.role === 'ACCOUNTANT');
  console.log('Transactions count:', transactions.length);

  return (
    <div className="transactions-page">
        <div className="page-container">

        {canAdd && (
          <div className="add-transaction-page">
            <div className="add-transaction-wrapper">
              <div className="add-transaction-card">
                <div className="add-transaction-header">
                  <h2>Add New Transaction</h2>
                </div>

                <form onSubmit={handleAdd} className="add-transaction-form">
                  <div className="form-grid">
                    {/* Date | Type */}
                    <div className="form-group">
                      <label>Date (Auto-filled)</label>
                      <input
                        type="date"
                        value={newTransaction.date}
                        readOnly
                        className="auto-filled-field"
                        title="Date is automatically set to today"
                      />
                    </div>

                    <div className="form-group">
                      <label>Type</label>
                      <select
                        value={newTransaction.type}
                        onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                        required
                      >
                        <option value="CREDIT">Credit</option>
                        <option value="DEBIT">Debit</option>
                      </select>
                    </div>

                    {/* Client Name | Bank Name */}
                    <div className="form-group">
                      <label>Client Name</label>
                      <input
                        type="text"
                        placeholder="Enter client name"
                        value={newTransaction.clientName}
                        onChange={(e) => setNewTransaction({...newTransaction, clientName: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Bank Name *</label>
                      <select
                        value={newTransaction.bankName}
                        onChange={(e) => setNewTransaction({...newTransaction, bankName: e.target.value})}
                        required
                      >
                        <option value="">Select Bank</option>
                        <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                        <option value="HDFC Bank">HDFC Bank</option>
                        <option value="ICICI Bank">ICICI Bank</option>
                        <option value="Axis Bank">Axis Bank</option>
                        <option value="Canara Bank">Canara Bank</option>
                        <option value="Indian Bank">Indian Bank</option>
                      </select>
                    </div>

                    {/* Category | Status */}
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        value={newTransaction.category}
                        onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                        required
                      >
                        <option value="Salary">Salary</option>
                        <option value="Client Payment">Client Payment</option>
                        <option value="Rent">Rent</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Office Expense">Office Expense</option>
                        <option value="Miscellaneous">Miscellaneous</option>
                      </select>
                    </div>

                    {/* Description | Status */}
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        placeholder="Enter transaction description"
                        value={newTransaction.description}
                        onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                        rows="3"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={newTransaction.status}
                        onChange={(e) => setNewTransaction({...newTransaction, status: e.target.value})}
                        required
                      >
                        <option value="COMPLETED">Completed</option>
                        <option value="PENDING">Pending</option>
                      </select>
                    </div>
                  </div>

                  {/* Amount field - full width */}
                  <div className="amount-row">
                    <div className="form-group">
                      <label>Amount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newTransaction.amount}
                        onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  {/* Centered button */}
                  <div className="button-row">
                    <button type="submit" className="add-transaction-submit-btn" disabled={submitting}>
                      {submitting ? 'Saving...' : 'Add Transaction'}
                    </button>
                  </div>
                </form>

                {error && <div className="add-transaction-error">{error}</div>}
                {deleteSuccess && <div className="delete-success">{deleteSuccess}</div>}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Popover */}
        {showDeleteConfirm && deletingTransaction && (
          <div className={`delete-confirm-popover show`}>
            <div className="delete-confirm-content">
              <div className="delete-confirm-header">
                <h3>Confirm Delete</h3>
              </div>
              <div className="delete-confirm-body">
                <p>Are you sure you want to delete this transaction? This action cannot be undone.</p>
                <div className="delete-transaction-details">
                  <strong>Transaction #{deletingTransaction.id}</strong><br />
                  {deletingTransaction.description}<br />
                  Amount: ${parseFloat(deletingTransaction.amount).toFixed(2)}<br />
                  Client: {deletingTransaction.clientName || 'Manual Entry'}
                </div>
              </div>
              <div className="delete-confirm-actions">
                <button
                  onClick={cancelDelete}
                  className="cancel-delete-btn"
                >
                  No
                </button>
                <button
                  onClick={confirmDelete}
                  className="confirm-delete-btn"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="transaction-content-container">
          {/* CSV Upload Section */}
          {canAdd && (
            <div className="csv-upload-section">
              <h4>📊 Upload CSV Transactions</h4>
              <p className="upload-description">
                Upload a CSV file containing transaction details. The file must have these required columns: date, type, client_name, description, category, status, amount.
              </p>
              <div className="upload-controls">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file && handleCsvUpload(file)) {
                      e.target.value = ''; // Reset file input
                    }
                  }}
                  disabled={uploadingCsv}
                  className="file-input"
                />
                <button
                  type="button"
                  onClick={() => document.querySelector('.file-input').click()}
                  className="upload-btn"
                  disabled={uploadingCsv}
                >
                  {uploadingCsv ? 'Processing...' : 'Choose CSV File'}
                </button>
              </div>
              {csvError && <div className="error-message">{csvError}</div>}
            </div>
          )}

          <div className="transactions-section">
            <div className="transactions-header">
              <h3>Transaction History</h3>
            </div>

            {/* Fetch Error Banner */}
            {fetchError && (
              <div className="fetch-error-banner">
                ⚠️ {fetchError}
              </div>
            )}

            {/* Filters for ACCOUNTANT and ADMIN */}
            {(user?.role === 'ACCOUNTANT' || user?.role === 'ADMIN') && (
              <div className="advanced-filters">
                <div className="filter-row">
                  <div className="filter-group">
                    <label>Transaction Type:</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    >
                      <option value="All">All Types</option>
                      <option value="CREDIT">Credit</option>
                      <option value="DEBIT">Debit</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label>From Date:</label>
                    <input
                      type="date"
                      value={dateFromFilter}
                      onChange={(e) => setDateFromFilter(e.target.value)}
                    />
                  </div>

                  <div className="filter-group">
                    <label>To Date:</label>
                    <input
                      type="date"
                      value={dateToFilter}
                      onChange={(e) => setDateToFilter(e.target.value)}
                    />
                  </div>

                  <div className="filter-group">
                    <label>Client:</label>
                    <input
                      type="text"
                      placeholder="Enter client name to filter"
                      value={clientFilter}
                      onChange={(e) => setClientFilter(e.target.value)}
                    />
                  </div>

                  <div className="filter-group">
                    <div className="filter-action-anchor">
                      <button
                        className="clear-filters-btn"
                        onClick={() => {
                          setTypeFilter('All');
                          setDateFromFilter('');
                          setDateToFilter('');
                          setClientFilter('');
                          // Re-fetch all transactions after clearing filters
                          setTimeout(() => fetchTransactions(), 100);
                        }}
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="loading">Loading transactions...</div>
            ) : (
              <>
                {(() => {
                  // Sort transactions by date (newest first) before filtering
                  const sortedTransactions = [...transactions].sort((a, b) => {
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    return dateB - dateA; // Newest first
                  });

                  // No additional client-side filtering - backend already applies all filters
                  // This ensures we see ALL data returned from the database
                  const filteredTransactions = sortedTransactions;
                  return filteredTransactions.length === 0 ? (
                    <div className="no-data">
                      {transactions.length === 0
                        ? 'No transactions found. Transactions will appear here once added.'
                        : 'No transactions found for the selected filter.'
                      }
                    </div>
                  ) : (
                    <div className="transactions-table-container">
                      <table className="transactions-table-fixed">
                        <thead>
                          <tr>
                            <th>Transaction ID</th>
                            <th>Date</th>
                            {user?.role !== 'USER' && <th>Client</th>}
                            <th>Description</th>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Type</th>
                            {user?.role === 'ACCOUNTANT' && <th className="status-column-fixed">Status</th>}
                            {user?.role === 'ADMIN' && <th>Created By</th>}
                            {user?.role === 'ACCOUNTANT' && <th className="actions-column-fixed">Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTransactions.map(t => {
                            // Add appropriate prefix based on transaction source
                            let desc = t.description;
                            if (t.clientUsername === 'manual_entry') {
                              // For manually entered transactions, ensure "manual-" prefix
                              if (!desc.startsWith('manual - ')) {
                                desc = 'manual - ' + desc;
                              }
                            } else if (t.clientUsername && t.clientUsername !== 'manual_entry' && !desc.startsWith(t.clientUsername + ' - ')) {
                              // For CSV/other imports, add client username prefix
                              desc = t.clientUsername + ' - ' + desc;
                            }

                            // Debug each transaction
                            console.log(`Rendering transaction ${t.id}: status=${t.status}, role=${user?.role}, showActions=${user?.role === 'ACCOUNTANT'}`);

                            return (
                              <tr key={t.id}>
                                <td>TXN-{t.id}</td>
                                <td>{formatDate(t.date)}</td>
                                {user?.role !== 'USER' && <td>{t.clientName || 'Manual Entry'}</td>}
                                <td className="description-cell">{desc}</td>
                                <td>{t.category || 'Miscellaneous'}</td>
                                <td className={`amount ${t.type.toLowerCase()}`}>
                                  ${parseFloat(t.amount).toFixed(2)}
                                </td>
                                <td>
                                  <span className={`type-badge ${t.type.toLowerCase()}`}>
                                    {t.type}
                                  </span>
                                </td>
                                {user?.role === 'ACCOUNTANT' && (
                                  <td className="status-cell-fixed">
                                    <div className="status-content-fixed">
                                      <span className={`status-badge-fixed ${t.status?.toLowerCase() || 'completed'}`}>
                                        {t.status || 'COMPLETED'}
                                      </span>
                                    </div>
                                  </td>
                                )}
                                {user?.role === 'ADMIN' && <td>{getUserName(t.userId)}</td>}
                                {user?.role === 'ACCOUNTANT' && (
                                  <td className="actions-cell-fixed">
                                    <div className="actions-content-fixed">
                                      <button
                                        onClick={(event) => handleDeleteClick(t, event)}
                                        className="delete-btn-fixed"
                                        title="Delete Transaction"
                                        disabled={deletingTransaction?.id === t.id}
                                      >
                                        🗑️ DELETE
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
