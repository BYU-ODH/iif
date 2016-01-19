var fs = require("fs-extra-promise"),
    request = require("request-promise"),
    url = require("url"),
    qs = require("querystring"),
    crypto = require("crypto"),
    moment = require("moment");

const ENCODING_NONCE = "Nonce",
      ENCODING_URL = "URL",
      KEY_TYPE_API = "API",
      KEY_TYPE_WSSESSION = "WsSession",
      HTTP_METHOD_GET = "GET",
      HTTP_METHOD_PUT = "PUT",
      HTTP_METHOD_POST = "POST",
      HTTP_METHOD_DELETE = "DELETE",
      VALID_HTTP_METHODS = [HTTP_METHOD_GET, HTTP_METHOD_PUT, HTTP_METHOD_POST, HTTP_METHOD_DELETE],
      VALID_KEY_TYPES = [KEY_TYPE_API, KEY_TYPE_WSSESSION],
      VALID_ENCODING_TYPES = [ENCODING_NONCE, ENCODING_URL];

exports.ENCODING_NONCE = ENCODING_NONCE;
exports.ENCODING_URL = ENCODING_URL;
exports.KEY_TYPE_API = KEY_TYPE_API;
exports.KEY_TYPE_WSSESSION = KEY_TYPE_WSSESSION;
exports.HTTP_METHOD_GET = HTTP_METHOD_GET;
exports.HTTP_METHOD_PUT = HTTP_METHOD_PUT;
exports.HTTP_METHOD_POST = HTTP_METHOD_POST;
exports.HTTP_METHOD_DELETE = HTTP_METHOD_DELETE;

function valid_http_method(method) {
  if (VALID_HTTP_METHODS.indexOf(method) !==-1) {
    return method.toUpperCase();
  }
  else {
    return false;
  }
}

function valid_key_type(key_type) {
  if (VALID_KEY_TYPES.indexOf(key_type) !==-1) {
    return key_type;
  }
  else {
    return false;
  }
}

function valid_encoding_types(encoding_type) {
  if (VALID_ENCODING_TYPES.indexOf(encoding_type) !==-1) {
    return encoding_type;
  }
  else {
    return false;
  }
}

function get_body_from_file(file_name) {
  return fs.readFileAsync(file_name).then(function(data) {
    return data.replace(/(\r\n|\n|\r)/gm,"");
  },function(err) {
    return "";
  });
}

function get_ws_session(casNetId, casPassword, casTimeout, headers) {
  casTimeout = (typeof casTimeout !== "undefined") ? casTimeout : 1;
  var options = {
    method: 'POST',
    uri: 'https://ws.byu.edu/authentication/services/rest/v1/ws/session',
    form : {
      timeout: casTimeout,
      password: casPassword,
      netId: casNetId
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    resolveWithFullResponse: true
  };
  return request(options).then(function (response) {
    return JSON.parse(response.body);
  }).catch(function (err) {
    console.log("no WsSession: "+err);
  });
}

function get_nonce(apiKey, actor) {
  if (actor) {
    actor = "/"+actor;
  }
  else {
    actor="";
  }
  var options = {
    method: 'POST',
    uri: 'https://ws.byu.edu/authentication/services/rest/v1/hmac/nonce/'+apiKey+actor,
    resolveWithFullResponse: true
  };
  
  return request(options).then(function(response) {
    return JSON.parse(response.body);
  }).catch(function (err) {
    console.log("no nonce: "+err);
  });
}

function _split_url(u) {
  var parsed_url=url.parse(u);
  return Array(parsed_url.host,parsed_url.pathname);
}

function _sort_params(params_str) {
  var params = {},
      tokens = params_str.split("&");
  if (tokens.length === 1) {
      return params_str;
  }
  else {
    tokens.forEach(function(token,idx) {
      var tpair=token.split("=");
      if (!(tpair[0] in params)) {
        params[tpair[0]]=tpair[1];
      }
      else {
        params[tpair[0]] +=","+tpair[1];
      }
    });
  return qs.stringify(params);
  }
}

function base64encode_string(string) {
  return new Buffer(string).toString('base64');
}

function make_sha512_mac(sharedSecret, string) {
  var hash = crypto.createHmac('sha512',sharedSecret);
  hash.update(string);
  return hash.digest();
}

function url_encode(sharedSecret, current_timestamp, url, requestBody, contentType, http_method, actor, actorInHash) {
  var end_str = current_timestamp;
  if (actorInHash) {
    if (actor)
      end_str += actor;
  }
  var item_to_encode = url + end_str,
      exception_ct = "application/x-www-form-urlencoded";
  
  if (requestBody) {
    if (contentType === exception_ct) {
      var hostpair = _split_url(url),
          host = hostpair[0],
          request_uri = hostpair[1];
          item_to_encode = http_method.toUpperCase()+"\n"+host+"\n"+request_uri+"\n"+ _sort_params(requestBody) + end_str;
    }
    else {
      item_to_encode = requestBody + end_str;
    }
  }
  var mac = make_sha512_mac(sharedSecret,item_to_encode);
  return base64encode_string(mac);
}


function nonce_encode(sharedSecret, nonceValue) {
  var mac = make_sha512_mac(sharedSecret, nonceValue);
  return base64encode_string(mac);
}

exports.get_http_authorization_header = function(apiKey, sharedSecret, keyType, encodingType, url, requestBody, actor,contentType, httpMethod, actorInHash) {
  var current_timestamp=moment.unix(Date.now()).format('YYYY-MM-DD HH:mm:ss');
      var nonceKey = "",
      base64encoded_hmac=null;
      
  if (!valid_key_type(keyType)) {
    console.log("keyType not allowed");
  }

  if (encodingType === ENCODING_URL) {
    return url_encode(sharedSecret, current_timestamp, url, requestBody, contentType, httpMethod, actor, actorInHash).then(function(base64encoded_hmac) {
      var actor_value="";
      if (actor) {
        actor_value = "," + actor;
      }
      return encodingType+"-Encoded-"+keyType+"-Key "+apiKey+","+base64encoded_hmac+","+current_timestamp+actor_value;
    });
  }
  else if (encodingType === ENCODING_NONCE) {
    return get_nonce(apiKey, actor).then(function(nonce_obj) {
      base64encoded_hmac = nonce_encode(sharedSecret, nonce_obj.nonceValue),
      nonceKey = nonce_obj.nonceKey;
      return "Nonce-Encoded-"+keyType+"-Key "+apiKey+","+nonceKey+","+base64encoded_hmac;
    });
  }
  else {
    console.log("encodingType wrong");
  }
};

exports.send_ws_request = function(url, httpMethod, requestBody) {
  if (!(valid_http_method(httpMethod))) {
    console.log("http method not allowed");
  }
  var options = {
    method: httpMethod,
    uri: url,
    data: requestBody,
    resolveWithFullResponse: true
  };
  return request(options).then(function(response) {
    return JSON.parse(response.body);
  });
};

exports.authorize_request = function(requestedUrl, authHeader, apiKey, sharedSecret, actor) {
  var authUrl = 'https://ws.byu.edu/authentication/services/rest/v1/provider/URL-Encoded-API-Key/validate';

  if (authHeader) {
    var authsplit = authHeader.split(','),
        wsId = authsplit[0],
        messageDigest = authsplit[1],
        timestamp = authsplit[2];
    
    wsId = wsId.split(' ')[1];
    return get_nonce(apiKey, actor).then(function(nonce) {
      var data = {
        'wsId': wsId,
        'messageDigest': messageDigest,
        'timestamp': timestamp,
        'message': requestedUrl
      };
      var nonceDigest = nonce_encode(sharedSecret, nonce.nonceValue),
          auth = 'Nonce-Encoded-API-Key '+apiKey+','+nonce.nonceKey+','+nonceDigest,
          options = {
          method: "POST",
          uri: authUrl,
          data: data,
          headers: {
            'Authorization': auth
          },
          resolveWithFullResponse: true
      };
      return request(options).then(function(response) {
        var r = JSON.parse(response.body);
        return r.personId;
      });
    });
  }
  else {
    return false;
  }
};