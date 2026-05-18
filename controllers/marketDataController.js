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
    const items = await Model.find({ archived: { $ne: true } }).sort({ sym: 1 });
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.createItem = async (req, res) => {
  try {
    const Model = getModel(req.params.type);
    if (!Model) return res.status(400).json({ message: 'Invalid type' });
    const sym = req.body.sym?.trim().toUpperCase();
    if (!sym) return res.status(400).json({ message: 'sym is required' });
    // Check ALL docs — including archived — so a sym retired via "New Data" can't be re-created
    const exists = await Model.findOne({ sym });
    if (exists) return res.status(409).json({ message: 'already_exists', item: exists });
    // Also block duplicate company/currency/item names (case-insensitive) across live docs
    const name = req.body.name?.trim();
    if (name) {
      const nameDup = await Model.findOne({ name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }, archived: { $ne: true } });
      if (nameDup) return res.status(409).json({ message: 'name_exists', item: nameDup });
    }
    const item = await Model.create({ ...req.body, sym, updatedAt: new Date() });
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

    const old = await Model.findById(id);
    if (!old) return res.status(404).json({ message: 'Item not found' });

    // 1. Archive the old document
    await Model.findByIdAndUpdate(id, {
      archived:   true,
      archivedAt: new Date(),
    });

    // 2. Create a fresh document — same identity, new prices, clean slate
    const { price, raw, change, chgNum, chgDir, explain, eli5 } = req.body;
    const freshDoc = {
      sym:    old.sym,
      name:   old.name,
      price, raw, change, chgNum, chgDir, explain, eli5,
      archived:   false,
      updatedAt:  new Date(),
    };
    // carry over sector or flag depending on type
    if (old.sector) freshDoc.sector = old.sector;
    if (old.flag)   freshDoc.flag   = old.flag;

    const newItem = await Model.create(freshDoc);
    res.status(201).json(newItem);
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