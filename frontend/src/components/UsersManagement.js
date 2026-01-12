import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UsersManagement.css';

const UsersManagement = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('username');
  const [sortDirection, setSortDirection] = useState('asc');

  // Add User Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'ACCOUNTANT'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const openAddUserModal = () => {
    setShowAddUserModal(true);
    setNewUser({ username: '', email: '', password: '', role: 'ACCOUNTANT' });
    setFormErrors({});
    setSubmitError('');
  };

  const closeAddUserModal = () => {
    setShowAddUserModal(false);
    setNewUser({ username: '', email: '', password: '', role: 'ACCOUNTANT' });
    setFormErrors({});
    setSubmitError('');
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!newUser.username.trim()) {
      errors.username = 'Username is required';
    } else if (newUser.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!newUser.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(newUser.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!newUser.password.trim()) {
      errors.password = 'Password is required';
    } else if (newUser.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit handler
  const handleSubmitUser = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/users`, newUser, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Success
      setSuccessMessage('User added successfully!');
      closeAddUserModal();
      fetchUsers(); // Refresh the users list

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (err) {
      console.error('Error adding user:', err);
      if (err.response?.status === 409) {
        setSubmitError('Username or email already exists');
      } else {
        setSubmitError(err.response?.data?.message || 'Failed to add user. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Format date to DD/MM/YYYY format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Check if user has permission (ADMIN only)
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="unauthorized-page">
        <div className="unauthorized-container">
          <div className="unauthorized-icon">🚫</div>
          <h1>Access Denied</h1>
          <p>You don't have permission to access Users Management.</p>
          <p>This feature is only available for Administrators.</p>
          <button onClick={() => window.history.back()} className="back-btn">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Filter and sort users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (sortField === 'createdAt') {
      aValue = new Date(aValue || 0);
      bValue = new Date(bValue || 0);
    } else {
      aValue = (aValue || '').toString().toLowerCase();
      bValue = (bValue || '').toString().toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  return (
    <div className="users-management">
      <div className="users-management-header">
        <h2>👥 Users Management</h2>
        <div className="header-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search users by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          <button className="add-user-btn" onClick={openAddUserModal}>
            <span>+</span> Add New User
          </button>
        </div>
      </div>

      {/* Filters and Stats */}
      <div className="filters-section">
        <div className="filter-controls">
          <div className="filter-group">
            <label>Role:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="role-filter"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="ACCOUNTANT">Accountant</option>
            </select>
          </div>
        </div>
      </div>

      {(() => {
        const totalUsers = sortedUsers.filter(u => u.role === 'ADMIN' || u.role === 'ACCOUNTANT').length;
        const adminCount = sortedUsers.filter(u => u.role === 'ADMIN').length;
        const accountantCount = sortedUsers.filter(u => u.role === 'ACCOUNTANT').length;

        console.log('Stat card data:', { totalUsers, adminCount, accountantCount, sortedUsersCount: sortedUsers.length });

        return (
          <div className="users-stats">
            <div className="stat-card total-users">
              <div className="stat-icon">👥</div>
              <h3>Total Users</h3>
              <p className="stat-number">{totalUsers}</p>
            </div>
            <div className="stat-card admin-count">
              <div className="stat-icon">👑</div>
              <h3>Admins</h3>
              <p className="stat-number">{adminCount}</p>
            </div>
            <div className="stat-card accountant-count">
              <div className="stat-icon">🧾</div>
              <h3>Accountants</h3>
              <p className="stat-number">{accountantCount}</p>
            </div>
          </div>
        );
      })()}

      <div className="users-table-container">
        {filteredUsers.length === 0 ? (
          <div className="empty-users-state">
            <span className="empty-icon">🔍</span>
            <p>{searchTerm ? `No users found matching "${searchTerm}"` : 'No users found. Add users to display here.'}</p>
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email || 'N/A'}</td>
                  <td>
                    <span className={`role-badge role-${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.createdAt ? formatDate(user.createdAt) : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="success-toast">
          <span className="success-icon">✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="modal-overlay" onClick={closeAddUserModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New User</h3>
              <button className="modal-close" onClick={closeAddUserModal}>×</button>
            </div>

            <form onSubmit={handleSubmitUser} className="modal-form">
              <div className="form-group">
                <label htmlFor="username">Username *</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={newUser.username}
                  onChange={handleInputChange}
                  className={formErrors.username ? 'error' : ''}
                  placeholder="Enter username"
                />
                {formErrors.username && <span className="error-message">{formErrors.username}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  className={formErrors.email ? 'error' : ''}
                  placeholder="Enter email address"
                />
                {formErrors.email && <span className="error-message">{formErrors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={newUser.password}
                  onChange={handleInputChange}
                  className={formErrors.password ? 'error' : ''}
                  placeholder="Enter password (min 6 characters)"
                />
                {formErrors.password && <span className="error-message">{formErrors.password}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="role">Role *</label>
                <select
                  id="role"
                  name="role"
                  value={newUser.role}
                  onChange={handleInputChange}
                >
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {submitError && (
                <div className="submit-error">
                  <span>⚠️</span> {submitError}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={closeAddUserModal}
                  className="cancel-btn"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Adding User...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;

<style jsx>{`
  .users-management {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  }

  .users-management::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%);
    pointer-events: none;
    z-index: -1;
  }

  .users-management-header {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    padding: 32px;
    margin-bottom: 40px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    overflow: hidden;
  }

  .users-management-header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
    border-radius: 20px 20px 0 0;
  }

  .users-management-header h2 {
    color: #1e293b;
    font-size: 36px;
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.8px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-icon {
    font-size: 40px;
    opacity: 0.8;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .search-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input {
    padding: 14px 20px;
    padding-right: 50px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50px;
    font-size: 15px;
    width: 320px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    color: #374151;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }

  .search-input:focus {
    outline: none;
    border-color: #667eea;
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
    transform: translateY(-2px);
  }

  .search-input::placeholder {
    color: #9ca3af;
  }

  .search-icon {
    position: absolute;
    right: 18px;
    color: #6b7280;
    font-size: 18px;
    pointer-events: none;
  }

  .add-user-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 14px 28px;
    border-radius: 50px;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.3s ease;
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    position: relative;
    overflow: hidden;
  }

  .add-user-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  .add-user-btn:hover::before {
    left: 100%;
  }

  .add-user-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
  }

  .add-user-btn span {
    font-size: 20px;
    font-weight: bold;
  }

  .filters-section {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(15px);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 32px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .filter-controls {
    display: flex;
    gap: 20px;
    align-items: center;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .filter-group label {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin: 0;
  }

  .role-filter {
    padding: 12px 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    font-size: 15px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    color: #374151;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .role-filter:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 2px 15px rgba(102, 126, 234, 0.2);
  }

  .users-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
    margin-bottom: 40px;
  }

  .users-stats .stat-card {
    background: #ffffff !important;
    color: #111827 !important;
    position: relative !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 16px !important;
    padding: 32px 24px !important;
    border-radius: 20px !important;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
    border: 2px solid #e5e7eb !important;
    text-align: center !important;
    min-height: 180px !important;
    transition: all 0.4s ease !important;
    overflow: visible !important;
    z-index: 1 !important;
  }

  .users-stats .stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    border-radius: 20px 20px 0 0;
  }

  .stat-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  }

  .stat-card.total-users {
    border-color: #4f46e5 !important;
  }

  .stat-card.admin-count {
    border-color: #f59e0b !important;
  }

  .stat-card.accountant-count {
    border-color: #10b981 !important;
  }

  .stat-card.total-users .stat-icon {
    color: #4f46e5;
  }

  .stat-card.admin-count .stat-icon {
    color: #f59e0b;
  }

  .stat-card.accountant-count .stat-icon {
    color: #10b981;
  }

  .stat-icon {
    font-size: 56px;
    margin-bottom: 0;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  }

  .users-stats .stat-card h3,
  .users-stats .stat-card p,
  .users-stats .stat-card .stat-number {
    color: #111827 !important;
    opacity: 1 !important;
    visibility: visible !important;
    display: block !important;
    z-index: 10;
    position: relative;
    text-align: center;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .users-stats .stat-card h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    line-height: 1.3;
    color: #374151 !important;
  }

  .users-stats .stat-card .stat-number,
  .users-stats .stat-card p {
    margin: 0;
    font-size: 42px;
    font-weight: 900;
    line-height: 1.2;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .users-table-container {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.3);
    position: relative;
  }

  .users-table-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
    border-radius: 20px 20px 0 0;
  }

  .users-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 15px;
  }

  .users-table th {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    padding: 20px 24px;
    text-align: left;
    font-weight: 700;
    color: #1e293b;
    border-bottom: 2px solid rgba(226, 232, 240, 0.5);
    white-space: nowrap;
    letter-spacing: 0.3px;
    position: relative;
  }

  .users-table th::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.5), transparent);
  }

  .users-table td {
    padding: 20px 24px;
    border-bottom: 1px solid rgba(243, 244, 246, 0.5);
    vertical-align: middle;
    color: #374151;
    transition: all 0.2s ease;
  }

  .users-table tbody tr {
    transition: all 0.3s ease;
  }

  .users-table tbody tr:hover {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
    transform: scale(1.01);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .role-badge {
    padding: 8px 16px;
    border-radius: 25px;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    position: relative;
    overflow: hidden;
  }

  .role-badge::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  .role-badge:hover::before {
    left: 100%;
  }

  .role-admin {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    color: #dc2626;
    border: 1px solid rgba(220, 38, 38, 0.2);
  }

  .role-accountant {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    color: #d97706;
    border: 1px solid rgba(217, 119, 6, 0.2);
  }

  .role-user {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    color: #2563eb;
    border: 1px solid rgba(37, 99, 235, 0.2);
  }

  .empty-users-state {
    text-align: center;
    padding: 80px 40px;
    color: rgba(107, 114, 128, 0.8);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(15px);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  }

  .empty-users-state .empty-icon {
    font-size: 64px;
    margin-bottom: 20px;
    opacity: 0.6;
  }

  .empty-users-state p {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #6b7280;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
    font-size: 20px;
    color: rgba(107, 114, 128, 0.8);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(15px);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  }

  .unauthorized-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .unauthorized-container {
    text-align: center;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    padding: 60px;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    max-width: 500px;
  }

  .unauthorized-icon {
    font-size: 4rem;
    margin-bottom: 20px;
    opacity: 0.8;
  }

  .unauthorized-container h1 {
    margin: 0 0 15px 0;
    color: #1e293b;
    font-size: 2.5rem;
    font-weight: 800;
  }

  .unauthorized-container p {
    margin: 8px 0;
    color: #6b7280;
    font-size: 1.2rem;
    line-height: 1.6;
  }

  .back-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 14px 28px;
    border-radius: 50px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 25px;
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }

  .back-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
  }

  /* Success Toast */
  .success-toast {
    position: fixed;
    top: 30px;
    right: 30px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    padding: 20px 24px;
    border-radius: 16px;
    box-shadow: 0 12px 40px rgba(16, 185, 129, 0.3);
    display: flex;
    align-items: center;
    gap: 15px;
    font-weight: 600;
    z-index: 1000;
    animation: slideInRight 0.4s ease-out;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .success-icon {
    font-size: 24px;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(8px);
    animation: fadeIn 0.3s ease-out;
  }

  .modal-content {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
    width: 100%;
    max-width: 520px;
    max-height: 90vh;
    overflow-y: auto;
    animation: modalSlideIn 0.4s ease-out;
    border: 1px solid rgba(255, 255, 255, 0.3);
    position: relative;
  }

  .modal-content::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
    border-radius: 24px 24px 0 0;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 32px 40px;
    border-bottom: 1px solid rgba(226, 232, 240, 0.5);
    background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%);
    position: relative;
  }

  .modal-header h3 {
    margin: 0;
    color: #1e293b;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }

  .modal-close {
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(0, 0, 0, 0.1);
    font-size: 24px;
    color: #6b7280;
    cursor: pointer;
    padding: 8px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .modal-close:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    transform: rotate(90deg);
    box-shadow: 0 4px 20px rgba(239, 68, 68, 0.2);
  }

  .modal-form {
    padding: 40px;
  }

  .form-group {
    margin-bottom: 28px;
  }

  .form-group label {
    display: block;
    margin-bottom: 10px;
    color: #374151;
    font-weight: 700;
    font-size: 15px;
    letter-spacing: 0.3px;
  }

  .form-group input,
  .form-group select {
    width: 100%;
    padding: 16px 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    font-size: 16px;
    transition: all 0.3s ease;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    color: #374151;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #667eea;
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
    transform: translateY(-2px);
  }

  .form-group input::placeholder {
    color: #9ca3af;
  }

  .form-group select {
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 16px center;
    background-repeat: no-repeat;
    background-size: 20px;
    padding-right: 50px;
    cursor: pointer;
  }

  .form-group input.error,
  .form-group select.error {
    border-color: #ef4444;
    background: rgba(254, 242, 242, 0.9);
  }

  .error-message {
    display: block;
    margin-top: 8px;
    color: #ef4444;
    font-size: 14px;
    font-weight: 600;
    animation: shake 0.3s ease-in-out;
  }

  .submit-error {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    color: #dc2626;
    padding: 16px 20px;
    border-radius: 12px;
    border: 1px solid rgba(220, 38, 38, 0.2);
    margin-bottom: 28px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 15px;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(220, 38, 38, 0.1);
  }

  .modal-actions {
    display: flex;
    gap: 16px;
    justify-content: flex-end;
    padding: 0 40px 32px 40px;
    border-top: 1px solid rgba(226, 232, 240, 0.5);
    margin-top: 32px;
  }

  .cancel-btn {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    color: #6b7280;
    border: 2px solid rgba(255, 255, 255, 0.3);
    padding: 14px 28px;
    border-radius: 50px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }

  .cancel-btn:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
    color: #dc2626;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.2);
  }

  .submit-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 14px 28px;
    border-radius: 50px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    position: relative;
    overflow: hidden;
  }

  .submit-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  .submit-btn:hover:not(:disabled)::before {
    left: 100%;
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
  }

  .cancel-btn:disabled,
  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  /* Animations */
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes modalSlideIn {
    from {
      transform: scale(0.9) translateY(-20px);
      opacity: 0;
    }
    to {
      transform: scale(1) translateY(0);
      opacity: 1;
    }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }

  @media (max-width: 768px) {
    .users-management {
      padding: 16px;
    }

    .users-management-header {
      padding: 24px 20px;
      flex-direction: column;
      gap: 20px;
      text-align: center;
    }

    .users-management-header h2 {
      font-size: 28px;
    }

    .header-actions {
      flex-direction: column;
      gap: 16px;
      width: 100%;
    }

    .search-input {
      width: 100%;
      max-width: 300px;
    }

    .add-user-btn {
      width: 100%;
      max-width: 200px;
      justify-content: center;
    }

    .users-stats {
      grid-template-columns: 1fr;
      gap: 20px;
    }

    .users-stats .stat-card {
      padding: 24px 20px;
      min-height: 160px;
    }

    .stat-icon {
      font-size: 48px;
    }

    .users-stats .stat-card h3 {
      font-size: 16px;
    }

    .users-stats .stat-card .stat-number {
      font-size: 36px;
    }

    .users-table-container {
      border-radius: 16px;
    }

    .users-table th,
    .users-table td {
      padding: 16px 12px;
      font-size: 14px;
    }

    .modal-content {
      margin: 16px;
      max-width: none;
      border-radius: 20px;
    }

    .modal-header,
    .modal-form {
      padding: 24px 20px;
    }

    .modal-header h3 {
      font-size: 22px;
    }

    .modal-actions {
      padding: 0 20px 24px 20px;
      flex-direction: column;
    }

    .cancel-btn,
    .submit-btn {
      width: 100%;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .users-management-header h2 {
      font-size: 24px;
      flex-direction: column;
      gap: 8px;
    }

    .header-icon {
      font-size: 32px;
    }

    .search-input {
      font-size: 14px;
      padding: 12px 16px;
      padding-right: 45px;
    }

    .add-user-btn {
      padding: 12px 20px;
      font-size: 14px;
    }

    .users-stats .stat-card {
      padding: 20px 16px;
    }

    .stat-icon {
      font-size: 40px;
    }

    .users-stats .stat-card h3 {
      font-size: 14px;
    }

    .users-stats .stat-card .stat-number {
      font-size: 30px;
    }

    .users-table th,
    .users-table td {
      padding: 12px 8px;
      font-size: 13px;
    }

    .modal-form {
      padding: 24px 16px;
    }

    .form-group input,
    .form-group select {
      padding: 14px 16px;
      font-size: 15px;
    }
  }
`}</style>
