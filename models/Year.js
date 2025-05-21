const mongoose = require('mongoose');
const YearSchema = new mongoose.Schema({
  name: Number,
});
module.exports = mongoose.model('Year', YearSchema);
