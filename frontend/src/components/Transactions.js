import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

/* ===============================
   API CONFIG (CRITICAL)
================================ */
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("REACT_APP_API_BASE_URL is not defined");
}

/* ===============================
   COMPONENT
================================ */
const Transactions = ({ user }) => {
  const navigate = useNavigate();

  /* ---------- STATE ---------- */
  const [transactions, setTransactions] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [filters, setFilters] = useState({
    type: "All",
    fromDate: "",
    toDate: "",
    client: ""
  });

  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split("T")[0],
    clientName: "",
    description: "",
    amount: "",
    type: "CREDIT",
    category: "Miscellaneous",
    status: "COMPLETED",
    bankName: ""
  });

  const token = localStorage.getItem("token");

  /* ===============================
     FETCH ON LOAD
  ================================ */
  useEffect(() => {
    if (!user || !token) return;
    fetchTransactions();
    fetchClients();
    if (user.role === "ADMIN") fetchUsers();
  }, [user]);

  /* ===============================
     API CALLS
  ================================ */

  const fetchClients = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/transactions/clients`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setClients(res.data || []);
    } catch (err) {
      console.error("Fetch clients error:", err.message);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/admin/users`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(res.data || []);
    } catch (err) {
      console.error("Fetch users error:", err.message);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.type !== "All") params.append("type", filters.type);
      if (filters.fromDate) params.append("fromDate", filters.fromDate);
      if (filters.toDate) params.append("toDate", filters.toDate);
      if (filters.client) params.append("client", filters.client);

      const url = `${API_BASE_URL}/api/transactions${
        params.toString() ? `?${params.toString()}` : ""
      }`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTransactions(res.data || []);
      setFetchError("");
    } catch (err) {
      console.error("Fetch transactions error:", err.message);
      setFetchError("Unable to load transactions");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     ADD TRANSACTION
  ================================ */
  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        ...newTransaction,
        amount: parseFloat(newTransaction.amount)
      };

      await axios.post(
        `${API_BASE_URL}/api/transactions`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewTransaction({
        date: new Date().toISOString().split("T")[0],
        clientName: "",
        description: "",
        amount: "",
        type: "CREDIT",
        category: "Miscellaneous",
        status: "COMPLETED",
        bankName: ""
      });

      await fetchTransactions();
      navigate("/dashboard", { state: { transactionAdded: true } });
      alert("Transaction added successfully");
    } catch (err) {
      console.error("Add transaction error:", err.message);
      setError("Failed to add transaction");
    } finally {
      setSubmitting(false);
    }
  };

  /* ===============================
     DELETE TRANSACTION
  ================================ */
  const deleteTransaction = async (id) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/transactions/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTransactions();
    } catch (err) {
      alert("Delete failed");
    }
  };

  /* ===============================
     RENDER
  ================================ */
  if (!user) {
    return <h3>Please login to view transactions</h3>;
  }

  return (
    <div className="transactions-page">
      <h2>Add New Transaction</h2>

      {/* ADD FORM */}
      <form onSubmit={handleAdd}>
        <input
          value={newTransaction.clientName}
          onChange={(e) =>
            setNewTransaction({ ...newTransaction, clientName: e.target.value })
          }
          placeholder="Client Name"
          required
        />

        <input
          value={newTransaction.amount}
          type="number"
          onChange={(e) =>
            setNewTransaction({ ...newTransaction, amount: e.target.value })
          }
          placeholder="Amount"
          required
        />

        <button disabled={submitting}>
          {submitting ? "Saving..." : "Add Transaction"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <hr />

      {/* TRANSACTIONS TABLE */}
      {loading ? (
        <p>Loading...</p>
      ) : transactions.length === 0 ? (
        <p>No transactions found</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Type</th>
              {user.role === "ACCOUNTANT" && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.date}</td>
                <td>{t.clientName}</td>
                <td>{t.amount}</td>
                <td>{t.type}</td>
                {user.role === "ACCOUNTANT" && (
                  <td>
                    <button onClick={() => deleteTransaction(t.id)}>
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Transactions;
