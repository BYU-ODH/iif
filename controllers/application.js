var env = process.env.NODE_ENV || 'development',
    config = require('../config.local')[env];

var Application = require("../models/application"),
    nodemailer = require('nodemailer'),
    sendmailTransport = require('nodemailer-sendmail-transport');

var transporter = nodemailer.createTransport(sendmailTransport());
    
exports.createApplication = function(req, res, next) {
  if (req.session_state.netid) {
    var packet=JSON.parse(req.body);
    packet.netid = req.session_state.netid;
    packet.fullname = req.session_state.student.fullname;
    var app = new Application(packet);
    app.save().then(function() {
      transporter.sendMail({
        from: '"Humanities Internship Funding System" <humplus-funding@byu.edu>',
        to: '"'+config.notifications.approver.name+'" <'+config.notifications.approver.email+'>',
        subject: 'New Internship Funding Request',
        text: JSON.stringify(packet)
      });
      res.json({
        type: true,
        data: "yes"
      });
    }, function(err) {
      console.log('could not save application: '+err);
    });
  }
  else {
    res.status(401);
    res.json({
        type: false,
        data: "You must log in before submitting a request"
    });
  }
};
