var env = process.env.NODE_ENV || 'development';
var config = require('./config')[env];
var bunyan = require('bunyan');
var restify = require('restify');
var pmongo = require('promised-mongo');
var restifyMiddleware = require('falcor-restify');
var falcor = require('falcor');
var Router = require('falcor-router');

var server = restify.createServer();
var creds=config.database.user+":"+config.database.passwd;
var conn_uri='mongodb://'+creds+'@'+config.database.host+':'+config.database.port+'/'+config.database.db;
var db=pmongo(conn_uri,['students','applications']);

var getAll = function(coll) {
  return db[coll].find().toArray().then(function(documents) {
    var packet=JSON.stringify(documents);
  });
};

var router = new Router([{
  route: "applications",
  get: function() {
    return {
      path:["applications"],
      value: getAll("applications").packet
    };
  }
}]);

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.listen(config.server.port,function() {
    console.log("Server started on port "+config.server.port);
});

server.get('/model.json', restifyMiddleware(function (req, res, next) {
    return router;
}));

server.get(/\/.*/, restify.serveStatic({
    directory: __dirname,
    default: 'index.html'
}));