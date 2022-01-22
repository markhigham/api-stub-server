"use strict";

const pkg = require("../package.json");

const config = {
  appName: pkg.name,
  buildNumber: pkg.version,
  env: "base",
  port: 3001,
  host: "0.0.0.0",
  logLevel: process.env.LOG_LEVEL || "info",
  echoRouteParams: false,
};

module.exports = config;
