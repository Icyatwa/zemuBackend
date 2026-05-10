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
      { ...req.body, wasEdited: true, editedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!news) return res.status(404).json({ message: 'News not found' });
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