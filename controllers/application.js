var env = process.env.NODE_ENV || 'development',
    config = require('../config.local')[env];

var Application = require("../models/application"),
    nodemailer = require('nodemailer'),
    sendmailTransport = require('nodemailer-sendmail-transport'),
    ws_client = require ("../modules/byu-ws"),
    request = require("request-promise");

var serviceMap = {
  "RecMainService": "https://api.byu.edu/rest/v1/apikey/academic/records/studentrecord/",
  "WeeklySchedService" : "https://ws.byu.edu/rest/v1.0/academic/registration/studentschedule/"
};

getStudentData = function(service,param,netid,creds_id) {
  serviceURL = serviceMap[service]+param;
  return ws_client.get_http_authorization_header(config.BYU_credentials[creds_id].key, config.BYU_credentials[creds_id].secret, ws_client.KEY_TYPE_API, ws_client.ENCODING_NONCE, serviceURL, "",netid,"application/json",ws_client.HTTP_METHOD_GET,true).then(function(headerVal) {
    var options = {
      method: 'GET',
      uri: serviceURL,
      headers: {
        "Authorization": headerVal
      },
      resolveWithFullResponse: true
    };
    return request(options);
  });
};

exports.createApplication = function(req, res, next) {
  if (req.session_state.netid) {
    var transporter = nodemailer.createTransport(sendmailTransport()),
        packet=JSON.parse(req.body);

    getStudentData("RecMainService",req.session_state.student.personid.toString(),req.session_state.netid,"grants").then(function(records) {
      numsem = (parseInt(packet.numericSemester)===7) ? "4" : packet.numericSemester.toString();
      getStudentData("WeeklySchedService",req.session_state.student.personid.toString()+"/"+packet.year.toString()+numsem,req.session_state.netid,"humanities").then(function(schedule) {
        packet.netid = req.session_state.netid;
        packet.byuid = req.session_state.byuid;
        packet.fullname = req.session_state.student.fullname;
        packet.email = req.session_state.student.email;
        confmessage="An application for internship funding for the BYU college of Humanities was recently submitted. Here are the details.\n\n";
        for (var att in packet) {
          confmessage+=att+": "+packet[att]+"\n";
        }
        confmessage+="\nIf you have any questions, please contact Humanities Advisement and Careers (1175 JFSB, 801.422.4789, humanities-advisement@byu.edu)";
        packet.courses="";
        packet.major="";

        schedule_obj=JSON.parse(schedule.body);
        schedule_obj.WeeklySchedService.response.schedule_table.forEach(function(course,idx) {
          if (packet.courses!=="") {
            packet.courses+=",";
          }
          packet.courses+=course.course;
        });

        records_obj=JSON.parse(records.body.replace("data list is missing ending delimiter",""));
        records_obj.RecMainService.response.Major.forEach(function(m,idx) {
          if (packet.major!=="") {
            packet.major+=",";
          }
          packet.major+=m.department;
          if (m.type!=="null") {
            packet.major+=" "+m.type;
          }
        });
        packet.classStanding=records_obj.RecMainService.response.classStanding;
        packet.gpa=records_obj.RecMainService.response['Credit List'][0].gpa;

        var app = new Application(packet);
        app.save().then(function() {
          recipients=['"'+config.notifications.approver.name+'" <'+config.notifications.approver.email+'>','"'+req.session_state.student.fullname+'" <'+req.session_state.student.email+'>'];
          recipients.forEach(function(recipient,idx) {
            if (idx===0) {
              confmessage="An application for internship funding for the BYU college of Humanities was recently submitted. Here are the details.\n\n";
              for (var att in packet) {
                confmessage+=att+": "+packet[att]+"\n";
              }
            }
            transporter.sendMail({
              from: '"Humanities Internship Funding System" <humplus-funding@byu.edu>',
              to: recipient,
              subject: 'New Student Internship Funding Request',
              text: confmessage
            });
          });
          res.json({
            type: true,
            data: "yes"
          });
        }, function(err) {
          console.log('could not save application: '+err);
        });
      });
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
