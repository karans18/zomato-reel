import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/auth-shared.css";
import { useAuth } from "../../context/AuthContext";
import api, { clearStoredAuthToken, storeAuthToken } from "../../lib/api";

const FoodPartnerLogin = () => {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const goTo = (path) => (event) => {
    event.preventDefault();
    event.stopPropagation();
    navigate(path);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/auth/food-partner/login", {
        email,
        password,
      });

      storeAuthToken(response.data?.token || "");

      const user = await refreshSession();

      if (!user) {
        clearStoredAuthToken();
        throw new Error(
          "We couldn't verify your partner session. Please try signing in again.",
        );
      }

      navigate("/create-food");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div
        className="auth-card"
        role="region"
        aria-labelledby="partner-login-title"
      >
        <header>
          <h1 id="partner-login-title" className="auth-title">
            Partner login
          </h1>
          <p className="auth-subtitle">
            Access your dashboard and manage orders.
          </p>
        </header>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="business@example.com"
              autoComplete="email"
            />
          </div>
          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="auth-alt-action">
          New partner?{" "}
          <button
            type="button"
            className="auth-inline-link"
            onClick={goTo("/food-partner/register")}
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodPartnerLogin;
