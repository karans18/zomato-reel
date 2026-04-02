import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import "../../styles/auth-shared.css";
import api from "../../lib/api";

const UserLogin = ({
  variant = "page",
  onSuccess,
  redirectOnSuccess = true,
  showFoodPartnerShortcut = false,
  isMinimized = false,
  onMinimize,
  onRestore,
}) => {
  const navigate = useNavigate();
  const { isAuthResolved, isLoggedIn, refreshSession } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (variant !== "page" || !isAuthResolved || !isLoggedIn) {
      return;
    }

    navigate("/", { replace: true });
  }, [isAuthResolved, isLoggedIn, navigate, variant]);

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
      await api.post("/api/auth/user/login", {
        email,
        password,
      });
      const user = await refreshSession();

      if (typeof onSuccess === "function") {
        onSuccess(user);
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
      {isOverlay && !isMinimized ? <div className="auth-overlay-backdrop" /> : null}

      {showFoodPartnerShortcut ? (
        <Link to="/food-partner/login" className="auth-partner-shortcut">
          Login as Food Partner
        </Link>
      ) : null}

      {isOverlay && isMinimized ? (
        <button
          type="button"
          className="auth-overlay-launcher"
          onClick={onRestore}
        >
          Login
        </button>
      ) : null}

      {(!isOverlay || !isMinimized) ? (
        <div
          className={`auth-card ${isOverlay ? "auth-card--overlay" : ""}`}
          role="region"
          aria-labelledby="user-login-title"
        >
          {isOverlay ? (
            <div className="auth-card__top">
              <header className="auth-card__header-copy">
                <h1 id="user-login-title" className="auth-title">
                  Welcome back
                </h1>
                <p className="auth-subtitle">
                  Sign in to continue your food journey.
                </p>
              </header>

              {typeof onMinimize === "function" ? (
                <button
                  type="button"
                  className="auth-overlay-minimize"
                  onClick={onMinimize}
                >
                  Maybe later
                </button>
              ) : null}
            </div>
          ) : (
            <header>
              <h1 id="user-login-title" className="auth-title">
                Welcome back
              </h1>
              <p className="auth-subtitle">
                Sign in to continue your food journey.
              </p>
            </header>
          )}

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
      ) : null}
    </div>
  );
};

export default UserLogin;
