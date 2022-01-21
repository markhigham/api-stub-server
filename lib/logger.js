const config = require("./config");

const winston = require("winston");
const path = require("path");

const paths = require("../paths");

let logger;

function WinstonLogger(filename) {
  function createLogger() {
    const logLevel = process.env.LOG_LEVEL || "info";
    logger = winston.createLogger({
      level: logLevel,
      transports: [
        new winston.transports.Console({
          stderrLevels: ["error"],
        }),
      ],
      format: winston.format.combine(
        winston.format.errors({ stack: true }),

        winston.format.colorize(),
        winston.format.simple(),
        winston.format.metadata(),
        winston.format.printf((loginfo) => {
          let json = "Error!";
          let stack = "";
          try {
            if (typeof loginfo.message === "object")
              json = JSON.stringify(loginfo.message, null, 2);
            else json = loginfo.message;

            if (loginfo.metadata.stack) {
              stack = loginfo.metadata.stack;
            }
          } catch (e) {
            console.error("failed to stringify error");
          }
          return `${loginfo.level} ${loginfo.metadata.name} ${json}${stack}`;
        })
      ),
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
    createLogger();
  }

  return logger.child({ filename: filename, name: name });
}

module.exports = WinstonLogger;
