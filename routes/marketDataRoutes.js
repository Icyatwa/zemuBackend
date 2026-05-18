// routes/marketDataRoute.js
const express = require('express');
const router  = express.Router();
const { getAll, createItem, updateItem, deleteItem, seedData, publishNewData } = require('../controllers/marketDataController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/:type', getAll);

router.post('/:type/seed',        protect, adminOnly, seedData);
router.post('/:type',             protect, adminOnly, createItem);
router.put('/:type/:id',          protect, adminOnly, updateItem);
router.put('/:type/:id/new-data', protect, adminOnly, publishNewData); // ← new
router.delete('/:type/:id',       protect, adminOnly, deleteItem);

module.exports = router; 