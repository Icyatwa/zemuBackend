// controllers/commentController.js
const Comment = require('../models/Comment');
const mongoose = require('mongoose');
const { Stock, Forex, Good } = require('../models/MarketData');
const News = require('../models/News');

// ─── GET comments for a MARKET item ──────────────────────────────────────────
exports.getMarketComments = async (req, res) => {
  try {
    const { marketType, sym } = req.params;
    // Comments are keyed by marketType+sym string — they belong to the sym,
    // not to a specific document version. No archived filter needed here.
    const comments = await Comment.find({ sourceType: 'market', marketType, sym: sym.toUpperCase() })
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
    const { text, marketDocId } = req.body;  // ← frontend sends this
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text required' });

    const comment = await Comment.create({
      sourceType: 'market', marketType, sym,
      marketDocId: marketDocId || null,       // ← store it
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

exports.getMarketCommentsByDocId = async (req, res) => {
  try {
    const { marketType, sym, docId } = req.params;
    const comments = await Comment.find({
      sourceType: 'market', marketType, sym, marketDocId: docId
    }).sort({ createdAt: -1 }).limit(50);
    res.status(200).json(comments);
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

    // For activity, we want to show the *archived* doc that the comments were written about,
    // not the live current doc. We find the most-recent archived doc whose _id matches
    // any marketDocId stored on the user's comments for that sym.
    const marketItemPromises = Array.from(marketKeys.values()).map(({ marketType, sym, ids }) => {
      const ModelMap = { stocks: Stock, forex: Forex, goods: Good };
      const Model = ModelMap[marketType];
      if (!Model) return Promise.resolve(null);

      // Gather the distinct marketDocIds the user's comments reference for this sym
      const relevantComments = threads.filter(t =>
        t.sourceType === 'market' && t.marketType === marketType && t.sym === sym && t.marketDocId
      );
      const docIds = [...new Set(relevantComments.map(c => c.marketDocId?.toString()).filter(Boolean))];

      if (docIds.length > 0) {
        // Prefer the archived doc(s) the comments were actually written on
        return Model.findOne({ _id: { $in: docIds }, archived: true })
          .sort({ archivedAt: -1 })
          .lean()
          .then(archived => {
            if (archived) return { ...archived, _isArchived: true };
            // Fall back to live doc if somehow not archived yet
            return Model.findOne({ sym, archived: { $ne: true } }).lean();
          });
      }
      // No marketDocId on comments (legacy) — fall back to live doc
      return Model.findOne({ sym, archived: { $ne: true } }).lean();
    });

    const newsArticlePromises = Array.from(newsKeys.values()).map(({ newsId }) =>
      News.findById(newsId).select('title summary content author date category image wasEdited editedAt').lean()
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
      const mItem = marketItems[idx] || null;
      conversationMap.set(key, {
        key,
        sourceType: 'market',
        marketType,
        sym,
        label: `${marketType?.toUpperCase()} · ${sym}`,
        allComments,
        lastActivity: allComments[0]?.createdAt || null,
        marketItem: mItem,
        marketItemIsArchived: mItem?._isArchived || false,  // tells frontend this is the old doc
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