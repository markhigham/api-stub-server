import * as winston from "winston";
// import { createLogger, format, transports } from "winston";
// const { combine, timestamp, label, printf, json } = format;

import * as path from "path";
import { format } from "winston";
// import { getRootPath } from "../paths";

export interface ILogger {
  debug(...any): void;

  error(...any): void;

  info(...any): void;

  warn(...any): void;

  verbose(...any): void;
}

const myFormat = winston.format.printf(
  ({ level, message, label, timestamp, name }) => {
    let messageText = message;
    if (typeof message === "object") {
      try {
        messageText = JSON.stringify(message);
      } catch (ex) {
        // do nothing - messageText is already set to [object Object]
      }
    }
    return `${timestamp} [${name}] ${level}: ${messageText}`;
  }
);

export class LogManager {
  static logger: winston.Logger;
  static logLevel: string;

  private static makeLogger(): winston.Logger {
    this.logLevel = process.env.LOG_LEVEL || "info";
    const logger = winston.createLogger({
      level: this.logLevel,
      format: winston.format.combine(format.timestamp(), myFormat),

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
