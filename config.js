var fs= require('fs');

var config = {
  development: {
    url: 'https://jmcdonald.byu.edu:8443',
    database: {
      user:	'iif-client',
	    passwd:	'IfYouWant2SeeMe!',
	    host:	'ds035703.mongolab.com',
	    port:	'35703',
	    db:		'iif'
    },
    server: {
        host: '0.0.0.0',
        port: '8443',
  	//certificate: fs.readFileSync('/etc/ssl/certs/jmcdonald.crt'),
  	//key: fs.readFileSync('/etc/ssl/private/jmcdonald_byu_edu.key'),
  	//ca: fs.readFileSync('/etc/ssl/certs/jmcdonald_ca.crt')
    }
  },
  production: {
    url: 'https://humplus-funding.byu.edu',
    database: {
      user:	'iif-client',
	    passwd:	'IfYouWant2SeeMe!',
	    host:	'ds035703.mongolab.com',
	    port:	'35703',
	    db:		'iif'
    },
    server: {
        host: '127.0.0.1',
        port: '9003',
	//certificate: fs.readFileSync('/etc/ssl/certs/server.crt'),
  	//key: fs.readFileSync('/etc/ssl/private/server.key'),
  	//ca: fs.readFileSync('/etc/ssl/certs/ca.crt')
    }    
  }
};
module.exports = config;
