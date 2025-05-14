const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  competition: { type: mongoose.Schema.Types.ObjectId, ref: 'Competition' },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'Participant' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Participant' }],
  teamName: { type: String },
  teamSize: { type: Number } // Changed to Number
});

module.exports = mongoose.model('Team', teamSchema);
