import * as winston from "winston";
import * as path from "path";
// import { getRootPath } from "../paths";

export interface ILogger {
  debug(...any): void;

  error(...any): void;

  info(...any): void;

  warn(...any): void;

  verbose(...any): void;
}

export class LogManager {
  static logger: winston.Logger;
  static logLevel: string;

  private static makeLogger(): winston.Logger {
    this.logLevel = process.env.LOG_LEVEL || "info";
    const logger = winston.createLogger({
      level: this.logLevel,
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
            // console.error(e);
          }
          return `${loginfo.metadata.name} ${loginfo.level} ${json}${stack}`;
        })
      ),
      transports: [
        new winston.transports.Console({
          stderrLevels: ["error"],
        }),
      ],
    });

    return logger;
  }

  static getLogger(filename: string): ILogger {
    // const root = getRootPath();
    let name = path.basename(filename);

    if (typeof this.logger === "undefined") {
      this.logger = this.makeLogger();
    }
    return this.logger.child({ filename: filename, name: name });
  }

  static getNamedLogger(name: string): ILogger {
    if (typeof this.logger === "undefined") {
      this.logger = this.makeLogger();
    }

    return this.logger.child({ service: name });
  }
}
