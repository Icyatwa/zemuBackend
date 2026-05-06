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