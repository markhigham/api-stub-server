import { config } from "./config";
import { LogManager } from "./logger";
import { MemoryStore } from "./datastores/memoryStore";
import { Response } from "./response";

import * as express from "express";
import * as bodyParser from "body-parser";

import { createManagementRouter } from "./routes/admin";
import * as bearerToken from "express-bearer-token";
import { ResponseInterpolator } from "./interpolator";
import { IResponseStore, USAGE_TYPE_SINGLE } from "./interfaces";
import { createStaticRouter } from "./routes/static";

const logger = LogManager.getLogger(__filename);

const serverDetails = {
  host: "",
  port: 0,
};

// Set to > 0 if we should record incoming requests
// a value of 0 means no recording
let recordingCounter = 0;

function tenantMiddleware(req, res, next) {
  req.tenant = req.token || "";
  next();
}

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(bearerToken());
app.use(tenantMiddleware);

const responseCollection: IResponseStore = new MemoryStore();

app.get("/favicon.ico", (req, res) => {
  res.sendStatus(404);
});

app.get("/__info", (req, res) => {
  res.status(200).send(config);
});

const staticRouter = createStaticRouter();
app.use("/", staticRouter);

const managementRouter = createManagementRouter(responseCollection, "/__app");
app.use("/__response", managementRouter);

/**
 * Any POST sent to /_ will be handled as an attempt to seed another response
 * for example
 * POST /_GET/api/v1/  { 'hello' : 'world' }
 * will create a new GET response at /api/v1 which returns the helloworld json
 */
app.all("/_:verb/*", async (req: any, res) => {
  if (req.method !== "POST") {
    logger.error("this only works with POSTS!");
    res.status(400).send("only POST works to setup return values");
    return;
  }

  const verb = req.params.verb;
  const triggerUrl = req.url.replace("/_" + verb, "");
  const tenant = req.tenant || "";
  logger.debug(`${verb} ${triggerUrl}`);

  await responseCollection.push(
    new Response(verb, triggerUrl, req.body, "persistent", tenant)
  );

  const response = {
    triggerUrl: triggerUrl,
  };

  res.json(response);
});

/**
 * just allow all cors requests and ignore any options pre-flight checks
 */
app.use((req, res, next) => {
  const method = req.method;
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (method == "OPTIONS") {
    res.status(200).send("aah yes... options");
    res.end();
    return;
  }

  next();
});

app.all("*", async (req: any, res) => {
  const method = req.method;
  const url = req.url;
  const tenant = req.tenant || "";

  logger.debug(`looking for ${method} ${url} on tenant ${tenant}`);

  const [response, matchResult] = await responseCollection.find(
    method,
    url,
    tenant
  );

  logger.debug(response);

  if (response && response.usageType == USAGE_TYPE_SINGLE) {
    logger.info("delete single use");
    await responseCollection.delete(response.uid);
  }

  if (response) {
    logger.debug(response);

    const body = ResponseInterpolator.interpolate(
      response,
      matchResult.routeMatch,
      tenant
    );

    logger.info(`${response.statusCode} ${method} ${req.url} ${tenant}`);
    res.status(response.statusCode).send(body);
    return;
  }

  // Not found
  if (recordingCounter != 0) {
    recordingCounter--;
    logger.debug(`recordCount ${recordingCounter}`);
    const stubbedResponse = req.body;
    const payload = new Response(
      req.method,
      req.url,
      req.body,
      "persistent",
      tenant
    );

    responseCollection.push(payload);
    res.sendStatus(200);
    return;
  }

  const failMessage = `404 - Not found. Try the web ui at http://${serverDetails.host}:${serverDetails.port}/__app/`;
  logger.info(`404, ${method}, ${url}`);
  res.status(404).send(failMessage);
});

function start(port: number, host: string): Promise<void> {
  logger.debug(`starting ${host}:${port}`);
  return new Promise((resolve, reject) => {
    app.listen(port, host, () => {
      logger.info(`started on http://${host}:${port}`);
      serverDetails.host = host;
      serverDetails.port = port;
      resolve();
    });
  });
}

export class Api {
  start(port, host) {
    return start(port, host);
  }

  stop(): Promise<any> {
    // this is really hacking and i'm quite embarrassed about it
    // TODO - use stoppable
    console.log("quitting");
    return Promise.resolve();
  }

  upload(savedData) {
    return responseCollection.addMany(savedData);
  }

  startRecording(limit) {
    logger.info(`recording ${limit} requests`);
    recordingCounter = limit;
  }
}
