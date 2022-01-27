import * as uuid from "uuid";
import * as Route from "route-parser";

import * as clone from "clone";

import { ILogger, LogManager } from "./logger";
import { config } from "./config";

interface IResponse {
  count: number;
  method: string;
  body: any;
  url: string;
  usageType: string;
  uid: string;
}

export interface IMatchResult {
  isMatch: boolean;
  routeMatch?: { [p: string]: string };
}

export class Response implements IResponse {
  private readonly logger: ILogger;
  body: any;
  count: number;
  method: string;
  url: string;
  usageType: string;
  uid: string;

  constructor(method: string, url: string, body: any, usageType?: string) {
    this.logger = LogManager.getLogger(__filename);

    this.method = method;
    this.url = url;
    this.body = body;
    this.usageType = usageType || "peristent";

    this.uid = uuid.v4();
  }

  isMatch(method: string, testUrl: string): IMatchResult {
    const lowercaseMethod = method.toLowerCase();
    const route = new Route(this.url);
    const routeMatch = route.match(testUrl);

    if (!routeMatch) {
      this.logger.debug("routes do not match");
      return { isMatch: false };
    }

    if (lowercaseMethod != this.method) {
      this.logger.debug("verbs do not match");
      return { isMatch: false };
    }

    return { isMatch: true, routeMatch: routeMatch };
  }

  interpolate(matchResult: { [p: string]: string }) {
    const ticks = new Date().getTime().toString();
    const count = String(this.count++);

    const body = clone(this.body);

    if (config.echoRouteParams) {
      Object.assign(body, matchResult);
    }

    const json = JSON.stringify(body);
    let replaced = json.replace(/{{\$ticks}}/g, ticks);
    replaced = replaced.replace(/{{\$count}}/g, count);
    replaced = replaced.replace(/{{\$uid}}/g, this.uid);
    return JSON.parse(replaced);
  }
}
