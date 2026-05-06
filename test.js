// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'editor'],
    default: 'editor'
  },
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;

// src/controllers/userAuthController.js
const UserAccount = require('../models/UserAccount');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id, type: 'user' }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    const existingUser = await UserAccount.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    const user = await UserAccount.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('User registration error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await UserAccount.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');           // admin model
const UserAccount = require('../models/UserAccount'); // regular user model

// Protects any authenticated route (admin OR user)
const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized to access this route' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tokens issued for regular users carry type: 'user'
    if (decoded.type === 'user') {
      const user = await UserAccount.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      req.user = user;
    } else {
      // Admin token (no type field, legacy tokens included)
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      req.user = user;
    }

    next();
  } catch (error) {
    console.error('Auth error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Session expired, please log in again',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token, please log in again',
        code: 'TOKEN_INVALID'
      });
    }

    res.status(401).json({ message: 'Not authorized to access this route' });
  }
};

// Only allows admins through
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

// Only allows regular users through
const userOnly = (req, res, next) => {
  if (req.user && req.user.role === 'user') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Users only.' });
  }
};

module.exports = { protect, adminOnly, userOnly };

// src/routes/userAuthRoutes.js
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/userAuthController');

router.post('/register', register);
router.post('/login', login);

module.exports = router;

// frontend/src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
  const response = await api.post('http://localhost:5000/api/auth/login', { email, password });
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
  const response = await api.get('http://localhost:5000/api/news', { params });
  return response.data;
};

export const getNewsById = async (id) => {
  const response = await api.get(`http://localhost:5000/api/news/${id}`);
  return response.data;
};

export const createNews = async (newsData) => {
  const response = await api.post('http://localhost:5000/api/news', newsData);
  return response.data;
};

export const updateNews = async (id, newsData) => {
  const response = await api.put(`http://localhost:5000/api/news/${id}`, newsData);
  return response.data;
};

export const deleteNews = async (id) => {
  const response = await api.delete(`http://localhost:5000/api/news/${id}`);
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get('http://localhost:5000/api/news/dashboard/stats');
  return response.data;
};

export const getPublishedNews = async (params) => {
  const response = await api.get('http://localhost:5000/api/news/published', { params });
  return response.data;
};

export const getPublishedNewsById = async (id) => {
  const response = await api.get(`http://localhost:5000/api/news/published/${id}`);
  return response.data;
};

// Market Data API
export const getMarketData = async (type) => {
  const response = await api.get(`http://localhost:5000/api/market/${type}`);
  return response.data;
};

export const createMarketItem = async (type, data) => {
  const response = await api.post(`http://localhost:5000/api/market/${type}`, data);
  return response.data;
};

export const updateMarketItem = async (type, id, data) => {
  const response = await api.put(`http://localhost:5000/api/market/${type}/${id}`, data);
  return response.data;
};

export const deleteMarketItem = async (type, id) => {
  const response = await api.delete(`http://localhost:5000/api/market/${type}/${id}`);
  return response.data;
};

export const seedMarketData = async (type, items) => {
  const response = await api.post(`http://localhost:5000/api/market/${type}/seed`, { items });
  return response.data;
};

export default api;

// Header.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../icons/Frame 623.png';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authState, setAuthState] = useState({
    isAdmin: false,
    isUser: false,
    userName: ''
  });

  const readAuth = () => {
    const token = localStorage.getItem('userToken');   // ← was 'userAuthToken'
    const role  = localStorage.getItem('userRole');
    const name  = localStorage.getItem('userName') || '';

    setAuthState({
      isAdmin: !!token && role === 'admin',
      isUser:  !!token && role === 'user',
      userName: name
    });
  };

  // Re-reads auth on every route change so header stays in sync after login/logout
  useEffect(() => {
    readAuth();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('userAuthToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');          // ← add this
    setAuthState({ isAdmin: false, isUser: false, userName: '' });
    setIsMenuOpen(false);
    navigate('/');
  };

  const { isAdmin, isUser, userName } = authState;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600&display=swap');

        .kmw-header {
          background: #1a1009;
          border-bottom: 3px solid #c8963c;
          position: relative;
        }

        .kmw-header::before {
          content: '';
          display: block;
          height: 4px;
          background: repeating-linear-gradient(
            90deg,
            #c8963c 0px, #c8963c 18px,
            #d4520a 18px, #d4520a 24px,
            #c8963c 24px, #c8963c 42px,
            #8c3206 42px, #8c3206 48px
          );
        }

        .kmw-masthead {
          max-width: 1200px;
          margin: 0 auto;
          padding: 18px 20px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(200,150,60,0.25);
        }

        .kmw-logo-wrap {
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
        }

        .kmw-logo-emblem {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .kmw-logo-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .kmw-logo-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 1.2rem;
          font-weight: 600;
          color: #f5efe0;
          line-height: 1;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .kmw-logo-subtitle {
          font-family: 'Oswald', sans-serif;
          font-size: 0.54rem;
          letter-spacing: 0.3em;
          color: #c8963c;
          text-transform: uppercase;
        }

        .kmw-nav {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        /* Ghost gold — Sign Up */
        .kmw-signup-btn {
          font-family: 'Oswald', sans-serif;
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 7px 18px;
          background: transparent;
          color: #c8963c;
          border: 1px solid #c8963c;
          border-radius: 3px;
          text-decoration: none;
          transition: all 0.15s;
          margin-left: 8px;
        }
        .kmw-signup-btn:hover {
          background: rgba(200,150,60,0.12);
          color: #f5efe0;
        }

        /* Solid orange — Sign In */
        .kmw-signin-btn {
          font-family: 'Oswald', sans-serif;
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 7px 18px;
          background: #d4520a;
          color: #f5efe0;
          border: 1px solid #8c3206;
          border-radius: 3px;
          text-decoration: none;
          transition: background 0.15s;
          margin-left: 8px;
        }
        .kmw-signin-btn:hover { background: #f07228; }

        /* Logged-in user chip */
        .kmw-user-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-left: 8px;
        }
        .kmw-user-name {
          font-family: 'Oswald', sans-serif;
          font-size: 0.7rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #e8b84a;
        }
        .kmw-logout-btn {
          font-family: 'Oswald', sans-serif;
          font-size: 0.68rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          padding: 6px 14px;
          background: transparent;
          color: #9a8060;
          border: 1px solid rgba(200,150,60,0.3);
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .kmw-logout-btn:hover {
          color: #f5efe0;
          border-color: rgba(200,150,60,0.6);
          background: rgba(200,150,60,0.08);
        }

        /* Admin */
        .kmw-admin-btn {
          font-family: 'Oswald', sans-serif;
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 7px 18px;
          background: transparent;
          color: #e8b84a;
          border: 1px solid #c8963c;
          border-radius: 3px;
          text-decoration: none;
          transition: all 0.15s;
          margin-left: 8px;
        }
        .kmw-admin-btn:hover { background: rgba(200,150,60,0.12); }

        /* Mobile burger */
        .kmw-burger {
          display: none;
          background: transparent;
          border: 1px solid rgba(200,150,60,0.4);
          color: #c8963c;
          width: 36px;
          height: 36px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 3px;
          flex-shrink: 0;
        }

        /* Mobile dropdown */
        .kmw-mobile-menu {
          background: #1a1009;
          border-top: 1px solid rgba(200,150,60,0.2);
          border-bottom: 2px solid #c8963c;
        }
        .kmw-mobile-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 12px 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .kmw-mobile-link {
          font-family: 'Oswald', sans-serif;
          font-size: 0.78rem;
          letter-spacing: 0.16em;
          color: #c0a878;
          text-decoration: none;
          padding: 9px 14px;
          border: 1px solid transparent;
          border-radius: 3px;
          text-transform: uppercase;
          transition: all 0.15s;
        }
        .kmw-mobile-link:hover {
          background: rgba(200,150,60,0.08);
          color: #f5efe0;
          border-color: rgba(200,150,60,0.2);
        }
        .kmw-mobile-logout {
          font-family: 'Oswald', sans-serif;
          font-size: 0.78rem;
          letter-spacing: 0.16em;
          color: #9a8060;
          background: none;
          border: 1px solid transparent;
          border-radius: 3px;
          padding: 9px 14px;
          text-transform: uppercase;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s;
          width: 100%;
        }
        .kmw-mobile-logout:hover {
          background: rgba(200,150,60,0.08);
          color: #f5efe0;
          border-color: rgba(200,150,60,0.2);
        }

        .kmw-divider {
          height: 1px;
          background: rgba(200,150,60,0.15);
          margin: 8px 0;
        }

        @media (max-width: 768px) {
          .kmw-nav    { display: none; }
          .kmw-burger { display: flex; }
          .kmw-logo-title { font-size: 1.1rem; }
        }
      `}</style>

      <header className="kmw-header">
        <div className="kmw-masthead">
          {/* Logo */}
          <Link to="/" className="kmw-logo-wrap">
            <div className="kmw-logo-emblem">
              <img style={{ height: '26px', width: '26px' }} src={Icon} alt="" />
            </div>
            <div className="kmw-logo-text">
              <span className="kmw-logo-title">Palanomic</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="kmw-nav">
            {isAdmin ? (
              <>
                <Link to="/admin" className="kmw-admin-btn">Admin</Link>
                <button className="kmw-logout-btn" onClick={handleLogout}>Logout</button>
              </>
            ) : isUser ? (
              <div className="kmw-user-chip">
                <span className="kmw-user-name">
                  {userName ? `Hi, ${userName.split(' ')[0]}` : 'My Account'}
                </span>
                <button className="kmw-logout-btn" onClick={handleLogout}>Logout</button>
              </div>
            ) : (
              <>
                <Link to="/sign-up" className="kmw-signup-btn">Sign Up</Link>
                <Link to="/sign-in" className="kmw-signin-btn">Sign In</Link>
              </>
            )}
          </nav>

          {/* Mobile burger */}
          <button
            className="kmw-burger"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {isMenuOpen ? (
                <><line x1="2" y1="2" x2="16" y2="16" /><line x1="16" y1="2" x2="2" y2="16" /></>
              ) : (
                <><line x1="2" y1="5" x2="16" y2="5" /><line x1="2" y1="9" x2="16" y2="9" /><line x1="2" y1="13" x2="16" y2="13" /></>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="kmw-mobile-menu">
            <div className="kmw-mobile-inner">
              <div className="kmw-divider" />
              {isAdmin ? (
                <>
                  <Link to="/admin" className="kmw-mobile-link" onClick={() => setIsMenuOpen(false)} style={{ color: '#e8b84a' }}>
                    Admin Dashboard
                  </Link>
                  <button className="kmw-mobile-logout" onClick={handleLogout}>Logout</button>
                </>
              ) : isUser ? (
                <>
                  <span className="kmw-mobile-link" style={{ color: '#e8b84a', cursor: 'default' }}>
                    {userName ? `Hi, ${userName.split(' ')[0]}` : 'My Account'}
                  </span>
                  <button className="kmw-mobile-logout" onClick={handleLogout}>Logout</button>
                </>
              ) : (
                <>
                  <Link to="/sign-up" className="kmw-mobile-link" onClick={() => setIsMenuOpen(false)} style={{ color: '#c8963c' }}>
                    Sign Up
                  </Link>
                  <Link to="/sign-in" className="kmw-mobile-link" onClick={() => setIsMenuOpen(false)} style={{ color: '#d4520a' }}>
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}

export default Header;