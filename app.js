'use strict';
const DEVEL = (process.env.NODE_ENV !== "production");

// Include 3rd party libraries
const express = require('express'),
  fs = require('fs'),
  http = require('http'),
  https = require('https'),
  path = require('path'),
  wrap = require('wordwrapjs');

// Include our libraries
const logging = require('./src/lib/config/logging'),
  models = require('./src/app/models');

// Application logger and global Config
let logger, db;

//
// Our configuration defaults:
// 
const ROOT_PATH = path.normalize(__dirname);
const version = require('./package.json').version;
let config = {
  log_dir: "logs/",
  log_level: "info",
  data_dir: "data/",
  app: {
    name: 'Bio::Neos Backup System',
    version: version,
    root: ROOT_PATH
  },
  port: 8080,
};

// Explicitly warn about non-production modes
if (DEVEL)
{
  console.warn("*** Development Environment ***");
  config.log_level = "debug";
}


//
// Create the logger
//
try
{
  logging.configure(config);
  logger = logging.getLogger();
}
catch(error)
{
  const msg = '[ERROR] Could not setup the logging system: ' + error.message;
  console.error(wrap.wrap(msg, {width: 80, noTrim: true}));
  throw(error);
}

// TODO: Add more information
logger.info('Server starting up!');


// Load DB & models
logger.debug('Loading the User DB...');
db = models.init(config);
logger.trace('  models.init() complete...');
db.sequelize.sync()
.catch(err => {
  logger.error('Error loading the User DB: ' + err.message);
  logger.debug(err.stack);
  process.exit(-2);
})
.then(() => {
  // Start Webapp
  let app = express();
  require('./src/lib/config/express')(app, config);

  // Start either HTTP or HTTPS server, based on configuration file
  logger.debug('Starting the Web interface...');
  if (config.secure)
  {
    let key = fs.readFileSync(config.secure.key, 'utf-8');
    let cert = fs.readFileSync(config.secure.cert, 'utf-8');
    logger.info('Web interface ready for HTTPS connections on port ' + config.port + '...');
    require('https').createServer({'key': key, 'cert': cert}, app).listen(config.port);
  }
  else
  {
    logger.info('Web interface ready for HTTP connections on port ' + config.port + '...');
    app.listen(config.port);
  }
})
.catch(err => {
  logger.error('Unhandled error while starting the system: ' + err.message);
  logger.debug(err.stack);
  process.exit(-1);
});
