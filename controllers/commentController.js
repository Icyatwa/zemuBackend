// models/commentController.js
const Comment = require('../models/Comment');
const mongoose = require('mongoose'); 

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

    if (!text?.trim()) {
      return res.status(400).json({ message: 'Reply text required' });
    }

    console.log('--- addReply hit ---');
    console.log('commentId:', commentId);
    console.log('user:', req.user?._id, req.user?.name);
    console.log('text:', text);

    const comment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $push: {
          replies: {
            user: req.user._id,
            userName: req.user.name,
            text: text.trim(),
            likes: [],
            createdAt: new Date()
          }
        }
      },
      { new: true, runValidators: false }
    );

    console.log('comment after update:', comment?._id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.status(201).json(comment);

  } catch (err) {
    console.error('addReply ERROR name:', err.name);
    console.error('addReply ERROR message:', err.message);
    console.error('addReply ERROR stack:', err.stack);
    // Send full error back so you can see it in browser too
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message,
      name: err.name,
      stack: err.stack 
    });
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