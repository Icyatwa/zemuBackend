const express = require('express');
const router = express.Router();
const { getAll, createItem, updateItem, deleteItem, seedData } = require('../controllers/marketDataController');
const { protect, adminOnly } = require('../middleware/auth');

// Public - frontend reads these
router.get('/:type', getAll);

// Admin only
router.post('/:type/seed', protect, adminOnly, seedData);
router.post('/:type', protect, adminOnly, createItem);
router.put('/:type/:id', protect, adminOnly, updateItem);
router.delete('/:type/:id', protect, adminOnly, deleteItem);

module.exports = router;