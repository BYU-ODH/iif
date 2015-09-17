var config = {
  development: {
    url: 'https://jmcdonald.byu.edu:8443',
    database: {
      user:	'iif-client',
	    passwd:	'IfYouWant2SeeMe!',
	    host:	'ds035703.mongolab.com',
	    port:	'35703',
	    db:	'iif'
    },
    session_store: {
      host : "pub-redis-11111.us-central1-1-1.gce.garantiadata.com",
      port : 11111,
      db : "iis-sessions",
      password : "MikeScioscia"
    },
    server: {
        host: '0.0.0.0',
        port: '8443'
    },
    auth: {
      login: "https://jmcdonald.byu.edu:8443/login/",
      callback: "https://jmcdonald.byu.edu:8443/callback/",
    }
  }
};
module.exports = config;
