var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var applicationSchema = new Schema({
  netid: String,
  _id: { type: String, required: true, unique: true },
  isp: Boolean,
  coordinator: String
});

var Application = mongoose.model('application', applicationSchema);
module.exports = Application;