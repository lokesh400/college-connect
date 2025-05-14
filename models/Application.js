const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'TeamPost' },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: String,
  appliedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Application', applicationSchema);
