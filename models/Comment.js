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