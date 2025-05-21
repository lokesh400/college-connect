const mongoose = require('mongoose');
const BranchSchema = new mongoose.Schema({
  name: String,
  department: String
});
module.exports = mongoose.model('Branch', BranchSchema);
