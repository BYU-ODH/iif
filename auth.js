var env = process.env.NODE_ENV || 'development';
var config = require('./config')[env];
var cas = require('byu-cas');
var service = config.url;

auth= {
  doCasLogin:function() {
    var ticket = cas.getTicket('jlm59', '6hmdewitt9buffy', service)
    .then(function(ticket){
      return cas.validate(ticket, service);
    })
    .then(function success(response) {
      return {"netid":response.username,"attributes":response.attributes};
    })
    .catch(function error(e) {
      console.log("Invalid ticket. Error message was: " + e.message);
    });
  }
};

module.exports = auth;