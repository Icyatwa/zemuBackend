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
    required: [true, 'Password is required'],
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userAccountSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userAccountSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const UserAccount = mongoose.model('UserAccount', userAccountSchema);

module.exports = UserAccount;

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

// src/models/News.js
const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  summary: {
    type: String,
    required: [true, 'Summary is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  author: {
    type: String,
    required: [true, 'Author is required']
  },
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'review'],
    default: 'draft'
  },
  category: {
    type: String,
    enum: ['growth', 'investment', 'trade', 'policy', 'other'],
    required: [true, 'Category is required']
  },
  featured: {
    type: Boolean,
    default: false
  },
  image: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

newsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const News = mongoose.model('News', newsSchema);

module.exports = News;

// models/MarketData.js
const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  sym: { type: String, required: true },
  name: { type: String, required: true },
  sector: { type: String, required: true },
  price: { type: String, required: true },
  raw: { type: Number, required: true },
  change: { type: String, required: true },
  chgNum: { type: Number, required: true },
  chgDir: { type: String, enum: ['up', 'dn', 'nt'], required: true },
  explain: { type: String, default: '' },
  eli5: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

const forexSchema = new mongoose.Schema({
  sym: { type: String, required: true },
  name: { type: String, required: true },
  flag: { type: String, default: '' },
  price: { type: String, required: true },
  raw: { type: Number, required: true },
  change: { type: String, required: true },
  chgNum: { type: Number, required: true },
  chgDir: { type: String, enum: ['up', 'dn', 'nt'], required: true },
  explain: { type: String, default: '' },
  eli5: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

const goodsSchema = new mongoose.Schema({
  sym: { type: String, required: true },
  name: { type: String, required: true },
  sector: { type: String, required: true },
  price: { type: String, required: true },
  raw: { type: Number, required: true },
  change: { type: String, required: true },
  chgNum: { type: Number, required: true },
  chgDir: { type: String, enum: ['up', 'dn', 'nt'], required: true },
  explain: { type: String, default: '' },
  eli5: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

const Stock = mongoose.model('Stock', stockSchema);
const Forex = mongoose.model('Forex', forexSchema);
const Good = mongoose.model('Good', goodsSchema);

module.exports = { Stock, Forex, Good };

// models/Comment.js
const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'UserAccount', required: true },
  userName: { type: String, required: true },
  text: { type: String, required: true, maxlength: 500 },
  likes: { type: [mongoose.Schema.Types.ObjectId], ref: 'UserAccount', default: [] },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const commentSchema = new mongoose.Schema({
  marketType: { type: String, enum: ['stocks', 'forex', 'goods'], required: true },
  sym: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'UserAccount', required: true },
  userName: { type: String, required: true },
  text: { type: String, required: true, maxlength: 1000 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserAccount' }],
  replies: [replySchema],
  createdAt: { type: Date, default: Date.now }
});

commentSchema.index({ marketType: 1, sym: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);

// models/commentController.js
const Comment = require('../models/Comment');

// GET comments for a market item
exports.getComments = async (req, res) => {
  try {
    const { marketType, sym } = req.params;
    const comments = await Comment.find({ marketType, sym })
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST a comment
exports.createComment = async (req, res) => {
  try {
    const { marketType, sym } = req.params;
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text required' });

    const comment = await Comment.create({
      marketType,
      sym,
      user: req.user._id,
      userName: req.user.name,
      text: text.trim()
    });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST a reply
exports.addReply = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Reply text required' });

    const reply = {
      _id: new mongoose.Types.ObjectId(),
      user: req.user._id,
      userName: req.user.name,
      text: text.trim(),
      likes: [],
      createdAt: new Date()
    };

    const comment = await Comment.findByIdAndUpdate(
      commentId,
      { $push: { replies: reply } },
      { new: true, runValidators: false }
    );

    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    res.status(201).json(comment);
  } catch (err) {
    console.error('addReply error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH toggle like on comment
exports.toggleCommentLike = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id.toString();

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const idx = comment.likes.findIndex(id => id.toString() === userId);
    if (idx === -1) {
      comment.likes.push(req.user._id);
    } else {
      comment.likes.splice(idx, 1);
    }
    await comment.save();
    res.status(200).json({ likes: comment.likes.length, liked: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH toggle like on reply
exports.toggleReplyLike = async (req, res) => {
  try {
    const { commentId, replyId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findOne({
      _id: commentId,
      'replies._id': replyId
    });
    if (!comment) return res.status(404).json({ message: 'Comment or reply not found' });

    const reply = comment.replies.id(replyId);
    const alreadyLiked = reply.likes.some(id => id.toString() === userId.toString());

    const update = alreadyLiked
      ? { $pull: { 'replies.$.likes': userId } }
      : { $push: { 'replies.$.likes': userId } };

    await Comment.updateOne(
      { _id: commentId, 'replies._id': replyId },
      update
    );

    res.status(200).json({ likes: reply.likes.length + (alreadyLiked ? -1 : 1), liked: !alreadyLiked });
  } catch (err) {
    console.error('toggleReplyLike error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE a comment (owner or admin)
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await comment.deleteOne();
    res.status(200).json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// models/commentRoutes.js
const express = require('express');
const router = express.Router();
const {
  getComments, createComment, addReply,
  toggleCommentLike, toggleReplyLike, deleteComment
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

// Public read
router.get('/:marketType/:sym', getComments);

// Auth required
router.post('/:marketType/:sym', protect, createComment);
router.post('/:commentId/replies', protect, addReply);
router.patch('/:commentId/like', protect, toggleCommentLike);
router.patch('/:commentId/replies/:replyId/like', protect, toggleReplyLike);
router.delete('/:commentId', protect, deleteComment);

module.exports = router;

// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const userAuthRoutes = require('./routes/userAuthRoutes'); // ← new
const newsRoutes = require('./routes/newsRoutes');
const marketDataRoutes = require('./routes/marketDataRoutes');
const commentRoutes = require('./routes/commentRoutes');
const errorHandler = require('./middleware/errorHandler');
const { warmCache } = require('./controllers/newsController');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);           // admin auth
app.use('/api/users/auth', userAuthRoutes); // regular user auth  ← new
app.use('/api/news', newsRoutes);
app.use('/api/market', marketDataRoutes);
app.use('/api/comments', commentRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
warmCache();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// components/market/MarketPanel.js
import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import CommentSection from './CommentSection';

const dirColor = (dir) =>
  dir === 'up' ? '#4ddd4d' : dir === 'dn' ? '#ff5555' : '#ff7a00';

const DirIcon = ({ dir, size = 12 }) => {
  if (dir === 'up') return <TrendingUp style={{ width: size, height: size, color: '#4ddd4d' }} />;
  if (dir === 'dn') return <TrendingDown style={{ width: size, height: size, color: '#ff5555' }} />;
  return <Minus style={{ width: size, height: size, color: '#ff7a00' }} />;
};

const MarketPanel = ({ items, title, onClose, marketType }) => {
  const [selected, setSelected] = useState(null);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 100,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '32px 16px', overflowY: 'auto',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#ffffff', border: '2px solid #ff6600', borderRadius: 4,
        width: '100%', maxWidth: 900, overflow: 'hidden', fontFamily: "'Libre Baskerville', serif",
      }}>

        {/* ── Header ── */}
        <div style={{
          background: '#0d0d0d', padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '2px solid #ff6600',
        }}>
          <span style={{
            fontFamily: "'Oswald',sans-serif", fontSize: '0.82rem',
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
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
          gap: 1, background: '#e0e0e0',
        }}>
          {items.map(item => (
            <div
              key={item.sym}
              onClick={() => setSelected(selected?.sym === item.sym ? null : item)}
              style={{
                background: selected?.sym === item.sym ? '#0d0d0d' : '#ffffff',
                padding: '12px 14px', cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseOver={e => { if (selected?.sym !== item.sym) e.currentTarget.style.background = '#fff3ec'; }}
              onMouseOut={e => { if (selected?.sym !== item.sym) e.currentTarget.style.background = '#ffffff'; }}
            >
              <div style={{
                fontFamily: "'Oswald',sans-serif", fontSize: '0.75rem', letterSpacing: '0.1em',
                color: selected?.sym === item.sym ? '#ff6600' : '#999999', marginBottom: 2,
              }}>
                {item.flag || ''} {item.sym}
              </div>
              <div style={{
                fontFamily: "'Libre Baskerville',serif", fontSize: '0.82rem', fontWeight: 700,
                color: selected?.sym === item.sym ? '#ff9944' : '#0d0d0d',
                lineHeight: 1.25, marginBottom: 4,
              }}>
                {item.name}
              </div>
              <div style={{
                fontFamily: "'Oswald',sans-serif", fontSize: '0.9rem', fontWeight: 700,
                color: selected?.sym === item.sym ? '#ffffff' : '#0d0d0d',
              }}>
                {item.price}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <DirIcon dir={item.chgDir} />
                <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: '0.72rem', color: dirColor(item.chgDir) }}>
                  {item.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Explainer box ── */}
        <div style={{ background: '#0d0d0d', borderTop: '2px solid #ff6600', padding: '20px 24px', minHeight: 130 }}>
          {!selected ? (
            <p style={{
              fontFamily: "'Oswald',sans-serif", fontSize: '0.82rem', letterSpacing: '0.12em',
              color: '#444444', textAlign: 'center', paddingTop: 20, textTransform: 'uppercase',
            }}>
              Click any item above to understand what's driving it — in plain language
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: '0.8rem', letterSpacing: '0.1em', color: '#ff6600', textTransform: 'uppercase' }}>
                  {selected.flag || ''} {selected.name} ({selected.sym})
                </span>
                <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: '1.1rem', color: '#ffffff' }}>
                  {selected.price}
                </span>
                <span style={{ fontFamily: "'Oswald',sans-serif", fontSize: '0.8rem', color: dirColor(selected.chgDir) }}>
                  {selected.chgDir === 'up' ? '▲' : selected.chgDir === 'dn' ? '▼' : '—'} {selected.change}
                </span>
              </div>
              <p style={{ fontFamily: "'Libre Baskerville',serif", fontSize: '0.9rem', color: '#bbbbbb', lineHeight: 1.75, marginBottom: 14 }}>
                {selected.explain}
              </p>
              <div style={{
                borderLeft: '3px solid #ff6600', paddingLeft: 14,
                background: 'rgba(255,102,0,0.08)', padding: '10px 14px', borderRadius: '0 2px 2px 0',
              }}>
                <div style={{
                  fontFamily: "'Oswald',sans-serif", fontSize: '0.72rem', letterSpacing: '0.22em',
                  color: '#ff6600', marginBottom: 6, textTransform: 'uppercase',
                }}>
                  What this means for everyday Rwandans
                </div>
                <p style={{ fontFamily: "'Libre Baskerville',serif", fontSize: '0.9rem', color: '#e0e0e0', lineHeight: 1.7 }}>
                  {selected.eli5}
                </p>
              </div>
              <CommentSection marketType={marketType} sym={selected.sym} itemName={selected.name} />
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

// components/market/CommentSection.js
import React, { useState, useEffect, useCallback } from 'react';
import { ThumbsUp, Reply, Trash2, Send, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const authHeaders = () => {
  const token = localStorage.getItem('userToken') || localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

const isLoggedIn = () => !!(localStorage.getItem('userToken') || localStorage.getItem('authToken'));
const currentUserId = () => localStorage.getItem('userId');

// ── Reply Component ──────────────────────────────────────────────
const ReplyItem = ({ reply, commentId, onLikeReply, onDelete, canDelete }) => {
  const liked = reply.likes?.includes(currentUserId());

  return (
    <div style={{
      display: 'flex', gap: 10, padding: '10px 0 10px 16px',
      borderLeft: '2px solid rgba(255,102,0,0.2)',
      marginLeft: 8,
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
        border: '1px solid rgba(255,102,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Oswald', sans-serif", fontSize: '0.65rem', color: '#ff6600',
      }}>
        {reply.userName?.[0]?.toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.7rem', letterSpacing: '0.1em', color: '#ff9944' }}>
            {reply.userName}
          </span>
          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.62rem', color: '#333333', letterSpacing: '0.06em' }}>
            {timeAgo(reply.createdAt)}
          </span>
        </div>
        <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '0.82rem', color: '#cccccc', lineHeight: 1.6, margin: 0, wordBreak: 'break-word' }}>
          {reply.text}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
          <button
            onClick={() => onLikeReply(commentId, reply._id)}
            style={{
              background: 'none', border: 'none', cursor: isLoggedIn() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', gap: 4, padding: 0,
              color: liked ? '#ff6600' : '#444444', transition: 'color 0.15s',
            }}
          >
            <ThumbsUp style={{ width: 11, height: 11 }} />
            <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.65rem', letterSpacing: '0.08em' }}>
              {reply.likes?.length || 0}
            </span>
          </button>
          {canDelete && (
            <button
              onClick={() => onDelete(commentId, reply._id, true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333333', padding: 0, transition: 'color 0.15s' }}
              onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
              onMouseOut={e => e.currentTarget.style.color = '#333333'}
            >
              <Trash2 style={{ width: 11, height: 11 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Single Comment ───────────────────────────────────────────────
const CommentItem = ({ comment, onLike, onLikeReply, onReply, onDelete }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replyOpen, setReplyOpen]     = useState(false);
  const [replyText, setReplyText]     = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const liked     = comment.likes?.includes(currentUserId());
  const isOwner   = comment.user === currentUserId() || comment.user?._id === currentUserId();
  const replyCount = comment.replies?.length || 0;

  const submitReply = async () => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    await onReply(comment._id, replyText.trim());
    setReplyText('');
    setReplyOpen(false);
    setShowReplies(true);
    setSubmitting(false);
  };

  return (
    <div style={{
      background: '#151515',
      border: '1px solid rgba(255,102,0,0.1)',
      borderRadius: 2,
      padding: '14px 16px',
      transition: 'border-color 0.2s',
    }}
      onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(255,102,0,0.25)'}
      onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,102,0,0.1)'}
    >
      {/* Comment header */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #1a0a00, #2a1200)',
          border: '1px solid rgba(255,102,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Oswald', sans-serif", fontSize: '0.78rem', fontWeight: 700, color: '#ff6600',
        }}>
          {comment.userName?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.75rem', letterSpacing: '0.12em', color: '#ff9944', textTransform: 'uppercase' }}>
                {comment.userName}
              </span>
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.62rem', color: '#333333', letterSpacing: '0.08em' }}>
                {timeAgo(comment.createdAt)}
              </span>
            </div>
            {isOwner && (
              <button
                onClick={() => onDelete(comment._id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333333', padding: 0, transition: 'color 0.15s' }}
                onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                onMouseOut={e => e.currentTarget.style.color = '#333333'}
              >
                <Trash2 style={{ width: 12, height: 12 }} />
              </button>
            )}
          </div>
          <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '0.88rem', color: '#e0e0e0', lineHeight: 1.7, margin: 0, wordBreak: 'break-word' }}>
            {comment.text}
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
            <button
              onClick={() => onLike(comment._id)}
              style={{
                background: 'none', border: 'none', cursor: isLoggedIn() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', gap: 5, padding: 0,
                color: liked ? '#ff6600' : '#444444', transition: 'color 0.15s',
              }}
              onMouseOver={e => { if (isLoggedIn()) e.currentTarget.style.color = '#ff6600'; }}
              onMouseOut={e => { if (!liked) e.currentTarget.style.color = '#444444'; }}
            >
              <ThumbsUp style={{ width: 13, height: 13 }} />
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.68rem', letterSpacing: '0.1em' }}>
                {comment.likes?.length || 0}
              </span>
            </button>

            {isLoggedIn() && (
              <button
                onClick={() => setReplyOpen(v => !v)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5, padding: 0,
                  color: replyOpen ? '#ff6600' : '#444444', transition: 'color 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.color = '#ff6600'}
                onMouseOut={e => { if (!replyOpen) e.currentTarget.style.color = '#444444'; }}
              >
                <Reply style={{ width: 13, height: 13 }} />
                <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.68rem', letterSpacing: '0.1em' }}>Reply</span>
              </button>
            )}

            {replyCount > 0 && (
              <button
                onClick={() => setShowReplies(v => !v)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5, padding: 0,
                  color: '#555555', transition: 'color 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.color = '#ff9944'}
                onMouseOut={e => e.currentTarget.style.color = '#555555'}
              >
                {showReplies ? <ChevronUp style={{ width: 13, height: 13 }} /> : <ChevronDown style={{ width: 13, height: 13 }} />}
                <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '0.68rem', letterSpacing: '0.08em' }}>
                  {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                </span>
              </button>
            )}
          </div>

          {/* Reply input */}
          {replyOpen && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitReply()}
                placeholder="Write a reply..."
                maxLength={500}
                style={{
                  flex: 1, background: '#0a0a0a', border: '1px solid rgba(255,102,0,0.2)',
                  borderRadius: 2, padding: '7px 10px', color: '#e0e0e0',
                  fontFamily: "'Libre Baskerville', serif", fontSize: '0.82rem', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(255,102,0,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,102,0,0.2)'}
                autoFocus
              />
              <button
                onClick={submitReply}
                disabled={!replyText.trim() || submitting}
                style={{
                  background: replyText.trim() ? '#ff6600' : '#1a1a1a',
                  border: '1px solid rgba(255,102,0,0.3)', borderRadius: 2,
                  padding: '7px 12px', cursor: replyText.trim() ? 'pointer' : 'default',
                  color: replyText.trim() ? '#ffffff' : '#444444', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <Send style={{ width: 13, height: 13 }} />
              </button>
            </div>
          )}

          {/* Replies list */}
          {showReplies && comment.replies?.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {comment.replies.map(reply => (
                <ReplyItem
                  key={reply._id}
                  reply={reply}
                  commentId={comment._id}
                  onLikeReply={onLikeReply}
                  onDelete={onDelete}
                  canDelete={reply.user === currentUserId() || reply.user?._id === currentUserId()}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main CommentSection ──────────────────────────────────────────
const CommentSection = ({ marketType, sym, itemName }) => {
  const [comments, setComments]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [text, setText]               = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const [collapsed, setCollapsed]     = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`${API}/comments/${marketType}/${sym}`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [marketType, sym]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const submitComment = async () => {
    if (!text.trim() || submitting) return;
    if (!isLoggedIn()) { setError('Sign in to comment'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/comments/${marketType}/${sym}`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ text: text.trim() })
      });
      if (!res.ok) throw new Error();
      const newComment = await res.json();
      setComments(prev => [newComment, ...prev]);
      setText('');
    } catch {
      setError('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId) => {
    if (!isLoggedIn()) return;
    try {
      const res = await fetch(`${API}/comments/${commentId}/like`, { method: 'PATCH', headers: authHeaders() });
      if (!res.ok) return;
      const { likes, liked } = await res.json();
      const uid = currentUserId();
      setComments(prev => prev.map(c => {
        if (c._id !== commentId) return c;
        const newLikes = liked
          ? [...(c.likes || []), uid]
          : (c.likes || []).filter(id => id !== uid);
        return { ...c, likes: newLikes };
      }));
    } catch {}
  };

  const handleLikeReply = async (commentId, replyId) => {
    if (!isLoggedIn()) return;
    try {
      const res = await fetch(`${API}/comments/${commentId}/replies/${replyId}/like`, { method: 'PATCH', headers: authHeaders() });
      if (!res.ok) return;
      const { likes, liked } = await res.json();
      const uid = currentUserId();
      setComments(prev => prev.map(c => {
        if (c._id !== commentId) return c;
        return {
          ...c,
          replies: c.replies.map(r => {
            if (r._id !== replyId) return r;
            const newLikes = liked
              ? [...(r.likes || []), uid]
              : (r.likes || []).filter(id => id !== uid);
            return { ...r, likes: newLikes };
          })
        };
      }));
    } catch {}
  };

  const handleReply = async (commentId, replyText) => {
    try {
      const res = await fetch(`${API}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ text: replyText })
      });
      if (!res.ok) return;
      const updatedComment = await res.json();
      setComments(prev => prev.map(c => c._id === commentId ? updatedComment : c));
    } catch {}
  };

  const handleDelete = async (commentId) => {
    try {
      const res = await fetch(`${API}/comments/${commentId}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) return;
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch {}
  };

  const totalReplies = comments.reduce((sum, c) => sum + (c.replies?.length || 0), 0);

  return (
    <div style={{
      borderTop: '1px solid rgba(255,102,0,0.2)',
      background: '#0d0d0d',
    }}>
      {/* Section toggle header */}
      <button
        onClick={() => setCollapsed(v => !v)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          padding: '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: collapsed ? 'none' : '1px solid rgba(255,102,0,0.15)',
          transition: 'background 0.15s',
        }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,102,0,0.04)'}
        onMouseOut={e => e.currentTarget.style.background = 'none'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MessageCircle style={{ width: 14, height: 14, color: '#ff6600' }} />
          <span style={{
            fontFamily: "'Oswald', sans-serif", fontSize: '0.72rem',
            letterSpacing: '0.2em', color: '#ff6600', textTransform: 'uppercase',
          }}>
            Market Opinions
          </span>
          {comments.length > 0 && (
            <span style={{
              background: 'rgba(255,102,0,0.15)', border: '1px solid rgba(255,102,0,0.3)',
              borderRadius: 2, padding: '1px 7px',
              fontFamily: "'Oswald', sans-serif", fontSize: '0.65rem', color: '#ff9944',
              letterSpacing: '0.1em',
            }}>
              {comments.length + totalReplies}
            </span>
          )}
        </div>
        {collapsed
          ? <ChevronDown style={{ width: 14, height: 14, color: '#555555' }} />
          : <ChevronUp style={{ width: 14, height: 14, color: '#555555' }} />
        }
      </button>

      {!collapsed && (
        <div style={{ padding: '16px 20px 20px' }}>
          {/* Item label */}
          <div style={{
            fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic',
            fontSize: '0.8rem', color: '#555555', marginBottom: 14,
          }}>
            Share your take on <span style={{ color: '#ff9944' }}>{itemName}</span>
          </div>

          {/* Compose box */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={isLoggedIn() ? `What do you think is driving ${itemName}?` : 'Sign in to share your market analysis...'}
                disabled={!isLoggedIn()}
                maxLength={1000}
                rows={2}
                style={{
                  flex: 1, background: isLoggedIn() ? '#0a0a0a' : '#080808',
                  border: '1px solid rgba(255,102,0,0.2)', borderRadius: 2,
                  padding: '10px 12px', color: '#e0e0e0', resize: 'vertical',
                  fontFamily: "'Libre Baskerville', serif", fontSize: '0.85rem',
                  lineHeight: 1.6, outline: 'none', minHeight: 60,
                  opacity: isLoggedIn() ? 1 : 0.5,
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(255,102,0,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,102,0,0.2)'}
              />
              <button
                onClick={submitComment}
                disabled={!text.trim() || submitting || !isLoggedIn()}
                style={{
                  alignSelf: 'flex-end',
                  background: text.trim() && isLoggedIn() ? '#ff6600' : '#111111',
                  border: '1px solid rgba(255,102,0,0.3)',
                  borderRadius: 2, padding: '10px 16px',
                  cursor: text.trim() && isLoggedIn() ? 'pointer' : 'default',
                  color: text.trim() && isLoggedIn() ? '#ffffff' : '#333333',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: "'Oswald', sans-serif", fontSize: '0.72rem', letterSpacing: '0.14em',
                  whiteSpace: 'nowrap',
                }}
              >
                <Send style={{ width: 13, height: 13 }} />
                POST
              </button>
            </div>
            {error && (
              <div style={{
                marginTop: 8, fontFamily: "'Oswald', sans-serif", fontSize: '0.68rem',
                letterSpacing: '0.1em', color: '#ef4444',
              }}>
                ⚠ {error}
              </div>
            )}
            {text.length > 800 && (
              <div style={{
                marginTop: 4, fontFamily: "'Oswald', sans-serif", fontSize: '0.62rem',
                color: '#555555', textAlign: 'right',
              }}>
                {text.length}/1000
              </div>
            )}
          </div>

          {/* Comments list */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...Array(2)].map((_, i) => (
                <div key={i} style={{
                  height: 80, borderRadius: 2,
                  background: 'linear-gradient(90deg,#111 25%,#1a1a1a 50%,#111 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.4s infinite',
                }} />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '28px 0',
              fontFamily: "'Libre Baskerville', serif", fontStyle: 'italic',
              fontSize: '0.85rem', color: '#333333',
            }}>
              No opinions yet. Be the first to analyse this.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {comments.map(comment => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  onLike={handleLike}
                  onLikeReply={handleLikeReply}
                  onReply={handleReply}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;

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
  localStorage.setItem('userId', data.user.id);
  localStorage.setItem('userToken', data.token);
  return data;
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