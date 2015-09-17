var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var sessionSchema = new Schema({
  netid: String,
  _id: { type: String, required: true, unique: true },
  session_id: String
});

var Session = mongoose.model('session', sessionSchema);
module.exports = Session;