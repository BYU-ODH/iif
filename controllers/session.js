exports.createSession = function(req, res, next) {
  req.session_state.reset();
  req.session_state.id = (Math.random().toString(36)+'00000000000000000').slice(2, 10);
  res.json(req.session_state);
};

exports.removeSession = function(req, res, next) {
  req.session_state.reset();
  res.json(req.session_state);
};

exports.getSession = function(req,res,next) {
  if (!("id" in req.session_state)||req.session_state.id===null||req.session_state.id==="") {
    exports.createSession(req,res,next);
  }
  else {
    res.json(req.session_state);
  }
};