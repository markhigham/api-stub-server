import * as path from "path";

import { config } from "./config";
import { LogManager } from "./logger";
import { InMemoryResponseStore } from "./inMemoryResponseStore";
import { Response } from "./response";

import * as express from "express";
import * as bodyParser from "body-parser";

import { createManagementRouter } from "./routes/responseManagement";
import * as bearerToken from "express-bearer-token";
import { ResponseInterpolator } from "./interpolator";
import { IResponseStore } from "./interfaces";

const logger = LogManager.getLogger(__filename);

const app = express();
const serverDetails = {
  host: "",
  port: 0,
};

// Set to > 0 if we should record incoming requests
// a value of 0 means no recording
let recordingCounter = 0;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(bearerToken());

const responseCollection: IResponseStore = new InMemoryResponseStore();

app.get("/favicon.ico", (req, res) => {
  res.sendStatus(404);
});

// The front end website is served from the /static folder
// we re-use node_modules for some of the dependencies which needs some rethinking
app.use("/__app", express.static(path.join(__dirname + "/../../static")));
app.use(
  "/node_modules",
  express.static(path.join(__dirname + "/../../node_modules"))
);

app.get("/__info", (req, res) => {
  res.status(200).send(config);
});

const managementRouter = createManagementRouter(responseCollection, "/__app");
app.use("/__response", managementRouter);

/**
 * Any POST sent to /_ will be handled as an attempt to seed another response
 * for example
 * POST /_GET/api/v1/  { 'hello' : 'world' }
 * will create a new GET response at /api/v1 which returns the helloworld json
 */
app.all("/_:verb/*", async (req, res) => {
  if (req.method !== "POST") {
    logger.error("this only works with POSTS!");
    res.status(400).send("only POST works to setup return values");
    return;
  }

  const verb = req.params.verb;
  const triggerUrl = req.url.replace("/_" + verb, "");
  const tenant = req.token || "";
  logger.debug(`${verb} ${triggerUrl}`);

  await responseCollection.push(
    new Response(verb, triggerUrl, req.body, "persistent", tenant)
  );

  const response = {
    triggerUrl: triggerUrl,
  };

  res.json(response);
});

app.all("*", async (req, res) => {
  const method = req.method;
  const url = req.url;
  const tenant = req.token || "";

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (method == "OPTIONS") {
    res.status(200).send("oh yes... options");
    return;
  }

  logger.debug(`looking for ${method} ${url} on tenant ${tenant}`);

  const [response, matchResult] = await responseCollection.find(
    method,
    url,
    tenant
  );

  logger.debug(response);

  if (response && response.usageType == "single") {
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

    logger.info(`200 ${method} ${req.url} ${tenant}`);
    res.status(200).send(body);
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
