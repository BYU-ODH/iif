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
