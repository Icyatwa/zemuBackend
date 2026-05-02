const { Stock, Forex, Good } = require('../models/MarketData');

const getModel = (type) => {
  if (type === 'stocks') return Stock;
  if (type === 'forex') return Forex;
  if (type === 'goods') return Good;
  return null;
};

// ─── GET all (public) ─────────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { type } = req.params;
    const Model = getModel(type);
    if (!Model) return res.status(400).json({ message: 'Invalid type' });
    const items = await Model.find().sort({ sym: 1 });
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── CREATE ───────────────────────────────────────────────────────────────────
exports.createItem = async (req, res) => {
  try {
    const { type } = req.params;
    const Model = getModel(type);
    if (!Model) return res.status(400).json({ message: 'Invalid type' });
    const item = await Model.create({ ...req.body, updatedAt: new Date() });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
exports.updateItem = async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = getModel(type);
    if (!Model) return res.status(400).json({ message: 'Invalid type' });
    const item = await Model.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.status(200).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
exports.deleteItem = async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = getModel(type);
    if (!Model) return res.status(400).json({ message: 'Invalid type' });
    const item = await Model.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── SEED (one-time import of hardcoded arrays) ───────────────────────────────
exports.seedData = async (req, res) => {
  try {
    const { type } = req.params;
    const Model = getModel(type);
    if (!Model) return res.status(400).json({ message: 'Invalid type' });
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ message: 'items must be array' });
    await Model.deleteMany({});
    const created = await Model.insertMany(items.map(i => ({ ...i, updatedAt: new Date() })));
    res.status(201).json({ message: `Seeded ${created.length} items`, count: created.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};