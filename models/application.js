var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var applicationSchema = new Schema({
  coordinator_email: {type: String, required: true},
  coordinator_name: {type: String, required: true},
  numericSemester: {type: Number, required: true},
  permission: Boolean,
  program: {type: String, required: true},
  semester: {type: String, required: true},
  year: {type: Number, required: true},
  netid: {type: String, required: true},
  fullname: String,
  created_at: {type: Date, default: Date.now},
});

var Application = mongoose.model('application', applicationSchema);
module.exports = Application;