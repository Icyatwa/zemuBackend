// frontend/src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://economy-dcpb.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken') || localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API calls
export const login = async (email, password) => {
  const response = await api.post('https://economy-dcpb.onrender.com/api/auth/login', { email, password });
  return response.data;
};

// User Auth API calls
export const userLogin = async (email, password) => {
  const response = await api.post('/users/auth/login', { email, password });
  const data = response.data;

  localStorage.removeItem('userToken');      // clear old key if any
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');

  localStorage.setItem('userAuthToken', data.token);   // ← match the pages
  localStorage.setItem('userId', data.user.id);
  localStorage.setItem('userRole', data.user.role);
  localStorage.setItem('userName', data.user.name);

  return data;
};

export const userLogout = () => {
  localStorage.removeItem('userAuthToken');  // ← was removing 'userToken'
  localStorage.removeItem('userRole');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('userId');
};

export const userRegister = async (name, email, password) => {
  const response = await api.post('/users/auth/register', { name, email, password });
  return response.data;
};

// News API calls
export const getNews = async (params) => {
  const response = await api.get('https://economy-dcpb.onrender.com/api/news', { params });
  return response.data;
};

export const getNewsById = async (id) => {
  const response = await api.get(`https://economy-dcpb.onrender.com/api/news/${id}`);
  return response.data;
};

export const createNews = async (newsData) => {
  const response = await api.post('https://economy-dcpb.onrender.com/api/news', newsData);
  return response.data;
};

export const updateNews = async (id, newsData) => {
  const response = await api.put(`https://economy-dcpb.onrender.com/api/news/${id}`, newsData);
  return response.data;
};

export const deleteNews = async (id) => {
  const response = await api.delete(`https://economy-dcpb.onrender.com/api/news/${id}`);
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get('https://economy-dcpb.onrender.com/api/news/dashboard/stats');
  return response.data;
};

export const getPublishedNews = async (params) => {
  const response = await api.get('https://economy-dcpb.onrender.com/api/news/published', { params });
  return response.data;
};

export const getPublishedNewsById = async (id) => {
  const response = await api.get(`https://economy-dcpb.onrender.com/api/news/published/${id}`);
  return response.data;
};

// Market Data API
export const getMarketData = async (type) => {
  const response = await api.get(`https://economy-dcpb.onrender.com/api/market/${type}`);
  return response.data;
};

export const createMarketItem = async (type, data) => {
  const response = await api.post(`https://economy-dcpb.onrender.com/api/market/${type}`, data);
  return response.data;
};

export const updateMarketItem = async (type, id, data) => {
  const response = await api.put(`https://economy-dcpb.onrender.com/api/market/${type}/${id}`, data);
  return response.data;
};

export const deleteMarketItem = async (type, id) => {
  const response = await api.delete(`https://economy-dcpb.onrender.com/api/market/${type}/${id}`);
  return response.data;
};

export const seedMarketData = async (type, items) => {
  const response = await api.post(`https://economy-dcpb.onrender.com/api/market/${type}/seed`, { items });
  return response.data;
};

export default api;

// UserRegister.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userRegister } from '../services/api';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600&family=Oswald:wght@300;400;500&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');

  .pal-auth-root {
    min-height: 100vh;
    background: #f7f7f7;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    position: relative;
  }
  .pal-auth-root::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: repeating-linear-gradient(90deg, #c8963c 0px, #c8963c 18px, #d4520a 18px, #d4520a 24px, #c8963c 24px, #c8963c 42px, #8c3206 42px, #8c3206 48px);
  }
  .pal-topbar {
    position: absolute; top: 4px; left: 0; right: 0;
    background: #1a1009; height: 44px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .pal-topbar-logo {
    font-family: 'Orbitron', sans-serif; font-size: 0.85rem; font-weight: 600;
    color: #f5efe0; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none;
  }
  .pal-topbar-divider { width: 1px; height: 14px; background: rgba(200,150,60,0.4); }
  .pal-topbar-sub {
    font-family: 'Oswald', sans-serif; font-size: 0.55rem;
    letter-spacing: 0.28em; color: #c8963c; text-transform: uppercase;
  }
  .pal-status-tag {
    display: flex; align-items: center; gap: 7px;
    font-family: 'Oswald', sans-serif; font-size: 0.58rem; letter-spacing: 0.26em;
    text-transform: uppercase; color: #9a8060;
    border: 1px solid rgba(200,150,60,0.3); background: #fff;
    padding: 5px 14px; margin-bottom: 20px; margin-top: 68px;
  }
  .pal-status-dot {
    width: 5px; height: 5px; border-radius: 50%; background: #d4520a;
    animation: palPulse 2s infinite; flex-shrink: 0;
  }
  @keyframes palPulse { 0%,100% { opacity:1; } 50% { opacity:0.25; } }

  .pal-card {
    background: #ffffff; border: 1px solid #e2d9cc; border-top: 3px solid #c8963c;
    width: 100%; max-width: 420px; position: relative;
    box-shadow: 0 2px 20px rgba(0,0,0,0.06);
  }
  .pal-corner { position: absolute; width: 12px; height: 12px; }
  .pal-corner-tl { top: -3px; left: 0; border-top: 2px solid #d4520a; border-left: 2px solid #d4520a; }
  .pal-corner-tr { top: -3px; right: 0; border-top: 2px solid #d4520a; border-right: 2px solid #d4520a; }
  .pal-corner-bl { bottom: 0; left: 0; border-bottom: 2px solid rgba(200,150,60,0.3); border-left: 2px solid rgba(200,150,60,0.3); }
  .pal-corner-br { bottom: 0; right: 0; border-bottom: 2px solid rgba(200,150,60,0.3); border-right: 2px solid rgba(200,150,60,0.3); }
  .pal-card-inner { padding: 32px 32px 28px; }

  .pal-emblem {
    width: 48px; height: 48px; background: #1a1009;
    border: 1px solid rgba(200,150,60,0.5);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px; position: relative;
  }
  .pal-emblem::after { content: ''; position: absolute; inset: 4px; border: 1px solid rgba(200,150,60,0.2); }

  .pal-title {
    font-family: 'Orbitron', sans-serif; font-size: 1rem; font-weight: 600;
    color: #1a1009; text-align: center; letter-spacing: 0.08em;
    text-transform: uppercase; margin: 0 0 4px;
  }
  .pal-subtitle {
    font-family: 'Oswald', sans-serif; font-size: 0.62rem; letter-spacing: 0.28em;
    color: #c8963c; text-align: center; text-transform: uppercase; margin: 0 0 24px;
  }
  .pal-divider {
    height: 1px;
    background: repeating-linear-gradient(90deg, rgba(200,150,60,0.4) 0px, rgba(200,150,60,0.4) 6px, transparent 6px, transparent 10px);
    margin-bottom: 22px;
  }
  .pal-field { margin-bottom: 16px; }
  .pal-label {
    display: block; font-family: 'Oswald', sans-serif; font-size: 0.62rem;
    letter-spacing: 0.22em; color: #6a5a38; text-transform: uppercase; margin-bottom: 6px;
  }
  .pal-input {
    width: 100%; background: #faf9f6;
    border: 1px solid #ddd5c4; border-left: 2px solid #d4520a;
    color: #1a1009; font-family: 'Oswald', sans-serif; font-size: 0.85rem;
    letter-spacing: 0.05em; padding: 10px 12px; box-sizing: border-box;
    outline: none; transition: border-color 0.15s;
  }
  .pal-input:focus { border-color: #c8963c; border-left-color: #d4520a; }
  .pal-input::placeholder { color: #c4b89a; }
  .pal-input-hint {
    font-family: 'Oswald', sans-serif; font-size: 0.58rem;
    letter-spacing: 0.14em; color: #b0a080; margin-top: 5px;
  }
  .pal-btn-primary {
    width: 100%; background: #d4520a; border: 1px solid #8c3206; color: #fff;
    font-family: 'Oswald', sans-serif; font-size: 0.72rem; letter-spacing: 0.26em;
    text-transform: uppercase; padding: 11px 20px; cursor: pointer;
    transition: background 0.15s; margin-top: 8px;
  }
  .pal-btn-primary:hover:not(:disabled) { background: #f07228; }
  .pal-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .pal-error {
    background: #fff3ef; border-left: 2px solid #d4520a;
    font-family: 'Oswald', sans-serif; font-size: 0.72rem; letter-spacing: 0.1em;
    color: #a03a08; padding: 10px 14px; margin-top: 12px;
  }
  .pal-link-row {
    margin-top: 20px; border-top: 1px solid #ede5d8; padding-top: 16px; text-align: center;
  }
  .pal-link-text { font-family: 'Libre Baskerville', serif; font-size: 0.8rem; color: #9a8060; }
  .pal-link-accent { color: #d4520a; text-decoration: none; transition: color 0.15s; }
  .pal-link-accent:hover { color: #f07228; }
  .pal-back {
    font-family: 'Oswald', sans-serif; font-size: 0.6rem; letter-spacing: 0.18em;
    text-transform: uppercase; color: #b0a080; text-align: center;
    margin-top: 14px; display: block; text-decoration: none; transition: color 0.15s;
  }
  .pal-back:hover { color: #6a5a38; }
`;

export default function UserRegister() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', passwordConfirm: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { name, email, password, passwordConfirm } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    if (password !== passwordConfirm) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    try {
      const response = await userRegister(name, email, password);
      localStorage.setItem('userAuthToken', response.token);
      localStorage.setItem('userRole', response.user.role);
      localStorage.setItem('userEmail', response.user.email);
      localStorage.setItem('userName', response.user.name);
      localStorage.setItem('userId', response.user.id);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="pal-auth-root">

        <div className="pal-topbar">
          <Link to="/" className="pal-topbar-logo">Palanomic</Link>
          <div className="pal-topbar-divider" />
          <span className="pal-topbar-sub">Market Intelligence</span>
        </div>

        <div className="pal-status-tag">
          <div className="pal-status-dot" />
          New Enrollment
        </div>

        <div className="pal-card">
          <div className="pal-corner pal-corner-tl" />
          <div className="pal-corner pal-corner-tr" />
          <div className="pal-corner pal-corner-bl" />
          <div className="pal-corner pal-corner-br" />
          <div className="pal-card-inner">

            <div className="pal-emblem">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c8963c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>

            <h1 className="pal-title">Create Account</h1>
            <p className="pal-subtitle">New Enrollment</p>
            <div className="pal-divider" />

            <form onSubmit={handleSubmit}>
              <div className="pal-field">
                <label className="pal-label" htmlFor="name">Full Name</label>
                <input id="name" name="name" className="pal-input" type="text" required value={name} onChange={onChange} placeholder="Your name" />
              </div>
              <div className="pal-field">
                <label className="pal-label" htmlFor="email">Email Address</label>
                <input id="email" name="email" className="pal-input" type="email" autoComplete="email" required value={email} onChange={onChange} placeholder="you@example.com" />
              </div>
              <div className="pal-field">
                <label className="pal-label" htmlFor="password">Password</label>
                <input id="password" name="password" className="pal-input" type="password" required minLength={8} value={password} onChange={onChange} placeholder="••••••••" />
                <div className="pal-input-hint">Minimum 8 characters</div>
              </div>
              <div className="pal-field">
                <label className="pal-label" htmlFor="passwordConfirm">Confirm Password</label>
                <input id="passwordConfirm" name="passwordConfirm" className="pal-input" type="password" required value={passwordConfirm} onChange={onChange} placeholder="••••••••" />
              </div>
              {error && <div className="pal-error">⚠ {error}</div>}
              <button type="submit" disabled={isLoading} className="pal-btn-primary">
                {isLoading ? '◈ Creating Account...' : '⬡ Create Account'}
              </button>
            </form>

            <div className="pal-link-row">
              <span className="pal-link-text">Already enrolled? <Link to="/sign-in" className="pal-link-accent">Sign in →</Link></span>
            </div>
            <Link to="/" className="pal-back">← Return to homepage</Link>
          </div>
        </div>

      </div>
    </>
  );
}

// UserLogin.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userLogin } from '../services/api';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600&family=Oswald:wght@300;400;500&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');

  .pal-auth-root {
    min-height: 100vh;
    background: #f7f7f7;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    position: relative;
  }

  .pal-auth-root::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: repeating-linear-gradient(
      90deg,
      #c8963c 0px, #c8963c 18px,
      #d4520a 18px, #d4520a 24px,
      #c8963c 24px, #c8963c 42px,
      #8c3206 42px, #8c3206 48px
    );
  }

  .pal-topbar {
    position: absolute;
    top: 4px; left: 0; right: 0;
    background: #1a1009;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .pal-topbar-logo {
    font-family: 'Orbitron', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: #f5efe0;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    text-decoration: none;
  }

  .pal-topbar-divider {
    width: 1px; height: 14px;
    background: rgba(200,150,60,0.4);
  }

  .pal-topbar-sub {
    font-family: 'Oswald', sans-serif;
    font-size: 0.55rem;
    letter-spacing: 0.28em;
    color: #c8963c;
    text-transform: uppercase;
  }

  .pal-status-tag {
    display: flex; align-items: center; gap: 7px;
    font-family: 'Oswald', sans-serif; font-size: 0.58rem; letter-spacing: 0.26em;
    text-transform: uppercase; color: #9a8060;
    border: 1px solid rgba(200,150,60,0.3);
    background: #fff;
    padding: 5px 14px;
    margin-bottom: 20px;
    margin-top: 68px;
  }

  .pal-status-dot {
    width: 5px; height: 5px; border-radius: 50%; background: #d4520a;
    animation: palPulse 2s infinite; flex-shrink: 0;
  }
  @keyframes palPulse { 0%,100% { opacity:1; } 50% { opacity:0.25; } }

  .pal-card {
    background: #ffffff;
    border: 1px solid #e2d9cc;
    border-top: 3px solid #c8963c;
    width: 100%; max-width: 420px;
    position: relative;
    box-shadow: 0 2px 20px rgba(0,0,0,0.06);
  }

  .pal-corner { position: absolute; width: 12px; height: 12px; }
  .pal-corner-tl { top: -3px; left: 0; border-top: 2px solid #d4520a; border-left: 2px solid #d4520a; }
  .pal-corner-tr { top: -3px; right: 0; border-top: 2px solid #d4520a; border-right: 2px solid #d4520a; }
  .pal-corner-bl { bottom: 0; left: 0; border-bottom: 2px solid rgba(200,150,60,0.3); border-left: 2px solid rgba(200,150,60,0.3); }
  .pal-corner-br { bottom: 0; right: 0; border-bottom: 2px solid rgba(200,150,60,0.3); border-right: 2px solid rgba(200,150,60,0.3); }

  .pal-card-inner { padding: 32px 32px 28px; }

  .pal-emblem {
    width: 48px; height: 48px;
    background: #1a1009;
    border: 1px solid rgba(200,150,60,0.5);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px; position: relative;
  }
  .pal-emblem::after {
    content: ''; position: absolute; inset: 4px;
    border: 1px solid rgba(200,150,60,0.2);
  }

  .pal-title {
    font-family: 'Orbitron', sans-serif; font-size: 1rem; font-weight: 600;
    color: #1a1009; text-align: center; letter-spacing: 0.08em;
    text-transform: uppercase; margin: 0 0 4px;
  }

  .pal-subtitle {
    font-family: 'Oswald', sans-serif; font-size: 0.62rem; letter-spacing: 0.28em;
    color: #c8963c; text-align: center; text-transform: uppercase; margin: 0 0 24px;
  }

  .pal-divider {
    height: 1px;
    background: repeating-linear-gradient(
      90deg,
      rgba(200,150,60,0.4) 0px, rgba(200,150,60,0.4) 6px,
      transparent 6px, transparent 10px
    );
    margin-bottom: 22px;
  }

  .pal-field { margin-bottom: 16px; }

  .pal-label {
    display: block; font-family: 'Oswald', sans-serif; font-size: 0.62rem;
    letter-spacing: 0.22em; color: #6a5a38; text-transform: uppercase; margin-bottom: 6px;
  }

  .pal-input {
    width: 100%; background: #faf9f6;
    border: 1px solid #ddd5c4; border-left: 2px solid #d4520a;
    color: #1a1009; font-family: 'Oswald', sans-serif; font-size: 0.85rem;
    letter-spacing: 0.05em; padding: 10px 12px; box-sizing: border-box;
    outline: none; transition: border-color 0.15s;
  }
  .pal-input:focus { border-color: #c8963c; border-left-color: #d4520a; }
  .pal-input::placeholder { color: #c4b89a; }

  .pal-btn-primary {
    width: 100%; background: #d4520a; border: 1px solid #8c3206; color: #fff;
    font-family: 'Oswald', sans-serif; font-size: 0.72rem; letter-spacing: 0.26em;
    text-transform: uppercase; padding: 11px 20px; cursor: pointer;
    transition: background 0.15s; margin-top: 8px;
  }
  .pal-btn-primary:hover:not(:disabled) { background: #f07228; }
  .pal-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .pal-error {
    background: #fff3ef; border-left: 2px solid #d4520a;
    font-family: 'Oswald', sans-serif; font-size: 0.72rem; letter-spacing: 0.1em;
    color: #a03a08; padding: 10px 14px; margin-top: 12px;
  }

  .pal-link-row {
    margin-top: 20px; border-top: 1px solid #ede5d8;
    padding-top: 16px; text-align: center;
  }

  .pal-link-text {
    font-family: 'Libre Baskerville', serif; font-size: 0.8rem; color: #9a8060;
  }

  .pal-link-accent { color: #d4520a; text-decoration: none; transition: color 0.15s; }
  .pal-link-accent:hover { color: #f07228; }

  .pal-back {
    font-family: 'Oswald', sans-serif; font-size: 0.6rem; letter-spacing: 0.18em;
    text-transform: uppercase; color: #b0a080; text-align: center;
    margin-top: 14px; display: block; text-decoration: none; transition: color 0.15s;
  }
  .pal-back:hover { color: #6a5a38; }
`;

export default function UserLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await userLogin(email, password);
      localStorage.setItem('userAuthToken', response.token);
      localStorage.setItem('userRole', response.user.role);
      localStorage.setItem('userEmail', response.user.email);
      localStorage.setItem('userName', response.user.name);
      localStorage.setItem('userId', response.user.id);
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="pal-auth-root">

        <div className="pal-topbar">
          <Link to="/" className="pal-topbar-logo">Palanomic</Link>
          <div className="pal-topbar-divider" />
          <span className="pal-topbar-sub">Market Intelligence</span>
        </div>

        <div className="pal-status-tag">
          <div className="pal-status-dot" />
          Secure Terminal
        </div>

        <div className="pal-card">
          <div className="pal-corner pal-corner-tl" />
          <div className="pal-corner pal-corner-tr" />
          <div className="pal-corner pal-corner-bl" />
          <div className="pal-corner pal-corner-br" />
          <div className="pal-card-inner">

            <div className="pal-emblem">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c8963c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>

            <h1 className="pal-title">Sign In</h1>
            <p className="pal-subtitle">Member Access</p>
            <div className="pal-divider" />

            <form onSubmit={handleSubmit}>
              <div className="pal-field">
                <label className="pal-label" htmlFor="email">Email Address</label>
                <input id="email" className="pal-input" type="email" autoComplete="email" required value={email} placeholder="you@example.com" onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="pal-field">
                <label className="pal-label" htmlFor="password">Password</label>
                <input id="password" className="pal-input" type="password" autoComplete="current-password" required value={password} placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error && <div className="pal-error">⚠ {error}</div>}
              <button type="submit" disabled={isLoading} className="pal-btn-primary">
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="pal-link-row">
              <span className="pal-link-text">Don't have an account? <Link to="/sign-up" className="pal-link-accent">Create one →</Link></span>
            </div>
            <Link to="/" className="pal-back">← Return to homepage</Link>
          </div>
        </div>

      </div>
    </>
  );
}

// components/news/ArticleModal.js
import React from 'react';
import X from '../../../icons/red-cross.png';
import User from '../../../icons/user.png';
import Calendar from '../../../icons/calendar (1).png';
import { getCatStyle } from '../../config/categories';
import CommentSection from '../market/CommentSection';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=900&h=900&fit=crop';

const formatDate = d =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const ArticleModal = ({ article, onClose }) => {
  if (!article) return null;
  const cs = getCatStyle(article.category);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">

        {/* Corner accents */}
        {[['top', 'left'], ['top', 'right']].map(([v, h]) => (
          <div key={v + h} style={{
            position: 'absolute', [v]: 10, [h]: 10, width: 20, height: 20, zIndex: 3, opacity: 0.8,
            borderTop: v === 'top' ? '2px solid #ff6600' : 'none',
            borderLeft: h === 'left' ? '2px solid #ff6600' : 'none',
            borderRight: h === 'right' ? '2px solid #ff6600' : 'none',
          }} />
        ))}

        {/* Sticky close button */}
        <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', justifyContent: 'flex-end', pointerEvents: 'none' }}>
          <button
            onClick={onClose}
            style={{
              pointerEvents: 'auto', margin: '14px 14px 0 0',
              background: '#0d0d0d', border: '1px solid #ff6600',
              width: 32, height: 32,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', borderRadius: 2, flexShrink: 0,
            }}
          >
            <img style={{ height: '15px', width: '15px' }} src={X} alt='' />
          </button>
        </div>

        {/* ── Top block ── */}
        <div
          style={{ display: 'grid', gridTemplateColumns: '420px 1fr', borderBottom: '1px solid var(--rule)', marginTop: -46 }}
          className="modal-top-grid"
        >
          {/* Square image */}
          <div style={{ overflow: 'hidden' }}>
            <img
              src={article.imageUrl}
              alt={article.title}
              className="modal-sq-img"
              style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }}
              onError={e => { e.target.src = FALLBACK_IMG; }}
            />
          </div>

          {/* Headline + meta */}
          <div
            className="modal-meta-pad"
            style={{ background: '#0d0d0d', padding: '36px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}
          >
            <span className="cat-pill" style={{ background: cs.bg, color: cs.text, alignSelf: 'flex-start' }}>
              {cs.label}
            </span>
            <h1 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 'clamp(1.25rem,2.2vw,1.9rem)', fontWeight: 700, lineHeight: 1.22, color: '#ffffff', margin: 0 }}>
              {article.title}
            </h1>
            <p style={{ fontFamily: "'Libre Baskerville',serif", fontSize: '0.96rem', color: '#999999', lineHeight: 1.6, margin: 0 }}>
              {article.summary}
            </p>
            <div style={{ borderTop: '1px solid rgba(255,102,0,0.25)', paddingTop: 16, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
              <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: '0.78rem', letterSpacing: '0.08em', color: '#ff9944', display: 'flex', alignItems: 'center', gap: 5 }}>
                <img style={{ height: '12px', width: '12px' }} src={User} alt='' /> {article.author}
              </span>
              <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: '0.78rem', letterSpacing: '0.06em', color: '#555555', display: 'flex', alignItems: 'center', gap: 5 }}>
                {formatDate(article.date)}
                <img style={{ height: '12px', width: '12px' }} src={Calendar} alt='' />
              </span>
            </div>
          </div>
        </div>

        {/* ── Body text ── */}
        <div className="modal-body-pad" style={{ padding: '36px 44px 40px' }}>
          <div style={{
            fontFamily: "'Libre Baskerville',serif", fontSize: '1.02rem',
            color: '#333333', lineHeight: 1.9, whiteSpace: 'pre-line',
            maxWidth: 820, margin: '0 auto',
          }}>
            {article.content}
          </div>
        </div>

        {/* ── Discussion section ── */}
        <div style={{ borderTop: '2px solid rgba(255,102,0,0.2)', maxWidth: 860, margin: '0 auto', width: '100%' }}>
          <CommentSection
            sourceType="news"
            newsId={article._id || article.id}
            newsTitle={article.title}
            itemName={article.title}
          />
        </div>

        {/* Bottom padding */}
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
};

export default ArticleModal;

// components/news/FeaturedArticle.js
import React from 'react';
import User from '../../../icons/user.png';
import ArrowRight from '../../../icons/next.png';
import Calendar from '../../../icons/calendar (1).png';
import { getCatStyle } from '../../config/categories';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1200&h=600&fit=crop';
const THUMB_FALLBACK = 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=200&h=160&fit=crop';

const formatDate = d =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const FeaturedArticle = ({ featuredArticle, sidebarArticles, onOpenModal }) => {
  const cs = getCatStyle(featuredArticle.category);

  const todayStr = new Date().toDateString();
  const todayItems = sidebarArticles
    .filter(a => new Date(a.date).toDateString() === todayStr)
    .slice(0, 4);
  const sidebarItems = todayItems.length >= 2 ? todayItems : sidebarArticles.slice(0, 4);

  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 300px',
        border: '2px solid var(--orange)', borderRadius: 4,
        overflow: 'hidden', background: 'var(--surface)',
      }}>

        {/* ── Left: main featured ── */}
        <div
          style={{ cursor: 'pointer', borderRight: '1px solid var(--rule)', position: 'relative' }}
          onClick={() => onOpenModal(featuredArticle)}
          onMouseOver={e => e.currentTarget.querySelector('.featured-img').style.transform = 'scale(1.03)'}
          onMouseOut={e => e.currentTarget.querySelector('.featured-img').style.transform = 'scale(1)'}
        >
          {/* Hero image */}
          <div style={{ position: 'relative', height: 'clamp(200px,35vw,340px)', overflow: 'hidden' }}>
            <img
              src={featuredArticle.imageUrl}
              alt={featuredArticle.title}
              className="featured-img"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.6s ease' }}
              onError={e => { e.target.src = FALLBACK_IMG; }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,.02) 0%, rgba(0,0,0,.7) 100%)' }} />

            {/* Category badge */}
            <div style={{ position: 'absolute', top: 14, left: 14 }}>
              <span className="cat-pill" style={{ background: cs.bg, color: cs.text }}>
                {cs.label}
              </span>
            </div>

            {/* Cassette corner tick */}
            <div style={{ position: 'absolute', top: 10, right: 10, width: 16, height: 16, borderTop: '2px solid #ff6600', borderRight: '2px solid #ff6600', opacity: 0.7 }} />

            {/* Title overlay */}
            <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
              <p style={{ fontFamily: "'Oswald',sans-serif", fontSize: '0.75rem', letterSpacing: '0.2em', color: '#ff9944', marginBottom: 8, textTransform: 'uppercase' }}>
                Featured Report
              </p>
              <h2 style={{ fontFamily: "'Libre Baskerville',serif", fontSize: 'clamp(1.1rem,2.5vw,1.7rem)', fontWeight: 700, color: '#ffffff', lineHeight: 1.25, margin: 0 }}>
                {featuredArticle.title}
              </h2>
            </div>
          </div>

          {/* Summary bar */}
          <div style={{ padding: '16px 22px', background: '#0d0d0d', borderTop: '1px solid rgba(255,102,0,0.25)' }}>
            <p style={{ fontFamily: "'Libre Baskerville',serif", fontSize: '0.92rem', color: '#aaaaaa', lineHeight: 1.6, margin: '0 0 14px' }}>
              {featuredArticle.summary}
            </p>
            <div style={{ borderTop: '1px solid rgba(255,102,0,0.2)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: '0.75rem', letterSpacing: '0.08em', color: '#ff9944', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <img style={{ height: '11px', width: '11px' }} src={User} alt='' /> {featuredArticle.author}
                </span>
                <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: '0.75rem', letterSpacing: '0.06em', color: '#555555', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <img style={{ height: '11px', width: '11px' }} src={Calendar} alt='' /> {formatDate(featuredArticle.date)}
                </span>
              </div>
              <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: '0.78rem', letterSpacing: '0.12em', color: '#ff6600', display: 'flex', alignItems: 'center', gap: 5 }}>
                READ FULL REPORT <img style={{ height: '13px', width: '13px' }} src={ArrowRight} alt='' />
              </span>
            </div>
          </div>
        </div>

        {/* ── Right: same-day sidebar ── */}
        <div style={{ background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#0d0d0d', padding: '9px 14px', borderBottom: '1px solid #ff6600' }}>
            <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: '0.75rem', letterSpacing: '0.22em', color: '#ff9944', textTransform: 'uppercase' }}>
              More from today
            </span>
          </div>

          {sidebarItems.map(article => {
            const scs = getCatStyle(article.category);
            return (
              <div
                key={article.id}
                onClick={() => onOpenModal(article)}
                style={{
                  padding: '12px 14px', borderBottom: '1px solid var(--rule)',
                  cursor: 'pointer', display: 'grid', gridTemplateColumns: '72px 1fr',
                  gap: 10, alignItems: 'start', transition: 'background 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.background = '#fff3ec'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  style={{ width: 72, height: 56, objectFit: 'cover', borderRadius: 2, display: 'block', flexShrink: 0 }}
                  onError={e => { e.target.src = THUMB_FALLBACK; }}
                />
                <div>
                  <span className="cat-pill" style={{ background: scs.bg, color: scs.text, marginBottom: 5, display: 'inline-block' }}>
                    {scs.label}
                  </span>
                  <h4 style={{
                    fontFamily: "'Libre Baskerville',serif", fontSize: '0.86rem',
                    fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3,
                    margin: '0 0 5px', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {article.title}
                  </h4>
                  <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: '0.72rem', letterSpacing: '0.06em', color: 'var(--ink-lt)' }}>
                    {article.author}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default FeaturedArticle;

// components/news/NewsCard.js
import React from 'react';
import User from '../../../icons/user.png';
import Calendar from '../../../icons/calendar (1).png';
import { getCatStyle } from '../../config/categories';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&h=400&fit=crop';

const formatDate = d =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const NewsCard = ({ article, index, onClick }) => {
  const cs = getCatStyle(article.category);

  return (
    <article className="news-card" onClick={() => onClick(article)}>
      <div className="card-corner tl" />
      <div className="card-corner br" />

      {/* Thumbnail */}
      <div style={{ position: 'relative', height: 175, overflow: 'hidden', borderRadius: '2px 2px 0 0' }}>
        <img
          src={article.imageUrl}
          alt={article.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .4s' }}
          loading={index < 6 ? 'eager' : 'lazy'}
          onMouseOver={e => e.target.style.transform = 'scale(1.04)'}
          onMouseOut={e => e.target.style.transform = 'scale(1)'}
          onError={e => { e.target.src = FALLBACK_IMG; }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 55%,rgba(0,0,0,.55) 100%)' }} />
        <span className="cat-pill" style={{ position: 'absolute', top: 10, left: 10, background: cs.bg, color: cs.text }}>
          {cs.label}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px 16px' }}>
        <h3 style={{
          fontFamily: "'Libre Baskerville',serif", fontSize: '0.97rem', fontWeight: 700,
          lineHeight: 1.35, color: 'var(--ink)', marginBottom: 8,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {article.title}
        </h3>
        <p style={{
          fontFamily: "'Libre Baskerville',serif", fontSize: '0.86rem',
          color: 'var(--ink-lt)', lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          marginBottom: 12,
        }}>
          {article.summary}
        </p>
        <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: '0.72rem', letterSpacing: '0.08em', color: '#555555', display: 'flex', alignItems: 'center', gap: 3 }}>
            <img style={{ height: '10px', width: '10px' }} src={User} alt='' /> {article.author}
          </span>
          <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: '0.72rem', letterSpacing: '0.06em', color: '#555555', display: 'flex', alignItems: 'center', gap: 3 }}>
            <img style={{ height: '10px', width: '10px' }} src={Calendar} alt='' /> {formatDate(article.date)}
          </span>
        </div>
      </div>
    </article>
  );
};

export default NewsCard;

// components/market/CommentSection.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ThumbsUp, Reply, Trash2, Send, ChevronDown, MessageCircle, Repeat2, Bookmark, Share2, ArrowLeft } from 'lucide-react';

const API = process.env.REACT_APP_API_URL || 'https://economy-dcpb.onrender.com/api';
const WORD_LIMIT = 1100;

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(date).toLocaleDateString('en-RW', { month: 'short', day: 'numeric' });
};

const authHeaders = () => {
  const token = localStorage.getItem('userAuthToken');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
};

const isLoggedIn      = () => !!localStorage.getItem('userAuthToken');
const currentUserId   = () => localStorage.getItem('userId');
const currentUserName = () => localStorage.getItem('userName') || 'You';

// ── Auto-grow textarea ────────────────────────────────────────────
const AutoTextarea = ({ value, onChange, placeholder, minRows = 3, disabled = false, autoFocus = false, style = {} }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [value]);
  useEffect(() => { if (autoFocus && ref.current) ref.current.focus(); }, [autoFocus]);
  return (
    <textarea
      ref={ref} value={value} onChange={onChange} placeholder={placeholder}
      disabled={disabled} rows={minRows}
      style={{
        width: '100%', background: 'transparent', border: 'none', outline: 'none',
        resize: 'none', overflow: 'hidden', padding: 0,
        fontFamily: "'Libre Baskerville', serif", fontSize: '0.92rem',
        color: '#111', lineHeight: 1.78, boxSizing: 'border-box', display: 'block',
        ...style,
      }}
    />
  );
};

// ── Avatar ────────────────────────────────────────────────────────
const Avatar = ({ name, size = 38 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: '#fff3ec', border: '1.5px solid rgba(255,102,0,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Oswald', sans-serif", fontWeight: 700,
    fontSize: size > 32 ? '0.8rem' : '0.62rem', color: '#ff6600', userSelect: 'none',
  }}>
    {name?.[0]?.toUpperCase() || '?'}
  </div>
);

const Connector = () => (
  <div style={{
    width: 2, background: '#e8e8e8', borderRadius: 1, margin: '4px auto 0',
    flexShrink: 0, minHeight: 24, alignSelf: 'stretch',
  }} />
);

const ActionBtn = ({ icon, label, onClick, color = '#aaa', hoverColor, hoverBg, active }) => {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseOver={() => setHov(true)} onMouseOut={() => setHov(false)}
      style={{
        background: hov && hoverBg ? hoverBg : 'none', border: 'none',
        cursor: onClick ? 'pointer' : 'default',
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 10px', borderRadius: 20,
        color: active ? (hoverColor || color) : (hov ? (hoverColor || color) : color),
        fontFamily: "'Oswald', sans-serif", fontSize: '0.68rem',
        letterSpacing: '0.06em', transition: 'all 0.12s',
      }}
    >
      {icon}
      {label != null && label > 0 && <span>{label}</span>}
    </button>
  );
};

// ── Compose Box ───────────────────────────────────────────────────
const ComposeBox = ({ placeholder, onSubmit, replyTo = null, autoFocus = false, onCancel = null, isReply = false }) => {
  const [text, setText]             = useState('');
  const [submitting, setSubmitting] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const isOver    = wordCount > WORD_LIMIT;
  const canPost   = text.trim() && !isOver && !submitting;

  const handleSubmit = async () => {
    if (!canPost) return;
    setSubmitting(true);
    await onSubmit(text);
    setText('');
    setSubmitting(false);
  };

  return (
    <div style={{ borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
      {replyTo && (
        <div style={{ padding: '10px 16px 0 66px' }}>
          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.63rem', letterSpacing: '0.1em', color: '#bbb' }}>
            Replying to <span style={{ color: '#ff6600' }}>@{replyTo}</span>
          </span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, padding: '14px 16px 0' }}>
        <Avatar name={currentUserName()} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <AutoTextarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={placeholder}
            minRows={isReply ? 4 : 3}
            autoFocus={autoFocus}
          />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 14px' }}>
        <div>
          {onCancel && (
            <button onClick={onCancel} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Oswald', sans-serif", fontSize: '0.65rem',
              letterSpacing: '0.1em', color: '#bbb',
            }}
              onMouseOver={e => e.currentTarget.style.color = '#666'}
              onMouseOut={e => e.currentTarget.style.color = '#bbb'}
            >CANCEL</button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isOver && (
            <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.68rem', color: '#ef4444' }}>
              Too long
            </span>
          )}
          <button onClick={handleSubmit} disabled={!canPost} style={{
            background: canPost ? '#ff6600' : '#f0f0f0', border: 'none', borderRadius: 20,
            padding: '7px 20px', cursor: canPost ? 'pointer' : 'default',
            color: canPost ? '#fff' : '#bbb',
            fontFamily: "'Oswald', sans-serif", fontSize: '0.72rem',
            letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
          }}>
            <Send style={{ width: 13, height: 13 }} />
            POST
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Single post in the feed ───────────────────────────────────────
const FeedPost = ({ comment, onLike, onDelete, onOpenReplies }) => {
  const liked      = comment.likes?.includes(currentUserId());
  const isOwner    = comment.user === currentUserId() || comment.user?._id === currentUserId();
  const replyCount = comment.replies?.length || 0;

  return (
    <div style={{ borderBottom: '1px solid #f5f5f5' }}>
      <div style={{ display: 'flex', gap: 12, padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 38 }}>
          <Avatar name={comment.userName} size={38} />
          {replyCount > 0 && <Connector />}
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingBottom: 2 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.8rem', fontWeight: 700, color: '#111', letterSpacing: '0.04em' }}>
                {comment.userName}
              </span>
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.65rem', color: '#bbb', marginLeft: 8, letterSpacing: '0.04em' }}>
                · {timeAgo(comment.createdAt)}
              </span>
            </div>
            {isOwner && (
              <button onClick={() => onDelete(comment._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', padding: 2, flexShrink: 0 }}
                onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                onMouseOut={e => e.currentTarget.style.color = '#ddd'}
              >
                <Trash2 style={{ width: 12, height: 12 }} />
              </button>
            )}
          </div>
          <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '0.9rem', color: '#111', lineHeight: 1.8, margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
            {comment.text}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 6, marginLeft: -10 }}>
            <ActionBtn icon={<Reply style={{ width: 15, height: 15 }} />} label={replyCount} onClick={() => onOpenReplies(comment)} hoverColor="#ff6600" hoverBg="rgba(255,102,0,0.06)" />
            <ActionBtn icon={<Repeat2 style={{ width: 15, height: 15 }} />} hoverColor="#00ba7c" hoverBg="rgba(0,186,124,0.06)" />
            <ActionBtn icon={<ThumbsUp style={{ width: 15, height: 15 }} />} label={comment.likes?.length || 0} onClick={() => onLike(comment._id)} active={liked} hoverColor="#ff6600" hoverBg="rgba(255,102,0,0.06)" color={liked ? '#ff6600' : '#aaa'} />
            <ActionBtn icon={<Bookmark style={{ width: 15, height: 15 }} />} hoverColor="#1d9bf0" hoverBg="rgba(29,155,240,0.06)" />
          </div>
        </div>
      </div>
      {replyCount > 0 && (
        <button onClick={() => onOpenReplies(comment)} style={{
          display: 'block', width: '100%', background: 'none', border: 'none',
          padding: '8px 16px 10px 66px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s',
        }}
          onMouseOver={e => e.currentTarget.style.background = '#fafafa'}
          onMouseOut={e => e.currentTarget.style.background = 'none'}
        >
          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.65rem', letterSpacing: '0.12em', color: '#ff6600' }}>
            Show {replyCount} {replyCount === 1 ? 'reply' : 'replies'} ↓
          </span>
        </button>
      )}
    </div>
  );
};

// ── Expanded post view ────────────────────────────────────────────
const ExpandedPost = ({ comment, onLike, onLikeReply, onReply, onDelete, onClose }) => {
  const liked   = comment.likes?.includes(currentUserId());
  const replies = comment.replies || [];

  return (
    <div style={{ background: '#fff', borderBottom: '2px solid #ff6600' }}>
      <button onClick={onClose} style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        background: 'none', border: 'none', borderBottom: '1px solid #f0f0f0',
        padding: '11px 16px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s',
      }}
        onMouseOver={e => e.currentTarget.style.background = '#fafafa'}
        onMouseOut={e => e.currentTarget.style.background = 'none'}
      >
        <ArrowLeft style={{ width: 15, height: 15, color: '#888' }} />
        <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.68rem', letterSpacing: '0.16em', color: '#888', textTransform: 'uppercase' }}>
          Back to feed
        </span>
      </button>

      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Avatar name={comment.userName} size={42} />
          <div>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.82rem', fontWeight: 700, color: '#111', letterSpacing: '0.04em' }}>
              {comment.userName}
            </div>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.63rem', color: '#bbb', letterSpacing: '0.04em' }}>
              {timeAgo(comment.createdAt)}
            </div>
          </div>
        </div>

        <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '0.92rem', color: '#111', lineHeight: 1.82, margin: '0 0 12px', wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
          {comment.text}
        </p>

        <div style={{ borderTop: '1px solid #f0f0f0' }}>
          {(comment.likes?.length > 0 || replies.length > 0) && (
            <div style={{ padding: '10px 0 6px', display: 'flex', gap: 16 }}>
              {comment.likes?.length > 0 && (
                <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.72rem', color: '#555', letterSpacing: '0.06em' }}>
                  <strong style={{ color: '#111' }}>{comment.likes.length}</strong> like{comment.likes.length !== 1 ? 's' : ''}
                </span>
              )}
              {replies.length > 0 && (
                <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.72rem', color: '#555', letterSpacing: '0.06em' }}>
                  <strong style={{ color: '#111' }}>{replies.length}</strong> {replies.length === 1 ? 'reply' : 'replies'}
                </span>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: 0, marginLeft: -10, paddingBottom: 4 }}>
            <ActionBtn icon={<Reply style={{ width: 15, height: 15 }} />} hoverColor="#ff6600" hoverBg="rgba(255,102,0,0.06)" />
            <ActionBtn icon={<Repeat2 style={{ width: 15, height: 15 }} />} hoverColor="#00ba7c" hoverBg="rgba(0,186,124,0.06)" />
            <ActionBtn icon={<ThumbsUp style={{ width: 15, height: 15 }} />} label={comment.likes?.length || 0} onClick={() => onLike(comment._id)} active={liked} color={liked ? '#ff6600' : '#aaa'} hoverColor="#ff6600" hoverBg="rgba(255,102,0,0.06)" />
            <ActionBtn icon={<Share2 style={{ width: 15, height: 15 }} />} hoverColor="#1d9bf0" hoverBg="rgba(29,155,240,0.06)" />
          </div>
        </div>
      </div>

      {replies.length > 0 && (
        <div style={{ borderTop: '1px solid #f0f0f0' }}>
          <div style={{ padding: '8px 16px 4px' }}>
            <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.65rem', letterSpacing: '0.18em', color: '#bbb', textTransform: 'uppercase' }}>
              {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
            </span>
          </div>
          {replies.map((reply, idx) => {
            const replyLiked = reply.likes?.includes(currentUserId());
            const replyOwner = reply.user === currentUserId() || reply.user?._id === currentUserId();
            return (
              <div key={reply._id} style={{ borderBottom: idx < replies.length - 1 ? '1px solid #f9f9f9' : 'none' }}>
                <div style={{ display: 'flex', gap: 12, padding: '12px 16px 0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 34 }}>
                    <Avatar name={reply.userName} size={34} />
                    {idx < replies.length - 1 && <Connector />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingBottom: idx < replies.length - 1 ? 4 : 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <div>
                        <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.75rem', fontWeight: 700, color: '#111', letterSpacing: '0.04em' }}>
                          {reply.userName}
                        </span>
                        <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.62rem', color: '#bbb', marginLeft: 6, letterSpacing: '0.04em' }}>
                          · {timeAgo(reply.createdAt)}
                        </span>
                      </div>
                      {replyOwner && (
                        <button onClick={() => onDelete(comment._id, reply._id, true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', padding: 2 }}
                          onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseOut={e => e.currentTarget.style.color = '#ddd'}
                        >
                          <Trash2 style={{ width: 11, height: 11 }} />
                        </button>
                      )}
                    </div>
                    <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '0.88rem', color: '#111', lineHeight: 1.78, margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
                      {reply.text}
                    </p>
                    <div style={{ display: 'flex', gap: 0, marginTop: 4, marginLeft: -10 }}>
                      <ActionBtn icon={<ThumbsUp style={{ width: 13, height: 13 }} />} label={reply.likes?.length || 0} onClick={() => onLikeReply(comment._id, reply._id)} active={replyLiked} color={replyLiked ? '#ff6600' : '#aaa'} hoverColor="#ff6600" hoverBg="rgba(255,102,0,0.06)" />
                      <ActionBtn icon={<Reply style={{ width: 13, height: 13 }} />} hoverColor="#ff6600" hoverBg="rgba(255,102,0,0.06)" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isLoggedIn() && (
        <div style={{ borderTop: '1px solid #f0f0f0' }}>
          <ComposeBox
            placeholder={`Reply to ${comment.userName}...`}
            replyTo={comment.userName}
            isReply
            onSubmit={async (text) => { await onReply(comment._id, text, null); }}
          />
        </div>
      )}
    </div>
  );
};

// ── Main CommentSection ───────────────────────────────────────────
// Props:
//   sourceType  : 'market' | 'news'
//   marketType  : 'stocks' | 'forex' | 'goods'   (when sourceType='market')
//   sym         : string                           (when sourceType='market')
//   newsId      : string                           (when sourceType='news')
//   newsTitle   : string                           (when sourceType='news')
//   itemName    : display name for placeholder
const CommentSection = ({ sourceType = 'market', marketType, sym, newsId, newsTitle, itemName }) => {
  const [comments,  setComments]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [expanded,  setExpanded]  = useState(null);

  const endpoint = sourceType === 'news'
    ? `${API}/comments/news/${newsId}`
    : `${API}/comments/market/${marketType}/${sym}`;

  const fetchComments = useCallback(async () => {
    if (!isLoggedIn()) { setLoading(false); return; }
    try {
      const res  = await fetch(endpoint, { headers: authHeaders() });
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch { setError('Failed to load comments'); }
    finally { setLoading(false); }
  }, [endpoint]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const submitComment = async (text) => {
    if (!isLoggedIn()) return;
    try {
      const body = sourceType === 'news' ? { text, newsTitle } : { text };
      const res = await fetch(endpoint, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
      });
      if (!res.ok) return;
      const c = await res.json();
      setComments(prev => [c, ...prev]);
    } catch {}
  };

  const handleLike = async (commentId) => {
    if (!isLoggedIn()) return;
    try {
      const res = await fetch(`${API}/comments/${commentId}/like`, { method: 'PATCH', headers: authHeaders() });
      if (!res.ok) return;
      const { liked } = await res.json();
      const uid = currentUserId();
      setComments(prev => prev.map(c => {
        if (c._id !== commentId) return c;
        const likes = liked ? [...(c.likes || []), uid] : (c.likes || []).filter(id => id !== uid);
        return { ...c, likes };
      }));
    } catch {}
  };

  const handleLikeReply = async (commentId, replyId) => {
    if (!isLoggedIn()) return;
    try {
      const res = await fetch(`${API}/comments/${commentId}/replies/${replyId}/like`, { method: 'PATCH', headers: authHeaders() });
      if (!res.ok) return;
      const { liked } = await res.json();
      const uid = currentUserId();
      setComments(prev => prev.map(c => {
        if (c._id !== commentId) return c;
        return {
          ...c,
          replies: c.replies.map(r => {
            if (r._id !== replyId) return r;
            const likes = liked ? [...(r.likes || []), uid] : (r.likes || []).filter(id => id !== uid);
            return { ...r, likes };
          }),
        };
      }));
    } catch {}
  };

  const handleReply = async (commentId, replyText, parentReplyId = null) => {
    try {
      const res = await fetch(`${API}/comments/${commentId}/replies`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ text: replyText, parentReplyId }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setComments(prev => prev.map(c => c._id === commentId ? updated : c));
    } catch {}
  };

  const handleDelete = async (commentId) => {
    try {
      const res = await fetch(`${API}/comments/${commentId}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) return;
      setComments(prev => prev.filter(c => c._id !== commentId));
      if (expanded === commentId) setExpanded(null);
    } catch {}
  };

  const totalReplies    = comments.reduce((sum, c) => sum + (c.replies?.length || 0), 0);
  const expandedComment = expanded ? comments.find(c => c._id === expanded) : null;
  const sectionLabel    = sourceType === 'news' ? 'Article Discussion' : 'Market Opinions';
  const composePlaceholder = sourceType === 'news'
    ? `What do you think about this article?`
    : `What's your take on ${itemName}?`;

  return (
    <div style={{ background: '#ffffff', borderTop: '1px solid #ebebeb' }}>
      <button
        onClick={() => { setCollapsed(v => !v); setExpanded(null); }}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '13px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: collapsed ? 'none' : '1px solid #f0f0f0', transition: 'background 0.15s',
        }}
        onMouseOver={e => e.currentTarget.style.background = '#fafafa'}
        onMouseOut={e => e.currentTarget.style.background = 'none'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MessageCircle style={{ width: 15, height: 15, color: '#ff6600' }} />
          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.72rem', letterSpacing: '0.22em', color: '#ff6600', textTransform: 'uppercase' }}>
            {sectionLabel}
          </span>
          {(comments.length + totalReplies) > 0 && (
            <span style={{
              background: '#fff3ec', border: '1px solid rgba(255,102,0,0.2)',
              borderRadius: 10, padding: '1px 8px',
              fontFamily: "'Oswald', sans-serif", fontSize: '0.63rem', color: '#cc4400', letterSpacing: '0.1em',
            }}>
              {comments.length + totalReplies}
            </span>
          )}
        </div>
        <ChevronDown style={{
          width: 14, height: 14, color: '#bbb',
          transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
          transition: 'transform 0.2s',
        }} />
      </button>

      {!collapsed && (
        <>
          {expandedComment ? (
            <ExpandedPost
              comment={expandedComment}
              onLike={handleLike}
              onLikeReply={handleLikeReply}
              onReply={handleReply}
              onDelete={handleDelete}
              onClose={() => setExpanded(null)}
            />
          ) : (
            <>
              {isLoggedIn() ? (
                <ComposeBox placeholder={composePlaceholder} onSubmit={submitComment} />
              ) : (
                <div style={{ padding: '20px 16px', borderBottom: '1px solid #f0f0f0', textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic', fontSize: '0.85rem', color: '#bbb', margin: 0 }}>
                    Sign in to share your thoughts.
                  </p>
                </div>
              )}

              {error && (
                <div style={{ padding: '8px 16px', fontFamily: "'Oswald', sans-serif", fontSize: '0.68rem', color: '#ef4444' }}>
                  ⚠ {error}
                </div>
              )}

              {!isLoggedIn() ? (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic', fontSize: '0.85rem', color: '#ccc', margin: 0 }}>
                    Sign in to read and join the discussion.
                  </p>
                </div>
              ) : loading ? (
                <div style={{ padding: '16px' }}>
                  {[...Array(2)].map((_, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#f0f0f0', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 11, background: '#f0f0f0', borderRadius: 2, marginBottom: 8, width: '28%' }} />
                        <div style={{ height: 11, background: '#f5f5f5', borderRadius: 2, marginBottom: 6 }} />
                        <div style={{ height: 11, background: '#f5f5f5', borderRadius: 2, width: '65%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div style={{ padding: '36px 16px', textAlign: 'center' }}>
                  <MessageCircle style={{ width: 28, height: 28, color: '#e8e8e8', margin: '0 auto 10px', display: 'block' }} />
                  <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.7rem', letterSpacing: '0.18em', color: '#ccc', textTransform: 'uppercase', margin: '0 0 6px' }}>
                    No discussion yet
                  </p>
                  <p style={{ fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic', fontSize: '0.82rem', color: '#bbb', margin: 0 }}>
                    Be the first to share your analysis.
                  </p>
                </div>
              ) : (
                <div>
                  {comments.map(comment => (
                    <FeedPost
                      key={comment._id}
                      comment={comment}
                      onLike={handleLike}
                      onDelete={handleDelete}
                      onOpenReplies={(c) => setExpanded(c._id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CommentSection;

// components/market/MarketPanel.js
import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import CommentSection from './CommentSection';

const dirColor = (dir) =>
  dir === 'up' ? '#2a9a2a' : dir === 'dn' ? '#cc2222' : '#cc5500';

const DirIcon = ({ dir, size = 12 }) => {
  if (dir === 'up') return <TrendingUp style={{ width: size, height: size, color: '#2a9a2a' }} />;
  if (dir === 'dn') return <TrendingDown style={{ width: size, height: size, color: '#cc2222' }} />;
  return <Minus style={{ width: size, height: size, color: '#cc5500' }} />;
};

const MarketPanel = ({ items, title, onClose, marketType }) => {
  const [selected, setSelected] = useState(null);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 100,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '24px 12px', overflowY: 'auto',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#ffffff', border: '2px solid #ff6600', borderRadius: 4,
        width: '100%', maxWidth: 1100, overflow: 'hidden',
        fontFamily: "'Libre Baskerville', serif",
      }}>

        {/* ── Header ── */}
        <div style={{
          background: '#0d0d0d', padding: '14px 22px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '2px solid #ff6600',
        }}>
          <span style={{
            fontFamily: "'Oswald', sans-serif", fontSize: '0.82rem',
            letterSpacing: '0.2em', color: '#ff6600', textTransform: 'uppercase',
          }}>
            {title}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: '1px solid #ff6600', color: '#ff6600',
              width: 28, height: 28, borderRadius: 2, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>

        {/* ── Grid of items ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
          gap: 1, background: '#e0e0e0',
        }}>
          {items.map(item => (
            <div
              key={item.sym}
              onClick={() => setSelected(selected?.sym === item.sym ? null : item)}
              style={{
                background: selected?.sym === item.sym ? '#0d0d0d' : '#ffffff',
                padding: '11px 13px', cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseOver={e => { if (selected?.sym !== item.sym) e.currentTarget.style.background = '#fff3ec'; }}
              onMouseOut={e => { if (selected?.sym !== item.sym) e.currentTarget.style.background = '#ffffff'; }}
            >
              <div style={{
                fontFamily: "'Oswald', sans-serif", fontSize: '0.7rem', letterSpacing: '0.1em',
                color: selected?.sym === item.sym ? '#ff6600' : '#999999', marginBottom: 2,
              }}>
                {item.flag || ''} {item.sym}
              </div>
              <div style={{
                fontFamily: "'Libre Baskerville', serif", fontSize: '0.78rem', fontWeight: 700,
                color: selected?.sym === item.sym ? '#ff9944' : '#0d0d0d',
                lineHeight: 1.25, marginBottom: 4,
              }}>
                {item.name}
              </div>
              <div style={{
                fontFamily: "'Oswald', sans-serif", fontSize: '0.88rem', fontWeight: 700,
                color: selected?.sym === item.sym ? '#ffffff' : '#0d0d0d',
              }}>
                {item.price}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <DirIcon dir={item.chgDir} />
                <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.68rem', color: dirColor(item.chgDir) }}>
                  {item.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Explainer + Comments ── */}
        <div style={{ background: '#ffffff', borderTop: '2px solid #ff6600' }}>
          {!selected ? (
            <div style={{ padding: '32px 28px', minHeight: 100 }}>
              <p style={{
                fontFamily: "'Oswald', sans-serif", fontSize: '0.82rem', letterSpacing: '0.14em',
                color: '#bbbbbb', textAlign: 'center', textTransform: 'uppercase',
              }}>
                Click any item above to understand what's driving it — in plain language
              </p>
            </div>
          ) : (
            <>
              {/* Explainer */}
              <div style={{ padding: '22px 28px 20px', borderBottom: '1px solid #ebebeb' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: "'Oswald', sans-serif", fontSize: '0.8rem',
                    letterSpacing: '0.12em', color: '#ff6600', textTransform: 'uppercase',
                  }}>
                    {selected.flag || ''} {selected.name} ({selected.sym})
                  </span>
                  <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#0d0d0d' }}>
                    {selected.price}
                  </span>
                  <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.8rem', color: dirColor(selected.chgDir) }}>
                    {selected.chgDir === 'up' ? '▲' : selected.chgDir === 'dn' ? '▼' : '—'} {selected.change}
                  </span>
                </div>

                <p style={{
                  fontFamily: "'Libre Baskerville', serif", fontSize: '0.92rem',
                  color: '#1a1a1a', lineHeight: 1.8, marginBottom: 16,
                }}>
                  {selected.explain}
                </p>

                <div style={{
                  borderLeft: '3px solid #ff6600', paddingLeft: 14,
                  background: '#fff8f3', padding: '12px 16px',
                  borderRadius: '0 3px 3px 0',
                }}>
                  <div style={{
                    fontFamily: "'Oswald', sans-serif", fontSize: '0.68rem',
                    letterSpacing: '0.22em', color: '#ff6600', marginBottom: 6, textTransform: 'uppercase',
                  }}>
                    What this means for everyday Rwandans
                  </div>
                  <p style={{
                    fontFamily: "'Libre Baskerville', serif", fontSize: '0.9rem',
                    color: '#1a1a1a', lineHeight: 1.75, margin: 0,
                  }}>
                    {selected.eli5}
                  </p>
                </div>
              </div>

              {/* Comment section — sourceType='market' */}
              <CommentSection
                sourceType="market"
                marketType={marketType}
                sym={selected.sym}
                itemName={selected.name}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketPanel;

// components/market/MarketTickers.js
import React from 'react';
import SmartTickerRow from './SmartTickerRow';

const MarketTickers = ({ forexData, rseStocks, goodsData }) => (
  <>
    <SmartTickerRow
      items={forexData}
      label="FOREX BUREAU"
      bg="#0a1520"
      labelBg="#060e18"
      labelColor="#7ab8f5"
      panelTitle="Forex Bureau — RWF Exchange Rates · Click any currency to understand it"
      duration="55s"
      marketType="forex"
    />
    <SmartTickerRow
      items={rseStocks}
      label="RSE STOCKS"
      bg="#0d0d0d"
      labelBg="#050505"
      labelColor="#ff6600"
      panelTitle="Rwanda Stock Exchange (RSE) — All 10 Listed Companies · Click any stock to understand it"
      duration="48s"
      marketType="stocks"
    />
    <SmartTickerRow
      items={goodsData}
      label="MARKET PRICES"
      bg="#1a0a00"
      labelBg="#0f0600"
      labelColor="#ff9944"
      panelTitle="Kigali Market Prices — Key Commodities & Exports · Click any item to understand it"
      duration="38s"
      marketType="goods"
    />
  </>
);

export default MarketTickers;

// components/market/SmartTickerRow.js
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import MarketPanel from './MarketPanel';

const dirColor = (dir) =>
  dir === 'up' ? '#4ddd4d' : dir === 'dn' ? '#ff5555' : '#ff9944';

const SmartTickerRow = ({
  items,
  label,
  bg,
  labelBg,
  labelColor,
  panelTitle,
  duration = '45s',
  marketType,
}) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const animName = `ticker_${label.replace(/\s+/g, '_')}`;

  return (
    <>
      <div style={{
        background: bg, borderBottom: '1px solid rgba(255,102,0,0.25)',
        display: 'flex', alignItems: 'stretch', overflow: 'hidden', position: 'relative',
      }}>

        {/* ── Label / open button ── */}
        <button
          onClick={() => setPanelOpen(true)}
          style={{
            flexShrink: 0, background: labelBg, padding: '0 14px',
            border: 'none', borderRight: '1px solid rgba(255,102,0,0.3)',
            cursor: 'pointer', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 2, minWidth: 96,
            transition: 'opacity 0.15s',
          }}
          onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
        >
          <span style={{
            fontFamily: "'Oswald',sans-serif", fontSize: '0.68rem', letterSpacing: '0.18em',
            color: labelColor, textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>
            {label}
          </span>
          <span style={{
            fontFamily: "'Oswald',sans-serif", fontSize: '0.62rem', letterSpacing: '0.1em',
            color: labelColor, opacity: 0.55, display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <ChevronDown style={{ width: 9, height: 9 }} /> VIEW ALL
          </span>
        </button>

        {/* ── Scrolling ticker ── */}
        <div style={{ position: 'relative', overflow: 'hidden', flex: 1, display: 'flex', alignItems: 'center', padding: '6px 0' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 28,
            background: `linear-gradient(to right,${bg},transparent)`, zIndex: 1, pointerEvents: 'none',
          }} />
          <div style={{
            display: 'flex', whiteSpace: 'nowrap',
            animation: `${animName} ${duration} linear infinite`,
          }}>
            {[...items, ...items].map((item, i) => (
              <span
                key={i}
                onClick={() => setPanelOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0 18px',
                  fontFamily: "'Oswald',sans-serif", fontSize: '0.78rem', letterSpacing: '0.07em',
                  whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
                }}
                onMouseOver={e => e.currentTarget.style.opacity = '0.7'}
                onMouseOut={e => e.currentTarget.style.opacity = '1'}
              >
                {item.flag && <span style={{ fontSize: '0.85rem' }}>{item.flag}</span>}
                <span style={{ color: labelColor, fontWeight: 600 }}>{item.sym}</span>
                <span style={{ color: '#ffffff' }}>{item.price}</span>
                <span style={{ color: dirColor(item.chgDir), fontSize: '0.72rem' }}>
                  {item.chgDir === 'up' ? '▲' : item.chgDir === 'dn' ? '▼' : '—'} {item.change}
                </span>
              </span>
            ))}
          </div>
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 28,
            background: `linear-gradient(to left,${bg},transparent)`, zIndex: 1, pointerEvents: 'none',
          }} />
        </div>

        <style>{`@keyframes ${animName}{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
      </div>

      {panelOpen && (
        <MarketPanel
          items={items}
          title={panelTitle}
          marketType={marketType}   // ← add this
          onClose={() => setPanelOpen(false)}
        />
      )}
    </>
  );
};

export default SmartTickerRow;

// pages/MyActivity.js  — Palanomic · Cassette Futurism
import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import MessageIconOrange from '../../icons/message.png';
import MessageIconDarker from '../../icons/speech-bubble.png';
import MessageIconLighter from '../../icons/speech-bubble (1).png';
import ThumbsUp from '../../icons/like.png';
import ReplyLighter from '../../icons/reply.png';
import ReplyOrange from '../../icons/reply (1).png';
import Loader from '../../icons/loader.png';

const API = process.env.REACT_APP_API_URL || 'https://economy-dcpb.onrender.com/api';

const authHeaders = () => {
  const token = localStorage.getItem('userAuthToken');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
};

const isLoggedIn    = () => !!localStorage.getItem('userAuthToken');
const currentUserId = () => localStorage.getItem('userId');

const timeAgo = (date) => {
  if (!date) return '';
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-RW', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ── Avatar ────────────────────────────────────────────────────────
const Avatar = ({ name, size = 34 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: '#fff3ec', border: '1.5px solid rgba(255,102,0,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Oswald', sans-serif", fontWeight: 700,
    fontSize: size > 30 ? '0.82rem' : '0.7rem', color: '#ff6600', userSelect: 'none',
  }}>
    {name?.[0]?.toUpperCase() || '?'}
  </div>
);

// ── Source badge ──────────────────────────────────────────────────
const SourceBadge = ({ sourceType, marketType, sym, newsTitle }) => {
  const isMarket = sourceType === 'market';
  const marketColors = { stocks: '#0d6620', forex: '#0a3a6e', goods: '#6e3a0a' };
  const bg = isMarket ? (marketColors[marketType] || '#333') : '#1a0a2e';
  const label = isMarket
    ? `${marketType?.toUpperCase()} · ${sym}`
    : 'NEWS ARTICLE';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        fontFamily: "'Oswald', sans-serif", fontSize: '0.75rem', letterSpacing: '0.14em',
        background: bg, color: isMarket ? '#ff9944' : '#c4b5fd',
        padding: '3px 9px', borderRadius: 2, textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  );
};

// ── Single comment bubble ─────────────────────────────────────────
const CommentBubble = ({ comment, isCurrentUser }) => {
  const [showReplies, setShowReplies] = useState(false);
  const parts    = comment.text?.split('\n\n──\n\n') || [comment.text || ''];
  const isThread = parts.length > 1;
  const replyCount = comment.replies?.length || 0;
  const uid = currentUserId();

  const userReplied = comment.replies?.some(
    r => r.user === uid || r.user?._id === uid
  );

  return (
    <div style={{
      background: isCurrentUser ? '#fff8f3' : '#ffffff',
      border: `1px solid ${isCurrentUser ? 'rgba(255,102,0,0.2)' : '#f0f0f0'}`,
      borderLeft: `3px solid ${isCurrentUser ? '#ff6600' : '#e0e0e0'}`,
      borderRadius: '0 4px 4px 0',
      marginBottom: 10,
      transition: 'box-shadow 0.15s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={comment.userName} size={28} />
          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.82rem', fontWeight: 700, color: isCurrentUser ? '#ff6600' : '#333', letterSpacing: '0.04em' }}>
            {isCurrentUser ? 'You' : comment.userName}
          </span>
          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.72rem', color: '#bbb', letterSpacing: '0.04em' }}>
            · {timeAgo(comment.createdAt)}
          </span>
          {isThread && (
            <span style={{
              background: '#fff3ec', border: '1px solid rgba(255,102,0,0.2)', borderRadius: 10,
              padding: '2px 8px', fontFamily: "'Oswald', sans-serif",
              fontSize: '0.68rem', letterSpacing: '0.1em', color: '#cc5500',
            }}>THREAD</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {comment.likes?.length > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: "'Oswald', sans-serif", fontSize: '0.75rem', color: '#bbb' }}>
              <img src={ThumbsUp} alt='' style={{width: '12px', height:'12px'}} /> {comment.likes.length}
            </span>
          )}
        </div>
      </div>

      {/* Text */}
      <div style={{ padding: '0 14px 10px' }}>
        <p style={{
          fontFamily: "'Libre Baskerville', serif", fontSize: '0.95rem',
          color: '#222', lineHeight: 1.75, margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-line',
        }}>
          {parts[0]}
        </p>
        {isThread && (
          <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.72rem', letterSpacing: '0.1em', color: '#ff9944', marginTop: 6, marginBottom: 0 }}>
            + {parts.length - 1} more thread part{parts.length > 2 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Replies toggle */}
      {replyCount > 0 && (
        <>
          <button
            onClick={() => setShowReplies(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              width: '100%', background: 'none', border: 'none',
              borderTop: '1px solid #f5f5f5', padding: '8px 14px',
              cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s',
            }}
            onMouseOver={e => e.currentTarget.style.background = '#fafafa'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
          >
            <img src={ReplyLighter} alt='' style={{ width: 13, height: 13, color: '#bbb' }} />
            <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.75rem', letterSpacing: '0.1em', color: userReplied ? '#ff6600' : '#bbb' }}>
              {replyCount} {replyCount === 1 ? 'REPLY' : 'REPLIES'}
              {userReplied && ' · YOU REPLIED'}
            </span>
            <ChevronRight style={{
              width: 12, height: 12, color: '#bbb', marginLeft: 'auto',
              transform: showReplies ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.18s',
            }} />
          </button>

          {showReplies && (
            <div style={{ borderTop: '1px solid #f8f8f8', padding: '8px 14px 10px' }}>
              {comment.replies.map((reply, idx) => {
                const replyIsMe = reply.user === uid || reply.user?._id === uid;
                return (
                  <div key={reply._id || idx} style={{
                    display: 'flex', gap: 8, padding: '7px 0',
                    borderBottom: idx < comment.replies.length - 1 ? '1px solid #f8f8f8' : 'none',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
                      <Avatar name={reply.userName} size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{
                          fontFamily: "'Oswald', sans-serif", fontSize: '0.78rem', fontWeight: 700,
                          color: replyIsMe ? '#ff6600' : '#555', letterSpacing: '0.04em',
                        }}>
                          {replyIsMe ? 'You' : reply.userName}
                        </span>
                        <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.7rem', color: '#bbb', letterSpacing: '0.04em' }}>
                          · {timeAgo(reply.createdAt)}
                        </span>
                        {reply.likes?.length > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontFamily: "'Oswald', sans-serif", fontSize: '0.7rem', color: '#bbb', marginLeft: 'auto' }}>
                            <img src={ThumbsUp} alt='' style={{width: '12px', height:'12px'}} /> {reply.likes.length}
                          </span>
                        )}
                      </div>
                      <p style={{
                        fontFamily: "'Libre Baskerville', serif", fontSize: '0.92rem',
                        color: '#333', lineHeight: 1.65, margin: 0, wordBreak: 'break-word',
                      }}>
                        {reply.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Market context card ───────────────────────────────────────────
const MarketContextCard = ({ item, marketType }) => {
  if (!item) return null;
  const dirColor = d => d === 'up' ? '#2a9a2a' : d === 'dn' ? '#cc2222' : '#cc5500';
  const dirArrow = d => d === 'up' ? '▲' : d === 'dn' ? '▼' : '—';
  const typeColors = {
    stocks: { bg: '#e8f5e9', border: '#2a9a2a', label: '#1a6e1a' },
    forex:  { bg: '#e3f0fb', border: '#1a5fa8', label: '#0a3a6e' },
    goods:  { bg: '#fdf3e3', border: '#c47a1a', label: '#6e3a0a' }
  };
  const tc = typeColors[marketType] || typeColors.stocks;

  return (
    <div style={{
      background: tc.bg, border: `1px solid ${tc.border}`,
      borderRadius: 3, padding: '12px 16px', marginBottom: 14,
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            fontFamily: "'Oswald', sans-serif", fontSize: '0.72rem', letterSpacing: '0.18em',
            background: tc.border, color: '#fff', padding: '2px 7px', borderRadius: 2, textTransform: 'uppercase',
          }}>{marketType}</span>
          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.08em', color: tc.label }}>
            {item.sym}
          </span>
          {item.flag && <span style={{ fontSize: '1.1rem' }}>{item.flag}</span>}
        </div>
        <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '0.95rem', fontWeight: 700, color: '#0d0d0d', marginBottom: 2 }}>
          {item.name}
        </div>
        {item.sector && (
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.72rem', letterSpacing: '0.1em', color: '#888', textTransform: 'uppercase' }}>
            {item.sector}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.25rem', fontWeight: 700, color: '#0d0d0d', letterSpacing: '0.04em' }}>
          {item.price}
        </div>
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.85rem', color: dirColor(item.chgDir), letterSpacing: '0.06em' }}>
          {dirArrow(item.chgDir)} {item.change}
        </div>
      </div>
      {item.explain && (
        <div style={{
          width: '100%', borderTop: `1px solid ${tc.border}`, paddingTop: 10, marginTop: 2,
          fontFamily: "'Libre Baskerville', serif", fontSize: '0.92rem', color: '#333', lineHeight: 1.7,
        }}>
          {item.explain}
        </div>
      )}
    </div>
  );
};

// ── News context card ─────────────────────────────────────────────
const NewsContextCard = ({ article }) => {
  const [expanded, setExpanded] = useState(false);
  if (!article) return null;
  const catColors = {
    growth:     { bg: '#e8f5e9', text: '#1a6e1a' },
    investment: { bg: '#e3f0fb', text: '#0a3a6e' },
    trade:      { bg: '#fdf3e3', text: '#6e3a0a' },
    policy:     { bg: '#f3e8ff', text: '#4a1a8a' },
    other:      { bg: '#f0f0f0', text: '#444'    }
  };
  const cc = catColors[article.category] || catColors.other;

  return (
    <div style={{
      background: '#faf8ff', border: '1px solid rgba(124,58,237,0.25)',
      borderRadius: 3, padding: '14px 16px', marginBottom: 14,
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {article.image && (
          <img
            src={article.image}
            alt=""
            style={{ width: 80, height: 62, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: "'Oswald', sans-serif", fontSize: '0.72rem', letterSpacing: '0.14em',
              background: cc.bg, color: cc.text, padding: '3px 8px', borderRadius: 2, textTransform: 'uppercase',
            }}>{article.category}</span>
            <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.75rem', color: '#aaa', letterSpacing: '0.06em' }}>
              {article.author} · {new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h4 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '1rem', fontWeight: 700, color: '#0d0d0d', lineHeight: 1.3, margin: '0 0 6px' }}>
            {article.title}
          </h4>
          <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '0.92rem', color: '#555', lineHeight: 1.6, margin: 0 }}>
            {article.summary}
          </p>
        </div>
      </div>

      {article.content && (
        <>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              marginTop: 12, background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Oswald', sans-serif", fontSize: '0.75rem', letterSpacing: '0.14em',
              color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 4, padding: 0,
              textTransform: 'uppercase',
            }}
          >
            <ChevronRight style={{ width: 11, height: 11, transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
            {expanded ? 'HIDE FULL ARTICLE' : 'READ FULL ARTICLE'}
          </button>
          {expanded && (
            <div style={{
              marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(124,58,237,0.15)',
              fontFamily: "'Libre Baskerville', serif", fontSize: '0.95rem',
              color: '#222', lineHeight: 1.85, whiteSpace: 'pre-line',
              maxHeight: 400, overflowY: 'auto',
            }}>
              {article.content}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Conversation card ─────────────────────────────────────────────
const ConversationCard = ({ conversation }) => {
  const [open, setOpen] = useState(false);
  const uid = currentUserId();
  const {
    sourceType, marketType, sym, newsTitle, newsId,
    allComments, lastActivity,
    marketItem,
    newsArticle,
  } = conversation;

  const sorted = [...allComments].sort((a, b) => {
    const aIsMe = a.user === uid || a.user?._id === uid;
    const bIsMe = b.user === uid || b.user?._id === uid;
    if (aIsMe && !bIsMe) return -1;
    if (!aIsMe && bIsMe) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const myCommentsCount   = allComments.filter(c => c.user === uid || c.user?._id === uid).length;
  const myRepliesCount    = allComments.reduce((sum, c) =>
    sum + (c.replies?.filter(r => r.user === uid || r.user?._id === uid).length || 0), 0
  );
  const totalParticipants = new Set(allComments.map(c => c.user?.toString() || c.user)).size;

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e8e8e8',
      borderTop: `3px solid ${sourceType === 'news' ? '#7c3aed' : '#ff6600'}`,
      borderRadius: 3, marginBottom: 16, overflow: 'hidden',
      transition: 'box-shadow 0.18s',
    }}
      onMouseOver={e => e.currentTarget.style.boxShadow = '3px 3px 0 #e8e8e8'}
      onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Card header — always visible */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '14px 18px', textAlign: 'left', display: 'block', transition: 'background 0.12s',
        }}
        onMouseOver={e => e.currentTarget.style.background = sourceType === 'news' ? '#faf8ff' : '#fff8f3'}
        onMouseOut={e => e.currentTarget.style.background = 'none'}
      >
        {/* Source badge + time */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <SourceBadge sourceType={sourceType} marketType={marketType} sym={sym} newsTitle={newsTitle} />
          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.72rem', letterSpacing: '0.08em', color: '#bbb' }}>
            {timeAgo(lastActivity)}
          </span>
        </div>

        {/* ── Inline preview ── */}
        {sourceType === 'market' && marketItem && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            background: '#f9f9f9', border: '1px solid #ececec', borderRadius: 3, marginBottom: 10,
          }}>
            {marketItem.flag && <span style={{ fontSize: '1.2rem' }}>{marketItem.flag}</span>}
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.88rem', fontWeight: 700, color: '#0d0d0d', letterSpacing: '0.05em' }}>
                {marketItem.name}
              </span>
              {marketItem.sector && (
                <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.72rem', color: '#aaa', letterSpacing: '0.08em', marginLeft: 8, textTransform: 'uppercase' }}>
                  {marketItem.sector}
                </span>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1rem', fontWeight: 700, color: '#0d0d0d' }}>
                {marketItem.price}
              </div>
              <div style={{
                fontFamily: "'Oswald', sans-serif", fontSize: '0.8rem',
                color: marketItem.chgDir === 'up' ? '#2a9a2a' : marketItem.chgDir === 'dn' ? '#cc2222' : '#cc5500',
              }}>
                {marketItem.chgDir === 'up' ? '▲' : marketItem.chgDir === 'dn' ? '▼' : '—'} {marketItem.change}
              </div>
            </div>
          </div>
        )}

        {sourceType === 'news' && (newsArticle || newsTitle) && (
          <div style={{ marginBottom: 10 }}>
            {newsArticle?.image && (
              <img src={newsArticle.image} alt="" style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 2, marginBottom: 8, display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />
            )}
            <h4 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '0.97rem', fontWeight: 700, color: '#0d0d0d', lineHeight: 1.3, margin: '0 0 5px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {newsArticle?.title || newsTitle}
            </h4>
            {newsArticle?.summary && (
              <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '0.9rem', color: '#777', lineHeight: 1.55, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {newsArticle.summary}
              </p>
            )}
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Oswald', sans-serif", fontSize: '0.75rem', letterSpacing: '0.08em', color: '#ff6600' }}>
            <img style={{ height: '13px', width: '13px' }} src={MessageIconOrange} alt='' />
            {myCommentsCount} comment{myCommentsCount !== 1 ? 's' : ''} by you
          </span>
          {myRepliesCount > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Oswald', sans-serif", fontSize: '0.75rem', letterSpacing: '0.08em', color: '#ff9944' }}>
              <img src={ReplyOrange} alt='' style={{ width: 13, height: 13 }} />
              {myRepliesCount} {myRepliesCount === 1 ? 'reply' : 'replies'} by you
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Oswald', sans-serif", fontSize: '0.75rem', letterSpacing: '0.08em', color: '#bbb' }}>
            <img style={{ height: '12px', width: '12px' }} src={MessageIconDarker} alt='' />
            {allComments.length} total · {totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}
          </span>
          <ChevronRight style={{
            width: 14, height: 14, color: '#bbb', marginLeft: 'auto',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.18s',
          }} />
        </div>
      </button>

      {/* Expanded section */}
      {open && (
        <div style={{ borderTop: '1px solid #f0f0f0' }}>
          <div style={{ background: '#0d0d0d', padding: '9px 18px' }}>
            <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.75rem', letterSpacing: '0.18em', color: '#ff9944', textTransform: 'uppercase' }}>
              Context · Full Conversation
            </span>
          </div>

          <div style={{ padding: '16px 18px' }}>
            {sourceType === 'market' && marketItem && (
              <MarketContextCard item={marketItem} marketType={marketType} />
            )}
            {sourceType === 'news' && newsArticle && (
              <NewsContextCard article={newsArticle} />
            )}

            {sorted.length === 0 ? (
              <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '0.92rem', color: '#bbb', textAlign: 'center', padding: '20px 0' }}>
                No comments loaded.
              </p>
            ) : (
              sorted.map(comment => {
                const isMe = comment.user === uid || comment.user?._id === uid;
                return <CommentBubble key={comment._id} comment={comment} isCurrentUser={isMe} />;
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Filter tabs ───────────────────────────────────────────────────
const FilterTab = ({ label, active, onClick, count }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? '#0d0d0d' : 'transparent',
      border: `1px solid ${active ? '#ff6600' : '#e0e0e0'}`,
      borderRadius: 2, padding: '7px 16px', cursor: 'pointer',
      fontFamily: "'Oswald', sans-serif", fontSize: '0.8rem',
      letterSpacing: '0.14em', color: active ? '#ff6600' : '#888',
      display: 'flex', alignItems: 'center', gap: 6,
      transition: 'all 0.15s', textTransform: 'uppercase',
    }}
    onMouseOver={e => { if (!active) e.currentTarget.style.borderColor = '#ff6600'; }}
    onMouseOut={e => { if (!active) e.currentTarget.style.borderColor = '#e0e0e0'; }}
  >
    {label}
    {count > 0 && (
      <span style={{
        background: active ? '#ff6600' : '#f0f0f0',
        color: active ? '#fff' : '#888',
        borderRadius: 10, padding: '0 7px',
        fontSize: '0.7rem', fontFamily: "'Oswald', sans-serif",
      }}>{count}</span>
    )}
  </button>
);

// ── Main MyActivity page ──────────────────────────────────────────
const MyActivity = ({ onBack }) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [filter,  setFilter]  = useState('all');
  const [search,  setSearch]  = useState('');

  const fetchActivity = useCallback(async () => {
    if (!isLoggedIn()) { setLoading(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/comments/my-activity`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setData(json);
    } catch {
      setError('Failed to load your activity.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  const conversations = data?.conversations || [];

  const filtered = conversations.filter(c => {
    if (filter === 'market' && c.sourceType !== 'market') return false;
    if (filter === 'news'   && c.sourceType !== 'news')   return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const label = c.sourceType === 'news'
        ? (c.newsTitle || '').toLowerCase()
        : `${c.marketType} ${c.sym}`.toLowerCase();
      if (!label.includes(q)) return false;
    }
    return true;
  });

  const marketCount = conversations.filter(c => c.sourceType === 'market').length;
  const newsCount   = conversations.filter(c => c.sourceType === 'news').length;

  return (
    <div style={{
      fontFamily: "'Libre Baskerville', serif",
      background: '#f7f7f7', minHeight: '100vh', color: '#0d0d0d',
    }}>

      {/* ── Page header ── */}
      <div style={{ background: '#0d0d0d', borderBottom: '2px solid #ff6600' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>

          {onBack && (
            <button
              onClick={onBack}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '14px 0 0', color: '#666',
                fontFamily: "'Oswald', sans-serif", fontSize: '0.78rem', letterSpacing: '0.14em',
              }}
              onMouseOver={e => e.currentTarget.style.color = '#ff6600'}
              onMouseOut={e => e.currentTarget.style.color = '#666'}
            >
              <ArrowLeft style={{ width: 14, height: 14 }} />
              BACK TO HOME
            </button>
          )}

          <div style={{ padding: '20px 0 22px' }}>
            <div style={{
              width: 32, height: 3,
              background: 'repeating-linear-gradient(to right,#ff6600 0,#ff6600 6px,transparent 6px,transparent 10px)',
              marginBottom: 12,
            }} />
            <h1 style={{
              fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.6rem,3vw,2.2rem)',
              letterSpacing: '0.12em', color: '#ffffff', margin: '0 0 8px', textTransform: 'uppercase',
            }}>
              My Activity
            </h1>
            <p style={{
              fontFamily: "'Libre Baskerville', serif",
              fontSize: '1rem', color: '#888', margin: 0,
            }}>
              Every conversation you've joined — markets and news, all in one place.
            </p>
          </div>

          {/* Stats bar */}
          {data && (
            <div style={{
              display: 'flex', gap: 28, paddingBottom: 18,
              borderTop: '1px solid rgba(255,102,0,0.15)', paddingTop: 14,
              flexWrap: 'wrap',
            }}>
              {[
                { label: 'Conversations', value: conversations.length },
                { label: 'On Markets',    value: marketCount },
                { label: 'On Articles',   value: newsCount },
                { label: 'Total Threads', value: data.totalThreads },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: '#ff6600', letterSpacing: '0.04em' }}>
                    {value}
                  </div>
                  <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.7rem', letterSpacing: '0.16em', color: '#666', textTransform: 'uppercase' }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Filters + search ── */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e8e8e8' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '12px 20px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <FilterTab label="All"     active={filter === 'all'}    onClick={() => setFilter('all')}    count={conversations.length} />
          <FilterTab label="Markets" active={filter === 'market'} onClick={() => setFilter('market')} count={marketCount} />
          <FilterTab label="News"    active={filter === 'news'}   onClick={() => setFilter('news')}   count={newsCount} />
          <div style={{ flex: 1, minWidth: 160 }}>
            <input
              type="text"
              placeholder="Search conversations…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', fontFamily: "'Oswald', sans-serif", fontSize: '0.82rem',
                letterSpacing: '0.08em', padding: '8px 12px',
                border: '1px solid #e0e0e0', borderRadius: 2,
                background: '#f9f9f9', color: '#333', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = '#ff6600'}
              onBlur={e => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* Not logged in */}
        {!isLoggedIn() && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <img style={{ height: '44px', width: '44px', display: 'block', margin: '0 auto 16px' }} src={MessageIconLighter} alt='' />
            <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.9rem', letterSpacing: '0.2em', color: '#bbb', textTransform: 'uppercase' }}>
              Sign in to view your activity
            </p>
          </div>
        )}

        {/* Loading */}
        {isLoggedIn() && loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <img src={Loader} alt='' style={{ width: 50, height: 50, display: 'block', margin: '0 auto 14px', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '2.2rem', color: '#ff6600', marginBottom: 12 }}>⚠</div>
            <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.9rem', letterSpacing: '0.2em', color: '#bbb', textTransform: 'uppercase', marginBottom: 16 }}>
              {error}
            </p>
            <button onClick={fetchActivity} style={{
              background: 'none', border: '1px solid #ff6600', borderRadius: 2,
              padding: '8px 20px', cursor: 'pointer',
              fontFamily: "'Oswald', sans-serif", fontSize: '0.78rem', letterSpacing: '0.14em', color: '#ff6600',
            }}>RETRY</button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && isLoggedIn() && conversations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <img style={{ height: '44px', width: '44px', display: 'block', margin: '0 auto 16px' }} src={MessageIconLighter} alt='' />
            <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.88rem', letterSpacing: '0.2em', color: '#ccc', textTransform: 'uppercase', marginBottom: 10 }}>
              No activity yet
            </p>
            <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '0.95rem', color: '#bbb' }}>
              Start commenting on market items or news articles — they'll all appear here.
            </p>
          </div>
        )}

        {/* No results after filter */}
        {!loading && !error && isLoggedIn() && conversations.length > 0 && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.82rem', letterSpacing: '0.18em', color: '#ccc', textTransform: 'uppercase' }}>
              No conversations match your filter
            </p>
          </div>
        )}

        {/* Conversations list */}
        {!loading && !error && filtered.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: '#e8e8e8' }} />
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.75rem', letterSpacing: '0.2em', color: '#bbb', textTransform: 'uppercase' }}>
                {filtered.length} conversation{filtered.length !== 1 ? 's' : ''}
              </span>
              <div style={{ flex: 1, height: 1, background: '#e8e8e8' }} />
            </div>

            {filtered.map(conversation => (
              <ConversationCard key={conversation.key} conversation={conversation} />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default MyActivity;

// Home.js — Palanomic · Cassette Futurism
import React, { useState, useEffect, useCallback } from 'react';

import MessageIcon from '../icons/message.png';

// ── Services ──
import { getPublishedNews, getMarketData } from '../services/api';

// ── Layout ──
import Header  from '../components/Header';
import Footer  from './components/Footer';

// ── Styles ──
import GlobalStyles from './styles/GlobalStyles';

// ── Market ──
import MarketTickers from './components/market/MarketTickers';

// ── News ──
import DateBar          from './components/news/DateBar';
import SearchAndFilters from './components/news/SearchAndFilters';
import SkeletonLoader   from './components/news/SkeletonLoader';
import FeaturedArticle  from './components/news/FeaturedArticle';
import NewsCard         from './components/news/NewsCard';
import Pagination       from './components/news/Pagination';
import ArticleModal     from './components/news/ArticleModal';

// ── Activity ──
import MyActivity from './components/MyActivity';

const isLoggedIn = () => !!localStorage.getItem('userAuthToken');

// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const [showActivity, setShowActivity] = useState(false);

  // ── State ──
  const [articles, setArticles]               = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [filter, setFilter]                   = useState('all');
  const [searchTerm, setSearchTerm]           = useState('');
  const [isLoading, setIsLoading]             = useState(false);
  const [isInitialLoad, setIsInitialLoad]     = useState(true);
  const [error, setError]                     = useState(null);
  const [pagination, setPagination]           = useState({ current: 1, total: 1, count: 0 });

  // Market data
  const [rseStocks, setRseStocks] = useState([]);
  const [forexData, setForexData] = useState([]);
  const [goodsData, setGoodsData] = useState([]);

  // ── Lock/unlock body scroll when activity page or modal is open ──
  useEffect(() => {
    document.body.style.overflow = showActivity ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [showActivity]);

  // ── Market fetch ──
  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const [s, f, g] = await Promise.all([
          getMarketData('stocks'),
          getMarketData('forex'),
          getMarketData('goods'),
        ]);
        setRseStocks(s);
        setForexData(f);
        setGoodsData(g);
      } catch (err) {
        console.error('Market data fetch failed:', err.message);
      }
    };
    fetchMarket();
  }, []);

  // ── News fetch ──
  const fetchArticles = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { page, limit: 9 };
      if (filter !== 'all') params.category = filter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const data = await getPublishedNews(params);

      const normalised = (data.news || []).map((a, idx) => ({
        ...a,
        id: a._id,
        imageUrl: a.image || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop',
        featured: idx === 0 && page === 1 && filter === 'all' && !searchTerm,
      }));

      setArticles(normalised);
      setPagination(data.pagination || { current: page, total: 1, count: normalised.length });
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setError('Failed to load articles. Please try again.');
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [filter, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => fetchArticles(1), searchTerm ? 400 : 0);
    return () => clearTimeout(timer);
  }, [filter, searchTerm, fetchArticles]);

  // ── Handlers ──
  const handleFilterChange = f => {
    setFilter(f);
    setPagination(p => ({ ...p, current: 1 }));
  };

  const handlePageChange = n => {
    fetchArticles(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openModal = article => {
    setSelectedArticle(article);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedArticle(null);
    document.body.style.overflow = 'auto';
  };

  // ── Derived data ──
  const showSkeleton    = isInitialLoad && isLoading && articles.length === 0;
  const featuredArticle = articles.find(a => a.featured) || articles[0];
  const regularArticles = articles.filter(a => a.id !== featuredArticle?.id);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{
      fontFamily: "'Libre Baskerville','Georgia',serif",
      background: '#f7f7f7', minHeight: '100vh', color: '#0d0d0d',
    }}>
      <GlobalStyles />

      {/* ── Header ── */}
      <Header />

      {/* ── Market Tickers ── */}
      <MarketTickers
        forexData={forexData}
        rseStocks={rseStocks}
        goodsData={goodsData}
      />

      {/* ── Stripe divider ── */}
      <div className="stripe-rule" />

      {/* ── Date / Live bar ── */}
      <DateBar />

      {/* ── News Section ── */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 40px' }}>

        {/* ── My Activity tab — only shown when logged in ── */}
        {isLoggedIn() && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <button
              onClick={() => setShowActivity(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: '#0d0d0d', border: '1px solid #ff6600',
                borderRadius: 2, padding: '7px 16px', cursor: 'pointer',
                fontFamily: "'Oswald', sans-serif", fontSize: '0.82rem',
                letterSpacing: '0.16em', color: '#ff6600', textTransform: 'uppercase',
                transition: 'all 0.15s',
              }}
              onMouseOver={e => {
                e.currentTarget.style.color = '#fff';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = '#0d0d0d';
                e.currentTarget.style.color = '#ff6600';
              }}
            >
              <img style={{ height: '14px', width: '14px' }} src={MessageIcon} alt='' />
              My Activity
            </button>
          </div>
        )}

        {/* Search + Filters */}
        <SearchAndFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filter={filter}
          onFilterChange={handleFilterChange}
        />

        {/* Loading skeleton */}
        {showSkeleton && <SkeletonLoader />}

        {/* Error state */}
        {error && !isLoading && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '2.5rem', color: 'var(--orange)', marginBottom: 16 }}>⚠</div>
            <p style={{ fontFamily: "'Oswald',sans-serif", letterSpacing: '0.2em', color: 'var(--ink-lt)' }}>DISPATCH UNAVAILABLE</p>
            <p style={{ fontFamily: "'Libre Baskerville',serif", fontSize: '0.9rem', color: 'var(--ink-lt)', marginTop: 8 }}>{error}</p>
            <button
              onClick={() => fetchArticles(pagination.current)}
              style={{
                marginTop: 20, fontFamily: "'Oswald',sans-serif", fontSize: '0.8rem',
                letterSpacing: '0.14em', padding: '8px 20px',
                border: '1px solid var(--orange)', borderRadius: 2,
                background: 'transparent', color: 'var(--orange)', cursor: 'pointer',
              }}
            >
              RETRY
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && articles.length === 0 && !isInitialLoad && (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '2.5rem', color: 'var(--orange)', marginBottom: 16 }}>◈</div>
            <p style={{ fontFamily: "'Oswald',sans-serif", letterSpacing: '0.2em', color: 'var(--ink-lt)' }}>NO DISPATCHES FOUND</p>
            <p style={{ fontFamily: "'Libre Baskerville',serif", fontSize: '0.9rem', color: 'var(--ink-lt)', marginTop: 8 }}>Try adjusting your filter or search query</p>
          </div>
        )}

        {/* Articles */}
        {!showSkeleton && articles.length > 0 && (
          <>
            {featuredArticle && (
              <FeaturedArticle
                featuredArticle={featuredArticle}
                sidebarArticles={regularArticles}
                onOpenModal={openModal}
              />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 18 }}>
              {regularArticles.map((article, idx) => (
                <NewsCard
                  key={article.id}
                  article={article}
                  index={idx}
                  onClick={openModal}
                />
              ))}
            </div>

            <Pagination pagination={pagination} onPageChange={handlePageChange} />
          </>
        )}
      </main>

      {/* ── Article Modal ── */}
      <ArticleModal article={selectedArticle} onClose={closeModal} />

      {/* ── Footer ── */}
      <Footer />

      {/* ── My Activity overlay ── */}
      {showActivity && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: '#f7f7f7', overflowY: 'auto',
          // Slide in from right
          animation: 'slideInRight 0.22s ease-out',
        }}>
          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(60px); opacity: 0; }
              to   { transform: translateX(0);    opacity: 1; }
            }
          `}</style>
          <MyActivity onBack={() => setShowActivity(false)} />
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './home/Home';
import AdminNewsPanel from './admin/AdminNewsPanel';
import AdminMarketPanel from './admin/Adminmarketpanel';
import AdminDashboard from './admin/AdminDashboard';
import AdminRegister from './auth/AdminRegister';
import UserRegister from './auth/UserRegister';
import UserLogin from './auth/UserLogin';

import AdminLogin from './auth/AdminLogin';
import NotFound from './components/NotFound';
import ProtectedRoute from './components/ProjectedRoute';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/sign-up" element={<UserRegister />} />
      <Route path="/sign-in" element={<UserLogin />} />
      
      {/* Admin Routes - Protected */}
      <Route path="/register" element={<AdminRegister />} />
      <Route path="/login" element={<AdminLogin />} />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/news" 
        element={
          <ProtectedRoute>
            <AdminNewsPanel />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin/market" 
        element={
          <ProtectedRoute>
            <AdminMarketPanel />
          </ProtectedRoute>
        } 
      />
      
      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;