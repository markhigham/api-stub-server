import { IMatchResult, IResponse, Response } from "./response";

import { ILogger, LogManager } from "./logger";
import * as Route from "route-parser";

export class Responses {
  private readonly logger: ILogger;
  private responses: { [key: string]: IResponse };
  constructor() {
    this.logger = LogManager.getLogger(__filename);
    this.responses = {};
  }

  clear(): Promise<void> {
    this.logger.debug("clearing all values");
    this.responses = {};
    return Promise.resolve();
  }

  delete(uid: string): Promise<void> {
    const found = this.responses[uid];
    if (!found) {
      const msg = `Response with uid ${uid} not found`;
      this.logger.error(msg);
      return Promise.reject(msg);
    }

    delete this.responses[uid];
    return Promise.resolve();
  }

  update(response: IResponse) {
    const found = this.responses[response.uid];
    if (!found) {
      const msg = `Response with uid ${response.uid} not found`;
      this.logger.error(msg);
      return Promise.reject(msg);
    }

    found.url = response.url;
    found.method = response.method;
    found.body = response.body;
    found.usageType = response.usageType;

    return Promise.resolve();
  }

  addMany(responses: any[]) {
    responses.forEach((r) => {
      const response = new Response(r.method, r.url, r.body, r.usageType);
      response.uid = r.uid;
      this.responses[response.uid] = response;
    });

    return Promise.resolve();
  }

  push(response: IResponse) {
    this.responses[response.uid] = response;
  }

  getCount(): number {
    return Object.keys(this.responses).length;
  }

  private isMatch(
    response: IResponse,
    method: string,
    url: string
  ): IMatchResult {
    const lowercaseMethod = method.toLowerCase();
    const route = new Route(response.url);
    const routeMatch = route.match(url);

    if (!routeMatch) {
      this.logger.debug("routes do not match");
      return { isMatch: false };
    }

    if (lowercaseMethod != response.method) {
      this.logger.debug("verbs do not match");
      return { isMatch: false };
    }

    return { isMatch: true, routeMatch: routeMatch };
  }

  use(method: string, url: string) {
    let response: IResponse = undefined;

    for (const [key, value] of Object.entries(this.responses)) {
      const matchResult = this.isMatch(value, method, url);

      if (matchResult.isMatch) {
        if (value.usageType == "single") {
          delete this.responses[value.uid];
        }

        response = value.interpolate(matchResult.routeMatch);
        break;
      }
    }

    return response;
  }
}
