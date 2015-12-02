var fs= require('fs');

var config = {
  development: {
    url: 'https://jmcdonald.byu.edu:8443',
    database: {
      user: 'dbuser',
      passwd: 'dbpasswd',
      host: 'mongohost',
      port: 'mongoport',
      db: 'dbname'
    },
    session_store: {
      cookieName: 'iifSession',
      secret: 'sessoionsecret',
      duration: 24 * 60 * 60 * 1000,
      activeDuration: 1000 * 60 * 5
    },
    server: {
        host: '0.0.0.0',
        port: '8443',
      	certificate: fs.readFileSync('/etc/ssl/certs/jmcdonald.crt'),
      	key: fs.readFileSync('/etc/ssl/private/jmcdonald_byu_edu.key'),
      	ca: fs.readFileSync('/etc/ssl/certs/jmcdonald_ca.crt')
    }
};
module.exports = config;
