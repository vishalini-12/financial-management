import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import './axiosConfig'; // Axios config with interceptors
import './App.css';

// Components
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import ViewTransactions from './components/ViewTransactions';
import CreditTransactions from './components/CreditTransactions';
import Reports from './components/Reports';
import UsersManagement from './components/UsersManagement';
import AuditLogs from './components/AuditLogs.jsx';
import BankReconciliation from './components/BankReconciliation';
import ClientReconciliation from './components/ClientReconciliation.jsx';
import ReconciliationDetails from './components/ReconciliationDetails';

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Restore user from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');

    if (token && role) {
      setUser({ username, role });
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('username', userData.username);
    navigate('/dashboard');
  };

  // 🔐 Protected Route Wrapper
  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }

    return children;
  };

  return (
    <div className="App">
      <Routes>

        {/* ================= PUBLIC ROUTES ================= */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/unauthorized"
          element={
            <div className="unauthorized">
              <h2>Access Denied</h2>
              <p>You don't have permission to access this page.</p>
              <button onClick={() => navigate('/login')}>
                Go to Login
              </button>
            </div>
          }
        />

        {/* ================= PROTECTED ROUTES ================= */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <ViewTransactions user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTANT']}>
              <Reports user={user} />
            </ProtectedRoute>
          }
        />

        {/* ================= ADMIN ROUTES ================= */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UsersManagement user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit"
          element={
            <ProtectedRoute>
              <AuditLogs />
            </ProtectedRoute>
          }
        />

        {/* ================= ACCOUNTANT / TRANSACTION ROUTES ================= */}
        <Route
          path="/accountant"
          element={
            <ProtectedRoute allowedRoles={['ACCOUNTANT']}>
              <Transactions user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-transaction"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTANT']}>
              <Transactions user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/credit-transactions"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTANT']}>
              <CreditTransactions user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bank-reconciliation"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTANT']}>
              <BankReconciliation user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/client-reconciliation/:id"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTANT']}>
              <ClientReconciliation user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reconciliation/details/:id"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTANT']}>
              <ReconciliationDetails user={user} />
            </ProtectedRoute>
          }
        />

        {/* ================= DEFAULT ROUTES ================= */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </div>
  );
}

export default App;
