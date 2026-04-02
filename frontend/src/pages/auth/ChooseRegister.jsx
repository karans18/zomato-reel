import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/auth-shared.css';

const ChooseRegister = () => {
  const navigate = useNavigate();

  const goTo = (path) => () => {
    navigate(path);
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card" role="region" aria-labelledby="choose-register-title">
        <header>
          <h1 id="choose-register-title" className="auth-title">Register</h1>
          <p className="auth-subtitle">Pick how you want to join the platform.</p>
        </header>
        <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
          <button type="button" className="auth-submit" onClick={goTo("/user/register")}>
            Register as New User
          </button>
          <button type="button" className="auth-submit" onClick={goTo("/food-partner/register")} style={{ background:'var(--color-surface-alt)', color:'var(--color-text)', border:'1px solid var(--color-border)' }}>
            Register as Food Partner
          </button>
        </div>
        <div className="auth-alt-action" style={{marginTop:'4px'}}>
          Already have an account? <button type="button" className="auth-inline-link" onClick={goTo("/user/login")}>Sign in</button>
        </div>
      </div>
    </div>
  );
};

export default ChooseRegister;
