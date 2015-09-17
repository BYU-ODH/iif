var env = process.env.NODE_ENV || 'development';
var config = require('./config')[env];
var cas = require('byu-cas');
var service = config.url;
var Session = require('./models/session');

auth= {
  cas_server: "https://byu.edu/cas/",
  validateLogin:function() {
    return cas.validate(ticket, service)
    .then(function success(response) {
      return {"netid":response.username,"attributes":response.attributes};
    })
    .catch(function error(e) {
      console.log("Invalid ticket. Error message was: " + e.message);
    });
  },
  getSession:function(token) {
    if (token) {
      return Session.find({ 'session_id': token }}).then(function(session) {
        return session;
      });
    }
    else {
      s = new Session({'session_id:','netid':''});
      return s.save().then(function(session) {
        return session;
      })
    }
  }
};

module.exports = auth;