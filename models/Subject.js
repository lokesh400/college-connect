const mongoose = require('mongoose');
const SubjectSchema = new mongoose.Schema({
  name: String,
  year: String,
  department: String,
  branch: String
});
module.exports = mongoose.model('Subject', SubjectSchema);
