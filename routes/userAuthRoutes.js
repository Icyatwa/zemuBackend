// src/routes/userAuthRoutes.js
const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyOTP,
  resendVerification,
  forgotPassword,
  verifyForgotOTP,
  resetPassword,
  googleAuth
} = require('../controllers/userAuthController');
 
router.post('/register',            register);
router.post('/login',               login);
router.post('/verify-otp',          verifyOTP);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password',     forgotPassword);
router.post('/verify-forgot-otp',   verifyForgotOTP);
router.post('/reset-password',      resetPassword);
router.post('/google',              googleAuth);

module.exports = router;
