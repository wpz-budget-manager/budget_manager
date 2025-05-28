import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService, { axiosInstance } from "../services/authService";
import "./Dashboard.css";
import TransactionForm from "./TransactionForm";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTransactions = async () => {
    try {
      const res = await axiosInstance.get("/api/transactions/");
      setTransactions(res.data.results);
    } catch (err) {
      console.error("Error loading transactions", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          const userData = await authService.getUserProfile();
          setUser(userData);
          await fetchTransactions();
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Error fetching user or transactions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const totalBalance = transactions.reduce(
    (acc, tx) => acc + parseFloat(tx.amount),
    0,
  );

  const grouped = transactions.reduce((acc, tx) => {
    acc[tx.date] = acc[tx.date] || [];
    acc[tx.date].push(tx);
    return acc;
  }, {});

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Budget Manager Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.username}</span>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-card">
          <h2>Summary</h2>
          <p>
            <strong>Total Balance:</strong>{" "}
            <span className={totalBalance >= 0 ? "income" : "expense"}>
              {totalBalance.toFixed(2)} zł
            </span>
          </p>
          <ul>
            <li>
              <strong>Username:</strong> {user?.username}
            </li>
            <li>
              <strong>Email:</strong> {user?.email}
            </li>
          </ul>
        </div>

        <TransactionForm onAddTransaction={fetchTransactions} />

        <div className="dashboard-card">
          <h2>Recent Transactions</h2>
          {transactions.length === 0 ? (
            <p>No recent transactions.</p>
          ) : (
            Object.entries(grouped).map(([date, txs]) => (
              <div key={date} className="transaction-group">
                <h4 className="transaction-date">{date}</h4>
                {txs.map((tx) => (
                  <div key={tx.id} className="transaction-row">
                    <span
                      className={`transaction-amount ${
                        parseFloat(tx.amount) >= 0 ? "income" : "expense"
                      }`}
                    >
                      {tx.amount} zł
                    </span>
                    <span className="transaction-desc">{tx.description}</span>
                    <span className="transaction-category">
                      {tx.category?.name || "No category"}
                    </span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
