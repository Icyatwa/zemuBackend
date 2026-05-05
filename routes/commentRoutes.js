const express = require('express');
const router = express.Router();
const {
  getComments, createComment, addReply,
  toggleCommentLike, toggleReplyLike, deleteComment
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

// ── Specific routes FIRST ──────────────────────────────
router.post('/:commentId/replies', protect, addReply);
router.patch('/:commentId/replies/:replyId/like', protect, toggleReplyLike);
router.patch('/:commentId/like', protect, toggleCommentLike);
router.delete('/:commentId', protect, deleteComment);

// ── Generic 2-param routes LAST ───────────────────────
router.get('/:marketType/:sym', protect, getComments);
router.post('/:marketType/:sym', protect, createComment);

module.exports = router;