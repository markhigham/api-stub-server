import "source-map-support/register";
import { config } from "./lib/config";
import { LogManager } from "./lib/logger";

const logger = LogManager.getLogger(__filename);
logger.debug(config);

//
// const api = require("./lib/api");
// const config = require("./lib/config");
// const logger = require("./lib/logger")(__filename);
//
// api.start(config.port, config.host).then(() => {
//   // We are started
//   logger.info(`Server started on ${config.host}:${config.port}`);
// });
