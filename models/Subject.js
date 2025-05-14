const mongoose = require('mongoose');
const SubjectSchema = new mongoose.Schema({
  name: String,
  year: { type: mongoose.Schema.Types.ObjectId, ref: 'Year' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }
});
module.exports = mongoose.model('Subject', SubjectSchema);
