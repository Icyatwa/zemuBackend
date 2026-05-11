// routes/commentRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

// ─── Activity feed — MUST be before /:commentId routes ───────────────────────
router.get('/my-activity', protect, ctrl.getMyActivity);

// ─── Market comments ──────────────────────────────────────────────────────────
router.get('/market/:marketType/:sym', protect, ctrl.getMarketComments);
router.post('/market/:marketType/:sym', protect, ctrl.createMarketComment);
router.get('/market/:marketType/:sym/:docId', protect, ctrl.getMarketCommentsByDocId);

// ─── News comments ────────────────────────────────────────────────────────────
router.get('/news/:newsId', protect, ctrl.getNewsComments);
router.post('/news/:newsId', protect, ctrl.createNewsComment);

// ─── Shared reply / like routes ───────────────────────────────────────────────
router.post('/:commentId/replies', protect, ctrl.addReply);
router.patch('/:commentId/like', protect, ctrl.toggleCommentLike);
router.patch('/:commentId/replies/:replyId/like', protect, ctrl.toggleReplyLike);
router.delete('/:commentId', protect, ctrl.deleteComment);

module.exports = router;