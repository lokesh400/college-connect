const mongoose = require('mongoose');

const competitionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  minMembers: { type: Number, required: true },
  maxMembers: { type: Number, required: true },
  teamSize: { type: Number, required: true }, // Changed to Number
  prizes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Prize' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Competition', competitionSchema);
