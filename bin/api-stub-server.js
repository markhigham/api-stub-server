#!/usr/bin/env node

process.env.DEBUG = process.env.DEBUG || "api*";

const argv = require("minimist")(process.argv.slice(2));
const debugLevel = argv.v || process.env.DEBUG_LEVEL || "info";
process.env.DEBUG_LEVEL = debugLevel;

const colors = require("colors");
const app = require("../lib/api");
const config = require("../lib/config");
const fs = require("fs");

const port = argv.p || config.port;
const host = argv.h || config.host;

function showHelp() {
  const pkg = require("../package.json");
  const version = pkg.version;
  console.log(`api-stub-server [-p 8092] [-h 127.0.0.1] [-v verbose] [-s use sample data] [-r x] [saved_response_file.json]
version: ${version}

-p  (Optional) Port number - defaults to 3001

-h  (Optional) Host address - defaults to 0.0.0.0

-v  (Optional) Verbosity - choose from log, error, warn, debug, info, verbose

-s  (Optional) Use sample data

-r  (Optional) Start recording requests to a limit of x 
    Set to 0 for no limits.

saved_response_file.json (optional)
    Path to a file containing pre-saved responses

    `);
}

if (argv.h) {
  showHelp();
  process.exit(0);
}

if (isNaN(port)) {
  showHelp();
  process.exit(-1);
}

process.on("uncaughtException", (err) => {
  console.error("Something unexpected happened. See the error code below".red);
  console.error(err);
});

app
  .start(port, host)
  .then(() => {
    console.log(`debugging is ${debugLevel}`);

    if (argv.r) {
      let limit = isNaN(argv.r) ? 0 : argv.r;
      if (limit === true) limit = -1;
      console.log(`recording ${limit} requests`);
      app.startRecording(limit);
    }

    if (argv.s) {
      console.log("Using sample data");
      const sample = require("./sample-data");
      return app.upload(sample);
    }

    if (argv._.length === 0) {
      return;
    }

    const filename = argv._[0];
    console.log(`using ${filename}`);

    var file = fs.readFileSync(filename, "utf8");
    var json = JSON.parse(file);
    return app.upload(json);
  })
  .then(() => {
    // started
  })
  .catch((err) => {
    console.error("Something failed");
    process.exit(-1);
  });
