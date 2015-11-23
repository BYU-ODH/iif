var Application = require("../models/Application");
    
exports.createApplication = function(req, res, next) {
  if (req.session_state.netid) {
    var packet=JSON.parse(req.body);
    packet.netid = req.session_state.netid;
    packet.fullname = req.session_state.student.fullname;
    var app = new Application(packet);
    app.save().then(function() {
      console.log('yoder');
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