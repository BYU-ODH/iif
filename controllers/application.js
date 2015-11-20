var Application = require("../models/Application");
    
exports.createApplication = function(req, res, next) {
  if (req.session_state.netid) {
  var packet=JSON.parse(req.body);
    packet.netid = req.session_state.netid;
    var app = new Application(JSON.parse(req.body));
    app.save(function(err, app) {
        if (err) {
            res.status(500);
            res.json({
                type: false,
                data: "Error occurred: " + err
            });
        } else {
            res.json({
                type: true,
                data: app
            });
        }
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