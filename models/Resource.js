const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: String,
  description: String,
  type: { type: String, enum: ['Books', 'Notes', 'Papers'] },
  branch: String,
  year: String,
  subject: String,
  department:String,
  zenodoLink: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resource', resourceSchema);
