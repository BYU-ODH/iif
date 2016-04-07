// var env = process.env.NODE_ENV || 'development',
var env = process.env.NODE_ENV || 'production',
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

var getStudentData = function(service,param,netid,creds_id) {
  var serviceURL = serviceMap[service]+param;
  return ws_client.get_http_authorization_header(config.BYU_credentials[creds_id].key, config.BYU_credentials[creds_id].secret, ws_client.KEY_TYPE_API, ws_client.ENCODING_NONCE, serviceURL,"",netid,"application/json",ws_client.HTTP_METHOD_GET,true).then(function(headerVal) {
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
      var numsem = (parseInt(packet.numericSemester,10)===7) ? "4" : packet.numericSemester.toString();
      getStudentData("WeeklySchedService",req.session_state.student.personid.toString()+"/"+packet.year.toString()+numsem,req.session_state.netid,"humanities").then(function(schedule) {
        packet.netid = req.session_state.netid;
        packet.byuid = req.session_state.byuid;
        packet.fullname = req.session_state.student.fullname;
        packet.courses="";
        packet.major="";
        packet.secondmajor="";
        packet.minor="";

        var schedule_obj=JSON.parse(schedule.body);
        schedule_obj.WeeklySchedService.response.schedule_table.forEach(function(course,idx) {
          if (packet.courses!=="") {
            packet.courses+=",";
          }
          packet.courses+=course.course;
        });
        if (packet.courses==="") {
          packet.courses="\n";
        }

        var records_obj=JSON.parse(records.body.replace("data list is missing ending delimiter",""));
        records_obj.RecMainService.response.Major.forEach(function(m,idx) {
          if (m.type!==null) {
            if (packet.major==="") {
              packet.major=m.department+=" "+m.type;
            }
            else {
              packet.secondmajor+=m.department+=" "+m.type+" ";
            }
          }
          else {
            if (packet.minor!=="") {
              packet.minor+=",";
            }
            packet.minor+=m.department;
          }
        });
        if (packet.secondmajor==="") {
          packet.secondmajor="\n";
        }
        if (packet.minor==="") {
          packet.minor="\n";
        }
        packet.classStanding=records_obj.RecMainService.response.classStanding;
        packet.gpa=records_obj.RecMainService.response['Credit List'][0].gpa;

        var app = new Application(packet);
        app.save().then(function() {
          var recipients=['"'+req.session_state.student.fullname+'" <'+req.session_state.student.email+'>','"'+config.notifications.approver.name+'" <'+config.notifications.approver.email+'>',];
          recipients.forEach(function(recipient,idx) {
            var confmessage_to_send="You have successfully submitted your College Study Abroad Funding application. You will be notified directly before your final payment is due. If you have any questions, please contact the college secretary at 422-2775 or humanities@byu.edu.";
            if (idx===1) {
              confmessage_to_send="An application for study abroad funding for the BYU college of Humanities was recently submitted. Here are the details.\n\n";
              for (var att in packet) {
                confmessage_to_send+=att+": "+packet[att]+"\n";
              }
            }
            transporter.sendMail({
              from: '"Humanities Study Abroad Funding" <humanities@byu.edu>',
              to: recipient,
              subject: 'New Student Study Abroad Funding Request',
              text: confmessage_to_send
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
