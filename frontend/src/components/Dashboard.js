import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import "./Dashboard.css";
import TransactionForm from "./TransactionForm";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          // Optionally, fetch additional user data from API
          const userData = await authService.getUserProfile();
          setUser(userData);
        } else {
          // Should not happen due to ProtectedRoute, but just in case
          navigate("/login");
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Budget Manager Dashboard</h1>
        <div className="user-info">
          {user && (
            <>
              <span>Welcome, {user.username}</span>
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-card">
          <h2>Summary</h2>
          <p>This is your budget dashboard. You are now logged in!</p>
          <p>Your account details:</p>
          {user && (
            <ul>
              <li>
                <strong>Username:</strong> {user.username}
              </li>
              <li>
                <strong>Email:</strong> {user.email}
              </li>
            </ul>
          )}
        </div>

        <TransactionForm />
        <div className="dashboard-card">
          <h2>Recent Transactions</h2>
          <p>Your recent transactions will appear here.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
