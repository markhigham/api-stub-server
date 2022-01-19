"use strict";

const api = require("./lib/api");
const config = require("./lib/config");

api.start(config.port, config.host).then(() => {
  // We are started
});
