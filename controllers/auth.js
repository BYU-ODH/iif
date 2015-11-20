const CAS_SERVICE="https://cas.byu.edu/cas/";
var cas = require('byu-cas'),
    Student = require("../models/Student");

var addStudentToDB = function(token,netid,name) {
  student = new Student({"token":token,"netid":netid,"fullname":name});
  return student.save().exec().then(function(save_student) {
    return save_student;
  }).catch(function(err){
    console.log('error:', err);
  });
};

var locateStudent = function(token,netid,name) {
  query = Student.where({"netid":netid});
  return query.findOne().exec().then(function(student) {
    if (student) {
      return student;
    }
    else {
      return addStudentToDB(token,netid,name);
    }
  });
};

exports.loginFlow = function (req, res, next) {
  var cas_function="login",
      n=encodeURIComponent("/"),
      service="https://jmcdonald.byu.edu:8443/login?next="+n;
  if (req.session_state.netid) {
    if (!("student" in req.session_state)) {
      locateStudent(req.session_state.id,req.session_state.netid,"noname");
    }
    res.redirect(req.query.next, next);
  }
  else if (req.query.ticket) {
    cas.validate(req.query.ticket, service).then(function success(response) {
      req.session_state.netid=response.username;
      req.session_state.student=locateStudent(req.session_state.id,response.username,response.attributes.name);
      res.redirect(req.query.next, next);
    }).catch(function error(e) {
      console.log("Invalid ticket. Error message was: " + e.message);
    });
  }
  else {
    var url=CAS_SERVICE+cas_function+"?service="+encodeURIComponent(service);
    res.redirect(url, next);
  }
};