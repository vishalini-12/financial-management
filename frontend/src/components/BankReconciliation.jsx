import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { API_BASE_URL, API_ENDPOINTS } from '../utils/api';

const BankReconciliation = ({ user }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    clientName: '',
    bankName: '',
    fromDate: '',
    toDate: '',
    openingBalance: '',
    bankBalance: ''
  });
  const [clients, setClients] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [banksLoading, setBanksLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      // 🔍 DEBUG: Log API configuration
      console.log('🔍 BANK RECONCILIATION - API Config:');
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Clients endpoint:', API_ENDPOINTS.TRANSACTION_CLIENTS);

      const response = await api.get(API_ENDPOINTS.TRANSACTION_CLIENTS);
      setClients(response.data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setClientsLoading(false);
    }
  };

  // Check if user has permission (ADMIN or ACCOUNTANT only)
  if (!user || user.role === 'USER') {
    return (
      <div className="unauthorized-page">
        <div className="unauthorized-container">
          <div className="unauthorized-icon">🚫</div>
          <h1>Access Denied</h1>
          <p>You don't have permission to access Bank Reconciliation.</p>
          <p>This feature is only available for Accountants and Administrators.</p>
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Load banks when client is selected
    if (name === 'clientName' && value) {
      await fetchClientBanks(value);
    }

    // Reset bank selection when client changes
    if (name === 'clientName' && !value) {
      setBanks([]);
      setFormData(prev => ({
        ...prev,
        bankName: ''
      }));
    }

    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear API error when user makes changes
    if (apiError) {
      setApiError('');
    }
  };

  const fetchClientBanks = async (clientName) => {
    try {
      setBanksLoading(true);
      // Populate with sample bank options
      const sampleBanks = [
        'State Bank of India (SBI)',
        'HDFC Bank',
        'ICICI Bank',
        'Axis Bank',
        'Canara Bank',
        'Indian Bank'
      ];
      setBanks(sampleBanks);
    } catch (err) {
      console.error('Error fetching client banks:', err);
      setBanks([]);
    } finally {
      setBanksLoading(false);
    }
  };



  const validateForm = () => {
    const newErrors = {};
    const { clientName, bankName, fromDate, toDate, openingBalance, bankBalance } = formData;

    // Required field validation
    if (!clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }
    if (!bankName || bankName.trim() === '') {
      newErrors.bankName = 'Bank must be selected';
    }
    if (!fromDate.trim()) {
      newErrors.fromDate = 'From date is required';
    }
    if (!toDate.trim()) {
      newErrors.toDate = 'To date is required';
    }
    if (!openingBalance.trim()) {
      newErrors.openingBalance = 'Opening balance is required';
    }
    if (!bankBalance.trim()) {
      newErrors.bankBalance = 'Bank balance is required';
    }

    // Date validation
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      if (from > to) {
        newErrors.toDate = 'To date cannot be before From date';
      }
    }

    // Numeric validation
    if (openingBalance && (isNaN(openingBalance) || parseFloat(openingBalance) < 0)) {
      newErrors.openingBalance = 'Opening balance must be a valid positive number';
    }
    if (bankBalance && (isNaN(bankBalance) || parseFloat(bankBalance) < 0)) {
      newErrors.bankBalance = 'Bank balance must be a valid positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      // 🔍 DEBUG: Log API call and authentication details
      const token = localStorage.getItem('token');
      const role = user?.role;

      console.log('🔍 BANK RECONCILIATION - Authentication Debug:');
      console.log('Token exists:', !!token);
      console.log('Token length:', token?.length || 0);
      console.log('User role:', role);
      console.log('User object:', user);

      console.log('🔍 BANK RECONCILIATION - Submitting reconciliation:');
      console.log('Endpoint:', API_ENDPOINTS.RECONCILIATION_CALCULATE);
      console.log('Request data:', {
        clientName: formData.clientName,
        bankName: formData.bankName,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        openingBalance: parseFloat(formData.openingBalance),
        bankBalance: parseFloat(formData.bankBalance)
      });

      const response = await api.post(API_ENDPOINTS.RECONCILIATION_CALCULATE, {
        clientName: formData.clientName,
        bankName: formData.bankName,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        openingBalance: parseFloat(formData.openingBalance),
        bankBalance: parseFloat(formData.bankBalance)
      });

      console.log('🔍 BANK RECONCILIATION - Response received:', response.data);

      // Success - redirect to client reconciliation page
      const reconciliationId = response.data.reconciliationId;
      navigate(`/client-reconciliation/${reconciliationId}`);

    } catch (err) {
      console.error('Error calculating reconciliation:', err);
      const errorMessage = err.response?.data?.message || 'Failed to calculate reconciliation. Please try again.';
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.clientName.trim() &&
           formData.fromDate.trim() &&
           formData.toDate.trim() &&
           formData.openingBalance.trim() &&
           formData.bankBalance.trim() &&
           Object.keys(errors).length === 0;
  };

  return (
    <div className="add-transaction-page">
      <div className="add-transaction-wrapper">
        <div className="add-transaction-card">
          <div className="add-transaction-header">
            <h2>Bank Reconciliation</h2>
          </div>

          <form onSubmit={handleSubmit} className="add-transaction-form">
            <div className="form-grid">
              {/* Client Name | Bank Name */}
              <div className="form-group">
                <label>Client Name</label>
                {clientsLoading ? (
                  <div className="loading-spinner-small"></div>
                ) : (
                  <select
                    value={formData.clientName}
                    onChange={handleInputChange}
                    name="clientName"
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client} value={client}>{client}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label>Client Bank Name</label>
                {banksLoading ? (
                  <div className="loading-spinner-small"></div>
                ) : (
                  <select
                    value={formData.bankName}
                    onChange={handleInputChange}
                    name="bankName"
                    disabled={!formData.clientName}
                    required
                  >
                    <option value="">
                      {!formData.clientName ? 'Select a client first' : 'Select a bank'}
                    </option>
                    {banks.map(bank => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* From Date | To Date */}
              <div className="form-group">
                <label>From Date</label>
                <input
                  type="date"
                  value={formData.fromDate}
                  onChange={handleInputChange}
                  name="fromDate"
                  required
                />
              </div>

              <div className="form-group">
                <label>To Date</label>
                <input
                  type="date"
                  value={formData.toDate}
                  onChange={handleInputChange}
                  name="toDate"
                  required
                />
              </div>

              {/* Opening Balance | Bank Balance */}
              <div className="form-group">
                <label>Opening Balance</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.openingBalance}
                  onChange={handleInputChange}
                  name="openingBalance"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Bank Closing Balance</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.bankBalance}
                  onChange={handleInputChange}
                  name="bankBalance"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Centered button */}
            <div className="button-row">
              <button type="submit" className="add-transaction-submit-btn" disabled={loading}>
                {loading ? 'Calculating...' : 'Reconcile Bank Statement'}
              </button>
            </div>
          </form>

          {apiError && <div className="add-transaction-error">{apiError}</div>}
        </div>

        {/* Instructions */}
        <div className="instructions-wrapper">
          <div className="instructions-card">
            <h3>How Bank Reconciliation Works</h3>
            <div className="instructions-content">
              <div className="instruction-item">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Select Date Range</h4>
                  <p>Choose the period for which you want to reconcile bank transactions.</p>
                </div>
              </div>
              <div className="instruction-item">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Enter Opening Balance</h4>
                  <p>The account balance at the beginning of the selected period.</p>
                </div>
              </div>
              <div className="instruction-item">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Enter Bank Balance</h4>
                  <p>The closing balance shown in your bank statement for the end date.</p>
                </div>
              </div>
              <div className="instruction-item">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Calculate Reconciliation</h4>
                  <p>The system will calculate: Opening Balance + Credits - Debits = System Balance</p>
                  <p>Then compare: System Balance vs Bank Balance</p>
                  <p><strong>RECONCILED</strong> if they match, <strong>NOT RECONCILED</strong> if they differ.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`

        .instructions-wrapper {
          width: 100%;
          max-width: 650px;
          margin: 0 auto;
          padding: 0 16px;
        }

        .instructions-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          width: 100%;
        }

        .instructions-card h3 {
          margin: 0 0 16px 0;
          color: #1f2937;
          font-size: 1.25rem;
          text-align: center;
        }

        .instructions-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .instruction-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .step-number {
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
          flex-shrink: 0;
        }

        .step-content h4 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 1rem;
          font-weight: 600;
        }

        .step-content p {
          margin: 0;
          color: #6b7280;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .unauthorized-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f8fafc;
        }

        .unauthorized-container {
          text-align: center;
          background: white;
          padding: 60px;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          max-width: 500px;
        }

        .unauthorized-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .unauthorized-container h1 {
          margin: 0 0 10px 0;
          color: #1f2937;
          font-size: 2rem;
        }

        .unauthorized-container p {
          margin: 8px 0;
          color: #6b7280;
          font-size: 1.1rem;
        }

        .back-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
          margin-top: 20px;
        }

        .back-btn:hover {
          transform: translateY(-2px);
        }



        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .instructions-content {
            grid-template-columns: 1fr;
          }

          .header-content {
            flex-direction: column;
            text-align: center;
          }

          .page-header {
            padding: 20px;
          }

          .reconciliation-card {
            padding: 20px;
          }


        }
      `}</style>
    </div>
  );
};

export default BankReconciliation;
