"use strict";

const api = require("./lib/api");
const config = require("./config");

api.start(config.port, config.host);
