import * as uuid from "uuid";

import { ILogger, LogManager } from "./logger";
import { IResponse } from "./interfaces";

export class Response implements IResponse {
  private readonly logger: ILogger;
  body: any;
  count: number = 0;
  tenant: string;
  method: string;
  url: string;
  usageType: string;
  uid: string;

  constructor(
    method: string,
    url: string,
    body: any,
    usageType: string = "persistent",
    tenant: string = ""
  ) {
    this.logger = LogManager.getLogger(__filename);
    this.usageType = usageType;

    this.method = method.toLowerCase();
    this.url = url;
    this.body = body;
    this.tenant = tenant.toLowerCase();

    this.uid = uuid.v4();
  }
}
