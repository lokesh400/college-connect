const mongoose = require('mongoose');

const teamPostSchema = new mongoose.Schema({
  title: String,
  description: String,
  skillsNeeded: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TeamPost', teamPostSchema);
