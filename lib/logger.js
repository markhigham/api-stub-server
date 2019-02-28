const debug = require("debug-levels");
const config = require("../config");

module.exports = function(name) {
  const namespace = config.appName + ":" + name;
  const log = debug(namespace);

  log.verbose("created logger for " + namespace);

  return {
    log: log.log,
    verbose: log.verbose,
    error: log.error,
    info: log.info
  };
};
