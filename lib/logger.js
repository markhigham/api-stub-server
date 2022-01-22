const config = require("./config");

const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, printf, json } = format;

const path = require("path");

const paths = require("../paths");

let logger;

function WinstonLogger(filename) {
  const myFormat = printf(({ level, message, label, timestamp, name }) => {
    return `${timestamp} [${name}] ${level}: ${message}`;
  });

  function makeLogger() {
    const logLevel = config.logLevel;
    logger = createLogger({
      level: logLevel,
      transports: [
        new transports.Console({
          stderrLevels: ["error"],
        }),
      ],
      format: combine(format.timestamp(), myFormat),
    });
  }

  const root = paths.root();
  let name = path.basename(filename);
  try {
    name = filename.substr(root.length);
  } catch (e) {
    //
  }

  if (typeof logger === "undefined") {
    makeLogger();
  }

  return logger.child({ filename: filename, name: name });
}

module.exports = WinstonLogger;
