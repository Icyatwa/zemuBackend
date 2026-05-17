// src/controllers/userAuthController.js
const UserAccount = require('../models/UserAccount');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Resend } = require('resend');
const { OAuth2Client } = require('google-auth-library');

const resend = new Resend(process.env.RESEND_API_KEY);
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id, type: 'user' }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Generate 6-digit OTP
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// Send OTP email via Resend
const sendOTPEmail = async (email, otp, type) => {
  const subjects = {
    verify: 'Verify your email — Palanomic',
    forgot: 'Reset your password — Palanomic'
  };

  const headings = {
    verify: 'Email Verification',
    forgot: 'Password Reset'
  };

  const messages = {
    verify: 'To complete your registration, enter the verification code below:',
    forgot: 'To reset your password, enter the code below:'
  };

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@palanomic.com',
    to: email,
    subject: subjects[type],
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#f7f7f7;font-family:'Helvetica Neue',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" style="max-width:480px;background:#fff;border:1px solid #e2d9cc;border-top:3px solid #c8963c;">
                <tr>
                  <td style="background:#1a1009;padding:16px 32px;text-align:center;">
                    <span style="font-size:1rem;font-weight:700;color:#f5efe0;letter-spacing:0.1em;text-transform:uppercase;">PALANOMIC</span>
                    <span style="display:inline-block;width:1px;height:14px;background:rgba(200,150,60,0.4);margin:0 8px;vertical-align:middle;"></span>
                    <span style="font-size:0.6rem;letter-spacing:0.28em;color:#c8963c;text-transform:uppercase;">Market Intelligence</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:36px 32px 28px;">
                    <p style="font-size:0.65rem;letter-spacing:0.22em;color:#6a5a38;text-transform:uppercase;margin:0 0 8px;">${headings[type]}</p>
                    <h1 style="font-size:1.3rem;color:#1a1009;margin:0 0 20px;font-weight:600;">${headings[type]}</h1>
                    <p style="color:#6a5a38;font-size:0.9rem;line-height:1.6;margin:0 0 28px;">${messages[type]}</p>

                    <div style="background:#faf9f6;border:1px solid #e2d9cc;border-left:3px solid #d4520a;text-align:center;padding:24px 16px;margin-bottom:28px;">
                      <span style="font-size:2.4rem;font-weight:700;color:#1a1009;letter-spacing:0.25em;">${otp}</span>
                    </div>

                    <p style="color:#9a8060;font-size:0.8rem;margin:0 0 4px;">This code expires in <strong>10 minutes</strong>.</p>
                    <p style="color:#9a8060;font-size:0.8rem;margin:0;">If you didn't request this, you can safely ignore this email.</p>
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid #ede5d8;padding:16px 32px;text-align:center;">
                    <span style="color:#b0a080;font-size:0.72rem;">&copy; ${new Date().getFullYear()} Palanomic. All rights reserved.</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  });
};

// ─── REGISTER (sends OTP, does NOT log in yet) ────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });

    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });

    const existing = await UserAccount.findOne({ email });
    if (existing) {
      if (existing.isVerified)
        return res.status(400).json({ success: false, message: 'An account with this email already exists' });

      // Unverified account — resend OTP
      const otp = generateOTP();
      existing.name = name;
      existing.password = password;  // will be re-hashed by pre-save
      existing.otp = otp;
      existing.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      existing.otpType = 'verify';
      await existing.save();
      await sendOTPEmail(email, otp, 'verify');
      return res.status(200).json({ success: true, message: 'Verification code resent to your email', email });
    }

    const otp = generateOTP();
    await UserAccount.create({
      name, email, password,
      otp, otpExpires: new Date(Date.now() + 10 * 60 * 1000),
      otpType: 'verify', isVerified: false
    });

    await sendOTPEmail(email, otp, 'verify');

    res.status(201).json({
      success: true,
      message: 'Account created. Check your email for a verification code.',
      email
    });
  } catch (error) {
    console.error('User registration error:', error);
    if (error.code === 11000)
      return res.status(400).json({ success: false, message: 'Email already in use' });
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── VERIFY OTP (for account creation) ───────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await UserAccount.findOne({ email }).select('+otp +otpExpires +otpType');
    if (!user)
      return res.status(404).json({ success: false, message: 'Account not found' });

    if (user.otpType !== 'verify')
      return res.status(400).json({ success: false, message: 'Invalid OTP type' });

    if (!user.otp || user.otp !== otp)
      return res.status(400).json({ success: false, message: 'Invalid verification code' });

    if (user.otpExpires < new Date())
      return res.status(400).json({ success: false, message: 'Verification code has expired' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpType = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── RESEND VERIFICATION OTP ──────────────────────────────────────────────────
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserAccount.findOne({ email }).select('+otp +otpExpires +otpType');

    if (!user)
      return res.status(404).json({ success: false, message: 'Account not found' });

    if (user.isVerified)
      return res.status(400).json({ success: false, message: 'Email already verified' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.otpType = 'verify';
    await user.save();

    await sendOTPEmail(email, otp, 'verify');

    res.status(200).json({ success: true, message: 'Verification code resent to your email' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Please provide email and password' });

    const user = await UserAccount.findOne({ email }).select('+password');
    if (!user)
      return res.status(401).json({ message: 'Invalid email or password' });

    if (user.authProvider === 'google')
      return res.status(400).json({ message: 'Please sign in with Google' });

    if (!user.isVerified) {
      // Resend a fresh OTP and prompt verification
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      user.otpType = 'verify';
      await user.save();
      await sendOTPEmail(email, otp, 'verify');
      return res.status(403).json({
        success: false,
        requiresVerification: true,
        email,
        message: 'Please verify your email. A new code has been sent.'
      });
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch)
      return res.status(401).json({ message: 'Invalid email or password' });

    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserAccount.findOne({ email });

    // Always respond the same to avoid email enumeration
    if (!user || user.authProvider === 'google') {
      return res.status(200).json({ success: true, message: 'If that email exists, a reset code has been sent.' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.otpType = 'forgot';
    await user.save();

    await sendOTPEmail(email, otp, 'forgot');

    res.status(200).json({ success: true, message: 'If that email exists, a reset code has been sent.', email });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── VERIFY FORGOT-PASSWORD OTP ───────────────────────────────────────────────
exports.verifyForgotOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await UserAccount.findOne({ email }).select('+otp +otpExpires +otpType');

    if (!user) return res.status(404).json({ success: false, message: 'Account not found' });
    if (user.otpType !== 'forgot') return res.status(400).json({ success: false, message: 'Invalid OTP type' });
    if (!user.otp || user.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid code' });
    if (user.otpExpires < new Date()) return res.status(400).json({ success: false, message: 'Code has expired' });

    // Issue a short-lived reset token
    const resetToken = jwt.sign({ id: user._id, type: 'reset' }, process.env.JWT_SECRET, { expiresIn: '15m' });
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpType = undefined;
    await user.save();

    res.status(200).json({ success: true, resetToken });
  } catch (error) {
    console.error('Verify forgot OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;
    if (!resetToken || !password) return res.status(400).json({ success: false, message: 'Missing fields' });
    if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ success: false, message: 'Reset link expired or invalid' });
    }

    if (decoded.type !== 'reset') return res.status(400).json({ success: false, message: 'Invalid token' });

    const user = await UserAccount.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.password = password;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── GOOGLE SIGN-IN / SIGN-UP ─────────────────────────────────────────────────
exports.googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ success: false, message: 'ID token required' });

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, email_verified } = payload;

    if (!email_verified) return res.status(400).json({ success: false, message: 'Google email not verified' });

    let user = await UserAccount.findOne({ email });

    if (user) {
      // Link Google to existing local account
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        user.isVerified = true;
        await user.save();
      }
    } else {
      user = await UserAccount.create({
        name,
        email,
        googleId,
        authProvider: 'google',
        isVerified: true,
        role: 'user'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, message: 'Google authentication failed', error: error.message });
  }
};
