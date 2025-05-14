const mongoose = require('mongoose');
const DepartmentSchema = new mongoose.Schema({
  name: String,
  year: { type: mongoose.Schema.Types.ObjectId, ref: 'Year' }
});
module.exports = mongoose.model('Department', DepartmentSchema);
