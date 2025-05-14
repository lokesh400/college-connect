const mongoose = require('mongoose');
const BranchSchema = new mongoose.Schema({
  name: String,
  year: { type: mongoose.Schema.Types.ObjectId, ref: 'Year' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' }
});
module.exports = mongoose.model('Branch', BranchSchema);
