// models/MarketData.js
const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  sym: { type: String, required: true },
  name: { type: String, required: true },
  sector: { type: String, required: true },
  price: { type: String, required: true },
  raw: { type: Number, required: true },
  change: { type: String, required: true },
  chgNum: { type: Number, required: true },
  chgDir: { type: String, enum: ['up', 'dn', 'nt'], required: true },
  explain: { type: String, default: '' },
  eli5: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

const forexSchema = new mongoose.Schema({
  sym: { type: String, required: true },
  name: { type: String, required: true },
  flag: { type: String, default: '' },
  price: { type: String, required: true },
  raw: { type: Number, required: true },
  change: { type: String, required: true },
  chgNum: { type: Number, required: true },
  chgDir: { type: String, enum: ['up', 'dn', 'nt'], required: true },
  explain: { type: String, default: '' },
  eli5: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

const goodsSchema = new mongoose.Schema({
  sym: { type: String, required: true },
  name: { type: String, required: true },
  sector: { type: String, required: true },
  price: { type: String, required: true },
  raw: { type: Number, required: true },
  change: { type: String, required: true },
  chgNum: { type: Number, required: true },
  chgDir: { type: String, enum: ['up', 'dn', 'nt'], required: true },
  explain: { type: String, default: '' },
  eli5: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

const Stock = mongoose.model('Stock', stockSchema);
const Forex = mongoose.model('Forex', forexSchema);
const Good = mongoose.model('Good', goodsSchema);

module.exports = { Stock, Forex, Good };