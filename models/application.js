var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var applicationSchema = new Schema({
    email: {type: String, required: true},
    location: {type: String, required: true},
    numericSemester: {type: Number, required: true},
    director: {type: String, required: true},
    semester: {type: String, required: true},
    fee: {type: String, required: true},
    fafsa: Boolean,
    permission: Boolean,
    explanation: {type: String, required: true},
    year: {type: Number, required: true},
    netid: {type: String, required: true},
    fullname: String,
    major: String,
    secondmajor: String,
    minor: String,
    classStanding: String,
    gpa: String,
    courses: String,
    created_at: {type: Date, default: Date.now},
});

var Application = mongoose.model('application', applicationSchema);
module.exports = Application;
