// src/models/UserAccount.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userAccountSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: { 
    type: String,
    minlength: 8,
    select: false
  },
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  role: {
    type: String,
    default: 'user'
  },
  // Email verification
  isVerified: {
    type: Boolean,
    default: false
  },
  // OTP fields
  otp: {
    type: String,
    select: false
  },
  otpExpires: {
    type: Date,
    select: false
  },
  otpType: {
    type: String, // 'verify' | 'forgot'
    select: false
  },
  // Google OAuth
  googleId: {
    type: String,
    sparse: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userAccountSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userAccountSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const UserAccount = mongoose.model('UserAccount', userAccountSchema);

module.exports = UserAccount;
