const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  competition: { type: mongoose.Schema.Types.ObjectId, ref: 'Competition' },
  name: { type: String },
  email: { type: String },
  collegeName: { type: String },
  department: { type: String },
  course: { type: String },
  phoneNumber: { type: String },
  role: { type: String },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' } // Added team reference
});

module.exports = mongoose.model('Participant', participantSchema);
