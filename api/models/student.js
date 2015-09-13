var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var studentSchema = new Schema({
  name: String,
  _id: { type: String, required: true, unique: true },
  netid: { type: String, required: true, unique: true },
  admin: Boolean,
  created_at: Date,
  updated_at: Date
});

var Student = mongoose.model('student', studentSchema);
module.exports = Student;