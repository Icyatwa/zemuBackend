// models/Comment.js
const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'UserAccount', required: true },
  userName:      { type: String, required: true },
  text:          { type: String, required: true, maxlength: 500 },
  likes:         { type: [mongoose.Schema.Types.ObjectId], ref: 'UserAccount', default: [] },
  parentReplyId: { type: mongoose.Schema.Types.ObjectId, default: null }, // ← NEW
  createdAt:     { type: Date, default: Date.now }
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