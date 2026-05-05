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