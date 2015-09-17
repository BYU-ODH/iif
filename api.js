var env = process.env.NODE_ENV || 'development';
var config = require('./config')[env];
var auth = require('./auth');
var router = require('./router');

var fs= require('fs');
var bunyan = require('bunyan');
var restify = require('restify');
var restifyMiddleware = require('falcor-restify');
var falcor = require('falcor');
var mongoose = require('mongoose');

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
var db=mongoose.connect(conn_uri,['students','applications','sessions']);

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
  console.log(req.query);
  login_url=auth.cas_server+"?service="+config.auth.login+"&next="+config.auth.callback;
  res.redirect(login_url,next);
});

server.get('/callback', function (req, res, next) {
  console.log(req.query);
  userdata=auth.validateLogin(req.query.ticket,config.auth.login);
  console.log(userdata);
  // now check if user is in DB, if not, create it ... then create a session, pass session
  // ID back to front end so it can store it in local storage and make a falcor model
  // that binds to the students DB entry
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