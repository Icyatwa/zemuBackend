// controllers/marketDataController.js
const { Stock, Forex, Good } = require('../models/MarketData');

const getModel = (type) => {
  if (type === 'stocks') return Stock;
  if (type === 'forex')  return Forex;
  if (type === 'goods')  return Good;
  return null;
};

exports.getAll = async (req, res) => {
  try {
    const Model = getModel(req.params.type);
    if (!Model) return res.status(400).json({ message: 'Invalid type' });
    res.status(200).json(await Model.find().sort({ sym: 1 }));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createItem = async (req, res) => {
  try {
    const Model = getModel(req.params.type);
    if (!Model) return res.status(400).json({ message: 'Invalid type' });
    // Prevent duplicates by sym
    const exists = await Model.findOne({ sym: req.body.sym?.toUpperCase() });
    if (exists) return res.status(409).json({ message: 'already_exists', item: exists });
    const item = await Model.create({ ...req.body, sym: req.body.sym?.toUpperCase(), updatedAt: new Date() });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Regular edit (fix typo, update sector/name etc.) — no snapshot saved
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

// New period data — saves current as snapshot, then applies new prices
exports.publishNewData = async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = getModel(type);
    if (!Model) return res.status(400).json({ message: 'Invalid type' });

    const current = await Model.findById(id);
    if (!current) return res.status(404).json({ message: 'Item not found' });

    // Save current data as previous snapshot
    const snapshot = {
      price:      current.price,
      raw:        current.raw,
      change:     current.change,
      chgNum:     current.chgNum,
      chgDir:     current.chgDir,
      explain:    current.explain,
      eli5:       current.eli5,
      recordedAt: current.updatedAt || new Date(),
    };

    const { price, raw, change, chgNum, chgDir, explain, eli5 } = req.body;
    const updated = await Model.findByIdAndUpdate(
      id,
      {
        price, raw, change, chgNum, chgDir, explain, eli5,
        previousSnapshot: snapshot,
        dataUpdatedAt: new Date(),
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

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