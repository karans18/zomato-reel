import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/auth-shared.css';
import axios from 'axios';

const UserLogin = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const email = e.target.email.value.trim();
        const password = e.target.password.value;

        if (!email || !password) {
            setError('Email and password are required.');
            return;
        }

        setLoading(true);
        try {
            await axios.post("/api/auth/user/login", { email, password }, { withCredentials: true });
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-card" role="region" aria-labelledby="user-login-title">
                <header>
                    <h1 id="user-login-title" className="auth-title">Welcome back</h1>
                    <p className="auth-subtitle">Sign in to continue your food journey.</p>
                </header>
                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <div className="field-group">
                        <label htmlFor="email">Email</label>
                        <input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" />
                    </div>
                    <div className="field-group">
                        <label htmlFor="password">Password</label>
                        <input id="password" name="password" type="password" placeholder="••••••••" autoComplete="current-password" />
                    </div>
                    {error && <p className="auth-error" role="alert">{error}</p>}
                    <button className="auth-submit" type="submit" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
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
