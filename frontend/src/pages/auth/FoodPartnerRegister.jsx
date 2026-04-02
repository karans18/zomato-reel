import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/auth-shared.css';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

const FoodPartnerRegister = () => {
    const navigate = useNavigate();
    const { refreshSession } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const businessName = e.target.businessName.value.trim();
        const contactName = e.target.contactName.value.trim();
        const phone = e.target.phone.value.trim();
        const email = e.target.email.value.trim();
        const password = e.target.password.value;
        const address = e.target.address.value.trim();

        if (!businessName || !contactName || !phone || !email || !password || !address) {
            setError('All fields are required.');
            return;
        }

        setLoading(true);
        try {
            await api.post("/api/auth/food-partner/register", {
                name: businessName,
                contactName,
                phone,
                email,
                password,
                address
            });

            await refreshSession();
            navigate("/create-food");
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-card" role="region" aria-labelledby="partner-register-title">
                <header>
                    <h1 id="partner-register-title" className="auth-title">Partner sign up</h1>
                    <p className="auth-subtitle">Grow your business with our platform.</p>
                </header>
                <nav className="auth-alt-action" style={{ marginTop: '-4px' }}>
                    <strong style={{ fontWeight: 600 }}>Switch:</strong>{' '}
                    <Link to="/user/register">User</Link> •{' '}
                    <Link to="/food-partner/register">Food partner</Link>
                </nav>
                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <div className="field-group">
                        <label htmlFor="businessName">Business Name</label>
                        <input id="businessName" name="businessName" placeholder="Tasty Bites" autoComplete="organization" />
                    </div>
                    <div className="two-col">
                        <div className="field-group">
                            <label htmlFor="contactName">Contact Name</label>
                            <input id="contactName" name="contactName" placeholder="Jane Doe" autoComplete="name" />
                        </div>
                        <div className="field-group">
                            <label htmlFor="phone">Phone</label>
                            <input id="phone" name="phone" placeholder="+1 555 123 4567" autoComplete="tel" />
                        </div>
                    </div>
                    <div className="field-group">
                        <label htmlFor="email">Email</label>
                        <input id="email" name="email" type="email" placeholder="business@example.com" autoComplete="email" />
                    </div>
                    <div className="field-group">
                        <label htmlFor="password">Password</label>
                        <input id="password" name="password" type="password" placeholder="Create password" autoComplete="new-password" />
                    </div>
                    <div className="field-group">
                        <label htmlFor="address">Address</label>
                        <input id="address" name="address" placeholder="123 Market Street" autoComplete="street-address" />
                        <p className="small-note">Full address helps customers find you faster.</p>
                    </div>
                    {error && <p className="auth-error" role="alert">{error}</p>}
                    <button className="auth-submit" type="submit" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Partner Account'}
                    </button>
                </form>
                <div className="auth-alt-action">
                    Already a partner? <Link to="/food-partner/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
};

export default FoodPartnerRegister;
