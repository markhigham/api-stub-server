import * as clone from "clone";
import { config } from "./config";
import { IResponse } from "./interfaces";

export class ResponseInterpolator {
  static interpolate(
    response: IResponse,
    matchResult: { [p: string]: string },
    tenant: string = "",
  ): any {
    const ticks = new Date().getTime().toString();
    const count = String(++response.count);

    const body = clone(response.body);

    if (config.echoRouteParams) {
      Object.assign(body, matchResult);
    }

    const json = JSON.stringify(body);
    let replaced = json.replace(/{{\$ticks}}/g, ticks);
    replaced = replaced.replace(/{{\$count}}/g, count);
    replaced = replaced.replace(/{{\$uid}}/g, response.uid);
    replaced = replaced.replace(/{{\$tenant}}/g, tenant);
    return JSON.parse(replaced);
  }
}
