var Router = require('falcor-router');
var Student = require('./models/student');
var Application = require('./models/application');

var routes = new Router([{
  route: "students[{keys}]",
  get: function(pathSet) {
    if (typeof pathSet[1][0] === "undefined") {
      return Student.find().exec().then(function(documents) {
        return {"path":["students"],"value":JSON.stringify(documents)};
      });
    }
    else {
      return Student.find({ 'netid': {$in: pathSet[1] }}).then(function(documents) {
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
      return Application.find().then(function(documents) {
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

module.exports = routes;