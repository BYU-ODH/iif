const CAS_SERVICE="https://cas.byu.edu/cas/";
var env = process.env.NODE_ENV || 'development',
    config = require('../config.local')[env];

var cas = require('byu-cas'),
    Student = require("../models/student");

var locateStudent = function(token,netid,name) {
  query = Student.where({"netid":netid});
  return query.findOne().then(function(student) {
    if (student) {
      return student;
    }
    else {
      student = new Student({"token":token,"netid":netid,"fullname":name});
      return student.save();
    }
  });
};

exports.loginFlow = function (req, res, next) {
  var cas_function="login",
      n=encodeURIComponent("/"),
      service=config.url+"/login?next="+n;
  if (req.session_state.netid) {
    if (!("student" in req.session_state)) {
      locateStudent(req.session_state.id,req.session_state.netid,"noname").then(function(student) {
        req.session_state.student=student;
        res.redirect(req.query.next, next);
      });
    }
    else {
      res.redirect(req.query.next, next);
    }
  }
  else if (req.query.ticket) {
    cas.validate(req.query.ticket, service).then(function success(response) {
      req.session_state.netid=response.username;
      locateStudent(req.session_state.id,response.username,response.attributes.name).then(function(student) {
        req.session_state.student=student;
        res.redirect(req.query.next, next);
      });
    }).catch(function error(e) {
      console.log("Invalid ticket. Error message was: " + e.message);
    });
  }
  else {
    var url=CAS_SERVICE+cas_function+"?service="+encodeURIComponent(service);
    res.redirect(url, next);
  }
};
