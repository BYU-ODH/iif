var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var studentSchema = new Schema({
  token: String,
  fullname: String,
  netid: { type: String, required: true, unique: true },
  admin: {type: Boolean, default: false},
  email: {type: String},
  personid: {type: String, required: true },
  byuid: String,
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now}
});

var Student = mongoose.model('student', studentSchema);
module.exports = Student;
