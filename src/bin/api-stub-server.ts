#!/usr/bin/env node

import * as minimist from "minimist";
import { Api } from "../lib/api";
import { config } from "../lib/config";
import { LogManager } from "../lib/logger";
import { sampleData } from "./sample-data";
import * as fs from "fs";

const argv = minimist(process.argv.slice(2));

const port = argv.p || config.port;
const host = argv.h || config.host;

const logger = LogManager.getLogger(__filename);

function showHelp() {
  console.log(`api-stub-server [-p 8092] [-h 127.0.0.1] [-v verbose] [-s use sample data] [-r x] [saved_response_file.json]
version: ${config.buildNumber}

-p  (Optional) Port number - defaults to 3001

-h  (Optional) Host address - defaults to 0.0.0.0

-s  (Optional) Use sample data

-r  (Optional) Start recording requests to a limit of x 
    Set to 0 for no limits.
    
-e  (Optional) Echo any route params to the JSON response - defaults to false

saved_response_file.json (optional)
    Path to a file containing pre-saved responses
    
-----
Environment variables
PORT: Port number
SAVED_RESPONSE_FILE: Path to a file containing pre-saved responses 
ECHO_ROUTE_PARAMS: Echo and route params back to the response

    `);
}

if (argv.h) {
  showHelp();
  process.exit(0);
}

if (argv.e || process.env.ECHO_ROUTE_PARAMS) {
  logger.info("Echoing route params to response");
  config.echoRouteParams = true;
}

if (isNaN(port)) {
  showHelp();
  process.exit(-1);
}

process.on("uncaughtException", (err) => {
  console.error("Something unexpected happened. See the error code below");
  console.error(err);
});

const app = new Api();

app
  .start(port, host)
  .then(() => {
    logger.info(`log level ${config.logLevel}`);

    if (argv.r) {
      let limit = isNaN(argv.r) ? 0 : argv.r;
      if (limit === true) limit = -1;
      console.log(`recording ${limit} requests`);
      app.startRecording(limit);
    }

    if (argv.s) {
      logger.info("Using sample data");
      return app.upload(sampleData);
    }

    let filename;
    if (process.env.SAVED_RESPONSE_FILE) {
      logger.info(`using ${process.env.SAVED_RESPONSE_FILE}`);
      filename = process.env.SAVED_RESPONSE_FILE;
    }

    // This means that arg will override environment variable
    if (argv._.length) {
      filename = argv._[0];
      logger.info(`using ${filename}`);
    }

    if (!filename) return;

    if (!fs.existsSync(filename)) {
      console.error(`${filename} does not exist`);
      process.exit(-1);
    }

    const file = fs.readFileSync(filename, "utf8");
    const json = JSON.parse(file);
    return app.upload(json);
  })
  .then(() => {
    // started
  })
  .catch((err) => {
    console.error("Something failed");
    console.error(err);
    process.exit(-1);
  });

function stopApp() {
  app
    .stop()
    .then((err) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }

      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(-1);
    });
}

process.on("SIGINT", stopApp);
process.on("SIGTERM", stopApp);
