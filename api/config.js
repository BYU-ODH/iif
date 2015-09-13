var config = {
  development: {
    url: 'http://localhost',
    database: {
      user:	'iif-client',
	    passwd:	'IfYouWant2SeeMe!',
	    host:	'ds035703.mongolab.com',
	    port:	'35703',
	    db:	'iif'
    },
    server: {
        host: '0.0.0.0',
        port: '5000'
    }
  }
};
module.exports = config;
