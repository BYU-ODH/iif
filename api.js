var env = process.env.NODE_ENV || 'development';
var config = require('./config')[env];
var bunyan = require('bunyan');
var restify = require('restify');
var restifyMiddleware = require('falcor-restify');
var falcor = require('falcor');
var mongoose = require('mongoose');
var Router = require('falcor-router');
var Student = require('./models/student');
var Application = require('./models/application');

var LOG = bunyan.createLogger({
    name: 'demo',
    level: bunyan.DEBUG,
    src: true
});

var server = restify.createServer({
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

var pathMap = {
  "applications": Application,
  "students": Student
}

var getAll = function(model) {
  return model.find().exec();
}
  
var router = new Router([{
  route: "students['name', 'description']",
  get: function(pathSet) {
    return pathMap[pathSet[0]].find().exec().then(function(documents) {
      return {"path":pathSet,"value":JSON.stringify(documents)};
    });
  }
}]);

server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser());
server.use(restify.requestLogger());
server.use(restify.queryParser());

server.on('after', restify.auditLogger({
    log: LOG.child({
        component: 'audit'
    })
}));

server.on('uncaughtException', function (req, res, route, err) {
    req.log.error(err, 'got uncaught exception');
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