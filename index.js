"use strict";

const api = require("./lib/api");
const config = require("./lib/config");
const logger = require("./lib/logger")(__filename);

api.start(config.port, config.host).then(() => {
  // We are started
  logger.info(`Server started on ${config.host}:${config.port}`);
});
