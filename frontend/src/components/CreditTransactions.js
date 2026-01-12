import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CreditTransactions = ({ user }) => {
  const [creditTransactions, setCreditTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreditTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/transactions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Filter only CREDIT transactions
        const credits = (response.data?.data || []).filter(t => t.type === 'CREDIT');
        setCreditTransactions(credits);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCreditTransactions();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatAmount = (amount) => {
    return parseFloat(amount).toLocaleString();
  };

  return (
    <div className="credit-transactions-section">
      <div className="credit-header">
        <div className="header-icon">◆</div>
        <h2>CREDIT TRANSACTIONS (Money IN)</h2>
      </div>

      {loading ? (
        <div className="loading">Loading credit transactions...</div>
      ) : creditTransactions.length === 0 ? (
        <div className="no-data">No credit transactions found</div>
      ) : (
        <div className="credit-table-container">
          <table className="credit-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Date</th>
                <th>Client</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              {creditTransactions.map(t => {
                let desc = t.description;
                if (t.clientUsername && !desc.startsWith(t.clientUsername + ' - ')) {
                  desc = t.clientUsername + ' - ' + desc;
                }
                return (
                  <tr key={t.id}>
                    <td className="txn-id">TXN-{String(t.id).padStart(3, '0')}</td>
                    <td>{formatDate(t.date)}</td>
                    <td>{t.clientUsername || 'N/A'}</td>
                    <td className="description-cell">{desc}</td>
                    <td>{t.category || 'Miscellaneous'}</td>
                    <td className="amount-cell">{formatAmount(t.amount)}</td>
                    <td>
                      <span className="credit-badge">CREDIT</span>
                    </td>
                    <td className="created-by">{user?.username || 'Unknown'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CreditTransactions;
