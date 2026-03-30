import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

import "../../styles/auth-shared.css";

const UserLogin = ({
  variant = "page",
  onSuccess,
  redirectOnSuccess = true,
  showFoodPartnerShortcut = false,
}) => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (variant !== "page") {
      return;
    }

    let isMounted = true;

    axios
      .get("/api/auth/me", { withCredentials: true })
      .then((response) => {
        if (!isMounted || !response.data.user) {
          return;
        }

        navigate("/", { replace: true });
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [navigate, variant]);

  const isOverlay = variant === "overlay";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const email = event.target.email.value.trim();
    const password = event.target.password.value;

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "/api/auth/user/login",
        { email, password },
        { withCredentials: true },
      );

      if (typeof onSuccess === "function") {
        onSuccess(response.data.user || null);
      }

      if (redirectOnSuccess) {
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`auth-page-wrapper ${isOverlay ? "auth-page-wrapper--overlay" : ""}`}
    >
      {showFoodPartnerShortcut ? (
        <Link
          to="/food-partner/login"
          className="auth-partner-shortcut"
        >
          Login as Food Partner
        </Link>
      ) : null}

      <div
        className={`auth-card ${isOverlay ? "auth-card--overlay" : ""}`}
        role="region"
        aria-labelledby="user-login-title"
      >
        <header>
          <h1 id="user-login-title" className="auth-title">
            Welcome back
          </h1>
          <p className="auth-subtitle">
            Sign in to continue your food journey.
          </p>
        </header>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
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

          {error ? (
            <p className="auth-error" role="alert">
              {error}
            </p>
          ) : null}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-alt-action">
          New here? <Link to="/user/register">Create account</Link>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
