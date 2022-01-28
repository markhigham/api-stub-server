import { Response } from "../response";

import { ILogger, LogManager } from "../logger";
import * as Route from "route-parser";
import { IMatchResult, IResponse, IResponseStore } from "../interfaces";

export class MemoryStore implements IResponseStore {
  private readonly logger: ILogger;
  private responses: { [key: string]: IResponse };
  constructor() {
    this.logger = LogManager.getLogger(__filename);
    this.responses = {};
  }

  asJSON(): Promise<IResponse[]> {
    const responses: IResponse[] = [];
    for (const [key, value] of Object.entries(this.responses)) {
      responses.push(value);
    }
    return Promise.resolve(responses);
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

    this.logger.debug(`deleting ${uid}`);
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
    found.tenant = response.tenant;

    return Promise.resolve();
  }

  addMany(responses: any[]): Promise<void> {
    responses.forEach((r) => {
      this.logger.debug(r.tenant);
      const response = new Response(
        r.method,
        r.url,
        r.body,
        r.usageType,
        r.tenant || ""
      );
      response.uid = r.uid;
      this.responses[response.uid] = response;
    });

    return Promise.resolve();
  }

  push(response: IResponse): Promise<void> {
    this.responses[response.uid] = response;
    return Promise.resolve();
  }

  getCount(): number {
    return Object.keys(this.responses).length;
  }

  private compare(first: string, second: string) {
    return first.localeCompare(second, undefined, { sensitivity: "base" }) == 0;
  }

  private isMatch(
    response: IResponse,
    method: string,
    url: string,
    tenant: string
  ): IMatchResult {
    const route = new Route(response.url);
    const routeMatch = route.match(url);

    this.logger.debug(
      `checking ${method} ${url} '${tenant}' against ${response.method} ${response.url} '${response.tenant}'`
    );

    if (!routeMatch) {
      this.logger.debug("routes do not match");
      return { isMatch: false };
    }

    if (!this.compare(method, response.method)) {
      this.logger.debug("verbs do not match");
      return { isMatch: false };
    }

    if (!this.compare(tenant, response.tenant)) {
      this.logger.debug("tenants do not match");
      return { isMatch: false };
    }

    this.logger.debug(response);
    return { isMatch: true, routeMatch: routeMatch };
  }

  find(
    method: string,
    url: string,
    tenant: string
  ): Promise<[IResponse, IMatchResult]> {
    let response: IResponse = undefined;
    let matchResult: IMatchResult = undefined;

    for (const [key, value] of Object.entries(this.responses)) {
      matchResult = this.isMatch(value, method, url, tenant);

      if (matchResult.isMatch) {
        response = value;
        break;
      }
    }

    return Promise.resolve([response, matchResult]);
  }
}
