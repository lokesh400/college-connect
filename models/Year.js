const mongoose = require('mongoose');
const YearSchema = new mongoose.Schema({
  name: String
});
module.exports = mongoose.model('Year', YearSchema);
