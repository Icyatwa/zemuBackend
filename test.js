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

newsSchema.index({ status: 1, createdAt: -1 });        // main feed query
newsSchema.index({ status: 1, category: 1, createdAt: -1 }); // filtered feed
newsSchema.index({ status: 1, title: 'text', summary: 'text' }); // search

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

// models/Comments.js
const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'UserAccount', required: true },
  userName:      { type: String, required: true },
  text: { type: String, required: true, maxlength: 2000 },
  likes:         { type: [mongoose.Schema.Types.ObjectId], ref: 'UserAccount', default: [] },
  parentReplyId: { type: mongoose.Schema.Types.ObjectId, default: null },
  createdAt:     { type: Date, default: Date.now }
}, { _id: true });

const commentSchema = new mongoose.Schema({
  // 'market' or 'news'
  sourceType: {
    type: String,
    enum: ['market', 'news'],
    required: true,
    default: 'market'
  },

  // ── Market fields (sourceType === 'market') ──
  marketType: {
    type: String,
    enum: ['stocks', 'forex', 'goods', null],
    default: null
  },
  sym: { type: String, default: null },

  // ── News fields (sourceType === 'news') ──
  newsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'News',
    default: null
  },
  newsTitle: { type: String, default: null }, // denormalized for activity feed

  // ── Common ──
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'UserAccount', required: true },
  userName: { type: String, required: true },
  text: { type: String, required: true, maxlength: 5000 },
  likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserAccount' }],
  replies:  [replySchema],
  createdAt:{ type: Date, default: Date.now }
});

commentSchema.index({ sourceType: 1, marketType: 1, sym: 1, createdAt: -1 });
commentSchema.index({ sourceType: 1, newsId: 1, createdAt: -1 });
commentSchema.index({ user: 1, createdAt: -1 }); // for activity feed

module.exports = mongoose.model('Comment', commentSchema);

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

// src/controllers/newsController.js
const News = require('../models/News');

// Redis client setup
let redisClient = null;

// Cache configuration (kept for future use)
const CACHE_EXPIRY = {
  PUBLISHED_NEWS: 300, // 5 minutes
  DASHBOARD_STATS: 180, // 3 minutes
  SEARCH_RESULTS: 120,  // 2 minutes
};

// Helper function for cache operations
const cacheGet = async (key) => {
  return null; // Always return null when Redis is disabled
};

const cacheSet = async (key, data, expiry = 300) => {
  return; // No-op when Redis is disabled
};


const cacheDelete = async (pattern) => {
  if (!redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.warn('Cache delete error:', error);
  }
};

// Optimized database queries with proper indexing hints
const optimizeQuery = (query) => {
  // Add hints for MongoDB to use proper indexes
  return query.hint({ status: 1, createdAt: -1 });
};

exports.getAllNews = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (category && category !== 'all') query.category = category;
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await News.countDocuments(query);
    const news = await News.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      news,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getNewsById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }
    res.status(200).json(news);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createNews = async (req, res) => {
  try {
    const newsData = {
      ...req.body,
      createdBy: req.user._id
    };

    const news = await News.create(newsData);
    res.status(201).json(news);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateNews = async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    res.status(200).json(news);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    
    if (!news) {
      return res.status(404).json({ message: 'News not found' });
    }

    res.status(200).json({ message: 'News deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [stats, recentActivity] = await Promise.all([
      News.aggregate([
        { $facet: {
          total:      [{ $count: 'n' }],
          byStatus:   [{ $group: { _id: '$status', n: { $sum: 1 } } }],
          byCategory: [{ $group: { _id: '$category', n: { $sum: 1 } } }],
        }}
      ]),
      News.find().sort({ updatedAt: -1 }).limit(5)
        .select('title status updatedAt createdBy')
    ]);

    const s    = stats[0];
    const byStatus   = Object.fromEntries(s.byStatus.map(x => [x._id, x.n]));
    const byCategory = Object.fromEntries(s.byCategory.map(x => [x._id, x.n]));

    res.status(200).json({
      totalArticles:     s.total[0]?.n || 0,
      publishedArticles: byStatus.published || 0,
      draftArticles:     byStatus.draft || 0,
      categories: {
        growth:     byCategory.growth || 0,
        investment: byCategory.investment || 0,
        trade:      byCategory.trade || 0,
        policy:     byCategory.policy || 0,
      },
      recentActivity,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPublishedNews = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    const query = { status: 'published' }; // Only fetch published news

    if (category && category !== 'all') query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await News.countDocuments(query);
    const news = await News.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      news,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPublishedNewsById = async (req, res) => {
  try {
    const news = await News.findOne({ 
      _id: req.params.id,
      status: 'published' // Only return published articles
    });
    
    if (!news) {
      return res.status(404).json({ message: 'News article not found' });
    }
    
    res.status(200).json(news);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// New endpoint for prefetching
exports.prefetchNews = async (req, res) => {
  try {
    res.status(200).json({ message: 'Prefetch not available without Redis' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Cache warming function (no-op without Redis)
exports.warmCache = async () => {
  console.log('Cache warming skipped - Redis not available');
  return;
};

// marketDataController.js
const { Stock, Forex, Good } = require('../models/MarketData');

const getModel = (type) => {
  if (type === 'stocks') return Stock;
  if (type === 'forex') return Forex;
  if (type === 'goods') return Good;
  return null;
};

// ─── GET all (public) ─────────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { type } = req.params;
    const Model = getModel(type);
    if (!Model) return res.status(400).json({ message: 'Invalid type' });
    const items = await Model.find().sort({ sym: 1 });
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── CREATE ───────────────────────────────────────────────────────────────────
exports.createItem = async (req, res) => {
  try {
    const { type } = req.params;
    const Model = getModel(type);
    if (!Model) return res.status(400).json({ message: 'Invalid type' });
    const item = await Model.create({ ...req.body, updatedAt: new Date() });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
exports.updateItem = async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = getModel(type);
    if (!Model) return res.status(400).json({ message: 'Invalid type' });
    const item = await Model.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.status(200).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
exports.deleteItem = async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = getModel(type);
    if (!Model) return res.status(400).json({ message: 'Invalid type' });
    const item = await Model.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── SEED (one-time import of hardcoded arrays) ───────────────────────────────
exports.seedData = async (req, res) => {
  try {
    const { type } = req.params;
    const Model = getModel(type);
    if (!Model) return res.status(400).json({ message: 'Invalid type' });
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ message: 'items must be array' });
    await Model.deleteMany({});
    const created = await Model.insertMany(items.map(i => ({ ...i, updatedAt: new Date() })));
    res.status(201).json({ message: `Seeded ${created.length} items`, count: created.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// controllers/commentController.js
const Comment = require('../models/Comment');
const mongoose = require('mongoose');
const { Stock, Forex, Good } = require('../models/MarketData');
const News = require('../models/News');

// ─── GET comments for a MARKET item ──────────────────────────────────────────
exports.getMarketComments = async (req, res) => {
  try {
    const { marketType, sym } = req.params;
    const comments = await Comment.find({ sourceType: 'market', marketType, sym })
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── POST comment on a MARKET item ───────────────────────────────────────────
exports.createMarketComment = async (req, res) => {
  try {
    const { marketType, sym } = req.params;
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text required' });

    const comment = await Comment.create({
      sourceType: 'market',
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

// ─── GET comments for a NEWS article ─────────────────────────────────────────
exports.getNewsComments = async (req, res) => {
  try {
    const { newsId } = req.params;
    const comments = await Comment.find({ sourceType: 'news', newsId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── POST comment on a NEWS article ──────────────────────────────────────────
exports.createNewsComment = async (req, res) => {
  try {
    const { newsId } = req.params;
    const { text, newsTitle } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text required' });

    const comment = await Comment.create({
      sourceType: 'news',
      newsId,
      newsTitle: newsTitle || null,
      user: req.user._id,
      userName: req.user.name,
      text: text.trim()
    });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── POST a reply (works for both market & news comments) ────────────────────
exports.addReply = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text, parentReplyId } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Reply text required' });

    const comment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $push: {
          replies: {
            user:          req.user._id,
            userName:      req.user.name,
            text:          text.trim(),
            likes:         [],
            parentReplyId: parentReplyId || null,
            createdAt:     new Date()
          }
        }
      },
      { new: true, runValidators: false }
    );

    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── PATCH toggle like on comment ────────────────────────────────────────────
exports.toggleCommentLike = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id.toString();

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const idx = comment.likes.findIndex(id => id.toString() === userId);
    if (idx === -1) comment.likes.push(req.user._id);
    else comment.likes.splice(idx, 1);

    await comment.save();
    res.status(200).json({ likes: comment.likes.length, liked: idx === -1 });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── PATCH toggle like on reply ───────────────────────────────────────────────
exports.toggleReplyLike = async (req, res) => {
  try {
    const { commentId, replyId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findOne({ _id: commentId, 'replies._id': replyId });
    if (!comment) return res.status(404).json({ message: 'Comment or reply not found' });

    const reply = comment.replies.id(replyId);
    const alreadyLiked = reply.likes.some(id => id.toString() === userId.toString());

    const update = alreadyLiked
      ? { $pull: { 'replies.$.likes': userId } }
      : { $push: { 'replies.$.likes': userId } };

    await Comment.updateOne({ _id: commentId, 'replies._id': replyId }, update);
    res.status(200).json({ likes: reply.likes.length + (alreadyLiked ? -1 : 1), liked: !alreadyLiked });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── DELETE a comment (owner or admin) ───────────────────────────────────────
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

exports.getMyActivity = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const myComments     = await Comment.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean();  // was 200
const repliedThreads = await Comment.find({ 'replies.user': userId }).sort({ createdAt: -1 }).limit(50).lean(); // was 200

    const threadMap = new Map();
    for (const c of [...myComments, ...repliedThreads]) {
      if (!threadMap.has(c._id.toString())) threadMap.set(c._id.toString(), c);
    }

    const threads = Array.from(threadMap.values());
    const marketKeys = new Map();
    const newsKeys   = new Map();

    for (const t of threads) {
      if (t.sourceType === 'market') {
        const key = `${t.marketType}:${t.sym}`;
        if (!marketKeys.has(key)) marketKeys.set(key, { marketType: t.marketType, sym: t.sym, ids: [] });
        marketKeys.get(key).ids.push(t._id.toString());
      } else {
        const key = t.newsId?.toString();
        if (key && !newsKeys.has(key)) newsKeys.set(key, { newsId: t.newsId, newsTitle: t.newsTitle, ids: [] });
        if (key) newsKeys.get(key).ids.push(t._id.toString());
      }
    }

    const marketSiblingPromises = Array.from(marketKeys.values()).map(({ marketType, sym }) =>
      Comment.find({ sourceType: 'market', marketType, sym }).sort({ createdAt: -1 }).limit(50).lean()
    );
    const newsSiblingPromises = Array.from(newsKeys.values()).map(({ newsId }) =>
      Comment.find({ sourceType: 'news', newsId }).sort({ createdAt: -1 }).limit(50).lean()
    );

    // ── NEW: fetch the actual market item and news article for context ──
    const marketItemPromises = Array.from(marketKeys.values()).map(({ marketType, sym }) => {
      const ModelMap = { stocks: Stock, forex: Forex, goods: Good };
      const Model = ModelMap[marketType];
      return Model ? Model.findOne({ sym }).lean() : Promise.resolve(null);
    });

    const newsArticlePromises = Array.from(newsKeys.values()).map(({ newsId }) =>
      News.findById(newsId).select('title summary content author date category image').lean()
    );

    const [marketSiblingGroups, newsSiblingGroups, marketItems, newsArticles] = await Promise.all([
      Promise.all(marketSiblingPromises),
      Promise.all(newsSiblingPromises),
      Promise.all(marketItemPromises),   // ← new
      Promise.all(newsArticlePromises),  // ← new
    ]);

    const conversationMap = new Map();

    Array.from(marketKeys.values()).forEach(({ marketType, sym }, idx) => {
      const key = `market:${marketType}:${sym}`;
      const allComments = marketSiblingGroups[idx] || [];
      conversationMap.set(key, {
        key,
        sourceType: 'market',
        marketType,
        sym,
        label: `${marketType?.toUpperCase()} · ${sym}`,
        allComments,
        lastActivity: allComments[0]?.createdAt || null,
        marketItem: marketItems[idx] || null,   // ← new
      });
    });

    Array.from(newsKeys.values()).forEach(({ newsId, newsTitle }, idx) => {
      const key = `news:${newsId}`;
      const allComments = newsSiblingGroups[idx] || [];
      conversationMap.set(key, {
        key,
        sourceType: 'news',
        newsId,
        newsTitle,
        label: newsTitle || 'News Article',
        allComments,
        lastActivity: allComments[0]?.createdAt || null,
        newsArticle: newsArticles[idx] || null,  // ← new
      });
    });

    const conversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

    res.status(200).json({ conversations, totalThreads: threads.length });
  } catch (err) {
    console.error('getMyActivity error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// src/routes/userAuthRoutes.js
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/userAuthController');

router.post('/register', register);
router.post('/login', login);

module.exports = router;

// src/routes/newsRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getAllNews, 
  getNewsById, 
  createNews, 
  updateNews, 
  deleteNews,
  getDashboardStats,
  getPublishedNews,
  getPublishedNewsById,
  prefetchNews
} = require('../controllers/newsController');
const { protect, adminOnly } = require('../middleware/auth');

// Public routes
router.get('/published', getPublishedNews);
router.get('/published/:id', getPublishedNewsById); // Using the new function
router.post('/prefetch', prefetchNews);

// Protected routes (for admins)
router.get('/', protect, adminOnly, getAllNews);
router.post('/', protect, adminOnly, createNews);
router.get('/dashboard/stats', protect, adminOnly, getDashboardStats);
router.get('/:id', protect, getNewsById); // Admin can access any article
router.put('/:id', protect, adminOnly, updateNews);
router.delete('/:id', protect, adminOnly, deleteNews);
module.exports = router;

// routes/marketDataRoute.js
const express = require('express');
const router = express.Router();
const { getAll, createItem, updateItem, deleteItem, seedData } = require('../controllers/marketDataController');
const { protect, adminOnly } = require('../middleware/auth');

// Public - frontend reads these
router.get('/:type', getAll);

// Admin only
router.post('/:type/seed', protect, adminOnly, seedData);
router.post('/:type', protect, adminOnly, createItem);
router.put('/:type/:id', protect, adminOnly, updateItem);
router.delete('/:type/:id', protect, adminOnly, deleteItem);

module.exports = router;

// routes/commentRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/commentController');
const { protect } = require('../middleware/auth'); // adjust to your auth middleware path

// ─── Market comments ──────────────────────────────────────────────────────────
// GET  /api/comments/market/:marketType/:sym
router.get('/market/:marketType/:sym', protect, ctrl.getMarketComments);
// POST /api/comments/market/:marketType/:sym
router.post('/market/:marketType/:sym', protect, ctrl.createMarketComment);

// ─── News comments ────────────────────────────────────────────────────────────
// GET  /api/comments/news/:newsId
router.get('/news/:newsId', protect, ctrl.getNewsComments);
// POST /api/comments/news/:newsId
router.post('/news/:newsId', protect, ctrl.createNewsComment);

// ─── Shared reply / like routes ───────────────────────────────────────────────
// POST   /api/comments/:commentId/replies
router.post('/:commentId/replies', protect, ctrl.addReply);
// PATCH  /api/comments/:commentId/like
router.patch('/:commentId/like', protect, ctrl.toggleCommentLike);
// PATCH  /api/comments/:commentId/replies/:replyId/like
router.patch('/:commentId/replies/:replyId/like', protect, ctrl.toggleReplyLike);
// DELETE /api/comments/:commentId
router.delete('/:commentId', protect, ctrl.deleteComment);

// ─── Activity feed ────────────────────────────────────────────────────────────
// GET /api/comments/my-activity
router.get('/my-activity', protect, ctrl.getMyActivity);

module.exports = router;

// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const compression = require('compression');
const authRoutes = require('./routes/authRoutes');
const userAuthRoutes = require('./routes/userAuthRoutes'); // ← new
const newsRoutes = require('./routes/newsRoutes');
const marketDataRoutes = require('./routes/marketDataRoutes');
const commentRoutes = require('./routes/commentRoutes');
const errorHandler = require('./middleware/errorHandler');
const { warmCache } = require('./controllers/newsController');

dotenv.config();

const app = express();

app.use(compression());
const corsOptions = {
  origin: [
    'https://economy-frontend.vercel.app',  // your Vercel URL
    'http://localhost:3000',                   // for local development
  ],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.get('/api/health', (req, res) => res.json({ ok: true, timestamp: new Date() }));

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