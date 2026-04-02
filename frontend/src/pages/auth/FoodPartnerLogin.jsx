import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/auth-shared.css';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

const FoodPartnerLogin = () => {
    const navigate = useNavigate();
    const { refreshSession } = useAuth();
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
            await api.post("/api/auth/food-partner/login", { email, password });
            await refreshSession();
            navigate("/create-food");
        } catch (err) {
            setError(err.response?.data?.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-card" role="region" aria-labelledby="partner-login-title">
                <header>
                    <h1 id="partner-login-title" className="auth-title">Partner login</h1>
                    <p className="auth-subtitle">Access your dashboard and manage orders.</p>
                </header>
                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <div className="field-group">
                        <label htmlFor="email">Email</label>
                        <input id="email" name="email" type="email" placeholder="business@example.com" autoComplete="email" />
                    </div>
                    <div className="field-group">
                        <label htmlFor="password">Password</label>
                        <input id="password" name="password" type="password" placeholder="Password" autoComplete="current-password" />
                    </div>
                    {error && <p className="auth-error" role="alert">{error}</p>}
                    <button className="auth-submit" type="submit" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                <div className="auth-alt-action">
                    New partner? <Link to="/food-partner/register">Create an account</Link>
                </div>
            </div>
        </div>
    );
};

export default FoodPartnerLogin;
