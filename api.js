<<<<<<< HEAD
var env = process.env.NODE_ENV || 'development',
    config = require('./config')[env];

var fs= require('fs'),
    bunyan = require('bunyan'),
    restify = require('restify'),
    mongoose = require('mongoose'),
    sessions = require('client-sessions'),
    controllers = {
      session: require('./controllers/session'),
      auth: require('./controllers/auth'),
      application: require('./controllers/application')
    };

var LOG = bunyan.createLogger({
    name: 'demo',
    level: bunyan.INFO,
    src: true
});

var server = restify.createServer({
  //certificate: fs.readFileSync('/etc/ssl/certs/jmcdonald.crt'),
  //key: fs.readFileSync('/etc/ssl/private/jmcdonald_byu_edu.key'),
  //ca: fs.readFileSync('/etc/ssl/certs/jmcdonald_ca.crt'),
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

server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser());
server.use(restify.requestLogger());
server.use(restify.queryParser());
server.use(sessions({
  cookieName: config.session_store.cookieName,
  secret: config.session_store.secret,
  duration: config.session_store.duration,
  activeDuration: config.session_store.activeDuration
}));

server.use(sessions({
  secret: 'IEde0cdseJRi2o4hTW8q11u33J807S8q',
  duration: 2 * 60 * 60 * 1000
}));

//server.on('after', restify.auditLogger({
//    log: LOG.child({
//        component: 'audit'
//    })
//}));

server.on('uncaughtException', function (req, res, route, err) {
  req.log.error(err, 'got uncaught exception');
});

server.get('/login', controllers.auth.loginFlow);

server.get("/sessions",controllers.session.getSession);
server.post("/sessions",controllers.session.createSession);
server.del("/sessions",controllers.session.removeSession);

server.post("/applications",controllers.application.createApplication);

server.get(/\/.*/, restify.serveStatic({
  directory:'app',
  default: 'index.html'
}));

server.listen(config.server.port,function() {
  LOG.info("Server started on port %s",config.server.port);
});