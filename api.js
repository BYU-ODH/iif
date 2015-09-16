var env = process.env.NODE_ENV || 'development';
var config = require('./config')[env];
var fs= require('fs');
var bunyan = require('bunyan');
var restify = require('restify');
var restifyMiddleware = require('falcor-restify');
var falcor = require('falcor');
var mongoose = require('mongoose');
var Router = require('falcor-router');
var cas = require('byu-cas');
var Student = require('./models/student');
var Application = require('./models/application');

var LOG = bunyan.createLogger({
    name: 'demo',
    level: bunyan.INFO,
    src: true
});

var server = restify.createServer({
  certificate: fs.readFileSync('/etc/ssl/certs/jmcdonald.crt'),
  key: fs.readFileSync('/etc/ssl/private/jmcdonald_byu_edu.key'),
  ca: fs.readFileSync('/etc/ssl/certs/jmcdonald_ca.crt'),
  log: LOG.child({
    component: 'server',
    level: bunyan.INFO,
    streams: [{
      level: bunyan.DEBUG,
      type: 'raw',
      stream: new restify.bunyan.RequestCaptureStream({
        level: bunyan.WARN,
        maxRecords: 100,
        maxRequestIds: 1000,
        stream: process.stderr
      })
    }],
    serializers: bunyan.stdSerializers
  })
});

var creds=config.database.user+":"+config.database.passwd;
var conn_uri='mongodb://'+creds+'@'+config.database.host+':'+config.database.port+'/'+config.database.db;
var db=mongoose.connect(conn_uri,['students','applications']);
  
var router = new Router([{
  route: "credentials[{keys}]",
  get: function(pathSet) {
    return cas.getTicket(pathSet[1],pathSet[2], config.url)
    .then(function(ticket){
      return cas.validate(ticket, config.url);
    })
    .then(function success(response) {
      return {"path":[response.username],"value":response.attributes};
    })
    .catch(function error(e) {
      console.log("Invalid ticket. Error message was: " + e.message);
    });
  }
},
{
  route: "students[{keys}]",
  get: function(pathSet) {
    if (typeof pathSet[1][0] === "undefined") {
      return Student.find().exec().then(function(documents) {
        return {"path":["students"],"value":JSON.stringify(documents)};
      });
    }
    else {
      return Student.find({ 'netid': {$in: pathSet[1] }}).exec().then(function(documents) {
        var results=[];
        documents.forEach(function(document) {
          results.push({"path":[pathSet[0],document.netid],"value":JSON.stringify(document)});
        });
        return results;
      });
    }
  }
},
{
  route: "applications[{keys}]",
  get: function(pathSet) {
    if (typeof pathSet[1][0] === "undefined") {
      return Application.find().exec().then(function(documents) {
        return {"path":["applications"],"value":JSON.stringify(documents)};
      });
    }
    else {
      return Application.find({ 'netid': {$in: pathSet[1] }}).exec().then(function(documents) {
        var results=[];
        documents.forEach(function(document) {
          results.push({"path":[pathSet[0],document.netid],"value":JSON.stringify(document)});
        });
        return results;
      });
    }
  }
}]);

server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser());
server.use(restify.requestLogger());
server.use(restify.queryParser());

//server.on('after', restify.auditLogger({
//    log: LOG.child({
//        component: 'audit'
//    })
//}));

server.on('uncaughtException', function (req, res, route, err) {
  req.log.error(err, 'got uncaught exception');
});

server.get('/login', function (req, res, next) {
  auth.doCasLogin();
});

server.get('/model.json', restifyMiddleware(function (req, res, next) {
  return router;
}));

server.get(/\/.*/, restify.serveStatic({
  directory: __dirname,
  default: 'index.html'
}));

server.listen(config.server.port,function() {
  LOG.info("Server started on port %s",config.server.port);
});