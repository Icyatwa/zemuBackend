// models/MarketData.js
const mongoose = require('mongoose');

const snapshotFields = {
  price:   { type: String, required: true },
  raw:     { type: Number, required: true },
  change:  { type: String, required: true },
  chgNum:  { type: Number, required: true },
  chgDir:  { type: String, enum: ['up', 'dn', 'nt'], required: true },
  explain: { type: String, default: '' },
  eli5:    { type: String, default: '' },
  recordedAt: { type: Date, default: Date.now },
};

const baseFields = {
  sym:      { type: String, required: true },
  name:     { type: String, required: true },
  // current live data
  price:    { type: String, required: true },
  raw:      { type: Number, required: true },
  change:   { type: String, required: true },
  chgNum:   { type: Number, required: true },
  chgDir:   { type: String, enum: ['up', 'dn', 'nt'], required: true },
  explain:  { type: String, default: '' },
  eli5:     { type: String, default: '' },
  // history
  previousSnapshot: { type: snapshotFields, default: null },
  dataUpdatedAt:    { type: Date, default: null }, // when new period data was published
  updatedAt:        { type: Date, default: Date.now },
  archived:   { type: Boolean, default: false },
  archivedAt: { type: Date,    default: null  },
};

const stockSchema = new mongoose.Schema({
  ...baseFields,
  sector: { type: String, required: true },
});

const forexSchema = new mongoose.Schema({
  ...baseFields,
  flag: { type: String, default: '' },
});

const goodsSchema = new mongoose.Schema({
  ...baseFields,
  sector: { type: String, required: true },
});

const Stock = mongoose.model('Stock', stockSchema);
const Forex = mongoose.model('Forex', forexSchema);
const Good  = mongoose.model('Good',  goodsSchema);

module.exports = { Stock, Forex, Good };