const pkg = require("../../package.json");

export const config = {
  appName: pkg.name,
  buildNumber: pkg.version,
  env: "base",
  port: process.env.PORT || 3001,
  host: "0.0.0.0",
  logLevel: process.env.LOG_LEVEL || "info",
  echoRouteParams: false,
};
