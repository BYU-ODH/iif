var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var applicationSchema = new Schema({
  coordinator_email: String,
  coordinator_name: String,
  numericSemester: Number,
  permission: Boolean,
  program: String,
  semester: String,
  year: Number
});

var Application = mongoose.model('application', applicationSchema);
module.exports = Application;