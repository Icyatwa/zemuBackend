// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, adminOnly } = require('../middleware/auth');
const { uploadArticleImage } = require('../controllers/uploadController');

// Store file in memory (buffer) before streaming to GCS
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'), false);
    }
  },
});

// POST /api/upload/article-image  — admin only
router.post(
  '/article-image',
  protect,
  adminOnly,
  upload.single('image'),
  uploadArticleImage
);

module.exports = router;
