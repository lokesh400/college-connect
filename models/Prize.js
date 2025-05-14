const mongoose = require('mongoose');

const prizeSchema = new mongoose.Schema({
  competition: { type: mongoose.Schema.Types.ObjectId, ref: 'Competition' },
  title: String,
  description: String,
  amount: Number,
  type: String
});

module.exports = mongoose.model('Prize', prizeSchema);
