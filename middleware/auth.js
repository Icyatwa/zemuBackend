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